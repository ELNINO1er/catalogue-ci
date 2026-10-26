import { useEffect, useState } from "react";
import { Check, CheckCheck, Copy, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input, { Textarea } from "../../components/ui/Input";
import { CardGrid, PageHeader, StatusPill } from "../../components/ui/PageKit";
import { getMerchantDashboard } from "../../services/merchantService";

const defaultTemplate = "Bonjour {customer_name}, votre commande {product_name} chez {business_name} a ete recue. Montant : {price} FCFA.";

// Modeles prets a l'emploi ; un clic les charge dans l'editeur.
const PRESETS = [
  { key: "received", type: "Confirmation", tone: "info", title: "Commande recue", text: defaultTemplate },
  { key: "paid", type: "Paiement", tone: "success", title: "Paiement recu", text: "Bonjour {customer_name}, nous avons bien recu votre paiement de {price} FCFA pour la commande {order_number}. Merci !" },
  { key: "ready", type: "Livraison", tone: "warning", title: "Commande prete", text: "Bonjour {customer_name}, votre commande {order_number} ({product_name}) est prete. {business_name} vous remercie." },
  { key: "thanks", type: "Fidelisation", tone: "brand", title: "Remerciement", text: "Merci {customer_name} pour votre confiance ! A tres bientot chez {business_name}." },
];

const VARIABLES = ["{customer_name}", "{product_name}", "{business_name}", "{price}", "{order_number}"];

export default function MerchantMessagesPage() {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({
    customer_name: "Jean",
    product_name: "Flyer professionnel",
    price: "5 000",
    order_number: "CMD-001",
    message: defaultTemplate,
  });

  useEffect(() => {
    getMerchantDashboard().then((data) => setBusiness(data.business)).catch(() => {});
  }, []);

  function fill(text) {
    return text
      .replaceAll("{customer_name}", form.customer_name)
      .replaceAll("{product_name}", form.product_name)
      .replaceAll("{business_name}", business?.name || "Votre boutique")
      .replaceAll("{price}", form.price)
      .replaceAll("{order_number}", form.order_number);
  }

  const generated = fill(form.message);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(generated);
      toast.success("Message copie !");
    } catch {
      toast.error("Copie impossible.");
    }
  }

  function insertVariable(variable) {
    setForm((current) => ({ ...current, message: `${current.message}${current.message.endsWith(" ") ? "" : " "}${variable}` }));
  }

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages WhatsApp"
        description="Preparez des messages reutilisables avec variables pour vos clients."
        actions={(
          <>
            <Button tone="secondary" onClick={copyMessage}><Copy size={16} /> Copier</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(generated)}`} target="_blank" rel="noreferrer">
              <Button tone="whatsapp"><MessageCircle size={16} /> Ouvrir WhatsApp</Button>
            </a>
          </>
        )}
      />

      <section>
        <h2 className="mb-3 font-display text-base font-bold text-ink-900">Modeles</h2>
        <CardGrid cols={4}>
          {PRESETS.map((preset) => {
            const active = form.message === preset.text;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setForm({ ...form, message: preset.text })}
                aria-pressed={active}
                className={`card-hover flex flex-col gap-3 p-4 text-left ${active ? "ring-2 ring-brand-400" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-ink-900">{preset.title}</span>
                  <StatusPill tone={preset.tone}>{preset.type}</StatusPill>
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-ink-500">{fill(preset.text)}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                  {active ? <><Check size={12} /> Utilise</> : "Utiliser ce modele"}
                </span>
              </button>
            );
          })}
        </CardGrid>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <section className="card space-y-5 p-5">
          <h2 className="font-display text-base font-bold text-ink-900">Modifier le message</h2>
          <Textarea label="Texte du message" rows={6} {...field("message")} />
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-500">Inserer une variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="rounded-lg border border-surface-border bg-surface px-2 py-1 font-mono text-xs text-ink-700 hover:border-brand-300 hover:text-brand-700"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 border-t border-surface-border pt-4 sm:grid-cols-2">
            <Input label="Client (exemple)" {...field("customer_name")} />
            <Input label="Produit (exemple)" {...field("product_name")} />
            <Input label="Prix (exemple)" {...field("price")} />
            <Input label="Commande (exemple)" {...field("order_number")} />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-bold">{(form.customer_name || "?")[0].toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{form.customer_name || "Client"}</p>
              <p className="text-xs text-white/70">Apercu WhatsApp</p>
            </div>
          </div>
          <div className="min-h-64 bg-[#ECE5DD] p-4">
            <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 text-sm leading-6 text-ink-900 shadow-sm">
              <p className="whitespace-pre-wrap break-words">{generated}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-2xs text-ink-500">{time} <CheckCheck size={12} className="text-sky-500" aria-hidden="true" /></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
