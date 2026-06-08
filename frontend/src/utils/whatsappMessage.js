import { fmt } from "./formatters";

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

  return `https://wa.me/${business.whatsapp_number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildCustomerWhatsAppLink(order) {
  return `https://wa.me/${order.customer_phone}?text=${encodeURIComponent(`Bonjour ${order.customer_name}, concernant votre commande #${order.id}.`)}`;
}
