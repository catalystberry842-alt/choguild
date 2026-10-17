import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { AVATAR_SOURCE_TYPES } from "@/lib/passport/avatar";
import { chogImageUrl } from "@/lib/chog/chog";
import { cn } from "@/lib/cn";

type Status = { kind: "idle" } | { kind: "working"; label: string } | { kind: "error"; message: string };

/** Avatar picker: click/tap or drop an image; it is cropped, compressed and uploaded right away. */
export function AvatarField({
  value,
  name,
  onChange,
  error,
  chogTokenIds = [],
}: {
  value: string;
  name: string;
  onChange: (url: string) => void;
  error?: string;
  chogTokenIds?: number[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const busy = status.kind === "working";
  const shown = preview ?? (value || null);

  async function handle(file: File | undefined) {
    if (!file || busy) return;
    setStatus({ kind: "working", label: "Preparing image" });
    try {
      const { prepareAvatar, uploadAvatar } = await import("@/lib/passport/avatar-client");
      const blob = await prepareAvatar(file);
      setPreview(URL.createObjectURL(blob));
      setBroken(false);
      setStatus({ kind: "working", label: "Uploading" });
      const url = await uploadAvatar(blob);
      onChange(url);
      setStatus({ kind: "idle" });
    } catch (caught) {
      setPreview(null);
      setStatus({ kind: "error", message: caught instanceof Error ? caught.message : "The avatar could not be uploaded." });
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handle(event.dataTransfer.files[0]);
  }

  function clear() {
    setPreview(null);
    setBroken(false);
    setStatus({ kind: "idle" });
    onChange("");
  }

  const message = status.kind === "error" ? status.message : error;
  const chogChoices = chogTokenIds.slice(0, 6);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id="passport-avatar-label" className="text-small font-medium text-ink">
        Avatar
      </span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-dashed bg-white/[0.02] p-4 transition-colors sm:flex-row sm:items-center",
          dragging ? "border-signal bg-signal/10" : "border-line-strong",
        )}
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-labelledby="passport-avatar-label"
          aria-describedby="passport-avatar-hint"
          className="group relative size-24 shrink-0 self-center overflow-hidden rounded-full bg-secondary ring-1 ring-line-strong transition hover:ring-signal/60 sm:self-auto"
        >
          {shown && !broken ? (
            <img src={shown} alt="" width={96} height={96} className="size-full object-cover" onError={() => setBroken(true)} />
          ) : (
            <span className="flex size-full items-center justify-center text-[2rem] font-semibold tracking-tight text-ink">
              {(name.trim()[0] ?? "?").toUpperCase()}
            </span>
          )}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/55 text-ink transition-opacity",
              busy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
            aria-hidden="true"
          >
            {busy ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="text-base font-medium tracking-tight text-ink">
              {busy ? status.label : dragging ? "Drop to upload" : shown ? "Looking good" : "Drop an image or tap to upload"}
            </p>
            <p id="passport-avatar-hint" className="t-meta mt-1">
              PNG, JPG, WebP or GIF up to 10 MB. Cropped to a square and compressed. Saved with your passport.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="compact" onClick={() => input.current?.click()} disabled={busy}>
              {shown ? "Replace" : "Upload image"}
            </Button>
            {shown ? (
              <Button type="button" variant="ghost" size="compact" onClick={clear} disabled={busy}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
          {chogChoices.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-meta">Use my Chog</span>
              {chogChoices.map((tokenId) => {
                const url = chogImageUrl(tokenId);
                const selected = value === url;
                return (
                  <button
                    key={tokenId}
                    type="button"
                    disabled={busy}
                    aria-pressed={selected}
                    aria-label={`Use Chog #${tokenId}`}
                    onClick={() => {
                      setPreview(null);
                      setBroken(false);
                      setStatus({ kind: "idle" });
                      onChange(url);
                    }}
                    className={cn(
                      "size-10 overflow-hidden rounded-full ring-1 transition",
                      selected ? "ring-2 ring-signal" : "ring-line-strong hover:ring-signal/60",
                    )}
                  >
                    <img src={url} alt="" width={40} height={40} loading="lazy" className="size-full object-cover" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <input
          ref={input}
          type="file"
          accept={AVATAR_SOURCE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handle(event.target.files?.[0])}
        />
      </div>
      {message ? (
        <p className="text-small text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
