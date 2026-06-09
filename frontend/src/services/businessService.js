import api from "./api";

export async function getAdminOverview() {
  const { data } = await api.get("/stats/overview");
  return data;
}

export async function listBusinesses(params = {}) {
  const { data } = await api.get("/businesses", { params });
  return data.data || data;
}

export async function createBusiness(payload) {
  const { data } = await api.post("/businesses", payload);
  return data;
}

export async function updateBusiness(id, payload) {
  const { data } = await api.put(`/businesses/${id}`, payload);
  return data;
}

export async function getPublicCatalogue(slug) {
  const { data } = await api.get(`/public/catalogue/${slug}`);
  return data;
}

export async function getBusinessStats(businessId) {
  const { data } = await api.get(`/businesses/${businessId}/stats`);
  return data;
}

export async function listMerchants(params = {}) {
  const { data } = await api.get("/merchants", { params });
  return data.data || data;
}

export async function createMerchant(payload) {
  const { data } = await api.post("/merchants", payload);
  return data;
}

export async function updateMerchant(id, payload) {
  const { data } = await api.put(`/merchants/${id}`, payload);
  return data;
}

export async function toggleMerchant(id, isActive) {
  const { data } = await api.patch(`/merchants/${id}/disable`, { is_active: isActive });
  return data;
}

export async function listPaymentMethods() {
  const { data } = await api.get("/payment-methods/all");
  return data;
}

export async function createPaymentMethod(payload) {
  const { data } = await api.post("/payment-methods", payload);
  return data;
}

export async function updatePaymentMethod(id, payload) {
  const { data } = await api.put(`/payment-methods/${id}`, payload);
  return data;
}
