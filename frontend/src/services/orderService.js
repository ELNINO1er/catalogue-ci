import api from "./api";

export async function createPublicOrder(slug, payload) {
  const { data } = await api.post(`/public/catalogue/${slug}/orders`, payload);
  return data;
}

export async function listOrdersByBusiness(businessId, status = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const { data } = await api.get(`/businesses/${businessId}/orders${query}`);
  return data;
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await api.patch(`/orders/${orderId}/status`, payload);
  return data;
}

export async function markPaymentSent(orderId) {
  const { data } = await api.post(`/orders/${orderId}/payment-sent`);
  return data;
}
