import { resolveApiBaseUrl } from "../services/api";

export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  // Seuls les chemins relatifs (uploads) sont completes ; tout autre schema (javascript:, data:...) est ignore.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return "";
  const origin = resolveApiBaseUrl().replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
