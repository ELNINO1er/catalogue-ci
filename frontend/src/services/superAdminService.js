import api from "./api";

export async function getSuperAdminDashboard() {
  const { data } = await api.get("/super-admin/dashboard");
  return data;
}

export async function listPlans() {
  const { data } = await api.get("/super-admin/plans");
  return data;
}

export async function createPlan(payload) {
  const { data } = await api.post("/super-admin/plans", payload);
  return data;
}

export async function listSubscriptions() {
  const { data } = await api.get("/super-admin/subscriptions");
  return data;
}

export async function saveSubscription(payload) {
  const { data } = await api.post("/super-admin/subscriptions", payload);
  return data;
}

export async function listPlatformPayments() {
  const { data } = await api.get("/super-admin/platform-payments");
  return data;
}

export async function createPlatformPayment(payload) {
  const { data } = await api.post("/super-admin/platform-payments", payload);
  return data;
}

export async function listAdminCategories() {
  const { data } = await api.get("/super-admin/categories");
  return data;
}

export async function createAdminCategory(payload) {
  const { data } = await api.post("/super-admin/categories", payload);
  return data;
}

export async function listTemplates() {
  const { data } = await api.get("/super-admin/templates");
  return data;
}

export async function createTemplate(payload) {
  const { data } = await api.post("/super-admin/templates", payload);
  return data;
}

export async function listActivityLogs() {
  const { data } = await api.get("/super-admin/activity-logs");
  return data;
}

export async function getPlatformSettings() {
  const { data } = await api.get("/super-admin/settings");
  return data;
}

export async function savePlatformSettings(payload) {
  const { data } = await api.put("/super-admin/settings", payload);
  return data;
}
