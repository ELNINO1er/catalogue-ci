import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Copy, Eye, Package, Plus, QrCode, ShoppingBag, Sparkles, Users, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import {
  CategoryDonut, InsightsPanel, KpiCard, RANGE_OPTIONS, RangeTabs, RankingList, StatusGauge, TrendChart,
} from "../../components/dashboard/DashboardWidgets";
import { SERIES } from "../../components/dashboard/chartTheme";
import { getMerchantDashboard, getPlanInfo } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

function formatDate(value) {
  if (!value) return "Non definie";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function greeting() {
  return new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";
}

export default function MerchantDashboardPage({ user, setView, setPublicSlug, setQrBusiness }) {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlanInfo().then(setPlanInfo).catch(() => null);
  }, []);

  useEffect(() => {
    setLoading(true);
    getMerchantDashboard(range)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !data) return <PageLoading />;
  if (!data || !data.business) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <Sparkles size={32} className="mx-auto mb-4 text-brand-500" />
        <h2 className="font-display text-lg font-bold text-ink-900">Configurez votre boutique</h2>
        <p className="mt-2 text-sm text-ink-500">Completez l'assistant de creation pour acceder a votre tableau de bord.</p>
        <Button className="mt-6" onClick={() => setView("onboarding")}>Commencer la configuration</Button>
      </div>
    );
  }

  const { business, subscription, stats, trends } = data;
  const summary = trends.summary;
  const compareLabel = RANGE_OPTIONS.find((r) => r.value === range)?.compare;
  const publicUrl = `${window.location.origin}/catalogue/${business.slug}`;
  const firstName = user?.name?.split(" ")[0] || "";
  const best = trends.ranking[0];

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success("Lien copie !")).catch(() => toast.error("Copie impossible."));
  }

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      {/* Salutation + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">{greeting()}{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p className="mt-1 text-sm text-ink-500">Voici ce qui se passe dans votre boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeTabs value={range} onChange={setRange} />
          <Button size="sm" onClick={() => setView("products")}><Plus size={15} /> Ajouter un produit</Button>
        </div>
      </div>

      {/* Carte boutique */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold text-ink-900">{business.name}</p>
            <Badge variant={business.is_active ? "success" : "danger"} dot>{business.is_active ? "En ligne" : "Suspendue"}</Badge>
            {planInfo?.freeMode ? (
              <Badge variant="brand">Lancement gratuit</Badge>
            ) : subscription?.plan ? (
              <Badge variant="brand">{planInfo?.fallbackFree ? planInfo.plan?.name : subscription.plan.name}</Badge>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="truncate text-sm text-ink-500">{publicUrl}</span>
            <button onClick={copyLink} aria-label="Copier le lien de la boutique" className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-900">
              <Copy size={14} />
            </button>
          </div>
          {!planInfo?.freeMode && subscription?.plan && !planInfo?.fallbackFree ? (
            <p className="mt-1 text-xs text-ink-500">Abonnement jusqu'au {formatDate(subscription.ends_at)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" size="sm" onClick={() => setPublicSlug(business.slug)}><Eye size={15} /> Voir ma boutique</Button>
          <Button tone="secondary" size="sm" onClick={() => setQrBusiness(business)}><QrCode size={15} /> QR code</Button>
        </div>
      </div>

      {/* Alertes abonnement (uniquement quand la facturation est active) */}
      {planInfo?.freeMode ? null : planInfo?.isExpired ? (
        <div className="card flex flex-wrap items-center gap-4 border-amber-300 bg-amber-50 p-5">
          <AlertTriangle size={22} className="shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Votre abonnement a expire</p>
            <p className="text-sm text-amber-700">Choisissez un plan pour continuer a recevoir des commandes.</p>
          </div>
          <Button size="sm" onClick={() => setView("plans")}>Voir les plans</Button>
        </div>
      ) : planInfo?.isTrial ? (
        <div className="card flex flex-wrap items-center gap-4 border-brand-200 bg-brand-50 p-5">
          <Clock size={22} className="shrink-0 text-brand-600" />
          <div className="flex-1">
            <p className="font-semibold text-ink-900">Periode d'essai — {planInfo.daysLeft} jour{planInfo.daysLeft > 1 ? "s" : ""} restant{planInfo.daysLeft > 1 ? "s" : ""}</p>
            <p className="text-sm text-ink-600">Passez a un plan payant pour garder toutes les fonctionnalites.</p>
          </div>
          <Button size="sm" onClick={() => setView("plans")}>Choisir un plan</Button>
        </div>
      ) : null}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Ventes" value={fmt(summary.revenue)} unit="FCFA" change={summary.changes.revenue} compareLabel={compareLabel} spark={trends.series} sparkKey="revenue" />
        <KpiCard icon={ShoppingBag} label="Commandes" value={fmt(summary.orders)} change={summary.changes.orders} compareLabel={compareLabel} spark={trends.series} sparkKey="orders" sparkColor={SERIES.orders.color} />
        <KpiCard icon={Users} label="Clients" value={fmt(summary.customers)} change={summary.changes.customers} compareLabel={compareLabel} />
        <KpiCard icon={Package} label="Panier moyen" value={fmt(summary.average_basket)} unit="FCFA" change={summary.changes.average_basket} compareLabel={compareLabel} />
      </div>

      {/* Courbe + categories */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TrendChart series={trends.series} peak={trends.peak} />
        <CategoryDonut title="Commandes par categorie" categories={trends.categories} />
      </div>

      {/* Classement, statuts, resume */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RankingList
          title="Produits les plus vendus"
          items={trends.ranking}
          emptyLabel="Aucune commande sur cette periode."
          onSeeAll={() => setView("stats")}
        />
        <StatusGauge statuses={trends.statuses} />
        <InsightsPanel
          title="A suivre"
          insights={[
            { label: "Commandes a traiter", value: fmt(stats.untreated_orders) },
            { label: "Paiements a verifier", value: fmt(stats.pending_payments) },
            { label: "Clics WhatsApp", value: fmt(stats.whatsapp_clicks), hint: "depuis le debut" },
            { label: "Produits en ligne", value: fmt(stats.products_count) },
          ]}
          footer={best ? `${best.name} est votre meilleure vente sur la periode. Continuez !` : "Partagez votre lien ou votre QR code pour recevoir vos premieres commandes."}
        />
      </div>
    </div>
  );
}
