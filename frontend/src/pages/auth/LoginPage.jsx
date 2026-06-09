import { useState } from "react";
import { Eye, EyeOff, LogIn, QrCode, ShoppingBag, Smartphone, Star } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { login as loginRequest } from "../../services/authService";

const features = [
  { icon: ShoppingBag, text: "Catalogue digital complet" },
  { icon: QrCode, text: "QR Code personnalise" },
  { icon: Smartphone, text: "Commandes WhatsApp et Wave" },
  { icon: Star, text: "Dashboard et statistiques" },
];

export default function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(await loginRequest(email, password));
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible. Verifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Panneau gauche — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500">
              <ShoppingBag size={20} className="text-brand-900" />
            </div>
            <span className="font-display text-xl font-bold">CatalogueCI</span>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Votre boutique digitale,{" "}
            <span className="text-accent-500">a portee de main.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-200">
            Gerez votre catalogue, recevez des commandes WhatsApp et des paiements Wave depuis un seul tableau de bord.
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

      {/* Panneau droit — formulaire */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        {/* Logo mobile */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-brand-700">CatalogueCI</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-brand-800">Bienvenue</h2>
            <p className="mt-1 text-sm text-gray-500">Connectez-vous pour acceder a votre espace.</p>
          </div>

          <form onSubmit={submit} className="grid gap-5">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
            />

            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-brand-700">Mot de passe</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
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
            </div>

            {error ? (
              <div className="animate-fade-in rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="text-white" /> : <LogIn size={18} />}
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Pas encore de compte ?{" "}
            <button onClick={onGoRegister} className="font-semibold text-brand-600 hover:underline">Creer ma boutique</button>
          </p>
        </div>
      </div>
    </main>
  );
}
