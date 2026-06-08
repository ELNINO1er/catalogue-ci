import { useState } from "react";
import { LogOut, RefreshCw, Store } from "lucide-react";
import Button from "../../components/ui/Button";
import { login as loginRequest } from "../../services/authService";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(await loginRequest(email, password));
    } catch (err) {
      setError(err.response?.data?.message || "Connexion impossible. Verifiez l'API et les identifiants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-600 text-white">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">CatalogueCI</h1>
            <p className="text-sm text-slate-500">Espace de gestion</p>
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <Button className="w-full" disabled={loading}>
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <LogOut size={16} />}
          Se connecter
        </Button>
      </form>
    </main>
  );
}
