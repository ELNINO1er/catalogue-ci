import api from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("catalogueci_token", data.token);
  localStorage.setItem("catalogueci_user", JSON.stringify(data.user));
  return data.user;
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
