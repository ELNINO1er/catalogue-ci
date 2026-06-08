import { useEffect, useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { getMerchantDashboard } from "../../services/merchantService";

const defaultTemplate = "Bonjour {customer_name}, votre commande {product_name} chez {business_name} a ete recue. Montant : {price} FCFA.";

export default function MerchantMessagesPage() {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({
    customer_name: "Jean",
    product_name: "Flyer professionnel",
    price: "5 000",
    order_number: "CMD-001",
    message: defaultTemplate,
  });

  useEffect(() => {
    getMerchantDashboard().then((data) => setBusiness(data.business)).catch(() => {});
  }, []);

  const generated = form.message
    .replaceAll("{customer_name}", form.customer_name)
    .replaceAll("{product_name}", form.product_name)
    .replaceAll("{business_name}", business?.name || "Votre boutique")
    .replaceAll("{price}", form.price)
    .replaceAll("{order_number}", form.order_number);

  async function copyMessage() {
    await navigator.clipboard.writeText(generated);
  }

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages WhatsApp</h1>
        <p className="mt-1 text-sm text-slate-500">Preparez des messages reutilisables avec variables pour vos clients.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-bold text-slate-900">Modele de message</h2>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={7}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            Variables : {"{customer_name}"} {"{product_name}"} {"{business_name}"} {"{price}"} {"{order_number}"}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Client" />
            <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Produit" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Prix" />
            <input value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Commande" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-bold text-slate-900">Apercu</h2>
          <div className="rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-slate-800">{generated}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={copyMessage}><Copy size={16} /> Copier</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(generated)}`} target="_blank" rel="noreferrer">
              <Button tone="secondary"><MessageCircle size={16} /> Ouvrir WhatsApp</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
