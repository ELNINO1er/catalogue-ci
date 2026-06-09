import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import { trackPublicOrder } from "../../services/orderService";
import { fmt } from "../../utils/formatters";

const statusLabels = {
  PENDING: "Commande recue",
  AWAITING_PAYMENT: "En attente de paiement",
  AWAITING_VERIFICATION: "Paiement a verifier",
  PAID: "Paiement confirme",
  CONFIRMED: "Commande confirmee",
  IN_PROGRESS: "En cours",
  READY: "Prete",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const paymentLabels = {
  PENDING: "Paiement en attente",
  PROCESSING: "Paiement a verifier",
  PAID: "Paiement confirme",
  FAILED: "Paiement echoue",
  CANCELLED: "Paiement annule",
  REFUNDED: "Paiement rembourse",
};

export default function OrderTrackingPage({ onBack }) {
  const [form, setForm] = useState({ order_id: "", customer_phone: "" });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      setOrder(await trackPublicOrder(form));
    } catch (err) {
      setError(err.response?.data?.message || "Commande introuvable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-5">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} />
          Retour
        </button>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">Suivi de commande</h1>
          <p className="mt-1 text-sm text-slate-500">Entrez votre numero de commande et le telephone utilise lors de la commande.</p>

          <form onSubmit={submit} className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Numero de commande
              <input
                value={form.order_id}
                onChange={(event) => setForm({ ...form, order_id: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ex: 123"
                inputMode="numeric"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Telephone
              <input
                value={form.customer_phone}
                onChange={(event) => setForm({ ...form, customer_phone: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ex: 0700000000"
                inputMode="tel"
              />
            </label>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <Button type="submit" disabled={loading} className="py-3">
              <Search size={16} />
              Suivre ma commande
            </Button>
          </form>
        </section>

        {order ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Commande</p>
                <h2 className="text-xl font-bold text-slate-900">#{order.id}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p><strong>Produit :</strong> {order.product?.name}</p>
              <p><strong>Montant :</strong> {fmt(order.total_amount)} FCFA</p>
              <p><strong>Paiement :</strong> {paymentLabels[order.payment_status] || order.payment_status}</p>
              <p><strong>Methode :</strong> {order.payment_method || "Non definie"}</p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
