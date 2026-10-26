import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, CreditCard, MessageCircle, ShoppingBag, Truck, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  Avatar, CardGrid, FilterTabs, ListSkeleton, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { me } from "../../services/authService";
import { listOrdersByBusiness, updateOrderStatus } from "../../services/orderService";
import { listBusinesses } from "../../services/businessService";
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

const statusTones = {
  PENDING: "info",
  AWAITING_PAYMENT: "warning",
  AWAITING_VERIFICATION: "warning",
  PAID: "success",
  CONFIRMED: "info",
  IN_PROGRESS: "violet",
  READY: "brand",
  DELIVERED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
};

const paymentStatusLabels = {
  PENDING: "Paiement en attente",
  PROCESSING: "Paiement a verifier",
  PAID: "Paye",
  FAILED: "Paiement echoue",
  CANCELLED: "Paiement annule",
  REFUNDED: "Rembourse",
};

const paymentTones = { PAID: "success", PROCESSING: "warning", FAILED: "danger", REFUNDED: "danger" };

const paymentMethodLabels = {
  wave_checkout: "Wave Checkout",
  wave: "Wave manuel",
  cod: "Paiement a la livraison",
  whatsapp: "WhatsApp",
};

// Regroupement des statuts pour les onglets (filtre sur la page chargee).
const GROUPS = {
  todo: ["PENDING", "AWAITING_PAYMENT", "AWAITING_VERIFICATION"],
  progress: ["PAID", "CONFIRMED", "IN_PROGRESS", "READY"],
  done: ["DELIVERED"],
  cancelled: ["CANCELLED", "REFUNDED"],
};

const selectClass = "rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm font-medium text-ink-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function OrdersPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "SUPER_ADMIN";
  // Le super admin n'a pas de boutique : il choisit celle dont il veut voir les commandes.
  const [businesses, setBusinesses] = useState([]);
  const [adminBusinessId, setAdminBusinessId] = useState("");

  useEffect(() => {
    if (isAdmin) {
      listBusinesses()
        .then((list) => {
          setBusinesses(list);
          if (list[0]) setAdminBusinessId(String(list[0].id));
          else setLoading(false);
        })
        .catch(() => { setError("Impossible de charger les boutiques."); setLoading(false); });
    } else {
      me().then(setProfile).catch(() => {});
    }
  }, [isAdmin]);

  const businessId = isAdmin ? adminBusinessId : profile?.business?.id || profile?.business_id;

  async function loadOrders() {
    if (!businessId) return;
    setLoading(true);
    try {
      const result = await listOrdersByBusiness(businessId, status, page);
      setOrders(result.data || result);
      setPagination(result.pagination || null);
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || "Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [businessId, status, page]);

  function changeStatusFilter(value) {
    setStatus(value);
    setPage(1);
  }

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

  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.entries(GROUPS).forEach(([key, list]) => { c[key] = orders.filter((o) => list.includes(o.status)).length; });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((order) => {
      if (group !== "all" && !GROUPS[group].includes(order.status)) return false;
      if (!q) return true;
      return `${order.id} ${order.customer_name || ""} ${order.customer_phone || ""} ${order.product?.name || ""}`.toLowerCase().includes(q);
    });
  }, [orders, group, query]);

  const toVerify = orders.filter((o) => o.status === "AWAITING_VERIFICATION").length;
  const paidTotal = orders.filter(isPaid).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        description="Suivez chaque commande, confirmez les paiements et tenez vos clients informes."
        actions={isAdmin ? (
          <select
            aria-label="Boutique"
            value={adminBusinessId}
            onChange={(event) => { setAdminBusinessId(event.target.value); setPage(1); }}
            className={selectClass}
          >
            {businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        ) : null}
      />

      <SummaryStrip
        items={[
          { label: "Commandes", value: fmt(pagination?.total ?? orders.length), icon: ShoppingBag, hint: pagination ? `Page ${pagination.page} / ${pagination.pages || 1}` : undefined },
          { label: "A traiter", value: fmt(counts.todo), icon: Clock, tone: counts.todo ? "warning" : "neutral" },
          { label: "Paiements a verifier", value: fmt(toVerify), icon: CreditCard, tone: toVerify ? "danger" : "neutral" },
          { label: "Encaisse (page)", value: `${fmt(paidTotal)} FCFA`, icon: CheckCircle2, tone: "success" },
        ]}
      />

      <Toolbar
        right={(
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Client, telephone ou #numero" />
            <select aria-label="Statut precis" value={status} onChange={(event) => changeStatusFilter(event.target.value)} className={selectClass}>
              {statuses.map((item) => <option key={item.value || "all"} value={item.value}>{item.label}</option>)}
            </select>
          </>
        )}
      >
        <FilterTabs
          label="Etape des commandes"
          value={group}
          onChange={setGroup}
          options={[
            { value: "all", label: "Toutes", count: counts.all },
            { value: "todo", label: "A traiter", count: counts.todo },
            { value: "progress", label: "En cours", count: counts.progress },
            { value: "done", label: "Terminees", count: counts.done },
            { value: "cancelled", label: "Annulees", count: counts.cancelled },
          ]}
        />
      </Toolbar>

      {error ? (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div>
            <p className="font-semibold">Erreur</p>
            <p>{error}</p>
          </div>
          <button onClick={() => setError("")} className="text-xs font-semibold underline">Fermer</button>
        </div>
      ) : null}

      {loading ? <ListSkeleton /> : visible.length ? (
        <CardGrid>
          {visible.map((order) => (
            <article
              key={order.id}
              className={`card-hover flex flex-col p-5 ${order.status === "AWAITING_VERIFICATION" ? "ring-2 ring-amber-300" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={order.customer_name} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink-900">{order.customer_name}</h2>
                  <p className="truncate text-xs text-ink-500">Commande #{order.id} · {order.customer_phone}</p>
                </div>
                <StatusPill tone={statusTones[order.status] || "neutral"}>{statusLabels[order.status] || order.status}</StatusPill>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
                <span>{formatDateTime(order.created_at)}</span>
                <StatusPill tone={paymentTones[order.payment_status] || "neutral"} icon={CreditCard}>
                  {paymentStatusLabels[order.payment_status] || order.payment_status}
                </StatusPill>
              </div>

              <div className="mt-4 rounded-xl bg-surface p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium text-ink-800">{order.product?.name || "Produit"}</span>
                  <span className="shrink-0 text-ink-600">{fmt(order.product?.price ?? order.total_amount)} FCFA</span>
                </div>
                {order.fieldValues?.length ? (
                  <dl className="mt-2 space-y-1 border-t border-surface-border pt-2 text-xs">
                    {order.fieldValues.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3">
                        <dt className="text-ink-500">{item.field?.label}</dt>
                        <dd className="min-w-0 truncate text-right font-medium text-ink-800">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-500">
                  Total{order.payment_method ? ` · ${paymentMethodLabels[order.payment_method] || order.payment_method}` : ""}
                </span>
                <span className="font-display text-lg font-bold text-ink-900">{fmt(order.total_amount)} FCFA</span>
              </div>

              {order.status === "AWAITING_VERIFICATION" ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  <CreditCard size={14} className="mt-0.5 shrink-0" />
                  Le client dit avoir envoye le paiement. Verifiez sur votre compte Wave.
                </p>
              ) : null}

              <div className="mt-auto space-y-2 pt-4">
                {!isPaid(order) && !isDone(order) ? (
                  <Button className="w-full" onClick={() => askConfirm({
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

                {!isDone(order) ? (
                  <div className="grid grid-cols-3 gap-2">
                    {order.status !== "CONFIRMED" ? (
                      <Button size="sm" tone="secondary" onClick={() => askConfirm({
                        order,
                        nextStatus: "CONFIRMED",
                        title: "Confirmer la commande",
                        message: `Confirmer la commande #${order.id} de ${order.customer_name} ?`,
                        tone: "info",
                        confirmLabel: "Confirmer",
                      })}>Confirmer</Button>
                    ) : <span />}
                    {order.status !== "IN_PROGRESS" ? (
                      <Button size="sm" tone="secondary" onClick={() => askConfirm({
                        order,
                        nextStatus: "IN_PROGRESS",
                        title: "Passer en cours",
                        message: `Marquer la commande #${order.id} comme en cours de preparation ?`,
                        tone: "info",
                        confirmLabel: "En cours",
                      })}>En cours</Button>
                    ) : <span />}
                    <Button size="sm" tone="secondary" onClick={() => askConfirm({
                      order,
                      nextStatus: "DELIVERED",
                      title: "Marquer comme livree",
                      message: `Confirmer que la commande #${order.id} a ete livree a ${order.customer_name} ?`,
                      tone: "success",
                      confirmLabel: "Livree",
                    })}>
                      <Truck size={14} /> Livree
                    </Button>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <a href={buildCustomerWhatsAppLink(order)} target="_blank" rel="noreferrer" className="flex-1">
                    <Button size="sm" tone="whatsapp" className="w-full"><MessageCircle size={14} /> Ecrire au client</Button>
                  </a>
                  {!isDone(order) ? (
                    <Button size="sm" tone="dangerSoft" onClick={() => askConfirm({
                      order,
                      nextStatus: "CANCELLED",
                      paymentStatus: order.payment_status === "PAID" ? undefined : "CANCELLED",
                      title: "Annuler la commande",
                      message: `Etes-vous sur de vouloir annuler la commande #${order.id} de ${order.customer_name} ? Cette action est irreversible.`,
                      tone: "danger",
                      confirmLabel: "Annuler la commande",
                    })}>
                      <XCircle size={14} /> Annuler
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length ? "Aucune commande ne correspond" : "Aucune commande trouvee"}
          description={orders.length ? "Modifiez la recherche ou l'onglet." : "Les commandes de vos clients apparaitront ici."}
        />
      )}

      {pagination && pagination.pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button tone="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="text-sm text-ink-600">Page {pagination.page} / {pagination.pages}</span>
          <Button tone="secondary" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      ) : null}

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
