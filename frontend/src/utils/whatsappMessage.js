import { fmt } from "./formatters";
import { resolveApiBaseUrl } from "../services/api";

// wa.me n'accepte que des chiffres (indicatif pays inclus, sans "+").
export function waNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

export function waLink(number, text) {
  const base = `https://wa.me/${waNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Lien externe saisi par un commercant : seuls http(s) sont autorises (bloque javascript:, data:...).
export function safeHref(url) {
  try {
    const parsed = new URL(String(url || ""));
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

// Statistique "clics WhatsApp" : ne doit jamais bloquer le client.
export function trackWhatsAppClick({ businessId, productId, message }) {
  try {
    fetch(`${resolveApiBaseUrl()}/tracking/whatsapp-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, product_id: productId || null, customer_message: message || undefined }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function buildOrderWhatsAppMessage({ business, order }) {
  const lines = [
    `Bonjour, je veux commander : ${order.product?.name || "Produit"} a ${fmt(order.total_amount)} FCFA.`,
    `Nom : ${order.customer_name}`,
    `Telephone : ${order.customer_phone}`,
  ];

  if (order.payment_status) lines.push(`Statut paiement : ${order.payment_status}`);

  const details = order.fieldValues || [];
  if (details.length) {
    lines.push("Details :");
    details.forEach((item) => {
      lines.push(`- ${item.field?.label || "Champ"} : ${item.value}`);
    });
  }

  return waLink(business.whatsapp_number, lines.join("\n"));
}

export function buildCustomerWhatsAppLink(order) {
  return waLink(order.customer_phone, `Bonjour ${order.customer_name}, concernant votre commande #${order.id}.`);
}
