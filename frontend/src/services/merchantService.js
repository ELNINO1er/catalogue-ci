import api from "./api";

export async function getMerchantDashboard() {
  const { data } = await api.get("/merchant/dashboard");
  return data;
}

export async function getMerchantBusiness() {
  const { data } = await api.get("/merchant/business");
  return data;
}

export async function updateMerchantBusiness(payload) {
  const { data } = await api.put("/merchant/business", payload);
  return data;
}

export async function listMerchantTemplates() {
  const { data } = await api.get("/merchant/templates");
  return data;
}

export async function listMerchantCategories() {
  const { data } = await api.get("/merchant/categories");
  return data;
}
