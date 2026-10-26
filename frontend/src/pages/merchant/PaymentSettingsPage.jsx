import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, MessageCircle, Settings2, Truck, Wallet, Waves, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import Input, { Textarea } from "../../components/ui/Input";
import { Avatar, CardGrid, PageHeader, StatusPill, SummaryStrip } from "../../components/ui/PageKit";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { me } from "../../services/authService";
import { getPaymentSettings, getWaveStatus, updatePaymentSettings } from "../../services/paymentSettingsService";
import { listOrdersByBusiness, updateOrderStatus } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildCustomerWhatsAppLink } from "../../utils/whatsappMessage";

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

  const methods = [
    {
      key: "is_wave_checkout_enabled",
      icon: CreditCard,
      tone: "bg-sky-50 text-sky-600",
      title: "Wave Checkout",
      on: form.is_wave_checkout_enabled,
      detail: form.is_wave_checkout_enabled
        ? "Le client paie directement via Wave. Confirmation automatique."
        : waveAvailable ? "Disponible : activez-le dans les parametres." : "Non disponible sur la plateforme.",
    },
    {
      key: "is_wave_enabled",
      icon: Waves,
      tone: "bg-blue-50 text-blue-600",
      title: "Wave manuel",
      on: form.is_wave_enabled,
      detail: form.is_wave_enabled
        ? `Paiement sur ${form.wave_phone_number || "numero manquant"}, puis vous verifiez.`
        : "Le client envoie le paiement sur votre numero Wave.",
    },
    {
      key: "is_cod_enabled",
      icon: Truck,
      tone: "bg-amber-50 text-amber-600",
      title: "Paiement a la livraison",
      on: form.is_cod_enabled,
      detail: "Le client paie a la reception de la commande.",
    },
    {
      key: "is_whatsapp_enabled",
      icon: MessageCircle,
      tone: "bg-whatsapp-light text-green-700",
      title: "WhatsApp",
      on: form.is_whatsapp_enabled,
      detail: "Le client peut vous contacter sur WhatsApp apres commande.",
    },
  ];
  const activeCount = methods.filter((m) => m.on).length;
  const pendingTotal = pendingOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        description="Gerez vos moyens de paiement et verifiez les paiements recus."
        actions={<Button onClick={() => setModalOpen(true)}><Settings2 size={16} /> Modifier les parametres</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Moyens actifs", value: `${activeCount} / ${methods.length}`, icon: Wallet },
          { label: "Paiements a verifier", value: pendingOrders.length, icon: AlertCircle, tone: pendingOrders.length ? "warning" : "success" },
          { label: "Montant a verifier", value: `${fmt(pendingTotal)} FCFA`, icon: CreditCard, tone: "info" },
          { label: "Numero Wave", value: hasWaveNumber ? form.wave_phone_number : "Non configure", icon: Waves, tone: hasWaveNumber ? "success" : "danger" },
        ]}
      />

      {saved ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Parametres enregistres avec succes.</p> : null}

      {actionError ? (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p><span className="font-semibold">Erreur : </span>{actionError}</p>
          <button onClick={() => setActionError("")} className="text-xs font-semibold underline">Fermer</button>
        </div>
      ) : null}

      {/* Paiements a verifier */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-ink-900">Paiements a verifier</h2>
            <StatusPill tone={pendingOrders.length ? "warning" : "success"}>{pendingOrders.length ? `${pendingOrders.length} en attente` : "A jour"}</StatusPill>
          </div>
          {waveActive ? <p className="text-xs text-ink-500">Verifiez la reception sur votre compte Wave avant de confirmer.</p> : null}
        </div>
        {pendingOrders.length ? (
          <ul className="divide-y divide-surface-border">
            {pendingOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-4 p-4 lg:flex-nowrap">
                <Avatar name={order.customer_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">Commande #{order.id} · {order.product?.name}</p>
                  <p className="truncate text-sm text-ink-500">{order.customer_name} · {order.customer_phone}</p>
                  <p className="text-xs text-ink-400">
                    {order.payment_method === "wave_checkout" ? "Wave Checkout" : order.payment_method === "wave" ? "Wave manuel" : order.payment_method}
                    {order.payment_proof_reference ? ` · Ref. ${order.payment_proof_reference}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-ink-900">{fmt(order.total_amount)} <span className="text-xs font-semibold text-ink-500">FCFA</span></p>
                  <StatusPill tone="warning">Le client dit avoir paye</StatusPill>
                </div>
                <div className="flex w-full items-center gap-2 lg:w-auto">
                  <Button size="sm" onClick={() => askConfirmPayment(order)}><CheckCircle2 size={14} /> Confirmer</Button>
                  <Button size="sm" tone="dangerSoft" onClick={() => askRejectPayment(order)}><XCircle size={14} /> Rejeter</Button>
                  <a href={buildCustomerWhatsAppLink(order)} target="_blank" rel="noreferrer" aria-label={`Contacter ${order.customer_name} sur WhatsApp`} title="Contacter sur WhatsApp" className="grid h-9 w-9 place-items-center rounded-xl border border-surface-border bg-white text-green-700 hover:bg-whatsapp-light">
                    <MessageCircle size={16} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 px-5 py-6 text-sm text-ink-600">
            <CheckCircle2 size={20} className="text-emerald-600" />
            Aucun paiement en attente de verification.
          </div>
        )}
      </section>

      {/* Moyens de paiement */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-ink-900">Moyens de paiement proposes</h2>
          <Button tone="ghost" size="sm" onClick={() => setModalOpen(true)}>Modifier</Button>
        </div>
        <CardGrid cols={4}>
          {methods.map(({ key, icon: Icon, tone, title, on, detail }) => (
            <article key={key} className={`card flex flex-col gap-3 p-5 ${on ? "ring-1 ring-emerald-200" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
                <StatusPill tone={on ? "success" : "neutral"}>{on ? "Active" : "Inactive"}</StatusPill>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink-900">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{detail}</p>
              </div>
            </article>
          ))}
        </CardGrid>
      </section>

      {/* Compte Wave + instructions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card flex items-start gap-4 p-5">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${hasWaveNumber ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}><Waves size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-bold text-ink-900">Compte Wave</h2>
              <StatusPill tone={hasWaveNumber ? "success" : "warning"}>{hasWaveNumber ? "Configure" : "A configurer"}</StatusPill>
            </div>
            {hasWaveNumber ? (
              <>
                <p className="mt-2 font-mono text-xl font-bold text-ink-900">{form.wave_phone_number}</p>
                {form.wave_account_name ? <p className="text-sm text-ink-500">Compte : {form.wave_account_name}</p> : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-500">Ajoutez votre numero Wave pour recevoir les paiements de vos clients.</p>
            )}
          </div>
          <Button tone="secondary" size="sm" onClick={() => setModalOpen(true)}>{hasWaveNumber ? "Modifier" : "Ajouter"}</Button>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-base font-bold text-ink-900">Instructions pour le client</h2>
          <p className="mt-2 text-sm text-ink-600">{form.payment_instructions || "Aucune instruction. Ajoutez-en pour guider vos clients au moment du paiement."}</p>
        </section>
      </div>

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

      {modalOpen ? (
        <FormModal title="Parametres de paiement" description="Configurez comment vos clients peuvent vous payer." onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="mb-3 flex items-center gap-2 font-bold text-blue-900"><Waves size={18} /> Votre compte Wave</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input label="Numero Wave *" placeholder="Ex: 0700000000" {...field("wave_phone_number")} />
                  <p className="mt-1 text-xs text-blue-700">Vos clients enverront les paiements Wave sur ce numero.</p>
                </div>
                <div>
                  <Input label="Nom du compte Wave" placeholder="Nom affiche sur Wave" {...field("wave_account_name")} />
                  <p className="mt-1 text-xs text-ink-500">Aide le client a verifier qu'il envoie au bon compte.</p>
                </div>
              </div>
            </div>

            <Textarea label="Instructions de paiement (optionnel)" rows={2} placeholder="Ex: Envoyez le paiement Wave puis cliquez sur J'ai paye." {...field("payment_instructions")} />

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Moyens de paiement a proposer aux clients</p>
              <div className="grid gap-2">
                <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-ink-700 ${waveAvailable ? "border-surface-border" : "border-surface-border bg-surface opacity-60"}`}>
                  <input type="checkbox" checked={form.is_wave_checkout_enabled} onChange={(event) => setForm({ ...form, is_wave_checkout_enabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-500" disabled={!waveAvailable} />
                  <span>
                    <span className="block">Wave Checkout (paiement automatique)</span>
                    {waveAvailable ? (
                      <span className="text-xs font-normal text-ink-500">Le client paie directement via Wave. Confirmation automatique via l'API.</span>
                    ) : (
                      <span className="text-xs font-normal text-rose-600">Non disponible : l'administrateur doit configurer l'API Wave.</span>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                  <input type="checkbox" checked={form.is_wave_enabled} onChange={(event) => setForm({ ...form, is_wave_enabled: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-500" />
                  <span>
                    <span className="block">Wave manuel</span>
                    <span className="text-xs font-normal text-ink-500">Le client envoie le paiement sur votre numero, puis confirme. Vous verifiez et validez.</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                  <input type="checkbox" checked={form.is_cod_enabled} onChange={(event) => setForm({ ...form, is_cod_enabled: event.target.checked })} className="h-4 w-4 accent-brand-500" />
                  Paiement a la livraison
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                  <input type="checkbox" checked={form.is_whatsapp_enabled} onChange={(event) => setForm({ ...form, is_whatsapp_enabled: event.target.checked })} className="h-4 w-4 accent-brand-500" />
                  Contact WhatsApp
                </label>
              </div>
            </div>

            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
