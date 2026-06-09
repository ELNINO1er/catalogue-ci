import { useEffect, useState } from "react";
import { BarChart3, CreditCard, MessageCircle, Package, Percent, ShoppingBag, Wallet } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { getMerchantAnalytics } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

const orderStatusLabels = {
  PENDING: "Nouvelles",
  AWAITING_PAYMENT: "Attente paiement",
  AWAITING_VERIFICATION: "Paiement a verifier",
  PAID: "Payees",
  CONFIRMED: "Confirmees",
  IN_PROGRESS: "En cours",
  READY: "Pretes",
  DELIVERED: "Livrees",
  CANCELLED: "Annulees",
  REFUNDED: "Remboursees",
};

const paymentStatusLabels = {
  PENDING: "En attente",
  PROCESSING: "A verifier",
  PAID: "Payes",
  FAILED: "Echoues",
  CANCELLED: "Annules",
  REFUNDED: "Rembourses",
};

function ProgressRow({ label, value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500">{fmt(value)} - {percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function MerchantStatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMerchantAnalytics().then(setData).catch((err) => {
      setError(err.response?.data?.message || "Impossible de charger les statistiques.");
    });
  }, []);

  if (error) return <p className="p-5 text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="p-5 text-sm text-slate-500">Chargement des statistiques...</p>;

  const { summary } = data;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistiques</h1>
        <p className="mt-1 text-sm text-slate-500">
          Analyse des ventes, paiements, conversion WhatsApp et produits les plus performants.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Ventes totales payees" value={`${fmt(summary.total_sales)} FCFA`} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={BarChart3} label="Ventes du mois" value={`${fmt(summary.monthly_sales)} FCFA`} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={ShoppingBag} label="Commandes totales" value={fmt(summary.total_orders)} tone="bg-violet-50 text-violet-700" />
        <StatCard icon={ShoppingBag} label="Commandes semaine" value={fmt(summary.orders_week)} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={CreditCard} label="Commandes payees" value={fmt(summary.paid_orders)} tone="bg-teal-50 text-teal-700" />
        <StatCard icon={Percent} label="Conversion WhatsApp" value={`${fmt(summary.conversion_rate)}%`} tone="bg-orange-50 text-orange-700" />
        <StatCard icon={Wallet} label="Panier moyen" value={`${fmt(summary.average_basket)} FCFA`} tone="bg-rose-50 text-rose-700" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(summary.whatsapp_clicks)} tone="bg-lime-50 text-lime-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-bold text-slate-900">Repartition des commandes</h2>
          <div className="space-y-3">
            {data.status_breakdown.map((item) => (
              <ProgressRow key={item.status} label={orderStatusLabels[item.status] || item.status} value={item.count} total={summary.total_orders} />
            ))}
            {!data.status_breakdown.length ? <p className="text-sm text-slate-500">Aucune commande pour le moment.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-bold text-slate-900">Repartition des paiements</h2>
          <div className="space-y-3">
            {data.payment_breakdown.map((item) => (
              <ProgressRow key={item.status} label={paymentStatusLabels[item.status] || item.status} value={item.count} total={summary.total_orders} />
            ))}
            {!data.payment_breakdown.length ? <p className="text-sm text-slate-500">Aucun paiement pour le moment.</p> : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">Produits les plus performants</h2>
          <span className="text-sm text-slate-500">{fmt(summary.products_count)} produit(s) actif(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Produit</th>
                <th className="py-2">Commandes</th>
                <th className="py-2">Chiffre d'affaires</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((item) => (
                <tr key={item.product_id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-3 text-slate-600">{fmt(item.orders_count)}</td>
                  <td className="py-3 font-semibold text-emerald-700">{fmt(item.revenue)} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.top_products.length ? <p className="py-3 text-sm text-slate-500">Aucune commande pour classer les produits.</p> : null}
        </div>
      </section>
    </div>
  );
}
