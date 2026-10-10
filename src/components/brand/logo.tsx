import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function Logo({
  className = "",
  float = false,
  onClick,
}: {
  className?: string;
  float?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn("block", float && "mascot-float", className)}
      aria-label="Choguild home"
    >
      <img
        src="/brand/choguild-mark.jpg"
        alt="Choguild"
        width={640}
        height={640}
        className="h-auto w-full rounded-lg"
      />
    </Link>
  );
}
