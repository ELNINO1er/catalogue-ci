import api from "./api";

export async function getPaymentSettings(businessId) {
  const { data } = await api.get(`/businesses/${businessId}/payment-settings`);
  return data;
}

export async function updatePaymentSettings(businessId, payload) {
  const { data } = await api.put(`/businesses/${businessId}/payment-settings`, payload);
  return data;
}
