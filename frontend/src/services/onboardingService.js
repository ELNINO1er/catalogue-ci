function authHeaders() {
  const token = localStorage.getItem("catalogueci_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url, options = {}) {
  const res = await fetch(`/api${url}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return data;
}

export async function getOnboardingData() {
  return apiFetch("/merchant/onboarding");
}

export async function saveOnboardingStep(step, data) {
  return apiFetch("/merchant/onboarding/step", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, data }),
  });
}

export async function completeOnboarding() {
  return apiFetch("/merchant/onboarding/complete", { method: "POST" });
}

export async function createQuickProducts(products) {
  return apiFetch("/merchant/onboarding/quick-products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  });
}

export async function uploadBusinessImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = localStorage.getItem("catalogueci_token");
  const res = await fetch("/api/merchant/onboarding/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur upload");
  return data.image_url;
}

export async function uploadOnboardingProductImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = localStorage.getItem("catalogueci_token");
  const res = await fetch("/api/merchant/onboarding/upload-product-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur upload");
  return data.image_url;
}
