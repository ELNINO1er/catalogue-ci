import api from "./api";

export async function getAdminOverview() {
  const { data } = await api.get("/stats/overview");
  return data;
}

export async function listBusinesses() {
  const { data } = await api.get("/businesses");
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

export async function listMerchants() {
  const { data } = await api.get("/merchants");
  return data;
}

export async function listPaymentMethods() {
  const { data } = await api.get("/payment-methods/all");
  return data;
}
