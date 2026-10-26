import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, CreditCard, Crown, Loader2, Package, ShoppingBag, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import LoadingSpinner, { PageLoading } from "../../components/ui/LoadingSpinner";
import { PageHeader, StatusPill } from "../../components/ui/PageKit";
import { listAvailablePlans, getPlanInfo, requestPlanChange, submitSubscriptionPayment, getPaymentWaveInfo } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";

function parsePlanFeatures(plan) {
  if (!plan?.features_json) return [];
  try {
    const parsed = JSON.parse(plan.features_json);
    return Array.isArray(parsed) ? parsed : Object.keys(parsed).filter((k) => parsed[k]);
  } catch {
    return [];
  }
}

const featureLabels = {
  custom_fields: "Champs personnalises",
  advanced_stats: "Statistiques avancees",
  pdf_catalog: "Catalogue PDF",
  promo_codes: "Codes promo",
  premium_templates: "Templates premium",
  multi_staff: "Multi-utilisateurs",
};

function Step({ number, title, children, last }) {
  return (
    <li className="relative flex gap-4 pb-6">
      {!last ? <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-surface-border" aria-hidden="true" /> : null}
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 font-display text-sm font-bold text-white">{number}</span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="font-semibold text-ink-900">{title}</p>
        <div className="mt-1 text-sm text-ink-600">{children}</div>
      </div>
    </li>
  );
}

function UsageBar({ icon: Icon, label, current, limit }) {
  const percent = limit ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-ink-500"><Icon size={14} aria-hidden="true" /> {label}</span>
        <span className="font-semibold text-ink-900">{current} / {limit || "∞"}</span>
      </div>
      {limit ? (
        <div className="mt-2 h-1.5 rounded-full bg-ink-100">
          <div className={`h-1.5 rounded-full ${percent >= 90 ? "bg-rose-500" : "bg-brand-500"}`} style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export default function MerchantPlansPage() {
  const [plans, setPlans] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment flow state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [waveInfo, setWaveInfo] = useState(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listAvailablePlans(), getPlanInfo()])
      .then(([p, info]) => { setPlans(p); setPlanInfo(info); })
      .catch(() => toast.error("Erreur de chargement des plans."))
      .finally(() => setLoading(false));
  }, []);

  async function handleChoosePlan(plan) {
    if (plan.id === planInfo?.plan?.id && !planInfo?.isExpired) {
      toast("C'est deja votre plan actuel.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPlanChange(plan.id);
      if (result.payment) {
        // Paid plan → show payment step
        setSelectedPlan(plan);
        setPendingPayment(result.payment);
        const info = await getPaymentWaveInfo();
        setWaveInfo(info);
      } else {
        // Free plan → activated immediately
        toast.success("Plan mis a jour !");
        setPlanInfo(await getPlanInfo());
        setSelectedPlan(null);
        setPendingPayment(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du changement de plan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitPayment() {
    if (!pendingPayment) return;
    setSubmitting(true);
    try {
      await submitSubscriptionPayment(pendingPayment.id, reference);
      toast.success("Paiement enregistre ! L'administrateur va verifier et activer votre plan.");
      setPlanInfo(await getPlanInfo());
      setSelectedPlan(null);
      setPendingPayment(null);
      setReference("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi du paiement.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading message="Chargement des plans..." />;

  // Etape de paiement
  if (selectedPlan && pendingPayment && waveInfo) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Paiement du plan ${selectedPlan.name}`}
          description="Effectuez le paiement Wave puis entrez la reference de la transaction."
          actions={(
            <Button tone="secondary" onClick={() => { setSelectedPlan(null); setPendingPayment(null); }}>
              <ArrowLeft size={16} /> Retour aux plans
            </Button>
          )}
        />

        <section className="card overflow-hidden">
          <div className="flex items-center gap-4 bg-brand-50 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white"><CreditCard size={22} /></span>
            <div>
              <p className="text-sm text-ink-500">Montant a payer</p>
              <p className="font-display text-3xl font-bold text-ink-900">{fmt(selectedPlan.price)} <span className="text-base font-semibold text-ink-500">FCFA</span></p>
            </div>
          </div>

          <ol className="p-5 pb-0">
            <Step number={1} title="Ouvrez votre application Wave">
              Utilisez le compte Wave avec lequel vous souhaitez payer.
            </Step>
            <Step number={2} title={`Envoyez ${fmt(selectedPlan.price)} FCFA`}>
              {waveInfo.wave_number ? (
                <p className="mt-1 inline-block rounded-xl bg-surface px-4 py-2 font-mono text-lg font-bold text-ink-900">{waveInfo.wave_number}</p>
              ) : (
                <p className="mt-1 text-amber-700">Numero Wave non configure. Contactez l'administrateur.</p>
              )}
              {waveInfo.wave_name ? <p className="mt-1 text-xs text-ink-500">Nom du compte : {waveInfo.wave_name}</p> : null}
              {waveInfo.instructions ? <p className="mt-2 rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-ink-500">{waveInfo.instructions}</p> : null}
            </Step>
            <Step number={3} title="Entrez la reference de la transaction" last>
              <div className="mt-2 max-w-md">
                <Input
                  label="Reference de transaction Wave"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: TXN-123456789"
                />
              </div>
            </Step>
          </ol>

          <div className="flex flex-wrap justify-end gap-3 border-t border-surface-border p-5">
            <Button tone="secondary" onClick={() => { setSelectedPlan(null); setPendingPayment(null); }}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPayment} disabled={submitting || !reference.trim()}>
              {submitting ? <LoadingSpinner size="sm" className="text-white" /> : <Check size={16} />}
              J'ai paye
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const statusPill = planInfo?.isTrial
    ? <StatusPill tone="warning">Essai</StatusPill>
    : planInfo?.isExpired
      ? <StatusPill tone="danger">Expire</StatusPill>
      : <StatusPill tone="success">Actif</StatusPill>;

  return (
    <div className="space-y-6">
      <PageHeader title="Plans et abonnement" description="Choisissez le plan adapte a votre activite." />

      {/* Mode lancement gratuit : tout est offert, pas de choix de plan */}
      {planInfo?.freeMode ? (
        <section className="card flex items-start gap-4 border-emerald-200 bg-emerald-50 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-600"><Sparkles size={20} /></span>
          <div>
            <p className="font-display text-base font-bold text-emerald-900">Lancement gratuit</p>
            <p className="mt-1 text-sm text-emerald-800">
              Pendant le lancement, toutes les fonctionnalites sont offertes : produits et commandes illimites.
              Aucun paiement n'est demande. Nous vous previendrons avant l'arrivee des offres payantes.
            </p>
          </div>
        </section>
      ) : null}

      {/* Plan actuel */}
      {planInfo && !planInfo.freeMode ? (
        <section className={`card p-5 ${planInfo.isExpired ? "border-amber-300 bg-amber-50" : "bg-brand-50"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-600">
                {planInfo.isExpired ? <AlertTriangle size={20} className="text-amber-500" /> : <Crown size={20} />}
              </span>
              <div>
                <p className="font-display text-base font-bold text-ink-900">
                  {planInfo.isExpired ? "Abonnement expire" : planInfo.isTrial ? "Periode d'essai" : "Plan actif"}
                  {planInfo.plan ? ` — ${planInfo.plan.name}` : ""}
                </p>
                <p className="text-sm text-ink-600">
                  {planInfo.isExpired
                    ? "Votre abonnement a expire. Choisissez un plan pour continuer."
                    : planInfo.daysLeft !== null
                      ? `${planInfo.daysLeft} jour${planInfo.daysLeft > 1 ? "s" : ""} restant${planInfo.daysLeft > 1 ? "s" : ""}`
                      : "Sans date de fin"}
                </p>
              </div>
            </div>
            {statusPill}
          </div>
          {planInfo.limits ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <UsageBar icon={Package} label="Produits" current={planInfo.limits.products.current} limit={planInfo.limits.products.limit} />
              <UsageBar icon={ShoppingBag} label="Commandes ce mois" current={planInfo.limits.orders.current} limit={planInfo.limits.orders.limit} />
            </div>
          ) : null}
        </section>
      ) : null}

      {planInfo?.freeMode ? <h2 className="font-display text-lg font-bold text-ink-900">Offres a venir</h2> : null}

      {plans.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = !planInfo?.freeMode && planInfo?.plan?.id === plan.id && !planInfo?.isExpired;
            const features = parsePlanFeatures(plan);
            const paid = Number(plan.price) > 0;
            return (
              <article
                key={plan.id}
                className={`card relative flex flex-col p-6 ${isCurrent ? "border-2 border-brand-500 shadow-card-hover" : ""}`}
              >
                {isCurrent ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">Plan actuel</span>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-ink-900">{plan.name}</h3>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${paid ? "bg-brand-50 text-brand-600" : "bg-ink-100 text-ink-500"}`}>
                    <Crown size={18} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-ink-900">{paid ? fmt(plan.price) : "Gratuit"}</span>
                  {paid ? <span className="text-sm text-ink-500">FCFA / mois</span> : null}
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-surface-border pt-5">
                  <li className="flex items-center gap-2 text-sm text-ink-700">
                    <Check size={15} className="shrink-0 text-brand-500" aria-hidden="true" />
                    {plan.product_limit ? `${plan.product_limit} produits` : "Produits illimites"}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-ink-700">
                    <Check size={15} className="shrink-0 text-brand-500" aria-hidden="true" />
                    {plan.order_limit ? `${plan.order_limit} commandes / mois` : "Commandes illimitees"}
                  </li>
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-700">
                      <Check size={15} className="shrink-0 text-brand-500" aria-hidden="true" />
                      {featureLabels[f] || f}
                    </li>
                  ))}
                </ul>
                {planInfo?.freeMode ? null : (
                  <Button
                    tone={isCurrent ? "secondary" : "primary"}
                    size="lg"
                    className="mt-6 w-full"
                    disabled={isCurrent || submitting}
                    onClick={() => handleChoosePlan(plan)}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isCurrent ? "Plan actuel" : paid ? `Choisir — ${fmt(plan.price)} FCFA` : "Choisir ce plan"}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Crown} title="Aucun plan disponible" description="Aucun plan disponible pour le moment." />
      )}
    </div>
  );
}
