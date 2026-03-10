// XSS prevention: sanitize user-provided text for safe rendering
// Uses a strict allowlist approach - strips all HTML tags

const HTML_TAG_RE = /<[^>]*>/g;
const SCRIPT_CONTENT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;
const DATA_URI_RE = /data\s*:[^,]*;base64/gi;

export function sanitizeText(input: string): string {
  return input
    .replace(SCRIPT_CONTENT_RE, "")
    .replace(EVENT_HANDLER_RE, "")
    .replace(JAVASCRIPT_URI_RE, "")
    .replace(DATA_URI_RE, "")
    .replace(HTML_TAG_RE, "")
    .trim();
}

// Sanitize a URL — only allow http, https, and mailto protocols
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    // Not a valid URL
  }
  return "";
}

// Sanitize object values (shallow, for form data)
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key in result) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(result[key] as string);
    }
  }
  return result;
}
