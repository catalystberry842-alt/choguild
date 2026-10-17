import { AVATAR_TARGET_BYTES, checkAvatarSource, squareCrop } from "@/lib/passport/avatar";

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // fall back to an <img> element (older Safari)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("That image could not be read. Try a PNG, JPG or WebP.");
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Center-crops to a square, scales to 512px and re-encodes as WebP (JPEG where
 * WebP encoding is unsupported), lowering quality until it fits ~200 KB.
 * GIFs and animated WebPs keep their first frame.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  const problem = checkAvatarSource(file);
  if (problem) throw new Error(problem);
  const image = await decode(file);
  try {
    if (image.width < 32 || image.height < 32) throw new Error("Choose an image at least 32 × 32 pixels.");
    const crop = squareCrop(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = crop.out;
    canvas.height = crop.out;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot process images.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    let type = "image/webp";
    const probe = await toBlob(canvas, type, 0.8);
    if (!probe || probe.type !== "image/webp") type = "image/jpeg";
    if (type === "image/jpeg") {
      // JPEG has no alpha: flatten transparent areas onto the page black.
      context.fillStyle = "#050507";
      context.fillRect(0, 0, crop.out, crop.out);
    }
    context.drawImage(image.source, crop.sx, crop.sy, crop.side, crop.side, 0, 0, crop.out, crop.out);
    for (const quality of [0.86, 0.78, 0.68, 0.56, 0.44]) {
      const blob = await toBlob(canvas, type, quality);
      if (blob && blob.size <= AVATAR_TARGET_BYTES) return blob;
    }
    throw new Error("That image could not be compressed enough. Try a simpler image.");
  } finally {
    image.close();
  }
}

export async function uploadAvatar(blob: Blob): Promise<string> {
  const response = await fetch("/api/avatar-upload", {
    method: "POST",
    headers: { "content-type": blob.type || "application/octet-stream" },
    body: blob,
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
  if (!response.ok || !body?.ok || !body.url) throw new Error(body?.error ?? "The avatar could not be uploaded.");
  return body.url;
}
