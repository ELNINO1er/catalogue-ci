import { useState } from "react";
import { navigate } from "../../utils/navigation";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, MessageCircle, Store, User } from "lucide-react";
import { register as registerRequest } from "../../services/authService";
import AuthLayout, { AuthError, AuthField, AuthSubmit } from "./AuthLayout";

const passwordRules = [
  { test: (p) => p.length >= 8, label: "8 caracteres" },
  { test: (p) => /[A-Z]/.test(p), label: "Majuscule" },
  { test: (p) => /[a-z]/.test(p), label: "Minuscule" },
  { test: (p) => /[0-9]/.test(p), label: "Chiffre" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "Caractere special" },
];

const STRENGTH = [
  { min: 5, label: "Solide", bar: "bg-emerald-500", text: "text-emerald-600" },
  { min: 3, label: "Moyen", bar: "bg-amber-400", text: "text-amber-600" },
  { min: 0, label: "Faible", bar: "bg-rose-400", text: "text-rose-600" },
];

const CATEGORIES = [
  "Restaurant / Maquis", "Boutique / Mode", "Salon de coiffure", "Services digitaux",
  "Formation", "Livraison / Services", "Infographie", "Autre",
];

const STEPS = ["Votre compte", "Votre boutique"];

function Stepper({ step }) {
  return (
    <div className="seq mb-7" style={{ "--d": "300ms" }}>
      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => {
          const done = step > i + 1;
          const current = step === i + 1;
          return (
            <div key={label} className="flex items-center gap-2.5">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition-all duration-300 ${
                done ? "bg-emerald-500 text-white" : current ? "bg-ink-900 text-white shadow-card-hover" : "bg-white text-ink-400 ring-1 ring-surface-border"
              }`}>
                {done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-sm font-medium transition-colors ${current || done ? "text-ink-900" : "text-ink-400"}`}>{label}</span>
              {i === 0 ? <span className="mx-1 hidden h-px w-8 bg-surface-border sm:block" /> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-border">
        <div className="h-full origin-left rounded-full bg-brand-500 transition-transform duration-500 ease-out" style={{ transform: `scaleX(${step / STEPS.length})` }} />
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = passwordRules.filter((r) => r.test(password)).length;
  const level = STRENGTH.find((s) => score >= s.min);
  return (
    <div className="animate-fade-in grid gap-2.5 pt-1">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {passwordRules.map((rule, i) => (
            <span key={rule.label} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < score ? level.bar : "bg-surface-border"}`} />
          ))}
        </div>
        <span className={`w-12 text-right text-xs font-semibold ${level.text}`}>{level.label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <span key={rule.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors duration-300 ${ok ? "bg-emerald-50 text-emerald-700" : "bg-ink-50 text-ink-400"}`}>
              <Check size={11} strokeWidth={3} className={`transition-transform duration-300 ${ok ? "scale-100" : "scale-0"}`} />
              {rule.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    password: "",
    // Nom saisi sur la page d'accueil (/inscription?boutique=...)
    business_name: new URLSearchParams(window.location.search).get("boutique")?.slice(0, 150) || "",
    whatsapp_number: "",
    business_category: "",
    accept_terms: false,
  }));
  const [step, setStep] = useState(1);
  const [back, setBack] = useState(false); // sens de l'animation entre les etapes
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goToStep(next) {
    setBack(next < step);
    setError("");
    setStep(next);
  }

  async function submit(event) {
    event.preventDefault();
    // Etape 1 : le navigateur a deja verifie les champs affiches, on passe a la boutique.
    if (step === 1) {
      goToStep(2);
      return;
    }
    setLoading(true);
    setError("");
    try {
      onRegister(await registerRequest(form));
    } catch (err) {
      setError(err.response?.data?.message || "Inscription impossible. Reessayez.");
    } finally {
      setLoading(false);
    }
  }

  const allValid = passwordRules.every((r) => r.test(form.password));

  return (
    <AuthLayout
      variant="register"
      shopName={form.business_name}
      title="Creez votre"
      highlight="boutique"
      subtitle="Gratuit pendant le lancement. Aucune carte bancaire demandee."
    >
      <Stepper step={step} />

      <form onSubmit={submit} className="grid gap-5">
        {step === 1 ? (
          <div key="step-1" className={`grid gap-5 ${back ? "step-back" : ""}`}>
            <AuthField icon={User} label="Votre nom complet" delay="380ms">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Awa Kouassi" autoComplete="name" required />
            </AuthField>
            <AuthField icon={Mail} label="Adresse email" delay="460ms">
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com" autoComplete="email" required />
            </AuthField>
            <AuthField icon={Lock} label="Mot de passe" delay="540ms" hint={<PasswordStrength password={form.password} />}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Creez un mot de passe"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="shrink-0 rounded-full p-1 text-ink-400 transition hover:bg-ink-50 hover:text-brand-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </AuthField>
            <AuthSubmit disabled={!allValid} delay="620ms">Continuer</AuthSubmit>
          </div>
        ) : (
          <div key="step-2" className="step-in grid gap-5">
            <AuthField icon={Store} label="Nom de votre boutique">
              <input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="Ex: Chez Awa Food" maxLength={150} autoFocus required />
            </AuthField>
            <AuthField icon={MessageCircle} label="Numero WhatsApp" hint={<span className="text-xs text-ink-400">Avec l'indicatif, sans espace : 225 puis votre numero.</span>}>
              <input value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} placeholder="Ex: 2250700000000" inputMode="tel" autoComplete="tel" required />
            </AuthField>

            <fieldset className="grid gap-2.5">
              <legend className="mb-2.5 text-sm font-medium text-ink-800">Type d'activite <span className="font-normal text-ink-400">(optionnel)</span></legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category, i) => {
                  const selected = form.business_category === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("business_category", selected ? "" : category)}
                      className={`seq-pop rounded-full border px-3.5 py-2 text-sm transition-all duration-200 ${
                        selected ? "border-ink-900 bg-ink-900 text-white shadow-card-hover" : "border-surface-border bg-white text-ink-600 hover:border-brand-300 hover:text-ink-900"
                      }`}
                      style={{ "--d": `${120 + i * 40}ms` }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-surface-border bg-white px-4 py-3.5 text-sm text-ink-600 transition hover:border-brand-200">
              <input
                type="checkbox"
                required
                checked={form.accept_terms}
                onChange={(e) => update("accept_terms", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
              />
              <span>
                J'accepte les{" "}
                <a href="/cgu" onClick={(e) => { e.preventDefault(); navigate("/cgu"); }} className="font-semibold text-brand-600 underline">conditions d'utilisation</a>
                {" "}et la{" "}
                <a href="/confidentialite" onClick={(e) => { e.preventDefault(); navigate("/confidentialite"); }} className="font-semibold text-brand-600 underline">politique de confidentialite</a>.
              </span>
            </label>

            <AuthError message={error} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(1)}
                aria-label="Retour a l'etape precedente"
                className="grid h-[3.4rem] w-[3.4rem] shrink-0 place-items-center rounded-full border border-surface-border bg-white text-ink-700 transition hover:-translate-x-0.5 hover:border-ink-900"
              >
                <ArrowLeft size={18} />
              </button>
              <AuthSubmit loading={loading} loadingText="Creation en cours..." disabled={!form.accept_terms}>Creer ma boutique</AuthSubmit>
            </div>
          </div>
        )}
      </form>

      <p className="seq mt-8 text-center text-sm text-ink-500" style={{ "--d": "700ms" }}>
        Vous avez deja un compte ?{" "}
        <button onClick={onGoLogin} className="font-semibold text-ink-900 underline decoration-brand-400 decoration-2 underline-offset-4 transition hover:text-brand-600">Se connecter</button>
      </p>
    </AuthLayout>
  );
}
