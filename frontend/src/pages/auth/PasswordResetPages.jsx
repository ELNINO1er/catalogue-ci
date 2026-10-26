import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck, ShoppingBag } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { requestPasswordReset, resetPassword } from "../../services/authService";

function AuthShell({ icon: Icon, title, subtitle, children, onBack }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white"><ShoppingBag size={20} /></div>
          <span className="font-display text-xl font-bold text-ink-900">CatalogueCI</span>
        </div>
        <div className="card p-7">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={22} /></div>
          <h1 className="font-display text-xl font-bold text-ink-900">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <button onClick={onBack} className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
          <ArrowLeft size={15} /> Retour a la connexion
        </button>
      </div>
    </main>
  );
}

export function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Envoi impossible. Reessayez dans quelques minutes.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell icon={MailCheck} title="Verifiez vos emails" subtitle="Si un compte existe pour cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe. Le lien est valable 1 heure." onBack={onBack}>
        <p className="rounded-xl bg-surface px-4 py-3 text-sm text-ink-600">Pensez a regarder dans les courriers indesirables (spam).</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell icon={KeyRound} title="Mot de passe oublie" subtitle="Entrez l'email de votre compte. Nous vous enverrons un lien de reinitialisation." onBack={onBack}>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Adresse email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        {error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="text-white" /> : null}
          {loading ? "Envoi..." : "Recevoir le lien"}
        </Button>
      </form>
    </AuthShell>
  );
}

// Le jeton est lu une fois puis retire de la barre d'adresse (historique, partage d'ecran).
function readTokenOnce() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  if (token) window.history.replaceState(null, "", "/reinitialiser-mot-de-passe");
  return token;
}

export function ResetPasswordPage({ onBack }) {
  const [token] = useState(readTokenOnce);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError("Lien incomplet. Ouvrez le lien recu par email, ou refaites une demande.");
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Modification impossible. Refaites une demande.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell icon={CheckCircle2} title="Mot de passe modifie" subtitle="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe. Vos autres sessions ont ete fermees." onBack={onBack}>
        <Button size="lg" className="w-full" onClick={onBack}>Se connecter</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell icon={KeyRound} title="Nouveau mot de passe" subtitle="Au moins 8 caracteres, avec une majuscule, une minuscule, un chiffre et un caractere special." onBack={onBack}>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!token} />
        <Input label="Confirmer le mot de passe" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!token} />
        {error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading || !token}>
          {loading ? <LoadingSpinner size="sm" className="text-white" /> : null}
          {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </AuthShell>
  );
}
