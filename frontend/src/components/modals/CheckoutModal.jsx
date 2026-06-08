import { useState } from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";
import Button from "../ui/Button";
import { fmt } from "../../utils/formatters";
import { orderOnWhatsApp } from "../../utils/whatsapp";

export default function CheckoutModal({ business, product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [fulfillment, setFulfillment] = useState("delivery");
  const [paymentCode, setPaymentCode] = useState(business.paymentMethods?.[0]?.code || "");
  const unitPrice = Number(product.price || 0);
  const total = unitPrice * quantity;
  const payment = business.paymentMethods.find((method) => method.code === paymentCode);

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function confirmOrder() {
    const details = [
      `Produit: ${product.name}`,
      `Quantite: ${quantity}`,
      `Total: ${fmt(total)} FCFA`,
      `Paiement: ${payment?.name || "A confirmer"}`,
      `Mode: ${fulfillment === "delivery" ? "Livraison" : "Retrait sur place"}`,
      customer.name ? `Client: ${customer.name}` : null,
      customer.phone ? `Telephone: ${customer.phone}` : null,
      fulfillment === "delivery" && customer.address ? `Adresse: ${customer.address}` : null,
    ].filter(Boolean);

    await orderOnWhatsApp({
      business,
      product: {
        ...product,
        price: total,
        name: `${product.name} x${quantity}`,
        checkoutMessage: details.join(" | "),
      },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Paiement et commande</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{product.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{business.name}</p>
            </div>
            <Button tone="ghost" onClick={onClose}>Fermer</Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Prix unitaire</p>
                <p className="font-bold text-slate-900">{fmt(unitPrice)} FCFA</p>
              </div>
              <div className="flex items-center gap-2">
                <Button tone="secondary" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>
                  <Minus size={16} />
                </Button>
                <span className="grid h-10 w-12 place-items-center rounded-lg border border-slate-200 font-bold">{quantity}</span>
                <Button tone="secondary" onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Mode de reception</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={() => setFulfillment("delivery")} className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${fulfillment === "delivery" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"}`}>
                Livraison
              </button>
              <button onClick={() => setFulfillment("pickup")} className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold ${fulfillment === "pickup" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"}`}>
                Retrait sur place
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Paiement</h3>
            <div className="grid gap-2">
              {business.paymentMethods.map((method) => (
                <label key={method.id} className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 ${paymentCode === method.code ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}>
                  <span className="font-semibold text-slate-800">{method.name}</span>
                  <input type="radio" name="payment" checked={paymentCode === method.code} onChange={() => setPaymentCode(method.code)} className="h-4 w-4 accent-emerald-600" />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Le commercant confirme les instructions exactes de paiement dans WhatsApp.
            </p>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Vos informations</h3>
            <div className="grid gap-3">
              <input value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} placeholder="Nom" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500" />
              <input value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} placeholder="Telephone" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500" />
              {fulfillment === "delivery" ? (
                <textarea value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} placeholder="Adresse de livraison" rows={2} className="resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500" />
              ) : null}
            </div>
          </section>

          <section className="rounded-lg bg-slate-100 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Sous-total</span>
              <span>{fmt(total)} FCFA</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-bold text-slate-900">
              <span>Total a payer</span>
              <span>{fmt(total)} FCFA</span>
            </div>
          </section>

          <Button className="w-full py-3" onClick={confirmOrder} disabled={!paymentCode}>
            <MessageCircle size={18} />
            Valider et envoyer sur WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
