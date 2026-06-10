// Fetch-based API client (replaces axios for Hostinger CDN compatibility)

function resolveApiBaseUrl() {
  if (import.meta.env.MODE === "lan") {
    return `http://${window.location.hostname}:4000/api`;
  }
  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

const BASE_URL = resolveApiBaseUrl();

function getToken() {
  return localStorage.getItem("catalogueci_token");
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

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: { ...headers, ...options.headers },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — clear auth
  if (res.status === 401) {
    localStorage.removeItem("catalogueci_token");
    localStorage.removeItem("catalogueci_user");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }

  // Return axios-compatible { data } shape
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
