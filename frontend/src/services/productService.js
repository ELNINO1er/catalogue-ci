import api from "./api";

export async function listProductsByBusiness(businessId) {
  const { data } = await api.get(`/businesses/${businessId}/products`);
  return data;
}

export async function createProduct(businessId, payload) {
  const { data } = await api.post(`/businesses/${businessId}/products`, payload);
  return data;
}

export async function uploadProductImage(businessId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post(`/businesses/${businessId}/products/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.image_url;
}

export async function deleteProduct(productId) {
  const { data } = await api.delete(`/products/${productId}`);
  return data;
}
