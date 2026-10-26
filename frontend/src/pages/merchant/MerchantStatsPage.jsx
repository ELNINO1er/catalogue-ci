import { useEffect, useState } from "react";
import { BarChart3, CreditCard, MessageCircle, Percent, ShoppingBag, Wallet } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { PageHeader } from "../../components/ui/PageKit";
import { KpiCard, Panel, RankingList } from "../../components/dashboard/DashboardWidgets";
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

// Barre de repartition : libelle + valeur + part, une seule couleur (le libelle porte l'identite).
function ProgressRow({ label, value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="text-ink-500"><span className="font-semibold text-ink-900">{fmt(value)}</span> · {percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100" role="presentation">
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
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

  if (error) return <EmptyState icon={BarChart3} title="Statistiques indisponibles" description={error} />;
  if (!data) return <PageLoading message="Chargement des statistiques..." />;

  const { summary } = data;
  const ranking = data.top_products.map((item) => ({
    id: item.product_id,
    name: item.name,
    orders: item.orders_count,
    revenue: item.revenue,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques"
        description="Ventes, paiements, conversion WhatsApp et produits les plus performants, depuis l'ouverture de la boutique."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Ventes payees" value={fmt(summary.total_sales)} unit="FCFA" compareLabel={`${fmt(summary.monthly_sales)} FCFA ce mois`} />
        <KpiCard icon={ShoppingBag} label="Commandes" value={fmt(summary.total_orders)} compareLabel={`${fmt(summary.orders_week)} cette semaine`} />
        <KpiCard icon={CreditCard} label="Commandes payees" value={fmt(summary.paid_orders)} compareLabel={`Panier moyen ${fmt(summary.average_basket)} FCFA`} />
        <KpiCard icon={Percent} label="Conversion WhatsApp" value={`${fmt(summary.conversion_rate)}%`} compareLabel={`${fmt(summary.whatsapp_clicks)} clic(s) WhatsApp`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Repartition des commandes">
          <div className="space-y-4">
            {data.status_breakdown.map((item) => (
              <ProgressRow key={item.status} label={orderStatusLabels[item.status] || item.status} value={item.count} total={summary.total_orders} />
            ))}
            {!data.status_breakdown.length ? <p className="rounded-xl bg-surface py-8 text-center text-sm text-ink-500">Aucune commande pour le moment.</p> : null}
          </div>
        </Panel>

        <Panel title="Repartition des paiements">
          <div className="space-y-4">
            {data.payment_breakdown.map((item) => (
              <ProgressRow key={item.status} label={paymentStatusLabels[item.status] || item.status} value={item.count} total={summary.total_orders} />
            ))}
            {!data.payment_breakdown.length ? <p className="rounded-xl bg-surface py-8 text-center text-sm text-ink-500">Aucun paiement pour le moment.</p> : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RankingList
            title="Produits les plus performants"
            items={ranking}
            emptyLabel="Aucune commande pour classer les produits."
          />
        </div>
        <Panel title="Activite">
          <dl className="grid grid-cols-2 gap-3">
            {[
              ["Produits actifs", fmt(summary.products_count), ShoppingBag],
              ["Clics WhatsApp", fmt(summary.whatsapp_clicks), MessageCircle],
              ["Ventes du mois", `${fmt(summary.monthly_sales)} FCFA`, BarChart3],
              ["Commandes semaine", fmt(summary.orders_week), ShoppingBag],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-xl bg-surface px-3 py-3">
                <dt className="flex items-center gap-1.5 text-xs text-ink-500"><Icon size={13} aria-hidden="true" /> {label}</dt>
                <dd className="mt-1 truncate text-sm font-bold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
