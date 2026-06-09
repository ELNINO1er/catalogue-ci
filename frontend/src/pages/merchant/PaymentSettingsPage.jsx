import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, MessageCircle, Truck, Waves, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { me } from "../../services/authService";
import { getPaymentSettings, getWaveStatus, updatePaymentSettings } from "../../services/paymentSettingsService";
import { listOrdersByBusiness, updateOrderStatus } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildCustomerWhatsAppLink } from "../../utils/whatsappMessage";

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
  const [pendingOrders, setPendingOrders] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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
      loadPendingOrders();
    }
  }, [businessId]);

  async function loadPendingOrders() {
    if (!businessId) return;
    try {
      const result = await listOrdersByBusiness(businessId, "AWAITING_VERIFICATION");
      const orders = result.data || result;
      setPendingOrders(Array.isArray(orders) ? orders : []);
    } catch {
      setPendingOrders([]);
    }
  }

  function askConfirmPayment(order) {
    setConfirm({
      order,
      action: "confirm",
      title: "Confirmer le paiement",
      message: `Confirmez-vous avoir recu ${fmt(order.total_amount)} FCFA de ${order.customer_name} pour "${order.product?.name}" ?`,
      tone: "success",
      confirmLabel: "Oui, paiement recu",
    });
  }

  function askRejectPayment(order) {
    setConfirm({
      order,
      action: "reject",
      title: "Rejeter le paiement",
      message: `Rejeter le paiement de ${order.customer_name} (${fmt(order.total_amount)} FCFA) ? La commande sera annulee.`,
      tone: "danger",
      confirmLabel: "Rejeter et annuler",
    });
  }

  async function executePaymentAction() {
    if (!confirm) return;
    setActionLoading(true);
    setActionError("");
    try {
      if (confirm.action === "confirm") {
        await updateOrderStatus(confirm.order.id, { status: "PAID", payment_status: "PAID" });
      } else {
        await updateOrderStatus(confirm.order.id, { status: "CANCELLED", payment_status: "FAILED" });
      }
      setConfirm(null);
      await loadPendingOrders();
    } catch (err) {
      setActionError(err.response?.data?.message || "Impossible de mettre a jour cette commande.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  }

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

  const hasWaveNumber = Boolean(form.wave_phone_number);
  const waveActive = form.is_wave_enabled || form.is_wave_checkout_enabled;

  return (
    <div className="space-y-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
          <p className="mt-1 text-sm text-slate-500">Gerez vos moyens de paiement et verifiez les paiements recus.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Modifier les parametres</Button>
      </div>

      {/* Section numero Wave principal */}
      <section className={`rounded-lg border-2 p-5 ${hasWaveNumber ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Waves size={24} className={hasWaveNumber ? "text-blue-600" : "text-amber-600"} />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Numero Wave</h2>
              {hasWaveNumber ? (
                <>
                  <p className="mt-1 font-mono text-2xl font-bold text-blue-900">{form.wave_phone_number}</p>
                  {form.wave_account_name ? <p className="text-sm text-blue-700">Compte : {form.wave_account_name}</p> : null}
                  <p className="mt-2 text-sm text-blue-700">Les clients envoient leurs paiements Wave sur ce numero.</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold text-amber-800">Aucun numero Wave configure</p>
                  <p className="text-sm text-amber-700">Ajoutez votre numero Wave pour recevoir les paiements de vos clients.</p>
                </>
              )}
            </div>
          </div>
          <Button tone="secondary" onClick={() => setModalOpen(true)}>{hasWaveNumber ? "Modifier" : "Ajouter"}</Button>
        </div>
      </section>

      {/* Paiements a verifier */}
      {pendingOrders.length > 0 ? (
        <section className="rounded-lg border-2 border-amber-300 bg-white">
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
            <AlertCircle size={20} className="text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Paiements a verifier ({pendingOrders.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Commande #{order.id} — {order.product?.name}</p>
                  <p className="text-sm text-slate-600">{order.customer_name} — {order.customer_phone}</p>
                  <p className="text-sm text-slate-500">Methode : {order.payment_method === "wave_checkout" ? "Wave Checkout" : order.payment_method === "wave" ? "Wave manuel" : order.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-700">{fmt(order.total_amount)} FCFA</p>
                  <p className="text-xs text-amber-600 font-semibold">Le client dit avoir paye</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button onClick={() => askConfirmPayment(order)}>
                    <CheckCircle2 size={16} /> Confirmer
                  </Button>
                  <Button tone="danger" onClick={() => askRejectPayment(order)}>
                    <XCircle size={16} /> Rejeter
                  </Button>
                  <a href={buildCustomerWhatsAppLink(order)} target="_blank" rel="noreferrer">
                    <Button tone="secondary"><MessageCircle size={16} /></Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Aucun paiement en attente de verification.</p>
          </div>
        </section>
      )}

      {/* Moyens de paiement actifs */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Moyens de paiement actifs</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className={`rounded-lg border p-4 ${form.is_wave_checkout_enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><CreditCard size={18} /> Wave Checkout</div>
            <p className={`text-sm font-semibold ${form.is_wave_checkout_enabled ? "text-emerald-700" : "text-slate-400"}`}>
              {form.is_wave_checkout_enabled ? "Actif — Paiement automatique" : "Inactif"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{form.is_wave_checkout_enabled ? "Le client paie directement via Wave. Confirmation automatique." : waveAvailable ? "Disponible, activez-le." : "Non disponible sur la plateforme."}</p>
          </section>
          <section className={`rounded-lg border p-4 ${form.is_wave_enabled ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Waves size={18} /> Wave manuel</div>
            <p className={`text-sm font-semibold ${form.is_wave_enabled ? "text-blue-700" : "text-slate-400"}`}>
              {form.is_wave_enabled ? `Actif — ${form.wave_phone_number || "Numero manquant"}` : "Inactif"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{form.is_wave_enabled ? "Le client envoie le paiement, puis confirme. Vous verifiez." : "Activez pour recevoir des paiements Wave manuels."}</p>
          </section>
          <section className={`rounded-lg border p-4 ${form.is_cod_enabled ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Truck size={18} /> Livraison</div>
            <p className={`text-sm font-semibold ${form.is_cod_enabled ? "text-orange-700" : "text-slate-400"}`}>
              {form.is_cod_enabled ? "Actif" : "Inactif"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Le client paie a la reception de la commande.</p>
          </section>
          <section className={`rounded-lg border p-4 ${form.is_whatsapp_enabled ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-900"><MessageCircle size={18} /> WhatsApp</div>
            <p className={`text-sm font-semibold ${form.is_whatsapp_enabled ? "text-green-700" : "text-slate-400"}`}>
              {form.is_whatsapp_enabled ? "Actif" : "Inactif"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Le client peut vous contacter sur WhatsApp apres commande.</p>
          </section>
        </div>
      </div>

      {form.payment_instructions ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-1 text-sm font-bold text-slate-700">Instructions de paiement (visibles par le client) :</p>
          <p className="text-sm text-slate-600">{form.payment_instructions}</p>
        </section>
      ) : null}

      {actionError ? (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Erreur</p>
          <p>{actionError}</p>
          <button onClick={() => setActionError("")} className="mt-1 text-xs font-semibold underline">Fermer</button>
        </div>
      ) : null}

      {saved ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Parametres enregistres avec succes.</p> : null}

      {/* Modal de confirmation paiement */}
      {confirm ? (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          tone={confirm.tone}
          confirmLabel={confirm.confirmLabel}
          loading={actionLoading}
          onConfirm={executePaymentAction}
          onCancel={() => setConfirm(null)}
        />
      ) : null}

      {/* Modal de modification */}
      {modalOpen ? (
        <FormModal title="Parametres de paiement" description="Configurez comment vos clients peuvent vous payer." onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-4">
            {/* Wave number en premier */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <p className="mb-3 flex items-center gap-2 font-bold text-blue-900"><Waves size={18} /> Votre compte Wave</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Numero Wave *
                  <input value={form.wave_phone_number} onChange={(event) => setForm({ ...form, wave_phone_number: event.target.value })} className={inputClass} placeholder="Ex: 0700000000" />
                  <span className="text-xs font-normal text-blue-700">C'est sur ce numero que vos clients enverront les paiements Wave.</span>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Nom du compte Wave
                  <input value={form.wave_account_name} onChange={(event) => setForm({ ...form, wave_account_name: event.target.value })} className={inputClass} placeholder="Nom affiche sur Wave" />
                  <span className="text-xs font-normal text-slate-500">Aide le client a verifier qu'il envoie au bon compte.</span>
                </label>
              </div>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Instructions de paiement (optionnel)
              <textarea value={form.payment_instructions} onChange={(event) => setForm({ ...form, payment_instructions: event.target.value })} rows={2} className={`${inputClass} resize-none`} placeholder="Ex: Envoyez le paiement Wave puis cliquez sur J'ai paye." />
            </label>

            <div>
              <p className="mb-2 text-sm font-bold text-slate-700">Moyens de paiement a proposer aux clients</p>
              <div className="grid gap-2">
                <label className={`flex items-start gap-2 rounded-lg border px-3 py-3 text-sm font-semibold text-slate-700 ${waveAvailable ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                  <input type="checkbox" checked={form.is_wave_checkout_enabled} onChange={(event) => setForm({ ...form, is_wave_checkout_enabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-emerald-600" disabled={!waveAvailable} />
                  <span>
                    <span className="block">Wave Checkout (paiement automatique)</span>
                    {waveAvailable ? (
                      <span className="text-xs font-normal text-emerald-600">Le client paie directement via Wave. La confirmation est automatique via l'API.</span>
                    ) : (
                      <span className="text-xs font-normal text-rose-600">Non disponible — l'administrateur doit configurer l'API Wave sur la plateforme.</span>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_wave_enabled} onChange={(event) => setForm({ ...form, is_wave_enabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-600" />
                  <span>
                    <span className="block">Wave manuel</span>
                    <span className="text-xs font-normal text-blue-700">Le client envoie le paiement sur votre numero Wave, puis confirme. Vous verifiez et validez.</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_cod_enabled} onChange={(event) => setForm({ ...form, is_cod_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
                  Paiement a la livraison
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_whatsapp_enabled} onChange={(event) => setForm({ ...form, is_whatsapp_enabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" />
                  Contact WhatsApp
                </label>
              </div>
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
