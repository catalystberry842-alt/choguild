import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePassport } from "@/components/passport/passport-provider";
import { getNotices } from "@/lib/notify/functions";
import type { Notice } from "@/lib/notify/repo.server";

const seenKey = (chogId: number) => `choguild:notices-seen:${chogId}`;

/** Simple in-app bell for the acting Chog: applications, submissions, reviews and duels. Read state is per browser. */
export function NoticeBell() {
  const { chogId } = usePassport();
  const load = useServerFn(getNotices);
  const [items, setItems] = useState<Notice[] | null>(null);
  const [seen, setSeen] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  useEffect(() => {
    if (!chogId) return setItems(null);
    let live = true;
    try { setSeen(window.localStorage.getItem(seenKey(chogId)) ?? ""); } catch { /* private mode */ }
    const tick = () => load().then((r) => live && setItems(r)).catch(() => undefined);
    void tick();
    const t = window.setInterval(tick, 60_000);
    return () => { live = false; window.clearInterval(t); };
  }, [chogId, load]);

  if (!chogId || !items) return null;
  const unread = items.filter((n) => n.at > seen).length;
  function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || !items?.[0] || !chogId) return;
    try { window.localStorage.setItem(seenKey(chogId), items[0].at); } catch { /* ignore */ }
    const latest = items[0].at;
    window.setTimeout(() => setSeen(latest), 1500);
  }
  return (
    <div ref={box} className="relative mr-1">
      <button type="button" onClick={toggle} aria-expanded={open} aria-label={unread ? `${unread} new notifications` : "Notifications"} className="relative flex size-8 items-center justify-center rounded-full text-body transition-colors hover:text-ink">
        <Bell className="size-4" aria-hidden="true" />
        {unread ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[#836ef9] px-1 text-[10px] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div role="dialog" aria-label="Notifications" className="surface fixed right-3 top-16 z-50 w-[min(22rem,calc(100vw-1.5rem))] p-2 shadow-xl sm:absolute sm:right-0 sm:top-10">
          <p className="t-kicker px-2 py-1.5">Chog #{chogId}</p>
          {items.length === 0 ? (
            <p className="t-meta px-2 pb-2">Nothing yet. Applications, submissions, reviews and duels land here.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link to={n.href} onClick={() => setOpen(false)} className="flex flex-col gap-0.5 rounded-lg px-2 py-2 hover:bg-secondary">
                    <span className="flex items-start gap-2 text-small text-ink">
                      {n.at > seen ? <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#836ef9]" /> : null}
                      <span className="min-w-0">{n.text}</span>
                    </span>
                    <span className="t-meta">{new Date(n.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
