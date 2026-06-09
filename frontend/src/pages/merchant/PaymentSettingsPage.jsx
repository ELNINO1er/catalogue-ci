import { useEffect, useState } from "react";
import { CreditCard, MessageCircle, Truck, Waves } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { me } from "../../services/authService";
import { getPaymentSettings, getWaveStatus, updatePaymentSettings } from "../../services/paymentSettingsService";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function PaymentSettingsPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({
    wave_phone_number: "",
    wave_account_name: "",
    payment_instructions: "",
    payment_mode: "manual",
    is_wave_checkout_enabled: false,
    is_wave_enabled: false,
    is_cod_enabled: false,
    is_whatsapp_enabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [waveAvailable, setWaveAvailable] = useState(false);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
    getWaveStatus().then((data) => setWaveAvailable(data.wave_checkout_available)).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  useEffect(() => {
    if (businessId) {
      getPaymentSettings(businessId).then((data) => setForm({
        wave_phone_number: data.wave_phone_number || "",
        wave_account_name: data.wave_account_name || "",
        payment_instructions: data.payment_instructions || "",
        payment_mode: data.payment_mode || "manual",
        is_wave_checkout_enabled: Boolean(data.is_wave_checkout_enabled),
        is_wave_enabled: Boolean(data.is_wave_enabled),
        is_cod_enabled: Boolean(data.is_cod_enabled),
        is_whatsapp_enabled: Boolean(data.is_whatsapp_enabled),
      })).catch(() => {});
    }
  }, [businessId]);

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await updatePaymentSettings(businessId, form);
      setForm({
        wave_phone_number: data.wave_phone_number || "",
        wave_account_name: data.wave_account_name || "",
        payment_instructions: data.payment_instructions || "",
        payment_mode: data.payment_mode || "manual",
        is_wave_checkout_enabled: Boolean(data.is_wave_checkout_enabled),
        is_wave_enabled: Boolean(data.is_wave_enabled),
        is_cod_enabled: Boolean(data.is_cod_enabled),
        is_whatsapp_enabled: Boolean(data.is_whatsapp_enabled),
      });
      setSaved(true);
      setModalOpen(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer les paiements.");
    }
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
          <p className="mt-1 text-sm text-slate-500">Configurez les moyens de paiement visibles au client pendant la commande.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Modifier</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <section className={`rounded-lg border p-4 ${form.is_wave_checkout_enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          <div className="mb-3 flex items-center gap-2 font-bold text-slate-900"><CreditCard size={18} /> Wave Checkout</div>
          <p className={`text-sm font-semibold ${form.is_wave_checkout_enabled ? "text-emerald-700" : "text-slate-500"}`}>{form.is_wave_checkout_enabled ? "Actif - Paiement direct" : "Inactif"}</p>
          <p className="mt-2 text-sm text-slate-500">{form.is_wave_checkout_enabled ? "Vos clients peuvent payer directement via Wave. Confirmation automatique." : waveAvailable ? "Disponible - Activez-le dans les parametres." : "Non disponible sur cette plateforme."}</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-slate-900"><Waves size={18} /> Wave manuel</div>
          <p className="text-sm text-slate-600">{form.is_wave_enabled ? "Actif" : "Inactif"}</p>
          <p className="mt-2 text-sm text-slate-500">{form.wave_phone_number || "Numero non renseigne"}</p>
          {form.wave_account_name ? <p className="text-sm text-slate-500">{form.wave_account_name}</p> : null}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-slate-900"><Truck size={18} /> Paiement a la livraison</div>
          <p className="text-sm text-slate-600">{form.is_cod_enabled ? "Actif" : "Inactif"}</p>
          <p className="mt-2 text-sm text-slate-500">Le client paie quand il recoit sa commande.</p>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 font-bold text-slate-900"><MessageCircle size={18} /> WhatsApp</div>
          <p className="text-sm text-slate-600">{form.is_whatsapp_enabled ? "Actif" : "Inactif"}</p>
          <p className="mt-2 text-sm text-slate-500">Le client peut contacter la boutique apres commande.</p>
        </section>
      </div>

      {form.payment_instructions ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><CreditCard size={18} /> Instructions de paiement</div>
          <p className="text-sm text-slate-600">{form.payment_instructions}</p>
        </section>
      ) : null}

      {saved ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Parametres enregistres.</p> : null}

      {modalOpen ? (
        <FormModal title="Modifier les paiements" description="Ces reglages sont utilises dans le tunnel de commande client." onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Numero Wave
                <input value={form.wave_phone_number} onChange={(event) => setForm({ ...form, wave_phone_number: event.target.value })} className={inputClass} placeholder="Ex: 0700000000" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Nom du compte Wave
                <input value={form.wave_account_name} onChange={(event) => setForm({ ...form, wave_account_name: event.target.value })} className={inputClass} placeholder="Nom affiche sur Wave" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
                Instructions
                <textarea value={form.payment_instructions} onChange={(event) => setForm({ ...form, payment_instructions: event.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Ex: Envoyez le paiement Wave puis cliquez sur J'ai paye." />
              </label>
            </div>

            <div className="grid gap-2">
              <label className={`flex items-start gap-2 rounded-lg border px-3 py-3 text-sm font-semibold text-slate-700 ${waveAvailable ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                <input type="checkbox" checked={form.is_wave_checkout_enabled} onChange={(event) => setForm({ ...form, is_wave_checkout_enabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-emerald-600" disabled={!waveAvailable} />
                <span>
                  <span className="block">Activer Wave Checkout (paiement automatique)</span>
                  {waveAvailable ? (
                    <span className="text-xs font-normal text-emerald-600">Wave Checkout est configure sur la plateforme. Vos clients pourront payer directement via Wave.</span>
                  ) : (
                    <span className="text-xs font-normal text-rose-600">Wave Checkout n'est pas encore configure par l'administrateur de la plateforme.</span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.is_wave_enabled} onChange={(event) => setForm({ ...form, is_wave_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
                Activer Wave manuel
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.is_cod_enabled} onChange={(event) => setForm({ ...form, is_cod_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
                Activer paiement a la livraison
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.is_whatsapp_enabled} onChange={(event) => setForm({ ...form, is_whatsapp_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
                Activer contact WhatsApp
              </label>
            </div>

            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
