import api from "./api";

export async function listCustomFields(productId) {
  const { data } = await api.get(`/products/${productId}/fields`);
  return data;
}

export async function createCustomField(productId, payload) {
  const { data } = await api.post(`/products/${productId}/fields`, payload);
  return data;
}

export async function updateCustomField(fieldId, payload) {
  const { data } = await api.put(`/custom-fields/${fieldId}`, payload);
  return data;
}

export async function deleteCustomField(fieldId) {
  const { data } = await api.delete(`/custom-fields/${fieldId}`);
  return data;
}
