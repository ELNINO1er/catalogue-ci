import { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Clock, Package, Search, ShoppingBag, Truck, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { trackPublicOrder } from "../../services/orderService";
import { fmt } from "../../utils/formatters";

const statusLabels = {
  PENDING: "Commande recue",
  AWAITING_PAYMENT: "En attente de paiement",
  AWAITING_VERIFICATION: "Paiement envoye",
  PAID: "Paiement confirme",
  CONFIRMED: "Commande confirmee",
  IN_PROGRESS: "En preparation",
  READY: "Prete a retirer",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const paymentLabels = {
  PENDING: "En attente",
  PROCESSING: "A verifier",
  PAID: "Confirme",
  FAILED: "Echoue",
  CANCELLED: "Annule",
  REFUNDED: "Rembourse",
};

const timeline = [
  { key: "PENDING", label: "Commande recue", icon: ShoppingBag },
  { key: "AWAITING_VERIFICATION", label: "Paiement envoye", icon: Clock },
  { key: "PAID", label: "Paiement confirme", icon: CheckCircle2 },
  { key: "CONFIRMED", label: "Confirmee", icon: Package },
  { key: "DELIVERED", label: "Livree", icon: Truck },
];

const statusOrder = ["PENDING", "AWAITING_PAYMENT", "AWAITING_VERIFICATION", "PAID", "CONFIRMED", "IN_PROGRESS", "READY", "DELIVERED"];

function getStatusIndex(status) {
  const idx = statusOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
}

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

  const isCancelled = order?.status === "CANCELLED" || order?.status === "REFUNDED";
  const currentIdx = order ? getStatusIndex(order.status) : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-6">
      <div className="mx-auto max-w-lg space-y-5">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 shadow-card transition hover:shadow-card-hover">
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="card p-6">
          <div className="mb-1 flex items-center gap-2">
            <Search size={20} className="text-brand-400" />
            <h1 className="font-display text-xl font-bold text-brand-800">Suivi de commande</h1>
          </div>
          <p className="mb-5 text-sm text-gray-500">Entrez votre numero de commande et le telephone utilise.</p>

          <form onSubmit={submit} className="grid gap-4">
            <Input
              label="Numero de commande"
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              placeholder="Ex: 123"
              inputMode="numeric"
              required
            />
            <Input
              label="Telephone"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              placeholder="Ex: 0700000000"
              inputMode="tel"
              required
            />
            {error ? <p className="animate-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p> : null}
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : <Search size={16} />}
              {loading ? "Recherche..." : "Suivre ma commande"}
            </Button>
          </form>
        </div>

        {order ? (
          <div className="animate-slide-up space-y-4">
            {/* Order summary */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Commande</p>
                  <h2 className="font-display text-2xl font-bold text-brand-800">#{order.id}</h2>
                </div>
                <Badge variant={isCancelled ? "danger" : order.status === "DELIVERED" ? "success" : "info"} dot>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
                <span className="font-medium text-gray-500">Produit</span>
                <span className="text-right font-semibold text-brand-700">{order.product?.name}</span>
                <span className="font-medium text-gray-500">Montant</span>
                <span className="text-right text-lg font-bold text-brand-500">{fmt(order.total_amount)} FCFA</span>
                <span className="font-medium text-gray-500">Paiement</span>
                <span className="text-right">
                  <Badge variant={order.payment_status === "PAID" ? "success" : order.payment_status === "FAILED" ? "danger" : "warning"}>
                    {paymentLabels[order.payment_status] || order.payment_status}
                  </Badge>
                </span>
              </div>
            </div>

            {/* Timeline */}
            {!isCancelled ? (
              <div className="card p-6">
                <h3 className="mb-5 font-display text-sm font-bold text-brand-800">Progression</h3>
                <div className="space-y-0">
                  {timeline.map((step, i) => {
                    const stepIdx = statusOrder.indexOf(step.key);
                    const done = currentIdx >= stepIdx;
                    const isCurrent = currentIdx === stepIdx;
                    const Icon = step.icon;
                    const isLast = i === timeline.length - 1;

                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all ${done ? "bg-brand-500 text-white" : "bg-surface text-gray-300"} ${isCurrent ? "ring-4 ring-brand-100" : ""}`}>
                            <Icon size={14} />
                          </div>
                          {!isLast ? <div className={`w-0.5 flex-1 min-h-[24px] ${done ? "bg-brand-500" : "bg-surface-border"}`} /> : null}
                        </div>
                        <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                          <p className={`text-sm font-semibold ${done ? "text-brand-800" : "text-gray-400"}`}>{step.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card border-rose-200 bg-rose-50 p-6">
                <div className="flex items-center gap-3">
                  <XCircle size={22} className="text-rose-500" />
                  <div>
                    <p className="font-semibold text-rose-800">Commande annulee</p>
                    <p className="text-sm text-rose-600">Cette commande a ete annulee.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <footer className="pt-4 text-center text-xs text-gray-400">
          Propulse par <span className="font-semibold text-brand-500">CatalogueCI</span>
        </footer>
      </div>
    </main>
  );
}
