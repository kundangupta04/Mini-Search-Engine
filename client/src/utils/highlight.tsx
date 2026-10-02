import type { ReactNode } from "react";

/** Escape characters that have a special meaning inside a regular expression. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wrap every occurrence of a keyword in <mark>. Case-insensitive, whole words only.
 * Longer keywords go first so "algorithms" wins over "algorithm".
 * Time: O(n) for n characters of text.
 */
export function highlightText(text: string, keywords: string[]): ReactNode {
  const cleaned = Array.from(new Set(keywords.filter((word) => word.length > 0))).sort(
    (a, b) => b.length - a.length
  );
  if (cleaned.length === 0) return text;

  const pattern = new RegExp(`\\b(${cleaned.map(escapeRegExp).join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-slate-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}