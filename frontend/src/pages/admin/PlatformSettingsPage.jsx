import { useEffect, useState } from "react";
import { Crown, CreditCard, Settings, Shield, Wallet } from "lucide-react";
import Button from "../../components/ui/Button";
import Input, { Select, Textarea } from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { MetaRow, PageHeader, StatusPill } from "../../components/ui/PageKit";
import { getPlatformSettings, savePlatformSettings } from "../../services/superAdminService";

// Carte de section : icone a gauche, titre + description, action, puis le resume des valeurs.
function SectionCard({ icon: Icon, tone = "bg-brand-50 text-brand-600", title, description, status, action, children, footer }) {
  return (
    <section className="card flex flex-col p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
            {status}
          </div>
          {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-4 flex-1">{children}</div> : null}
      {footer}
    </section>
  );
}

function SummaryList({ rows }) {
  return (
    <div className="divide-y divide-surface-border rounded-xl bg-surface px-3">
      {rows.map(([label, value]) => <MetaRow key={label} label={label}>{value}</MetaRow>)}
    </div>
  );
}

function SavedNote({ children }) {
  return <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{children}</p>;
}

export default function PlatformSettingsPage() {
  const [form, setForm] = useState({
    platform_name: "CatalogueCI",
    currency: "FCFA",
    country: "Cote d'Ivoire",
    support_email: "",
    support_whatsapp: "",
    maintenance_mode: "false",
    billing_enabled: "false",
  });
  const [waveForm, setWaveForm] = useState({
    wave_api_key: "",
    wave_signing_secret: "",
    wave_webhook_secret: "",
    wave_currency: "XOF",
    wave_checkout_enabled: "false",
  });
  const [subForm, setSubForm] = useState({
    platform_wave_number: "",
    platform_wave_name: "",
    platform_payment_instructions: "",
  });
  const [saved, setSaved] = useState("");
  const [generalModal, setGeneralModal] = useState(false);
  const [waveModal, setWaveModal] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [billingConfirm, setBillingConfirm] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
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
        billing_enabled: data.billing_enabled || "false",
      }));
      setWaveForm((current) => ({
        ...current,
        wave_api_key: data.wave_api_key || "",
        wave_signing_secret: data.wave_signing_secret || "",
        wave_webhook_secret: data.wave_webhook_secret || "",
        wave_currency: data.wave_currency || "XOF",
        wave_checkout_enabled: data.wave_checkout_enabled || "false",
      }));
      setSubForm({
        platform_wave_number: data.platform_wave_number || "",
        platform_wave_name: data.platform_wave_name || "",
        platform_payment_instructions: data.platform_payment_instructions || "",
      });
    }).catch(() => {});
  }, []);

  function flash(key) {
    setSaved(key);
    setTimeout(() => setSaved(""), 2500);
  }

  async function saveGeneral(event) {
    event.preventDefault();
    setError("");
    try {
      await savePlatformSettings(form);
      setGeneralModal(false);
      flash("general");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  }

  // Bascule directe du mode payant (meme champ billing_enabled que le formulaire general).
  async function toggleBilling() {
    const next = form.billing_enabled === "true" ? "false" : "true";
    setBillingLoading(true);
    setError("");
    try {
      await savePlatformSettings({ billing_enabled: next });
      setForm((current) => ({ ...current, billing_enabled: next }));
      flash("billing");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setBillingLoading(false);
      setBillingConfirm(false);
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
      setWaveModal(false);
      flash("wave");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde Wave.");
    }
  }

  async function saveSubscriptionPayment(event) {
    event.preventDefault();
    setError("");
    try {
      await savePlatformSettings(subForm);
      setSubModal(false);
      flash("sub");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  }

  const waveConfigured = Boolean(waveForm.wave_api_key && waveForm.wave_signing_secret);
  const waveEnabled = waveForm.wave_checkout_enabled === "true";
  const billingOn = form.billing_enabled === "true";
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const waveField = (key) => ({ value: waveForm[key], onChange: (e) => setWaveForm({ ...waveForm, [key]: e.target.value }) });
  const subField = (key) => ({ value: subForm[key], onChange: (e) => setSubForm({ ...subForm, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parametres de la plateforme"
        description="Informations generales, mode payant, Wave Checkout et paiement des abonnements."
        actions={<Button tone="secondary" onClick={() => { setError(""); setGeneralModal(true); }}><Settings size={16} /> Modifier les generaux</Button>}
      />

      {error && !generalModal && !waveModal && !subModal ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Mode payant : mis en avant */}
      <SectionCard
        icon={Crown}
        tone={billingOn ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}
        title="Abonnements payants"
        status={<StatusPill tone={billingOn ? "success" : "warning"}>{billingOn ? "Actives" : "Lancement gratuit"}</StatusPill>}
        description={billingOn
          ? "Les limites des plans s'appliquent. Les boutiques sans abonnement payant passent sur le plan gratuit."
          : "Toutes les boutiques ont acces a tout, sans limite ni expiration. Activez quand vous serez pret a facturer."}
        action={(
          <Button tone={billingOn ? "secondary" : "primary"} onClick={() => setBillingConfirm(true)}>
            {billingOn ? "Revenir au gratuit" : "Activer le payant"}
          </Button>
        )}
        footer={saved === "billing" ? <SavedNote>Mode d'abonnement mis a jour.</SavedNote> : null}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          icon={Settings}
          title="Parametres generaux"
          description="Identite de la plateforme et contacts du support."
          action={<Button tone="secondary" size="sm" onClick={() => { setError(""); setGeneralModal(true); }}>Modifier</Button>}
          footer={saved === "general" ? <SavedNote>Parametres generaux enregistres.</SavedNote> : null}
        >
          <SummaryList rows={[
            ["Nom", form.platform_name],
            ["Devise", form.currency],
            ["Pays", form.country],
            ["Email support", form.support_email || "-"],
            ["WhatsApp support", form.support_whatsapp || "-"],
            ["Mode maintenance", form.maintenance_mode === "true" ? "Oui" : "Non"],
          ]} />
        </SectionCard>

        <SectionCard
          icon={Wallet}
          tone="bg-violet-50 text-violet-600"
          title="Paiement des abonnements"
          description="Compte Wave sur lequel les commercants paient leur plan."
          status={<StatusPill tone={subForm.platform_wave_number ? "success" : "warning"}>{subForm.platform_wave_number ? "Configure" : "A configurer"}</StatusPill>}
          action={<Button tone="secondary" size="sm" onClick={() => { setError(""); setSubModal(true); }}>Modifier</Button>}
          footer={saved === "sub" ? <SavedNote>Paiement des abonnements enregistre.</SavedNote> : null}
        >
          <SummaryList rows={[
            ["Numero Wave", subForm.platform_wave_number || "Non renseigne"],
            ["Nom du compte", subForm.platform_wave_name || "-"],
          ]} />
          {subForm.platform_payment_instructions ? (
            <p className="mt-3 rounded-xl border border-surface-border px-3 py-2 text-xs text-ink-600">{subForm.platform_payment_instructions}</p>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        icon={CreditCard}
        tone="bg-sky-50 text-sky-600"
        title="Wave Checkout API"
        description="Les clients paient directement via Wave, avec confirmation automatique."
        status={(
          <StatusPill tone={waveEnabled && waveConfigured ? "success" : waveConfigured ? "warning" : "neutral"}>
            {waveEnabled && waveConfigured ? "Actif" : waveConfigured ? "Configure mais desactive" : "Non configure"}
          </StatusPill>
        )}
        action={<Button size="sm" onClick={() => { setError(""); setWaveModal(true); }}>Configurer</Button>}
        footer={saved === "wave" ? <SavedNote>Configuration Wave enregistree.</SavedNote> : null}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <SummaryList rows={[
            ["Cle API", <span key="k" className="font-mono">{waveForm.wave_api_key || "Non renseignee"}</span>],
            ["Secret signature", <span key="s" className="font-mono">{waveForm.wave_signing_secret || "Non renseigne"}</span>],
            ["Devise", waveForm.wave_currency || "XOF"],
            ["Pour les commercants", waveEnabled ? "Active" : "Desactive"],
          ]} />
          {!waveConfigured ? (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Obtenir vos cles Wave</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-700">
                <li>Creez un compte sur <strong>business.wave.com</strong></li>
                <li>Allez dans Parametres &gt; API &gt; Cles</li>
                <li>Copiez la cle API et le secret de signature</li>
                <li>URL webhook : <strong className="break-all">{window.location.origin.replace(/:5173$/, ":4000")}/api/wave/webhook</strong></li>
              </ol>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {billingConfirm ? (
        <ConfirmModal
          title={billingOn ? "Revenir au lancement gratuit" : "Activer les abonnements payants"}
          message={billingOn
            ? "Toutes les boutiques retrouveront un acces complet, sans limite ni expiration."
            : "Les limites des plans s'appliqueront a toutes les boutiques. Celles sans abonnement payant passeront sur le plan gratuit."}
          tone="warning"
          confirmLabel={billingOn ? "Revenir au gratuit" : "Activer"}
          loading={billingLoading}
          onConfirm={toggleBilling}
          onCancel={() => setBillingConfirm(false)}
        />
      ) : null}

      {generalModal ? (
        <FormModal title="Parametres generaux" onClose={() => setGeneralModal(false)}>
          <form onSubmit={saveGeneral} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Input label="Nom de la plateforme" {...field("platform_name")} /></div>
              <Input label="Devise" {...field("currency")} />
              <Input label="Pays" {...field("country")} />
              <Input label="Email support" {...field("support_email")} />
              <Input label="WhatsApp support" {...field("support_whatsapp")} />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
              <input type="checkbox" checked={form.maintenance_mode === "true"} onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked ? "true" : "false" })} className="h-4 w-4 accent-brand-500" />
              Mode maintenance
            </label>
            <label className="grid gap-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink-700">
              <span className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={form.billing_enabled === "true"} onChange={(e) => setForm({ ...form, billing_enabled: e.target.checked ? "true" : "false" })} className="h-4 w-4 accent-brand-500" />
                Activer les abonnements payants
              </span>
              <span className="text-xs text-ink-600">
                Desactive = lancement gratuit : toutes les boutiques ont acces a tout, sans limite ni expiration.
                Une fois active, les limites des plans s'appliquent et les boutiques sans abonnement payant passent sur le plan gratuit.
              </span>
            </label>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={() => setGeneralModal(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {subModal ? (
        <FormModal title="Paiement des abonnements" description="Affiche aux commercants quand ils choisissent un plan payant." onClose={() => setSubModal(false)}>
          <form onSubmit={saveSubscriptionPayment} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Numero Wave de la plateforme" placeholder="2250700000000" {...subField("platform_wave_number")} />
              <Input label="Nom du compte Wave" {...subField("platform_wave_name")} />
            </div>
            <Textarea label="Instructions de paiement" rows={3} {...subField("platform_payment_instructions")} />
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={() => setSubModal(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {waveModal ? (
        <FormModal title="Configuration Wave Checkout" description="Les cles API sont stockees de maniere securisee. Laissez un champ masque tel quel pour conserver la valeur actuelle." onClose={() => setWaveModal(false)}>
          <form onSubmit={saveWave} className="grid gap-5">
            <div className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
              <p className="flex items-center gap-2 font-semibold"><Shield size={16} /> Ces informations sont sensibles.</p>
              <p className="mt-1">Ne partagez jamais vos cles API. Elles permettent de creer des sessions de paiement Wave.</p>
            </div>
            <Input label="Cle API Wave (WAVE_API_KEY)" className="font-mono" placeholder="wave_ci_prod_..." {...waveField("wave_api_key")} />
            <Input label="Secret de signature (WAVE_SIGNING_SECRET)" className="font-mono" placeholder="whsec_..." {...waveField("wave_signing_secret")} />
            <Input label="Secret webhook (optionnel, si different)" className="font-mono" placeholder="Laisser vide si identique au secret de signature" {...waveField("wave_webhook_secret")} />
            <Select label="Devise Wave" {...waveField("wave_currency")}>
              <option value="XOF">XOF (Franc CFA)</option>
              <option value="XAF">XAF (Franc CFA CEMAC)</option>
              <option value="USD">USD (Dollar)</option>
            </Select>
            <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-ink-700">
              <input
                type="checkbox"
                checked={waveForm.wave_checkout_enabled === "true"}
                onChange={(e) => setWaveForm({ ...waveForm, wave_checkout_enabled: e.target.checked ? "true" : "false" })}
                className="mt-0.5 h-5 w-5 accent-brand-500"
              />
              <span>
                <span className="block text-emerald-900">Activer Wave Checkout sur la plateforme</span>
                <span className="text-xs font-normal text-emerald-700">
                  Les commercants pourront proposer le paiement Wave automatique. La cle API et le secret de signature doivent etre renseignes.
                </span>
              </span>
            </label>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={() => setWaveModal(false)}>Annuler</Button>
              <Button type="submit">Enregistrer la config Wave</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
