export function plainCopy(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function projectLabel(name: string): string {
  return plainCopy(name);
}

export function cardSummary(summary: string): string {
  const cleaned = plainCopy(summary);
  if (!cleaned) return "";
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}
