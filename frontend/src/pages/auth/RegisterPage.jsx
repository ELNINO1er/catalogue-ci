import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, MessageCircle, QrCode, ShoppingBag, Smartphone, Star, UserPlus } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { register as registerRequest } from "../../services/authService";

const features = [
  { icon: ShoppingBag, text: "Catalogue digital complet" },
  { icon: QrCode, text: "QR Code personnalise" },
  { icon: Smartphone, text: "Commandes WhatsApp et Wave" },
  { icon: Star, text: "Dashboard et statistiques" },
];

const passwordRules = [
  { test: (p) => p.length >= 8, label: "8 caracteres minimum" },
  { test: (p) => /[A-Z]/.test(p), label: "Une majuscule" },
  { test: (p) => /[a-z]/.test(p), label: "Une minuscule" },
  { test: (p) => /[0-9]/.test(p), label: "Un chiffre" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "Un caractere special" },
];

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    business_name: "",
    whatsapp_number: "",
    business_category: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
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
    <main className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500">
            <ShoppingBag size={20} className="text-brand-900" />
          </div>
          <span className="font-display text-xl font-bold">CatalogueCI</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Creez votre boutique{" "}
            <span className="text-accent-500">en 2 minutes.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-200">
            Rejoignez des centaines de commercants a Abidjan qui utilisent CatalogueCI pour vendre plus.
          </p>
          <div className="mt-8 grid gap-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Icon size={18} className="shrink-0 text-accent-400" />
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-brand-300">CatalogueCI &copy; {new Date().getFullYear()}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-10 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-brand-700">CatalogueCI</span>
        </div>

        <div className="w-full max-w-md">
          <button onClick={onGoLogin} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-700">
            <ArrowLeft size={14} /> Retour a la connexion
          </button>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-brand-800">Creer mon compte</h2>
            <p className="mt-1 text-sm text-gray-500">Remplissez le formulaire pour creer votre boutique digitale.</p>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {/* Merchant info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Votre nom complet"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ex: Awa Kouassi"
                required
              />
              <Input
                label="Adresse email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-brand-700">Mot de passe</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Creez un mot de passe"
                  autoComplete="new-password"
                  required
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-brand-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password ? (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {passwordRules.map((rule) => (
                    <span key={rule.label} className={`flex items-center gap-1 text-xs ${rule.test(form.password) ? "text-emerald-600" : "text-gray-400"}`}>
                      <Check size={12} /> {rule.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <hr className="border-surface-border" />

            {/* Business info */}
            <Input
              label="Nom de votre boutique"
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              placeholder="Ex: Chez Awa Food"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Numero WhatsApp"
                value={form.whatsapp_number}
                onChange={(e) => update("whatsapp_number", e.target.value)}
                placeholder="Ex: 2250700000000"
                inputMode="tel"
                required
              />
              <div className="grid gap-1.5">
                <span className="text-sm font-semibold text-brand-700">Type d'activite</span>
                <select
                  value={form.business_category}
                  onChange={(e) => update("business_category", e.target.value)}
                  className="input-base"
                >
                  <option value="">Choisir (optionnel)</option>
                  <option value="Restaurant / Maquis">Restaurant / Maquis</option>
                  <option value="Boutique / Mode">Boutique / Mode</option>
                  <option value="Services digitaux">Services digitaux</option>
                  <option value="Salon de coiffure">Salon de coiffure</option>
                  <option value="Formation">Formation</option>
                  <option value="Livraison / Services">Livraison / Services</option>
                  <option value="Infographie">Infographie</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            {error ? (
              <div className="animate-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading || !allValid}>
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : <UserPlus size={18} />}
              {loading ? "Creation en cours..." : "Creer ma boutique gratuitement"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Vous avez deja un compte ?{" "}
            <button onClick={onGoLogin} className="font-semibold text-brand-600 hover:underline">Se connecter</button>
          </p>
        </div>
      </div>
    </main>
  );
}
