import { useEffect, useState } from "react";
import { Eye, MessageCircle, Package, Store, UserRound } from "lucide-react";
import Button from "../../components/ui/Button";
import StatCard from "../../components/common/StatCard";
import { getAdminOverview } from "../../services/businessService";
import { fmt } from "../../utils/formatters";

export default function AdminDashboardPage({ setPublicSlug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAdminOverview().then(setData).catch(() => setData(null));
  }, []);

  const totals = data?.totals || {};

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Store} label="Commerces" value={fmt(totals.businesses)} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={Package} label="Produits" value={fmt(totals.products)} tone="bg-emerald-50 text-emerald-700" />
        <StatCard icon={UserRound} label="Commercants" value={fmt(totals.merchants)} tone="bg-violet-50 text-violet-700" />
        <StatCard icon={MessageCircle} label="Clics WhatsApp" value={fmt(totals.whatsapp_clicks)} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4 font-semibold text-slate-900">Derniers commerces</div>
        <div className="divide-y divide-slate-100">
          {(data?.recent_businesses || []).map((business) => (
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
          {!data?.recent_businesses?.length ? <p className="p-4 text-sm text-slate-500">Aucune donnee. Lancez le seeder.</p> : null}
        </div>
      </div>
    </div>
  );
}
