// Fetch-based API client (replaces axios for Hostinger CDN compatibility)

export function resolveApiBaseUrl() {
  if (import.meta.env.MODE === "lan") {
    return `http://${window.location.hostname}:4000/api`;
  }
  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

const BASE_URL = resolveApiBaseUrl();

// Emis quand la session n'est plus valide (token expire, compte desactive, boutique suspendue).
export const UNAUTHORIZED_EVENT = "catalogueci:unauthorized";

function getToken() {
  return localStorage.getItem("catalogueci_token");
}

function buildUrl(url, params) {
  if (!params || typeof params !== "object") return `${BASE_URL}${url}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  return qs ? `${BASE_URL}${url}?${qs}` : `${BASE_URL}${url}`;
}

async function request(method, url, body, options = {}) {
  const token = getToken();
  const headers = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  const isFormData = body instanceof FormData;
  if (!isFormData && body) {
    headers["Content-Type"] = "application/json";
  }

  // Build URL with query params if provided (axios compatibility)
  const fullUrl = buildUrl(url, options.params);

  // Merge headers but strip Content-Type for FormData
  const mergedHeaders = { ...headers };
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      // Skip Content-Type for FormData uploads
      if (isFormData && key.toLowerCase() === "content-type") continue;
      mergedHeaders[key] = value;
    }
  }

  const res = await fetch(fullUrl, {
    method,
    headers: mergedHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // Session invalide : on vide le stockage et on previent l'application (retour a la connexion).
  // Seulement si un token etait envoye, pour ne pas interferer avec un echec de connexion.
  if (token && (res.status === 401 || data.code === "BUSINESS_SUSPENDED")) {
    localStorage.removeItem("catalogueci_token");
    localStorage.removeItem("catalogueci_user");
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { message: data.message } }));
  }

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }

  return { data };
}

const api = {
  get: (url, options) => request("GET", url, null, options),
  post: (url, body, options) => request("POST", url, body, options),
  put: (url, body, options) => request("PUT", url, body, options),
  patch: (url, body, options) => request("PATCH", url, body, options),
  delete: (url, options) => request("DELETE", url, null, options),
};

export default api;
