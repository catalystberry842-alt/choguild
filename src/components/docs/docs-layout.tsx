import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DOCS, type DocPage } from "@/components/docs/content";
import { cn } from "@/lib/cn";

/** Docs page: sidebar (desktop) / collapsible menu (mobile), article, on-page TOC. */
export function DocsLayout({ page }: { page: DocPage }) {
  const [active, setActive] = useState<string | null>(page.sections[0]?.id ?? null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-20% 0px -70% 0px" });
    page.sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [page]);
  const index = DOCS.findIndex((d) => d.slug === page.slug);
  const next = DOCS[index + 1];
  const prev = DOCS[index - 1];

  const list = (
    <ul className="flex flex-col gap-0.5">
      {DOCS.map((d, i) => (
        <li key={d.slug}>
          <Link
            to="/docs/$slug"
            params={{ slug: d.slug }}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-small transition-colors", d.slug === page.slug ? "bg-purple text-white" : "text-body hover:bg-line/60 hover:text-ink")}
          >
            <span className={cn("font-mono text-label", d.slug === page.slug ? "text-white/70" : "text-muted")}>0{i + 1}</span>
            {d.title}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)_11rem] lg:gap-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="ix mb-3 hidden lg:block">DOCS</p>
        <nav aria-label="Docs" className="hidden lg:block">{list}</nav>
        <details className="bento group lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-small text-ink">
            <span><span className="ix mr-2">DOCS</span>{page.title}</span>
            <span aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180">⌄</span>
          </summary>
          <nav aria-label="Docs" className="border-t border-line p-2">{list}</nav>
        </details>
      </aside>
      <article className="min-w-0">
        <p className="ix flex items-center gap-3"><span className="text-purple-ink">0{index + 1}</span><span className="h-px w-8 bg-line-strong" />DOCUMENTATION</p>
        <h1 className="t-title mt-5 text-ink">{page.title}</h1>
        <p className="mt-4 max-w-2xl text-lead text-body">{page.lead}</p>
        <div className="mt-12 flex flex-col gap-12">
          {page.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-line pt-8">
              <h2 className="text-2xl font-medium tracking-[-0.035em] text-ink">{s.title}</h2>
              <div className="mt-4 max-w-2xl text-base leading-relaxed text-body">{s.body}</div>
            </section>
          ))}
        </div>
        <nav aria-label="Pager" className="mt-16 grid gap-2 sm:grid-cols-2">
          {prev ? (
            <Link to="/docs/$slug" params={{ slug: prev.slug }} className="bento p-4"><span className="ix">← PREVIOUS</span><span className="mt-1 block text-ink">{prev.title}</span></Link>
          ) : <span />}
          {next ? (
            <Link to="/docs/$slug" params={{ slug: next.slug }} className="bento p-4 text-right"><span className="ix">NEXT →</span><span className="mt-1 block text-ink">{next.title}</span></Link>
          ) : null}
        </nav>
      </article>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <p className="ix mb-3">ON THIS PAGE</p>
        <ul className="flex flex-col gap-1 border-l border-line">
          {page.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={cn("-ml-px block border-l py-1 pl-3 text-small transition-colors", active === s.id ? "border-purple text-ink" : "border-transparent text-muted hover:text-ink")}>{s.title}</a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
