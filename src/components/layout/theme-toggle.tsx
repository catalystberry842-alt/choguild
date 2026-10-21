import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Light/dark switch. The initial theme is set before paint by the inline script in __root. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme((document.documentElement.dataset.theme as Theme) || "dark"), []);
  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem("cg-theme", next); } catch { /* private mode */ }
    setTheme(next);
  }
  const label = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="mr-1 flex size-8 items-center justify-center rounded-full text-body transition-colors hover:bg-line hover:text-ink">
      {theme === "light" ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
    </button>
  );
}
