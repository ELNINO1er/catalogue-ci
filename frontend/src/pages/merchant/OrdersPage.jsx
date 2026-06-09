import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { me } from "../../services/authService";
import { listOrdersByBusiness, updateOrderStatus } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildCustomerWhatsAppLink } from "../../utils/whatsappMessage";

const statuses = [
  { value: "", label: "Tous les statuts" },
  { value: "PENDING", label: "Nouvelle commande" },
  { value: "AWAITING_PAYMENT", label: "En attente de paiement" },
  { value: "AWAITING_VERIFICATION", label: "Paiement a verifier" },
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

const selectClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function OrdersPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

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

  async function setOrderStatus(order, nextStatus, paymentStatus) {
    if (nextStatus === "CANCELLED" && !window.confirm("Annuler cette commande ? Cette action est irreversible.")) return;
    await updateOrderStatus(order.id, {
      status: nextStatus,
      payment_status: paymentStatus || order.payment_status,
    });
    await loadOrders();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}>
          {statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">Commande #{order.id} - {order.product?.name}</p>
                <p className="text-sm text-slate-600">{order.customer_name} - {order.customer_phone}</p>
                <p className="text-sm font-semibold text-emerald-700">{fmt(order.total_amount)} FCFA</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-700">{statusLabels[order.status] || order.status}</p>
                <p className="text-slate-500">Paiement : {paymentStatusLabels[order.payment_status] || order.payment_status}</p>
              </div>
            </div>

            {order.fieldValues?.length ? (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                {order.fieldValues.map((item) => (
                  <p key={item.id}><span className="font-semibold">{item.field?.label} :</span> {item.value}</p>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button tone="secondary" onClick={() => setOrderStatus(order, "CONFIRMED")}>Confirmer</Button>
              <Button tone="secondary" onClick={() => setOrderStatus(order, "IN_PROGRESS")}>En cours</Button>
              <Button tone="secondary" onClick={() => setOrderStatus(order, "DELIVERED")}>Livree</Button>
              <Button onClick={() => setOrderStatus(order, "PAID", "PAID")}>Confirmer paiement</Button>
              {order.status !== "CANCELLED" && order.status !== "DELIVERED" ? (
                <Button tone="danger" onClick={() => setOrderStatus(order, "CANCELLED")}>Annuler</Button>
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
    </div>
  );
}
