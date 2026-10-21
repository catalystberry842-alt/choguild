import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { emptyBoardSearch } from "@/lib/board/search";

const link = "text-small text-body transition-colors hover:text-ink";

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-2.5 mt-24 mb-2.5 sm:mx-4 sm:mt-32 sm:mb-4">
      <div className="stage stage-soft mx-auto max-w-[1400px]">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-x-6 gap-y-10 px-4 py-14 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:gap-16 2xl:max-w-7xl">
        <div className="col-span-3 max-w-xs md:col-span-1">
          <Link to="/" className="flex items-center gap-2 text-ink">
            <LogoMark className="size-5" />
            <span className="text-base font-medium tracking-[-0.03em]">Choguild</span>
          </Link>
          <p className="t-meta mt-4">The contributor guild on Monad. Every listing, passport and XP value is real.</p>
        </div>
        <FooterCol title="Work">
          <Link to="/discover" search={emptyBoardSearch()} className={link}>Discover</Link>
          <Link to="/opportunities/new" className={link}>Publish work</Link>
          <Link to="/submissions" search={{ view: "mine", status: "all" }} className={link}>Submissions</Link>
        </FooterCol>
        <FooterCol title="Guild">
          <Link to="/passport" className={link}>Passport</Link>
          <Link to="/ranking" className={link}>Ranking</Link>
          <Link to="/how-it-works" className={link}>How it works</Link>
        </FooterCol>
        <FooterCol title="Project">
          <Link to="/network" className={link}>Network</Link>
          <a href="https://github.com/catalystberry842-alt/choguild" className={link}>Source</a>
          <a href="https://monadscan.com/token/0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763" className={link}>Chog Genesis</a>
        </FooterCol>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-line px-4 py-5 sm:px-8 text-label text-muted sm:px-6 2xl:max-w-7xl">
        <span>Built on Monad</span>
        <span>MIT licensed</span>
      </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="t-kicker">{title}</p>
      <div className="mt-4 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}
