import { useEffect, useState } from "react";
import { CreditCard, Settings, Shield } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { getPlatformSettings, savePlatformSettings } from "../../services/superAdminService";

export default function PlatformSettingsPage() {
  const [form, setForm] = useState({
    platform_name: "CatalogueCI",
    currency: "FCFA",
    country: "Cote d'Ivoire",
    support_email: "",
    support_whatsapp: "",
    maintenance_mode: "false",
  });
  const [waveForm, setWaveForm] = useState({
    wave_api_key: "",
    wave_signing_secret: "",
    wave_webhook_secret: "",
    wave_currency: "XOF",
    wave_checkout_enabled: "false",
  });
  const [saved, setSaved] = useState("");
  const [generalModal, setGeneralModal] = useState(false);
  const [waveModal, setWaveModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPlatformSettings().then((data) => {
      setForm((current) => ({
        ...current,
        platform_name: data.platform_name || current.platform_name,
        currency: data.currency || current.currency,
        country: data.country || current.country,
        support_email: data.support_email || "",
        support_whatsapp: data.support_whatsapp || "",
        maintenance_mode: data.maintenance_mode || "false",
      }));
      setWaveForm((current) => ({
        ...current,
        wave_api_key: data.wave_api_key || "",
        wave_signing_secret: data.wave_signing_secret || "",
        wave_webhook_secret: data.wave_webhook_secret || "",
        wave_currency: data.wave_currency || "XOF",
        wave_checkout_enabled: data.wave_checkout_enabled || "false",
      }));
    }).catch(() => {});
  }, []);

  async function saveGeneral(event) {
    event.preventDefault();
    setError("");
    try {
      await savePlatformSettings(form);
      setSaved("general");
      setGeneralModal(false);
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  }

  async function saveWave(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = { ...waveForm };
      if (payload.wave_api_key.includes("****")) delete payload.wave_api_key;
      if (payload.wave_signing_secret.includes("****")) delete payload.wave_signing_secret;
      if (payload.wave_webhook_secret.includes("****")) delete payload.wave_webhook_secret;
      await savePlatformSettings(payload);
      const refreshed = await getPlatformSettings();
      setWaveForm({
        wave_api_key: refreshed.wave_api_key || "",
        wave_signing_secret: refreshed.wave_signing_secret || "",
        wave_webhook_secret: refreshed.wave_webhook_secret || "",
        wave_currency: refreshed.wave_currency || "XOF",
        wave_checkout_enabled: refreshed.wave_checkout_enabled || "false",
      });
      setSaved("wave");
      setWaveModal(false);
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde Wave.");
    }
  }

  const waveConfigured = Boolean(waveForm.wave_api_key && waveForm.wave_signing_secret);
  const waveEnabled = waveForm.wave_checkout_enabled === "true";

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="max-w-3xl space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Parametres de la plateforme</h1>
        <p className="mt-1 text-sm text-slate-500">Configurez les informations generales et l'integration Wave Checkout.</p>
      </div>

      {/* Section Generale */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-slate-500" />
            <h2 className="text-lg font-bold text-slate-900">Parametres generaux</h2>
          </div>
          <Button tone="secondary" onClick={() => setGeneralModal(true)}>Modifier</Button>
        </div>
        <div className="divide-y divide-slate-100 p-4 text-sm">
          {[
            ["Nom de la plateforme", form.platform_name],
            ["Devise", form.currency],
            ["Pays", form.country],
            ["Email support", form.support_email || "-"],
            ["WhatsApp support", form.support_whatsapp || "-"],
            ["Mode maintenance", form.maintenance_mode === "true" ? "Oui" : "Non"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2">
              <span className="font-semibold text-slate-700">{label}</span>
              <span className="text-slate-500">{value}</span>
            </div>
          ))}
        </div>
        {saved === "general" ? <p className="border-t border-slate-100 px-4 py-2 text-sm text-emerald-700">Parametres generaux enregistres.</p> : null}
      </section>

      {/* Section Wave Checkout */}
      <section className="rounded-lg border-2 border-blue-200 bg-white">
        <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-blue-900">Wave Checkout API</h2>
              <p className="text-xs text-blue-700">Permet aux clients de payer directement via Wave avec confirmation automatique.</p>
            </div>
          </div>
          <Button onClick={() => setWaveModal(true)}>Configurer</Button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${waveEnabled && waveConfigured ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              <span className={`h-2 w-2 rounded-full ${waveEnabled && waveConfigured ? "bg-emerald-500" : "bg-slate-400"}`} />
              {waveEnabled && waveConfigured ? "Actif" : waveConfigured ? "Configure mais desactive" : "Non configure"}
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between gap-4 py-2">
              <span className="font-semibold text-slate-700">Cle API Wave</span>
              <span className="font-mono text-slate-500">{waveForm.wave_api_key || "Non renseignee"}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="font-semibold text-slate-700">Secret signature</span>
              <span className="font-mono text-slate-500">{waveForm.wave_signing_secret || "Non renseigne"}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="font-semibold text-slate-700">Devise Wave</span>
              <span className="text-slate-500">{waveForm.wave_currency || "XOF"}</span>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <span className="font-semibold text-slate-700">Statut</span>
              <span className={`font-semibold ${waveEnabled ? "text-emerald-700" : "text-slate-500"}`}>{waveEnabled ? "Active pour les commercants" : "Desactive"}</span>
            </div>
          </div>

          {!waveConfigured ? (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">Comment obtenir vos cles Wave :</p>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-amber-700">
                <li>Creez un compte sur <strong>business.wave.com</strong></li>
                <li>Allez dans Parametres &gt; API &gt; Cles</li>
                <li>Copiez la cle API et le secret de signature</li>
                <li>Configurez l'URL webhook : <strong>{window.location.origin.replace(/:5173$/, ":4000")}/api/wave/webhook</strong></li>
              </ol>
            </div>
          ) : null}
        </div>
        {saved === "wave" ? <p className="border-t border-blue-100 px-4 py-2 text-sm text-emerald-700">Configuration Wave enregistree.</p> : null}
      </section>

      {/* Modal Parametres generaux */}
      {generalModal ? (
        <FormModal title="Parametres generaux" onClose={() => setGeneralModal(false)}>
          <form onSubmit={saveGeneral} className="grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Nom de la plateforme
              <input value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })} className={inputClass} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Devise
                <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Pays
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputClass} />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Email support
              <input value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              WhatsApp support
              <input value={form.support_whatsapp} onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })} className={inputClass} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.maintenance_mode === "true"} onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked ? "true" : "false" })} className="h-4 w-4 accent-emerald-600" />
              Mode maintenance
            </label>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={() => setGeneralModal(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {/* Modal Wave Checkout */}
      {waveModal ? (
        <FormModal title="Configuration Wave Checkout" description="Les cles API sont stockees de maniere securisee. Laissez un champ vide pour conserver la valeur actuelle." onClose={() => setWaveModal(false)}>
          <form onSubmit={saveWave} className="grid gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="flex items-center gap-2 font-semibold"><Shield size={16} /> Ces informations sont sensibles.</p>
              <p className="mt-1">Ne partagez jamais vos cles API. Elles permettent de creer des sessions de paiement Wave.</p>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Cle API Wave (WAVE_API_KEY)
              <input
                value={waveForm.wave_api_key}
                onChange={(e) => setWaveForm({ ...waveForm, wave_api_key: e.target.value })}
                className={`${inputClass} font-mono text-sm`}
                placeholder="wave_ci_prod_..."
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Secret de signature (WAVE_SIGNING_SECRET)
              <input
                value={waveForm.wave_signing_secret}
                onChange={(e) => setWaveForm({ ...waveForm, wave_signing_secret: e.target.value })}
                className={`${inputClass} font-mono text-sm`}
                placeholder="whsec_..."
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Secret webhook (optionnel, si different)
              <input
                value={waveForm.wave_webhook_secret}
                onChange={(e) => setWaveForm({ ...waveForm, wave_webhook_secret: e.target.value })}
                className={`${inputClass} font-mono text-sm`}
                placeholder="Laisser vide si identique au secret de signature"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Devise Wave
              <select value={waveForm.wave_currency} onChange={(e) => setWaveForm({ ...waveForm, wave_currency: e.target.value })} className={inputClass}>
                <option value="XOF">XOF (Franc CFA)</option>
                <option value="XAF">XAF (Franc CFA CEMAC)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={waveForm.wave_checkout_enabled === "true"}
                onChange={(e) => setWaveForm({ ...waveForm, wave_checkout_enabled: e.target.checked ? "true" : "false" })}
                className="mt-0.5 h-5 w-5 accent-emerald-600"
              />
              <span>
                <span className="block text-emerald-900">Activer Wave Checkout sur la plateforme</span>
                <span className="text-xs font-normal text-emerald-700">
                  Une fois active, les commercants pourront proposer le paiement Wave automatique a leurs clients.
                  Les cles API et le secret de signature doivent etre renseignes.
                </span>
              </span>
            </label>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={() => setWaveModal(false)}>Annuler</Button>
              <Button type="submit">Enregistrer la config Wave</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
