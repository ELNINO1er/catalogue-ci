import api from "./api";

export async function login(email, password) {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("catalogueci_token", data.token);
    localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
    return data.user;
  } catch (axiosErr) {
    // Fallback to native fetch if axios fails silently (CDN/proxy issues)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw { response: { data } };
    localStorage.setItem("catalogueci_token", data.token);
    localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
    return data.user;
  }
}

export async function register({ name, email, password, business_name, whatsapp_number, business_category }) {
  try {
    const { data } = await api.post("/auth/register", { name, email, password, business_name, whatsapp_number, business_category });
    localStorage.setItem("catalogueci_token", data.token);
    localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
    return data.user;
  } catch (axiosErr) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, business_name, whatsapp_number, business_category }),
    });
    const data = await res.json();
    if (!res.ok) throw { response: { data } };
    localStorage.setItem("catalogueci_token", data.token);
    localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
    return data.user;
  }
}

export async function me() {
  const { data } = await api.get("/auth/me");
  localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
  return data.user;
}

export function getStoredUser() {
  const raw = localStorage.getItem("catalogueci_user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("catalogueci_token");
  localStorage.removeItem("catalogueci_user");
}
