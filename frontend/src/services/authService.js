import api from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("catalogueci_token", data.token);
  localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
  return data.user;
}

export async function register({ name, email, password, business_name, whatsapp_number, business_category, accept_terms }) {
  const { data } = await api.post("/auth/register", { name, email, password, business_name, whatsapp_number, business_category, accept_terms });
  localStorage.setItem("catalogueci_token", data.token);
  localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
  return data.user;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
  return data.user;
}

export async function requestPasswordReset(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}

export function getStoredUser() {
  const raw = localStorage.getItem("catalogueci_user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("catalogueci_token");
  localStorage.removeItem("catalogueci_user");
}
