import { useEffect, useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { getMerchantDashboard } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "Non definie";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

export default function MerchantSubscriptionPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMerchantDashboard().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <p className="p-5 text-sm text-slate-500">Chargement de l'abonnement...</p>;

  const plan = data.subscription?.plan;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-500">Votre plan est gere par le super admin apres paiement ou validation.</p>
      </div>

      <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Plan actuel</p>
            <h2 className="text-xl font-bold text-slate-900">{plan?.name || "Aucun plan actif"}</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            {data.subscription?.status || "NON DEFINI"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Prix</p>
            <p className="font-bold text-slate-900">{fmt(plan?.price || 0)} FCFA/mois</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Produits</p>
            <p className="font-bold text-slate-900">{plan?.product_limit || "Illimite"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Expiration</p>
            <p className="font-bold text-slate-900">{formatDate(data.subscription?.ends_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><CheckCircle2 size={18} /> Inclus maintenant</div>
          <p className="text-sm text-slate-500">Produits/services, commandes, Wave manuel, QR boutique, statistiques simples.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Lock size={18} /> Valide par super admin</div>
          <p className="text-sm text-slate-500">Le changement de plan et les templates premium doivent etre valides par la plateforme.</p>
        </div>
      </div>
    </div>
  );
}
