import { useEffect, useState } from "react";
import { AlertTriangle, Check, CreditCard, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import LoadingSpinner, { PageLoading } from "../../components/ui/LoadingSpinner";
import { listAvailablePlans, getPlanInfo, requestPlanChange, submitSubscriptionPayment, getPaymentWaveInfo } from "../../services/merchantService";
import { fmt } from "../../utils/formatters";
import toast, { Toaster } from "react-hot-toast";

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

  // Payment flow modal
  if (selectedPlan && pendingPayment && waveInfo) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-800">Paiement du plan {selectedPlan.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Effectuez le paiement Wave puis entrez la reference.</p>
        </div>

        <div className="card border-2 border-brand-200 bg-brand-50 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant a payer</p>
              <p className="font-display text-3xl font-bold text-brand-800">{fmt(selectedPlan.price)} FCFA</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-display text-sm font-bold text-brand-800">Instructions de paiement</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">1</span>
              <p className="text-gray-600">Ouvrez votre application <strong>Wave</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">2</span>
              <div className="text-gray-600">
                <p>Envoyez <strong>{fmt(selectedPlan.price)} FCFA</strong> au numero :</p>
                {waveInfo.wave_number ? (
                  <p className="mt-1 rounded-lg bg-surface px-3 py-2 font-mono text-lg font-bold text-brand-800">{waveInfo.wave_number}</p>
                ) : (
                  <p className="mt-1 text-amber-600">Numero Wave non configure. Contactez l'administrateur.</p>
                )}
                {waveInfo.wave_name ? <p className="mt-1 text-xs text-gray-400">Nom : {waveInfo.wave_name}</p> : null}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">3</span>
              <p className="text-gray-600">Entrez la <strong>reference de transaction</strong> ci-dessous</p>
            </div>
          </div>
          {waveInfo.instructions ? <p className="mt-4 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-gray-500">{waveInfo.instructions}</p> : null}
        </div>

        <div className="card p-6">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-brand-700">Reference de transaction Wave</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: TXN-123456789"
              className="input-base"
            />
          </label>
          <div className="mt-4 flex gap-3">
            <Button tone="secondary" className="flex-1" onClick={() => { setSelectedPlan(null); setPendingPayment(null); }}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={handleSubmitPayment} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" className="text-white" /> : <Check size={16} />}
              J'ai paye
            </Button>
          </div>
        </div>

        <Toaster position="bottom-center" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-800">Plans et abonnement</h1>
        <p className="mt-1 text-sm text-gray-500">Choisissez le plan adapte a votre activite.</p>
      </div>

      {/* Current plan status */}
      {planInfo ? (
        <div className={`card p-5 ${planInfo.isExpired ? "border-amber-300 bg-amber-50" : planInfo.isTrial ? "border-brand-200 bg-brand-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {planInfo.isExpired ? <AlertTriangle size={20} className="text-amber-500" /> : <Sparkles size={20} className="text-brand-500" />}
              <div>
                <p className="font-semibold text-brand-800">
                  {planInfo.isExpired ? "Abonnement expire" : planInfo.isTrial ? "Periode d'essai" : "Plan actif"}
                  {planInfo.plan ? ` — ${planInfo.plan.name}` : ""}
                </p>
                <p className="text-sm text-gray-500">
                  {planInfo.isExpired
                    ? "Votre abonnement a expire. Choisissez un plan pour continuer."
                    : planInfo.daysLeft !== null
                      ? `${planInfo.daysLeft} jour${planInfo.daysLeft > 1 ? "s" : ""} restant${planInfo.daysLeft > 1 ? "s" : ""}`
                      : "Illimite"}
                </p>
              </div>
            </div>
            {planInfo.isTrial ? <Badge variant="warning">Essai</Badge> : planInfo.isExpired ? <Badge variant="danger">Expire</Badge> : <Badge variant="success">Actif</Badge>}
          </div>
          {planInfo.limits ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-gray-500">Produits</p>
                <p className="font-bold text-brand-800">{planInfo.limits.products.current} / {planInfo.limits.products.limit || "∞"}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-gray-500">Commandes ce mois</p>
                <p className="font-bold text-brand-800">{planInfo.limits.orders.current} / {planInfo.limits.orders.limit || "∞"}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Plans grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = planInfo?.plan?.id === plan.id && !planInfo?.isExpired;
          const features = parsePlanFeatures(plan);
          return (
            <div key={plan.id} className={`card relative p-6 ${isCurrent ? "border-2 border-brand-500 shadow-card-hover" : ""}`}>
              {isCurrent ? <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold text-white">Plan actuel</div> : null}
              <div className="flex items-center gap-2">
                <Crown size={18} className={Number(plan.price) > 0 ? "text-accent-500" : "text-gray-400"} />
                <h3 className="font-display text-lg font-bold text-brand-800">{plan.name}</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-brand-800">
                  {Number(plan.price) === 0 ? "Gratuit" : fmt(plan.price)}
                </span>
                {Number(plan.price) > 0 ? <span className="text-sm text-gray-500">FCFA / mois</span> : null}
              </div>
              <ul className="mt-5 space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="shrink-0 text-brand-500" />
                  {plan.product_limit ? `${plan.product_limit} produits` : "Produits illimites"}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="shrink-0 text-brand-500" />
                  {plan.order_limit ? `${plan.order_limit} commandes / mois` : "Commandes illimitees"}
                </li>
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="shrink-0 text-brand-500" />
                    {featureLabels[f] || f}
                  </li>
                ))}
              </ul>
              <Button
                tone={isCurrent ? "secondary" : "primary"}
                size="lg"
                className="mt-6 w-full"
                disabled={isCurrent || submitting}
                onClick={() => handleChoosePlan(plan)}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isCurrent ? "Plan actuel" : Number(plan.price) === 0 ? "Choisir ce plan" : `Choisir — ${fmt(plan.price)} FCFA`}
              </Button>
            </div>
          );
        })}
      </div>

      {!plans.length ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500">Aucun plan disponible pour le moment.</p>
        </div>
      ) : null}

      <Toaster position="bottom-center" />
    </div>
  );
}
