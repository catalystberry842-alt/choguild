import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom font sizes so `text-small` is not dropped next to a text colour.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["label", "small", "lead"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
