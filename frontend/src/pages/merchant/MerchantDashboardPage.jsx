import { useEffect, useState } from "react";
import { BarChart3, CalendarClock, Copy, CreditCard, ExternalLink, Eye, MessageCircle, Package, QrCode, ShoppingBag } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/common/StatCard";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { getMerchantDashboard } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";
import toast from "react-hot-toast";

function formatDate(value) {
  if (!value) return "Non definie";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

export default function MerchantDashboardPage({ user, setView, setPublicSlug, setQrBusiness }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMerchantDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (!data) return <p className="p-5 text-sm text-rose-600">Impossible de charger le dashboard.</p>;

  const { business, subscription, stats } = data;
  const publicUrl = `${window.location.origin}/catalogue/${business.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copie !");
  }

  return (
    <div className="space-y-8">
      {/* Header boutique */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-brand-800">{business.name}</h1>
              <Badge variant={business.is_active ? "success" : "danger"} dot>
                {business.is_active ? "Active" : "Suspendue"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="break-all text-sm text-gray-500">{publicUrl}</span>
              <button onClick={copyLink} className="rounded-lg p-1 text-gray-400 hover:text-brand-600">
                <Copy size={14} />
              </button>
            </div>
            {subscription?.plan ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="brand">{subscription.plan.name}</Badge>
                <span className="text-xs text-gray-400">Expire le {formatDate(subscription.ends_at)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setView("products")}><Package size={15} /> Ajouter produit</Button>
            <Button tone="secondary" size="sm" onClick={() => setPublicSlug(business.slug)}><Eye size={15} /> Voir boutique</Button>
            <Button tone="accent" size="sm" onClick={() => setQrBusiness(business)}><QrCode size={15} /> QR Code</Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Produits / Services" value={fmt(stats.products_count)} tone="brand" />
        <StatCard icon={ShoppingBag} label="Commandes aujourd'hui" value={fmt(stats.orders_today)} tone="info" />
        <StatCard icon={CalendarClock} label="Commandes ce mois" value={fmt(stats.orders_month)} tone="violet" />
        <StatCard icon={BarChart3} label="Ventes payees" value={`${fmt(stats.total_sales)} FCFA`} tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CreditCard}
          label="Paiements a verifier"
          value={fmt(stats.pending_payments)}
          tone={stats.pending_payments > 0 ? "warning" : "success"}
          onClick={() => setView("payment-settings")}
        />
        <StatCard icon={ShoppingBag} label="Commandes non traitees" value={fmt(stats.untreated_orders)} tone="danger" onClick={() => setView("orders")} />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(stats.whatsapp_clicks)} tone="whatsapp" />
      </div>

      {/* Top produits + Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="font-display font-bold text-brand-800">Produits les plus commandes</h2>
          </div>
          <div className="divide-y divide-surface-border">
            {stats.top_products?.map((item, i) => (
              <div key={item.product_id} className="flex items-center gap-4 px-6 py-3.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-50 text-xs font-bold text-accent-800">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium text-brand-700">{item.name}</span>
                <span className="text-sm font-bold text-brand-800">{fmt(item.orders_count)}</span>
              </div>
            ))}
            {!stats.top_products?.length ? <p className="px-6 py-4 text-sm text-gray-400">Aucune commande pour le moment.</p> : null}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-brand-800">Actions rapides</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button tone="secondary" className="justify-start" onClick={() => setView("store-profile")}>Ma boutique</Button>
            <Button tone="secondary" className="justify-start" onClick={() => setView("orders")}>Commandes</Button>
            <Button tone="secondary" className="justify-start" onClick={() => setView("payment-settings")}>Paiements</Button>
            <Button tone="secondary" className="justify-start" onClick={() => setView("stats")}>Statistiques</Button>
            <Button tone="secondary" className="justify-start" onClick={() => setView("messages")}>Messages WhatsApp</Button>
            <Button tone="secondary" className="justify-start" onClick={() => setView("subscription")}>Abonnement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
