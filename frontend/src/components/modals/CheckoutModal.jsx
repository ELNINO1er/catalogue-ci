import { useState } from "react";
import { MessageCircle } from "lucide-react";
import Button from "../ui/Button";
import { createPublicOrder, markPaymentSent } from "../../services/orderService";
import { fmt } from "../../utils/formatters";
import { buildOrderWhatsAppMessage } from "../../utils/whatsappMessage";

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
  const [paymentMethod, setPaymentMethod] = useState(business.paymentSettings?.is_wave_enabled ? "wave" : "whatsapp");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fields = product.customFields || [];
  const settings = business.paymentSettings || {};

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
    } catch (err) {
      setError(err.response?.data?.message || "Creation de commande impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPaymentSent() {
    const data = await markPaymentSent(createdOrder.id);
    setCreatedOrder(data.order);
  }

  const whatsappLink = createdOrder ? buildOrderWhatsAppMessage({ business, order: createdOrder }) : "#";

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
                {settings.is_wave_enabled ? (
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
                    <span className="font-semibold">Payer avec Wave</span>
                    <input type="radio" checked={paymentMethod === "wave"} onChange={() => setPaymentMethod("wave")} className="h-4 w-4 accent-emerald-600" />
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
              <p className="font-bold text-emerald-900">Commande #{createdOrder.id} creee</p>
              <p className="text-sm text-emerald-800">Montant exact : {fmt(createdOrder.total_amount)} FCFA</p>
            </div>

            {settings.is_wave_enabled ? (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="font-bold text-slate-900">Payer avec Wave</p>
                <p className="mt-1 text-sm text-slate-600">Envoyez le paiement sur le numero Wave du commercant : <strong>{settings.wave_phone_number || "A renseigner"}</strong></p>
                <p className="text-sm text-slate-600">Montant : <strong>{fmt(createdOrder.total_amount)} FCFA</strong></p>
                <Button className="mt-3" onClick={confirmPaymentSent}>J'ai paye</Button>
              </div>
            ) : null}

            {settings.is_whatsapp_enabled !== false ? (
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <Button className="w-full">
                  <MessageCircle size={18} />
                  Contacter sur WhatsApp
                </Button>
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
