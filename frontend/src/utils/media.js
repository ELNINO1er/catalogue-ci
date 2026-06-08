export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = import.meta.env.MODE === "lan"
    ? `http://${window.location.hostname}:4000/api`
    : import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
