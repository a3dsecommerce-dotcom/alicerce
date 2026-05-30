/**
 * Sanitiza strings para inserção segura em templates HTML de impressão.
 * Previne injeção de scripts maliciosos (XSS) ao escapar caracteres especiais.
 */
export function sanitizeHTML(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  const text = String(str);
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
