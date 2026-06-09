import api from "./api";

export async function getMerchantDashboard() {
  const { data } = await api.get("/merchant/dashboard");
  return data;
}

export async function getMerchantAnalytics() {
  const { data } = await api.get("/merchant/analytics");
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

export async function getPlanInfo() {
  const { data } = await api.get("/merchant/plan-info");
  return data;
}

export async function listAvailablePlans() {
  const { data } = await api.get("/merchant/plans");
  return data;
}

export async function requestPlanChange(plan_id) {
  const { data } = await api.post("/merchant/plans/change", { plan_id });
  return data;
}

export async function submitSubscriptionPayment(payment_id, reference) {
  const { data } = await api.post("/merchant/plans/payment", { payment_id, reference });
  return data;
}

export async function getPaymentWaveInfo() {
  const { data } = await api.get("/merchant/plans/wave-info");
  return data;
}
