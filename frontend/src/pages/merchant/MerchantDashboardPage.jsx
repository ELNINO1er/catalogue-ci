import { useEffect, useState } from "react";
import { BarChart3, CalendarClock, CreditCard, Eye, MessageCircle, Package, QrCode, ShoppingBag } from "lucide-react";
import Button from "../../components/ui/Button";
import StatCard from "../../components/common/StatCard";
import { getMerchantDashboard } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "Non definie";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

export default function MerchantDashboardPage({ setView, setPublicSlug, setQrBusiness }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMerchantDashboard().then(setData).catch((err) => {
      setError(err.response?.data?.message || "Impossible de charger le dashboard.");
    });
  }, []);

  if (error) return <p className="p-5 text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="p-5 text-sm text-slate-500">Chargement du dashboard...</p>;

  const { business, subscription, stats } = data;
  const publicUrl = `${window.location.origin}/catalogue/${business.slug}`;

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${business.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {business.is_active ? "Boutique active" : "Boutique suspendue"}
            </span>
          </div>
          <p className="mt-1 break-all text-sm text-slate-500">{publicUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView("products")}><Package size={16} /> Ajouter un produit</Button>
          <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}><Eye size={16} /> Voir boutique</Button>
          <Button tone="secondary" onClick={() => setQrBusiness(business)}><QrCode size={16} /> QR code</Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-slate-500">Plan actuel</p>
          <p className="font-bold text-slate-900">{subscription?.plan?.name || "Aucun plan"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Expiration</p>
          <p className="font-bold text-slate-900">{formatDate(subscription?.ends_at)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Template</p>
          <p className="font-bold text-slate-900">{business.template?.name || "Template par defaut"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Produits/services" value={fmt(stats.products_count)} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={ShoppingBag} label="Commandes aujourd'hui" value={fmt(stats.orders_today)} tone="bg-violet-50 text-violet-700" />
        <StatCard icon={CalendarClock} label="Commandes ce mois" value={fmt(stats.orders_month)} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={BarChart3} label="Ventes payees" value={`${fmt(stats.total_sales)} FCFA`} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={CreditCard} label="Paiements en attente" value={fmt(stats.pending_payments)} tone="bg-rose-50 text-rose-700" />
        <StatCard icon={ShoppingBag} label="Commandes non traitees" value={fmt(stats.untreated_orders)} tone="bg-orange-50 text-orange-700" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(stats.whatsapp_clicks)} tone="bg-teal-50 text-teal-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-bold text-slate-900">Produits les plus commandes</h2>
          <div className="mt-3 space-y-2">
            {stats.top_products?.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-700">{item.name}</span>
                <span className="text-slate-500">{fmt(item.orders_count)} commande(s)</span>
              </div>
            ))}
            {!stats.top_products?.length ? <p className="text-sm text-slate-500">Aucune commande pour le moment.</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-bold text-slate-900">Actions rapides</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button tone="secondary" onClick={() => setView("store-profile")}>Ma boutique</Button>
            <Button tone="secondary" onClick={() => setView("orders")}>Commandes</Button>
            <Button tone="secondary" onClick={() => setView("payment-settings")}>Paiements</Button>
            <Button tone="secondary" onClick={() => setView("subscription")}>Abonnement</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
