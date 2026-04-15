import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Strips markdown code fences from an LLM response and returns clean JSON text.
 * Handles all variants: ```json, ```, leading/trailing whitespace, and bare JSON.
 * For object responses, also extracts by brace-boundary as a fallback.
 *
 * @param {string} raw - Raw LLM output string
 * @param {"object"|"array"} [shape="object"] - Expected JSON root shape
 * @returns {string} Cleaned string ready for JSON.parse()
 */
export function cleanJson(raw, shape = "object") {
  // Strip code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  // Always slice to exact JSON boundaries — this safely handles:
  // - clean JSON (start=0, end=last char → no-op slice)
  // - preamble text before the JSON
  // - trailing explanation text after the closing bracket (the main failure mode)
  const opener = shape === "array" ? "[" : "{";
  const closer = shape === "array" ? "]" : "}";
  const start = cleaned.indexOf(opener);
  const end   = cleaned.lastIndexOf(closer);
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
    // Remove trailing commas before closing braces/brackets (common LLM mistake)
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  }

  return cleaned;
}
