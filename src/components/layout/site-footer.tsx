import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/brand/logo";
import { emptyBoardSearch } from "@/lib/board/search";

const pill = "rounded-full border border-line px-4 py-2 text-small text-body transition-colors hover:border-line-strong hover:text-ink";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto mt-20 max-w-6xl sm:mt-24 px-3 pb-6 sm:px-6">
      <div className="bento flex flex-col items-center px-6 py-12 text-center sm:py-16">
        <LogoMark className="size-9 text-ink" />
        <p className="t-h1 mt-6">
          Get work and earn your <em>rank.</em>
        </p>
        <nav aria-label="Footer" className="mt-10 flex flex-wrap justify-center gap-2">
          <Link to="/discover" search={emptyBoardSearch()} className={pill}>Discover</Link>
          <Link to="/ranking" className={pill}>Ranking</Link>
          <Link to="/passport" className={pill}>Passport</Link>
          <Link to="/opportunities/new" className={pill}>Publish work</Link>
          <Link to="/how-it-works" className={pill}>How it works</Link>
          <Link to="/network" className={pill}>Network</Link>
          <a href="https://github.com/catalystberry842-alt/choguild" className={pill}>Source</a>
        </nav>
      </div>
      <div className="flex items-center justify-between px-4 pt-5 text-label text-muted">
        <span>Choguild · Built on Monad</span>
        <span>MIT licensed</span>
      </div>
    </footer>
  );
}
