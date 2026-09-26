const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Escapes a user-controlled string (media/file names, rule names/patterns, remote URLs)
 * for interpolation into innerHTML templates. Everything that reaches an innerHTML
 * template from settings, the library, or the server manifest must pass through here.
 */
export function escapeHtml(text: string): string {
    return String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
