import api from "./api";

export async function createPublicOrder(slug, payload) {
  const { data } = await api.post(`/public/catalogue/${slug}/orders`, payload);
  return data;
}

export async function trackPublicOrder(payload) {
  const { data } = await api.post("/public/orders/track", payload);
  return data.order;
}

export async function listOrdersByBusiness(businessId, status = "", page = 1) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", page);
  const query = params.toString() ? `?${params}` : "";
  const { data } = await api.get(`/businesses/${businessId}/orders${query}`);
  return data.data !== undefined ? data : { data, pagination: null };
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await api.patch(`/orders/${orderId}/status`, payload);
  return data;
}

export async function markPaymentSent(orderId, payload = {}) {
  const { data } = await api.post(`/orders/${orderId}/payment-sent`, payload);
  return data;
}

export async function createWaveCheckoutSession(orderId, payload = {}) {
  const { data } = await api.post(`/orders/${orderId}/wave-checkout`, payload);
  return data;
}
