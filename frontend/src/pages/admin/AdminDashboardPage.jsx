import { useEffect, useState } from "react";
import { Eye, MessageCircle, Package, Store, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import StatCard from "../../components/common/StatCard";
import { getSuperAdminDashboard } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

export default function AdminDashboardPage({ setPublicSlug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSuperAdminDashboard().then(setData).catch(() => setData(null));
  }, []);

  const totals = data?.totals || {};

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Store} label="Boutiques" value={fmt(totals.businesses)} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={Package} label="Produits" value={fmt(totals.products)} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={UserRound} label="Commercants" value={fmt(totals.merchants)} tone="bg-violet-50 text-violet-700" />
        <StatCard icon={MessageCircle} label="Commandes" value={fmt(totals.orders)} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={Store} label="Boutiques actives" value={fmt(totals.active_businesses)} tone="bg-green-50 text-green-700" />
        <StatCard icon={Store} label="Suspendues" value={fmt(totals.suspended_businesses)} tone="bg-rose-50 text-rose-700" />
        <StatCard icon={MessageCircle} label="Revenus du mois" value={`${fmt(totals.monthly_revenue)} FCFA`} tone="bg-indigo-50 text-indigo-700" />
        <StatCard icon={MessageCircle} label="Revenus annuels" value={`${fmt(totals.yearly_revenue)} FCFA`} tone="bg-cyan-50 text-cyan-700" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4 font-semibold text-slate-900">Derniers commerces</div>
        <div className="divide-y divide-slate-100">
          {(data?.latest_businesses || []).map((business) => (
            <div key={business.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-900">{business.name}</p>
                <p className="text-sm text-slate-500">/catalogue/{business.slug}</p>
              </div>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}>
                <Eye size={16} />
                Voir
              </Button>
            </div>
          ))}
          {!data?.latest_businesses?.length ? <p className="p-4 text-sm text-slate-500">Aucune donnee. Lancez le seeder.</p> : null}
        </div>
      </div>
    </div>
  );
}
