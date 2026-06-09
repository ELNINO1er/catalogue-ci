import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, CreditCard, Eye, Package, ShoppingBag, Store, TrendingUp, Users, Wallet } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/common/StatCard";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { getSuperAdminDashboard } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function AdminDashboardPage({ setPublicSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSuperAdminDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const t = data?.totals || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-800">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de la plateforme CatalogueCI</p>
      </div>

      {/* Alertes */}
      {data?.alerts?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {data.alerts.map((a, i) => <p key={i}>{a}</p>)}
        </div>
      ) : null}

      {/* Stats principales */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Store} label="Boutiques" value={fmt(t.businesses)} tone="brand" subtitle={`${fmt(t.active_businesses)} actives`} />
        <StatCard icon={Package} label="Produits" value={fmt(t.products)} tone="info" />
        <StatCard icon={Users} label="Commercants" value={fmt(t.merchants)} tone="violet" />
        <StatCard icon={ShoppingBag} label="Commandes" value={fmt(t.orders)} tone="accent" subtitle={`${fmt(t.orders_this_month)} ce mois`} />
      </div>

      {/* Revenue */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-50 text-accent-700">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenus du mois</p>
              <p className="text-2xl font-bold text-brand-800">{fmt(t.monthly_revenue)} <span className="text-base font-medium text-gray-400">FCFA</span></p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenus annuels</p>
              <p className="text-2xl font-bold text-brand-800">{fmt(t.yearly_revenue)} <span className="text-base font-medium text-gray-400">FCFA</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableaux */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Dernières boutiques */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
            <h2 className="font-display font-bold text-brand-800">Dernieres boutiques</h2>
            <Badge variant="brand">{fmt(t.businesses)} total</Badge>
          </div>
          {data?.latest_businesses?.length ? (
            <div className="divide-y divide-surface-border">
              {data.latest_businesses.map((biz) => (
                <div key={biz.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-700">{biz.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(biz.created_at)}</p>
                  </div>
                  <button onClick={() => setPublicSlug(biz.slug)} className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-brand-50 hover:text-brand-600">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState title="Aucune boutique" description="Les boutiques apparaitront ici." />
            </div>
          )}
        </div>

        {/* Top boutiques par commandes */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
            <h2 className="font-display font-bold text-brand-800">Top boutiques</h2>
            <Badge variant="accent">Par commandes</Badge>
          </div>
          {data?.top_businesses?.length ? (
            <div className="divide-y divide-surface-border">
              {data.top_businesses.map((biz, i) => (
                <div key={biz.business_id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-700">{biz.business?.name}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-800">{fmt(biz.get?.("orders_count") ?? biz.orders_count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState title="Aucune donnee" description="Les statistiques apparaitront ici." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
