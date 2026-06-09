import { useState } from "react";
import { CheckCircle2, Clock, Copy, CreditCard, MessageCircle, Search, Truck } from "lucide-react";
import Button from "../ui/Button";
import { createPublicOrder, createWaveCheckoutSession, markPaymentSent } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildOrderWhatsAppMessage } from "../../utils/whatsappMessage";

const statusLabels = {
  PENDING: "En attente",
  AWAITING_PAYMENT: "En attente de paiement",
  AWAITING_VERIFICATION: "Paiement envoye, en attente de verification",
  PAID: "Paye",
  CONFIRMED: "Confirmee",
  IN_PROGRESS: "En cours",
  READY: "Prete",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  REFUNDED: "Remboursee",
};

const paymentStatusLabels = {
  PENDING: "En attente",
  PROCESSING: "Verification en cours",
  PAID: "Paye",
  FAILED: "Echoue",
  CANCELLED: "Annule",
  REFUNDED: "Rembourse",
};

function parseOptions(optionsJson) {
  if (!optionsJson) return [];
  try {
    return JSON.parse(optionsJson);
  } catch {
    return [];
  }
}

function FieldInput({ field, value, onChange }) {
  const baseClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const options = parseOptions(field.options_json);

  if (field.field_type === "textarea" || field.field_type === "address") {
    return <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} className={`${baseClass} resize-none`} />;
  }

  if (["select", "radio"].includes(field.field_type)) {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={baseClass}>
        <option value="">Choisir</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const current = value ? String(value).split(",").map((item) => item.trim()) : [];
          const checked = current.includes(option);
          return (
            <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...current, option]
                    : current.filter((item) => item !== option);
                  onChange(next.join(", "));
                }}
                className="h-4 w-4 accent-emerald-600"
              />
              {option}
            </label>
          );
        })}
      </div>
    );
  }

  const typeMap = {
    number: "number",
    phone: "tel",
    email: "email",
    date: "date",
    time: "time",
    file: "text",
  };

  return (
    <input
      type={typeMap[field.field_type] || "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={baseClass}
      placeholder={field.field_type === "file" ? "Lien du fichier ou reference" : ""}
    />
  );
}

export default function CheckoutModal({ business, product, slug, onClose }) {
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [fieldValues, setFieldValues] = useState({});
  const settings = business.paymentSettings || {};
  const defaultPaymentMethod = settings.is_wave_checkout_enabled
    ? "wave_checkout"
    : settings.is_wave_enabled
      ? "wave"
      : settings.is_cod_enabled
        ? "cod"
        : "whatsapp";
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fields = product.customFields || [];

  function updateField(fieldId, value) {
    setFieldValues((current) => ({ ...current, [fieldId]: value }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await createPublicOrder(slug, {
        product_id: product.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        payment_method: paymentMethod,
        field_values: fieldValues,
      });
      setCreatedOrder(data.order);
      if (paymentMethod === "wave_checkout") {
        const checkout = await createWaveCheckoutSession(data.order.id, {
          customer_phone: customer.phone,
        });
        window.location.href = checkout.checkout.wave_launch_url;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Creation de commande ou paiement Wave impossible.");
    } finally {
      setLoading(false);
    }
  }

  const [paymentSentLoading, setPaymentSentLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function confirmPaymentSent() {
    setPaymentSentLoading(true);
    setError("");
    try {
      const data = await markPaymentSent(createdOrder.id, { customer_phone: customer.phone });
      setCreatedOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de confirmer le paiement.");
    } finally {
      setPaymentSentLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const whatsappLink = createdOrder ? buildOrderWhatsAppMessage({ business, order: createdOrder }) : "#";
  const paymentLabel = {
    wave_checkout: "Wave Checkout (automatique)",
    wave: "Wave manuel",
    cod: "Paiement a la livraison",
    whatsapp: "WhatsApp",
  }[createdOrder?.payment_method] || createdOrder?.payment_method || "Non definie";

  const isPaymentVerifying = createdOrder?.payment_status === "PROCESSING";
  const isPaymentDone = createdOrder?.payment_status === "PAID";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Commande</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{product.name}</h2>
              <p className="mt-1 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
            </div>
            <Button tone="ghost" onClick={onClose}>Fermer</Button>
          </div>
        </div>

        {!createdOrder ? (
          <form onSubmit={submitOrder} className="space-y-5 p-5">
            <section>
              <h3 className="mb-3 font-bold text-slate-900">Client</h3>
              <div className="grid gap-3">
                <input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Nom" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="Telephone" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="Email optionnel" className="rounded-lg border border-slate-300 px-3 py-2" />
              </div>
            </section>

            {fields.length ? (
              <section>
                <h3 className="mb-3 font-bold text-slate-900">Details</h3>
                <div className="grid gap-3">
                  {fields.map((field) => (
                    <label key={field.id} className="grid gap-1 text-sm font-semibold text-slate-700">
                      {field.label} {field.is_required ? <span className="text-rose-600">*</span> : null}
                      <FieldInput field={field} value={fieldValues[field.id] || ""} onChange={(value) => updateField(field.id, value)} />
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h3 className="mb-3 font-bold text-slate-900">Paiement</h3>
              <div className="grid gap-2">
                {settings.is_wave_checkout_enabled ? (
                  <label className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
                    <span>
                      <span className="block font-semibold text-slate-900">Payer maintenant avec Wave</span>
                      <span className="text-xs text-slate-600">Paiement securise, confirmation automatique.</span>
                    </span>
                    <input type="radio" checked={paymentMethod === "wave_checkout"} onChange={() => setPaymentMethod("wave_checkout")} className="h-4 w-4 accent-emerald-600" />
                  </label>
                ) : null}
                {settings.is_wave_enabled ? (
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
                    <span className="font-semibold">Wave manuel</span>
                    <input type="radio" checked={paymentMethod === "wave"} onChange={() => setPaymentMethod("wave")} className="h-4 w-4 accent-emerald-600" />
                  </label>
                ) : null}
                {settings.is_cod_enabled ? (
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
                    <span className="font-semibold">Paiement a la livraison</span>
                    <input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="h-4 w-4 accent-emerald-600" />
                  </label>
                ) : null}
                {settings.is_whatsapp_enabled !== false ? (
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
                    <span className="font-semibold">Contacter sur WhatsApp</span>
                    <input type="radio" checked={paymentMethod === "whatsapp"} onChange={() => setPaymentMethod("whatsapp")} className="h-4 w-4 accent-emerald-600" />
                  </label>
                ) : null}
              </div>
            </section>

            {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              Creer la commande
            </Button>
          </form>
        ) : (
          <div className="space-y-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={22} />
                <div>
                  <p className="font-bold text-emerald-900">Commande #{createdOrder.id} recue !</p>
                  <p className="text-sm text-emerald-800">Le commercant a ete notifie.</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                <span className="font-semibold text-slate-800">Produit</span>
                <span>{createdOrder.product?.name || product.name}</span>
                <span className="font-semibold text-slate-800">Montant</span>
                <span className="font-bold text-emerald-700">{fmt(createdOrder.total_amount)} FCFA</span>
                <span className="font-semibold text-slate-800">Methode</span>
                <span>{paymentLabel}</span>
                <span className="font-semibold text-slate-800">Paiement</span>
                <span className={isPaymentDone ? "font-semibold text-emerald-700" : isPaymentVerifying ? "font-semibold text-amber-600" : "text-slate-600"}>
                  {paymentStatusLabels[createdOrder.payment_status] || createdOrder.payment_status}
                </span>
                <span className="font-semibold text-slate-800">Commande</span>
                <span>{statusLabels[createdOrder.status] || createdOrder.status}</span>
              </div>
            </div>

            {createdOrder.payment_method === "wave" && !isPaymentVerifying && !isPaymentDone ? (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <p className="flex items-center gap-2 text-lg font-bold text-blue-900">
                  <CreditCard size={20} /> Comment payer avec Wave
                </p>

                <ol className="mt-3 space-y-3 text-sm text-blue-900">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">1</span>
                    <span>Ouvrez l'application <strong>Wave</strong> sur votre telephone</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">2</span>
                    <div>
                      <span>Envoyez <strong>{fmt(createdOrder.total_amount)} FCFA</strong> au numero :</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold text-blue-950">{settings.wave_phone_number || "Non renseigne"}</span>
                        {settings.wave_phone_number ? (
                          <button onClick={() => copyToClipboard(settings.wave_phone_number)} className="rounded-lg bg-white p-2 text-blue-600 transition hover:bg-blue-100" title="Copier le numero">
                            <Copy size={16} />
                          </button>
                        ) : null}
                        {copied ? <span className="text-xs font-semibold text-emerald-600">Copie !</span> : null}
                      </div>
                      {settings.wave_account_name ? <p className="mt-1 text-xs text-blue-700">Nom du compte : <strong>{settings.wave_account_name}</strong></p> : null}
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">3</span>
                    <span>Une fois le paiement envoye, revenez ici et cliquez sur <strong>"J'ai envoye le paiement"</strong></span>
                  </li>
                </ol>

                {settings.payment_instructions ? (
                  <div className="mt-3 rounded-lg bg-white p-3 text-sm text-blue-800">
                    <p className="font-semibold">Instructions du commercant :</p>
                    <p className="mt-1">{settings.payment_instructions}</p>
                  </div>
                ) : null}

                {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

                <Button className="mt-4 w-full py-3" onClick={confirmPaymentSent} disabled={paymentSentLoading}>
                  {paymentSentLoading ? "Envoi en cours..." : "J'ai envoye le paiement"}
                </Button>
              </div>
            ) : null}

            {createdOrder.payment_method === "wave" && isPaymentVerifying ? (
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 shrink-0 text-amber-600" size={22} />
                  <div>
                    <p className="font-bold text-amber-900">Paiement envoye !</p>
                    <p className="mt-1 text-sm text-amber-800">Le commercant va verifier votre paiement Wave et confirmer votre commande. Vous recevrez une notification.</p>
                    <p className="mt-2 text-sm text-amber-700">Conservez votre numero de commande : <strong>#{createdOrder.id}</strong></p>
                  </div>
                </div>
              </div>
            ) : null}

            {createdOrder.payment_method === "wave" && isPaymentDone ? (
              <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} />
                  <div>
                    <p className="font-bold text-emerald-900">Paiement confirme !</p>
                    <p className="mt-1 text-sm text-emerald-800">Votre paiement a ete valide par le commercant.</p>
                  </div>
                </div>
              </div>
            ) : null}

            {createdOrder.payment_method === "wave_checkout" ? (
              <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 font-bold text-emerald-950"><CreditCard size={18} /> Paiement Wave Checkout</p>
                <p className="mt-1 text-sm text-emerald-800">Vous allez etre redirige vers Wave pour finaliser le paiement securise.</p>
                {createdOrder.wave_launch_url ? (
                  <a href={createdOrder.wave_launch_url}>
                    <Button className="mt-3 w-full py-3">Payer avec Wave maintenant</Button>
                  </a>
                ) : null}
              </div>
            ) : null}

            {createdOrder.payment_method === "cod" ? (
              <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 font-bold text-slate-900"><Truck size={18} /> Paiement a la livraison</p>
                <p className="mt-1 text-sm text-slate-600">Vous payerez <strong>{fmt(createdOrder.total_amount)} FCFA</strong> au livreur quand vous recevrez votre commande.</p>
                <p className="mt-2 text-sm text-slate-500">Le commercant va confirmer votre commande et organiser la livraison.</p>
              </div>
            ) : null}

            <div className="space-y-2 pt-2">
              {settings.is_whatsapp_enabled !== false ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <Button className="w-full">
                    <MessageCircle size={18} />
                    Contacter le commercant sur WhatsApp
                  </Button>
                </a>
              ) : null}
              <a href="/suivi-commande">
                <Button tone="secondary" className="w-full">
                  <Search size={16} />
                  Suivre ma commande
                </Button>
              </a>
              <Button tone="ghost" className="w-full" onClick={onClose}>Retour a la boutique</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
