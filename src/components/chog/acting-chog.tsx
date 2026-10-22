import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { chogImageUrl, CHOG_EXPLORER_URL } from "@/lib/chog/chog";
import { cn } from "@/lib/cn";
import { setActingChog } from "@/lib/passport/functions";

/** Lets a signed-in wallet pick which of its Chogs to act as. No Chog = view only. */
export function ActingChogPicker() {
  const { sessionAddress, chogId, ownedChogs, ownedKnown, refresh } = usePassport();
  const choose = useServerFn(setActingChog);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  if (!sessionAddress) return null;

  async function pick(id: number) {
    setBusy(id);
    setError(null);
    try {
      const result = await choose({ data: { chogId: id } });
      if (!result.ok) setError(result.error);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't switch Chog.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {ownedChogs.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Your Chogs">
          {ownedChogs.slice(0, 24).map((id) => {
            const active = id === chogId;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => void pick(id)}
                  disabled={busy !== null || active}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-small transition-colors",
                    active ? "border-[#836ef9] bg-[#836ef9]/15 text-ink" : "border-line text-body hover:border-line-strong hover:text-ink",
                  )}
                >
                  <img src={chogImageUrl(id)} alt="" width={28} height={28} className="size-7 rounded-full bg-secondary object-cover" />
                  <span className="tabular-nums">#{id}</span>
                  {active ? <span className="text-label text-[#836ef9]">acting</span> : busy === id ? <span className="text-label">checking…</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : ownedKnown ? (
        <p className="t-body">
          This wallet holds no Chog Genesis, so it can view but not act. A Chog is the membership:{" "}
          <a className="t-link" href={CHOG_EXPLORER_URL} target="_blank" rel="noreferrer">see the collection</a>.
        </p>
      ) : null}
      {!ownedKnown ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const id = Number(manual);
            if (Number.isInteger(id) && id > 0) void pick(id);
          }}
        >
          <label className="t-meta" htmlFor="chog-id">Holder list is loading. Enter your token id:</label>
          <input id="chog-id" inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))} className="h-9 w-24 rounded-lg border border-line bg-transparent px-3 text-small" placeholder="#" />
          <Button size="compact" type="submit" disabled={!manual || busy !== null}>Act as</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-small text-danger">{error}</p> : null}
      <p className="t-meta">Ownership is checked live with ownerOf on Monad before every action. Sell or send the Chog and its record goes with it.</p>
    </div>
  );
}
