import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, MessageCircle, Truck, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { me } from "../../services/authService";
import { listOrdersByBusiness, updateOrderStatus } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildCustomerWhatsAppLink } from "../../utils/whatsappMessage";

const statuses = [
  { value: "", label: "Tous les statuts" },
  { value: "PENDING", label: "Nouvelle commande" },
  { value: "AWAITING_PAYMENT", label: "En attente de paiement" },
  { value: "AWAITING_VERIFICATION", label: "Paiement a verifier" },
  { value: "PAID", label: "Payee" },
  { value: "CONFIRMED", label: "Confirmee" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "READY", label: "Prete" },
  { value: "DELIVERED", label: "Livree" },
  { value: "CANCELLED", label: "Annulee" },
];

const statusLabels = {
  PENDING: "Nouvelle commande",
  AWAITING_PAYMENT: "En attente de paiement",
  AWAITING_VERIFICATION: "Paiement a verifier",
  PAID: "Payee",
  CONFIRMED: "Confirmee",
  IN_PROGRESS: "En cours",
  READY: "Prete",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const paymentStatusLabels = {
  PENDING: "En attente",
  PROCESSING: "A verifier",
  PAID: "Paye",
  FAILED: "Echoue",
  CANCELLED: "Annule",
  REFUNDED: "Rembourse",
};

const statusColors = {
  PENDING: "bg-blue-50 text-blue-700",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700",
  AWAITING_VERIFICATION: "bg-orange-50 text-orange-700 ring-2 ring-orange-300",
  PAID: "bg-emerald-50 text-emerald-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  IN_PROGRESS: "bg-violet-50 text-violet-700",
  READY: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  REFUNDED: "bg-rose-50 text-rose-700",
};

const paymentMethodLabels = {
  wave_checkout: "Wave Checkout",
  wave: "Wave manuel",
  cod: "Livraison",
  whatsapp: "WhatsApp",
};

const selectClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function OrdersPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  async function loadOrders() {
    if (!businessId) return;
    const result = await listOrdersByBusiness(businessId, status, page);
    setOrders(result.data || result);
    setPagination(result.pagination || null);
  }

  useEffect(() => {
    loadOrders().catch(() => setOrders([]));
  }, [businessId, status, page]);

  useEffect(() => { setPage(1); }, [status]);

  function askConfirm({ order, nextStatus, paymentStatus, title, message, tone, confirmLabel }) {
    setConfirm({ order, nextStatus, paymentStatus, title, message, tone, confirmLabel });
  }

  async function executeAction() {
    if (!confirm) return;
    setActionLoading(true);
    setError("");
    try {
      await updateOrderStatus(confirm.order.id, {
        status: confirm.nextStatus,
        payment_status: confirm.paymentStatus || confirm.order.payment_status,
      });
      setConfirm(null);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de mettre a jour cette commande.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  }

  const isDone = (order) => ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);
  const isPaid = (order) => order.payment_status === "PAID";

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}>
          {statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      {error ? (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Erreur</p>
          <p>{error}</p>
          <button onClick={() => setError("")} className="mt-1 text-xs font-semibold underline">Fermer</button>
        </div>
      ) : null}

      <div className="grid gap-3">
        {orders.map((order) => (
          <div key={order.id} className={`rounded-lg border bg-white p-4 ${order.status === "AWAITING_VERIFICATION" ? "border-orange-300 border-l-4" : "border-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">Commande #{order.id} — {order.product?.name}</p>
                <p className="text-sm text-slate-600">{order.customer_name} — {order.customer_phone}</p>
                <p className="mt-1 text-sm font-bold text-emerald-700">{fmt(order.total_amount)} FCFA</p>
                {order.payment_method ? (
                  <p className="mt-1 text-xs text-slate-500">Via {paymentMethodLabels[order.payment_method] || order.payment_method}</p>
                ) : null}
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                  {statusLabels[order.status] || order.status}
                </span>
                <p className={`mt-1 text-sm ${isPaid(order) ? "font-semibold text-emerald-600" : "text-slate-500"}`}>
                  Paiement : {paymentStatusLabels[order.payment_status] || order.payment_status}
                </p>
              </div>
            </div>

            {order.fieldValues?.length ? (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                {order.fieldValues.map((item) => (
                  <p key={item.id}><span className="font-semibold">{item.field?.label} :</span> {item.value}</p>
                ))}
              </div>
            ) : null}

            {/* Alerte paiement a verifier */}
            {order.status === "AWAITING_VERIFICATION" ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                <CreditCard size={16} />
                Le client dit avoir envoye le paiement. Verifiez sur votre compte Wave.
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {/* Confirmer paiement — visible seulement si pas encore paye */}
              {!isPaid(order) && !isDone(order) ? (
                <Button onClick={() => askConfirm({
                  order,
                  nextStatus: "PAID",
                  paymentStatus: "PAID",
                  title: "Confirmer le paiement",
                  message: `Confirmez-vous avoir recu le paiement de ${fmt(order.total_amount)} FCFA de ${order.customer_name} pour "${order.product?.name}" ? Cette action marquera la commande comme payee.`,
                  tone: "success",
                  confirmLabel: "Oui, paiement recu",
                })}>
                  <CheckCircle2 size={16} /> Confirmer paiement
                </Button>
              ) : null}

              {/* Actions de progression — seulement si pas termine */}
              {!isDone(order) && order.status !== "CONFIRMED" ? (
                <Button tone="secondary" onClick={() => askConfirm({
                  order,
                  nextStatus: "CONFIRMED",
                  title: "Confirmer la commande",
                  message: `Confirmer la commande #${order.id} de ${order.customer_name} ?`,
                  tone: "info",
                  confirmLabel: "Confirmer",
                })}>Confirmer</Button>
              ) : null}

              {!isDone(order) && order.status !== "IN_PROGRESS" ? (
                <Button tone="secondary" onClick={() => askConfirm({
                  order,
                  nextStatus: "IN_PROGRESS",
                  title: "Passer en cours",
                  message: `Marquer la commande #${order.id} comme en cours de preparation ?`,
                  tone: "info",
                  confirmLabel: "En cours",
                })}>En cours</Button>
              ) : null}

              {!isDone(order) ? (
                <Button tone="secondary" onClick={() => askConfirm({
                  order,
                  nextStatus: "DELIVERED",
                  title: "Marquer comme livree",
                  message: `Confirmer que la commande #${order.id} a ete livree a ${order.customer_name} ?`,
                  tone: "success",
                  confirmLabel: "Livree",
                })}>
                  <Truck size={16} /> Livree
                </Button>
              ) : null}

              {/* Annuler — visible seulement si pas termine */}
              {!isDone(order) ? (
                <Button tone="danger" onClick={() => askConfirm({
                  order,
                  nextStatus: "CANCELLED",
                  paymentStatus: order.payment_status === "PAID" ? undefined : "CANCELLED",
                  title: "Annuler la commande",
                  message: `Etes-vous sur de vouloir annuler la commande #${order.id} de ${order.customer_name} ? Cette action est irreversible.`,
                  tone: "danger",
                  confirmLabel: "Annuler la commande",
                })}>
                  <XCircle size={16} /> Annuler
                </Button>
              ) : null}

              <a href={buildCustomerWhatsAppLink(order)} target="_blank" rel="noreferrer">
                <Button tone="secondary"><MessageCircle size={16} /> Client</Button>
              </a>
            </div>
          </div>
        ))}
        {!orders.length ? <p className="text-sm text-slate-500">Aucune commande trouvee.</p> : null}
      </div>

      {pagination && pagination.pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button tone="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="text-sm text-slate-600">Page {pagination.page} / {pagination.pages}</span>
          <Button tone="secondary" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      ) : null}

      {/* Modal de confirmation */}
      {confirm ? (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          tone={confirm.tone}
          confirmLabel={confirm.confirmLabel}
          loading={actionLoading}
          onConfirm={executeAction}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
