import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login as loginRequest } from "../../services/authService";
import AuthLayout, { AuthError, AuthField, AuthSubmit } from "./AuthLayout";

export default function LoginPage({ onLogin, onGoRegister, onForgot }) {
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
    <AuthLayout
      variant="login"
      title="Content de vous"
      highlight="revoir !"
      subtitle="Connectez-vous pour suivre vos commandes et mettre a jour votre catalogue."
    >
      <form onSubmit={submit} className="grid gap-5">
        <AuthField icon={Mail} label="Adresse email" delay="350ms">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
          />
        </AuthField>

        <AuthField
          icon={Lock}
          label="Mot de passe"
          delay="450ms"
          aside={<button type="button" onClick={onForgot} className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 hover:underline">Mot de passe oublie ?</button>}
        >
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
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

        <AuthError message={error} />

        <AuthSubmit loading={loading} loadingText="Connexion..." delay="550ms">Se connecter</AuthSubmit>
      </form>

      <div className="seq mt-8 flex items-center gap-4 text-xs uppercase tracking-wider text-ink-300" style={{ "--d": "650ms" }}>
        <span className="h-px flex-1 bg-surface-border" />
        Nouveau sur CatalogueCI ?
        <span className="h-px flex-1 bg-surface-border" />
      </div>
      <button
        type="button"
        onClick={onGoRegister}
        className="seq mt-5 w-full rounded-full border border-ink-900 px-6 py-3.5 font-medium text-ink-900 transition hover:-translate-y-0.5 hover:bg-ink-900 hover:text-white"
        style={{ "--d": "720ms" }}
      >
        Creer ma boutique gratuitement
      </button>
    </AuthLayout>
  );
}
