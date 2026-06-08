const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function generateWhatsAppLink(number, productName, price, businessName) {
  const message = `Bonjour, je veux commander : ${productName} a ${price} FCFA chez ${businessName}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export async function orderOnWhatsApp({ business, product }) {
  const message = product.checkoutMessage
    ? `Bonjour, je veux finaliser cette commande chez ${business.name}. ${product.checkoutMessage}`
    : `Bonjour, je veux commander : ${product.name} a ${product.price} FCFA chez ${business.name}.`;
  const link = `https://wa.me/${business.whatsapp_number}?text=${encodeURIComponent(message)}`;

  try {
    await fetch(`${API_URL}/tracking/whatsapp-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: business.id,
        product_id: product.id,
        customer_message: message,
      }),
      keepalive: true,
    });
  } catch {
    // Le tracking ne doit jamais bloquer la commande.
  }

  window.open(link, "_blank", "noopener,noreferrer");
}
