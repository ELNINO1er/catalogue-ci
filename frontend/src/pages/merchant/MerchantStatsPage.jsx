import { useEffect, useState } from "react";
import { BarChart3, CreditCard, MessageCircle, Package, ShoppingBag } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { getMerchantDashboard } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

export default function MerchantStatsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMerchantDashboard().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <p className="p-5 text-sm text-slate-500">Chargement des statistiques...</p>;

  const { stats } = data;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques</h1>
        <p className="mt-1 text-sm text-slate-500">Suivez les performances simples de votre boutique.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Produits actifs" value={fmt(stats.products_count)} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={ShoppingBag} label="Commandes aujourd'hui" value={fmt(stats.orders_today)} tone="bg-violet-50 text-violet-700" />
        <StatCard icon={ShoppingBag} label="Commandes ce mois" value={fmt(stats.orders_month)} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={BarChart3} label="Ventes payees" value={`${fmt(stats.total_sales)} FCFA`} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={CreditCard} label="Paiements en attente" value={fmt(stats.pending_payments)} tone="bg-rose-50 text-rose-700" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(stats.whatsapp_clicks)} tone="bg-teal-50 text-teal-700" />
      </div>
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
    </div>
  );
}
