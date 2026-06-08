import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { me } from "../../services/authService";
import { getPaymentSettings, updatePaymentSettings } from "../../services/paymentSettingsService";

export default function PaymentSettingsPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({
    wave_phone_number: "",
    payment_mode: "manual",
    is_wave_enabled: false,
    is_whatsapp_enabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  useEffect(() => {
    if (businessId) {
      getPaymentSettings(businessId).then((data) => setForm({
        wave_phone_number: data.wave_phone_number || "",
        payment_mode: data.payment_mode || "manual",
        is_wave_enabled: Boolean(data.is_wave_enabled),
        is_whatsapp_enabled: Boolean(data.is_whatsapp_enabled),
      })).catch(() => {});
    }
  }, [businessId]);

  async function save(event) {
    event.preventDefault();
    await updatePaymentSettings(businessId, form);
    setSaved(true);
    setModalOpen(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-2xl space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Parametres de paiement</h1>
        <Button onClick={() => setModalOpen(true)}>Modifier</Button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <p><strong>Numero Wave :</strong> {form.wave_phone_number || "Non renseigne"}</p>
        <p className="mt-2 text-slate-500">
          Ce numero est affiche au client apres commande. Les paiements Wave de vos articles doivent etre envoyes sur ce compte.
        </p>
        <p><strong>Wave manuel :</strong> {form.is_wave_enabled ? "Actif" : "Inactif"}</p>
        <p><strong>WhatsApp :</strong> {form.is_whatsapp_enabled ? "Actif" : "Inactif"}</p>
      </div>
      {saved ? <p className="text-sm text-emerald-700">Parametres enregistres.</p> : null}
      {modalOpen ? (
        <FormModal title="Modifier les parametres de paiement" onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Numero Wave</label>
              <input
                value={form.wave_phone_number}
                onChange={(event) => setForm({ ...form, wave_phone_number: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Ex: 0700000000"
              />
              <p className="mt-1 text-xs text-slate-500">Le client verra ce numero pour payer ses commandes avec Wave manuel.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_wave_enabled} onChange={(event) => setForm({ ...form, is_wave_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
              Activer Wave manuel
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_whatsapp_enabled} onChange={(event) => setForm({ ...form, is_whatsapp_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
              Activer contact WhatsApp
            </label>
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
