import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag, Store, Users, Wallet } from "lucide-react";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import {
  CategoryDonut, InsightsPanel, KpiCard, Panel, RANGE_OPTIONS, RangeTabs, RankingList, StatusGauge, TrendChart,
} from "../../components/dashboard/DashboardWidgets";
import { SERIES } from "../../components/dashboard/chartTheme";
import { getSuperAdminDashboard } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 18 ? "Bonjour" : "Bonsoir";
}

export default function AdminDashboardPage({ user, setPublicSlug, setView }) {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getSuperAdminDashboard(range)
      .then((d) => { setData(d); setError(""); })
      .catch((err) => setError(err.response?.data?.message || "Impossible de charger le tableau de bord."))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <EmptyState title="Erreur" description={error} />;

  const t = data.totals || {};
  const trends = data.trends;
  const summary = trends.summary;
  const compareLabel = RANGE_OPTIONS.find((r) => r.value === range)?.compare;
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      {/* Salutation + periode */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">{greeting()}{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p className="mt-1 text-sm text-ink-500">Voici l'activite de la plateforme CatalogueCI.</p>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {data.alerts?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {data.alerts.map((a) => <p key={a}>{a}</p>)}
        </div>
      ) : null}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Ventes" value={fmt(summary.revenue)} unit="FCFA" change={summary.changes.revenue} compareLabel={compareLabel} spark={trends.series} sparkKey="revenue" />
        <KpiCard icon={ShoppingBag} label="Commandes" value={fmt(summary.orders)} change={summary.changes.orders} compareLabel={compareLabel} spark={trends.series} sparkKey="orders" sparkColor={SERIES.orders.color} />
        <KpiCard icon={Users} label="Clients" value={fmt(summary.customers)} change={summary.changes.customers} compareLabel={compareLabel} />
        <KpiCard icon={Store} label="Boutiques actives" value={`${fmt(t.active_businesses)} / ${fmt(t.businesses)}`} change={undefined} compareLabel={`${fmt(t.merchants)} commercants`} />
      </div>

      {/* Courbe + repartition */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendChart series={trends.series} peak={trends.peak} />
        <CategoryDonut title="Commandes par categorie de boutique" categories={trends.categories} />
      </div>

      {/* Classement, statuts, resume */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RankingList
          title="Top boutiques"
          items={trends.ranking}
          emptyLabel="Aucune commande sur cette periode."
          onSeeAll={setView ? () => setView("businesses") : undefined}
        />
        <StatusGauge statuses={trends.statuses} />
        <InsightsPanel
          title="Plateforme"
          insights={[
            { label: "Produits en ligne", value: fmt(t.products) },
            { label: "Panier moyen", value: `${fmt(summary.average_basket)} FCFA` },
            { label: "Abonnements (mois)", value: `${fmt(t.monthly_revenue)} FCFA` },
            { label: "Abonnements (annee)", value: `${fmt(t.yearly_revenue)} FCFA` },
          ]}
          footer={trends.ranking[0] ? `${trends.ranking[0].name} est la boutique la plus active sur la periode.` : "Partagez la plateforme pour attirer les premiers commercants."}
        />
      </div>

      {/* Dernieres boutiques */}
      <Panel title="Dernieres boutiques inscrites" action={<span className="text-xs text-ink-500">{fmt(t.businesses)} au total</span>}>
        {data.latest_businesses?.length ? (
          <div className="divide-y divide-surface-border">
            {data.latest_businesses.map((biz) => (
              <div key={biz.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{biz.name}</p>
                  <p className="text-xs text-ink-500">Inscrite le {formatDate(biz.created_at)}</p>
                </div>
                <button
                  onClick={() => setPublicSlug(biz.slug)}
                  aria-label={`Voir la boutique ${biz.name}`}
                  className="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune boutique" description="Les boutiques apparaitront ici." />
        )}
      </Panel>
    </div>
  );
}
