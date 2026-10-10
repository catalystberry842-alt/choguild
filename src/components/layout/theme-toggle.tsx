import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // Server render is always dark; sync to the real theme after mount.
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(readTheme()), []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex size-9 items-center justify-center rounded-full border border-line bg-elevated text-muted transition-colors hover:border-muted hover:text-ink"
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  );
}
