import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, MailCheck } from "lucide-react";
import { requestPasswordReset, resetPassword } from "../../services/authService";
import AuthLayout, { AuthError, AuthField, AuthSubmit } from "./AuthLayout";

function AuthShell({ icon: Icon, title, subtitle, children, onBack }) {
  return (
    <AuthLayout variant="reset" title={title} subtitle={subtitle}>
      <div className="seq-pop mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600" style={{ "--d": "300ms" }}><Icon size={24} /></div>
      {children}
      <button onClick={onBack} className="seq group mt-8 flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900" style={{ "--d": "650ms" }}>
        <ArrowLeft size={15} className="transition-transform duration-200 group-hover:-translate-x-1" /> Retour a la connexion
      </button>
    </AuthLayout>
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
        <p className="seq rounded-2xl border border-surface-border bg-white px-4 py-3.5 text-sm text-ink-600" style={{ "--d": "400ms" }}>Pensez a regarder dans les courriers indesirables (spam).</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell icon={KeyRound} title="Mot de passe oublie" subtitle="Entrez l'email de votre compte. Nous vous enverrons un lien de reinitialisation." onBack={onBack}>
      <form onSubmit={submit} className="grid gap-5">
        <AuthField icon={Mail} label="Adresse email" delay="400ms">
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        </AuthField>
        <AuthError message={error} />
        <AuthSubmit loading={loading} loadingText="Envoi..." delay="500ms">Recevoir le lien</AuthSubmit>
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
        <form onSubmit={(e) => { e.preventDefault(); onBack(); }}>
          <AuthSubmit delay="400ms">Se connecter</AuthSubmit>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell icon={KeyRound} title="Nouveau mot de passe" subtitle="Au moins 8 caracteres, avec une majuscule, une minuscule, un chiffre et un caractere special." onBack={onBack}>
      <form onSubmit={submit} className="grid gap-5">
        <AuthField icon={Lock} label="Nouveau mot de passe" delay="400ms">
          <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!token} />
        </AuthField>
        <AuthField icon={Lock} label="Confirmer le mot de passe" delay="480ms">
          <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!token} />
        </AuthField>
        <AuthError message={error} />
        <AuthSubmit loading={loading} loadingText="Enregistrement..." disabled={!token} delay="560ms">Enregistrer le mot de passe</AuthSubmit>
      </form>
    </AuthShell>
  );
}
