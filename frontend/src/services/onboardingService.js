import api from "./api";

export async function getOnboardingData() {
  const { data } = await api.get("/merchant/onboarding");
  return data;
}

export async function saveOnboardingStep(step, data) {
  const { data: result } = await api.put("/merchant/onboarding/step", { step, data });
  return result;
}

export async function completeOnboarding() {
  const { data } = await api.post("/merchant/onboarding/complete");
  return data;
}

export async function createQuickProducts(products) {
  const { data } = await api.post("/merchant/onboarding/quick-products", { products });
  return data;
}

export async function uploadBusinessImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/merchant/onboarding/upload-image", formData);
  return data.image_url;
}

export async function uploadOnboardingProductImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/merchant/onboarding/upload-product-image", formData);
  return data.image_url;
}
