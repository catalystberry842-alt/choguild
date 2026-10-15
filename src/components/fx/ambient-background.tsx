import { useEffect, useRef } from "react";

/**
 * The site-wide backdrop: a slow aurora (pure CSS transforms), a dot grid on a
 * canvas that brightens gently around the cursor, and a grain overlay.
 * The canvas only animates while the pointer moves (fine pointers only), stops
 * when the tab is hidden, and is a single static frame under reduced motion.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const GAP = 28;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let animating = false;
    // Smoothed pointer (eased toward the real one) and its glow strength.
    const target = { x: -9999, y: -9999 };
    const pos = { x: -9999, y: -9999 };
    let strength = 0;
    let targetStrength = 0;

    const dotColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--fx-dot").trim() || "255 255 255";

    let rgb = dotColor();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const radius = 180;
      for (let y = GAP / 2; y < height; y += GAP) {
        for (let x = GAP / 2; x < width; x += GAP) {
          const dx = x - pos.x;
          const dy = y - pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = d < radius ? (1 - d / radius) * strength : 0;
          const alpha = 0.06 + near * 0.45;
          // Dots lean slightly away from the cursor.
          const push = near * 6;
          const ox = d > 0 ? (dx / d) * push : 0;
          const oy = d > 0 ? (dy / d) * push : 0;
          ctx.fillStyle = `rgb(${rgb} / ${alpha.toFixed(3)})`;
          ctx.fillRect(x + ox - 0.75, y + oy - 0.75, 1.5, 1.5);
        }
      }
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      strength += (targetStrength - strength) * 0.08;
      draw();
      const settled =
        Math.abs(target.x - pos.x) < 0.5 && Math.abs(target.y - pos.y) < 0.5 && Math.abs(targetStrength - strength) < 0.01;
      if (settled) {
        animating = false;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (animating || document.hidden) return;
      animating = true;
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (pos.x < -999) {
        pos.x = event.clientX;
        pos.y = event.clientY;
      }
      target.x = event.clientX;
      target.y = event.clientY;
      targetStrength = 1;
      kick();
    };
    const onLeave = () => {
      targetStrength = 0;
      kick();
    };
    const onTheme = new MutationObserver(() => {
      rgb = dotColor();
      draw();
    });

    resize();
    window.addEventListener("resize", resize);
    onTheme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (!reduced && finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      onTheme.disconnect();
    };
  }, []);

  // Card spotlight: one delegated listener feeds --mx/--my to the hovered .spotlight.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.(".spotlight") as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-aurora">
        <span className="fx-blob fx-blob-a" />
        <span className="fx-blob fx-blob-b" />
        <span className="fx-blob fx-blob-c" />
      </div>
      <canvas ref={canvasRef} className="fx-grid" />
      <div className="fx-grain" />
      <div className="fx-vignette" />
    </div>
  );
}
