import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/brand/logo";
import { emptyBoardSearch } from "@/lib/board/search";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-6">
          <LogoMark className="size-7 text-ink" />
          <p className="t-display mt-6 max-w-sm text-[1.75rem] leading-[1.05]">Get work and earn your rank.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-[13px] md:col-span-6 md:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <p className="t-label mb-1">Work</p>
            <Link to="/discover" search={emptyBoardSearch()} className="text-body hover:text-ink">Discover</Link>
            <Link to="/opportunities/new" className="text-body hover:text-ink">Publish work</Link>
            <Link to="/submissions" search={{ view: "mine", status: "all" }} className="text-body hover:text-ink">Submissions</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="t-label mb-1">Guild</p>
            <Link to="/ranking" className="text-body hover:text-ink">Ranking</Link>
            <Link to="/passport" className="text-body hover:text-ink">Passport</Link>
            <Link to="/applications" className="text-body hover:text-ink">Applications</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="t-label mb-1">About</p>
            <Link to="/how-it-works" className="text-body hover:text-ink">How it works</Link>
            <Link to="/network" className="text-body hover:text-ink">Network</Link>
            <a href="https://github.com/catalystberry842-alt/choguild" className="text-body hover:text-ink">Source</a>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-line px-5 py-5 font-mono text-[11px] text-muted sm:px-8">
        <span>Choguild · Built on Monad</span>
        <span>MIT</span>
      </div>
    </footer>
  );
}
