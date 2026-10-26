import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Clock, Copy, CreditCard,
  Eye, Globe, Loader2, Lock, MessageCircle, Package, Palette, Phone,
  Plus, Rocket, Save, ShoppingBag, Smartphone, Sparkles, Store, Truck, Users, X, Zap,
} from "lucide-react";
import { Brush, Logo, Sparkle } from "../landing/Doodles";
import Storefront from "../../components/shop/Storefront";
import { QRCodeCanvas } from "qrcode.react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Input, { Select } from "../../components/ui/Input";
import ImageUpload from "../../components/ui/ImageUpload";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { getOnboardingData, saveOnboardingStep, completeOnboarding, createQuickProducts, uploadBusinessImage, uploadOnboardingProductImage } from "../../services/onboardingService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";
import toast, { Toaster } from "react-hot-toast";

const STEPS = [
  { id: 1, label: "Bienvenue", icon: Sparkles },
  { id: 2, label: "Boutique", icon: Store, title: "Votre boutique", desc: "Les informations de base de votre commerce." },
  { id: 3, label: "Activite", icon: ShoppingBag, title: "Type d'activite", desc: "Quel type de boutique voulez-vous creer ?" },
  { id: 4, label: "Contact", icon: Phone, title: "Contact et localisation", desc: "Comment vos clients vous contactent." },
  { id: 5, label: "Paiement", icon: CreditCard, title: "Moyens de paiement", desc: "Comment vos clients vous paient." },
  { id: 6, label: "Design", icon: Palette, title: "Design de votre boutique", desc: "Choisissez les couleurs, la police et le style." },
  { id: 7, label: "Messages", icon: MessageCircle, title: "Messages automatiques", desc: "Personnalisez les messages envoyes a vos clients." },
  { id: 8, label: "Produits", icon: Package, title: "Premiers produits", desc: "Ajoutez vos premiers produits ou services (vous pourrez en ajouter plus tard)." },
  { id: 9, label: "Apercu", icon: Eye, title: "Apercu de votre boutique", desc: "Voici a quoi ressemblera votre boutique pour vos clients." },
  { id: 10, label: "Publication", icon: Rocket },
];
const TOTAL = STEPS.length;
const MESSAGE_VARIABLES = ["{customer_name}", "{product_name}", "{business_name}", "{price}", "{order_number}"];

const BUSINESS_TYPES = [
  { value: "products", label: "Je vends des produits physiques", icon: ShoppingBag },
  { value: "services", label: "Je propose des services", icon: Users },
  { value: "digital", label: "Je vends des abonnements digitaux", icon: Smartphone },
  { value: "restaurant", label: "Je fais de la restauration", icon: Store },
  { value: "reservation", label: "Je fais de la reservation", icon: Clock },
  { value: "creative", label: "Je propose des creations personnalisees", icon: Palette },
  { value: "multi", label: "Je fais plusieurs activites", icon: Zap },
];

const COLOR_PRESETS = [
  { name: "Bleu professionnel", value: "#272C68" },
  { name: "Vert WhatsApp", value: "#25D366" },
  { name: "Orange commerce", value: "#F97316" },
  { name: "Violet premium", value: "#7C3AED" },
  { name: "Noir luxe", value: "#1A1A2E" },
  { name: "Rose beaute", value: "#EC4899" },
  { name: "Rouge restaurant", value: "#DC2626" },
  { name: "Or accent", value: "#D4A017" },
];

const FONTS = ["Inter", "Poppins", "Nunito Sans", "Montserrat", "Roboto", "Playfair Display", "Merriweather"];

const DEFAULT_MESSAGES = [
  { type: "order_received", title: "Commande recue", content: "Bonjour {customer_name}, votre commande #{order_number} pour {product_name} chez {business_name} a ete recue. Montant : {price} FCFA." },
  { type: "payment_sent", title: "Paiement envoye", content: "Merci {customer_name} ! Nous avons bien recu votre paiement pour la commande #{order_number}. Nous verifions et confirmons rapidement." },
  { type: "order_confirmed", title: "Commande confirmee", content: "Bonne nouvelle {customer_name} ! Votre commande #{order_number} chez {business_name} est confirmee. Nous preparons {product_name}." },
  { type: "order_delivered", title: "Commande livree", content: "{customer_name}, votre commande #{order_number} a ete livree ! Merci pour votre confiance. A bientot chez {business_name} !" },
  { type: "payment_reminder", title: "Relance paiement", content: "Bonjour {customer_name}, votre commande #{order_number} de {price} FCFA est en attente de paiement. Envoyez le paiement pour confirmer." },
];

function getSuggestedFields(type) {
  const map = {
    restaurant: [
      { label: "Quantite", field_type: "number", is_required: true },
      { label: "Adresse de livraison", field_type: "address", is_required: true },
      { label: "Piment / Sans piment", field_type: "select", options: ["Avec piment", "Sans piment", "Piment a cote"] },
      { label: "Heure souhaitee", field_type: "time" },
    ],
    creative: [
      { label: "Nom de l'evenement", field_type: "text", is_required: true },
      { label: "Texte a mettre", field_type: "textarea", is_required: true },
      { label: "Couleurs preferees", field_type: "text" },
      { label: "Logo ou image (lien)", field_type: "text" },
    ],
    digital: [
      { label: "Email client", field_type: "email", is_required: true },
      { label: "Type d'abonnement", field_type: "select", options: ["1 mois", "3 mois", "6 mois", "12 mois"] },
      { label: "Numero WhatsApp", field_type: "phone", is_required: true },
    ],
    products: [
      { label: "Taille", field_type: "select", options: ["S", "M", "L", "XL", "XXL"] },
      { label: "Couleur", field_type: "text" },
      { label: "Quantite", field_type: "number", is_required: true },
      { label: "Adresse de livraison", field_type: "address", is_required: true },
    ],
  };
  return map[type] || [{ label: "Quantite", field_type: "number", is_required: true }];
}

/* ═══════════════ HABILLAGE ═══════════════ */
// Barre d'etapes : points relies par une ligne qui se remplit, libelles visibles sur grand ecran.
function Stepper({ step, maxReachable, onSelect }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 right-3.5 top-3.5 h-0.5 rounded-full bg-surface-border" />
      <div
        className="absolute left-3.5 right-3.5 top-3.5 h-0.5 origin-left rounded-full bg-brand-500 transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${(step - 1) / (TOTAL - 1)})` }}
      />
      <ol className="relative flex justify-between">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          const reachable = s.id <= maxReachable;
          return (
            <li key={s.id} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => reachable && onSelect(s.id)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                aria-label={`Etape ${s.id} : ${s.label}`}
                title={s.label}
                className={`relative grid h-7 w-7 place-items-center rounded-full transition-all duration-300 disabled:cursor-default ${
                  active
                    ? "scale-110 bg-ink-900 text-white ring-4 ring-brand-100"
                    : done
                      ? "bg-brand-500 text-white hover:scale-110"
                      : "bg-white text-ink-300 ring-1 ring-surface-border enabled:hover:text-ink-600"
                }`}
              >
                {active ? <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" /> : null}
                {done ? <Check size={13} strokeWidth={3} className="animate-pop-in" /> : <Icon size={13} />}
              </button>
              <span className={`mt-2 hidden text-[0.7rem] font-medium transition-colors lg:block ${active ? "text-ink-900" : done ? "text-brand-600" : "text-ink-400"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeader({ step }) {
  const s = STEPS[step - 1];
  const Icon = s.icon;
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="seq-pop grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white shadow-[0_10px_24px_-8px_rgba(247,103,7,0.65)]">
        <Icon size={22} />
      </span>
      <div className="seq" style={{ "--d": "80ms" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Etape {step} sur {TOTAL}</p>
        <h1 className="mt-1 text-[1.7rem] font-bold leading-tight text-ink-900 sm:text-3xl">{s.title}</h1>
        <p className="mt-1 text-ink-500">{s.desc}</p>
      </div>
    </div>
  );
}

// Telephone qui affiche la boutique en direct pendant la saisie.
function PhonePreview({ biz, payment, products, categoryName }) {
  const primary = biz.primary_color || "#272C68";
  const button = biz.button_color || primary;
  const dark = biz.theme_mode === "dark";
  const cardBg = dark ? "#1F2937" : "#FFFFFF";
  const textColor = dark ? "#F9FAFB" : biz.text_color || "#1A1A2E";
  const shown = products.slice(0, 4);

  return (
    <div className="mx-auto w-[17rem]">
      <div className="rounded-[2.6rem] bg-ink-900 p-2.5 shadow-modal">
        <div
          // Hauteur adaptee a la fenetre : le telephone ne passe jamais sous la barre de navigation
          className="relative h-[clamp(24rem,calc(100vh-18.5rem),33rem)] overflow-hidden rounded-[2.1rem] transition-colors duration-500"
          style={{ backgroundColor: dark ? "#111827" : biz.background_color || "#F8F9FC", fontFamily: biz.font_family || "Inter" }}
        >
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
          <div className="relative px-4 pb-5 pt-10 text-white transition-colors duration-500" style={{ backgroundColor: primary }}>
            {biz.banner_url ? <img src={mediaUrl(biz.banner_url)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /> : null}
            <div className="relative flex items-center gap-3">
              {biz.logo_url
                ? <img src={mediaUrl(biz.logo_url)} alt="" className="h-11 w-11 rounded-xl border-2 border-white/30 bg-white object-cover" />
                : <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20"><Store size={18} /></span>}
              <div className="min-w-0">
                <p className="truncate text-[0.65rem] text-white/70">{categoryName || "Commerce"}{biz.commune ? ` · ${biz.commune}` : ""}</p>
                <p className="truncate font-bold">{biz.name || "Nom de votre boutique"}</p>
              </div>
            </div>
            {biz.description ? <p className="relative mt-2 line-clamp-2 text-[0.7rem] leading-snug text-white/85">{biz.description}</p> : null}
          </div>

          <div className="flex gap-1.5 px-3 py-2.5">
            <span className="flex items-center gap-1 rounded-full bg-whatsapp px-2.5 py-1 text-[0.65rem] font-semibold text-white"><MessageCircle size={11} /> WhatsApp</span>
            {biz.phone_number ? <span className="flex items-center gap-1 rounded-full border border-surface-border bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-ink-600"><Phone size={11} /> Appeler</span> : null}
          </div>

          <div className={`px-3 ${biz.display_style === "list" ? "space-y-2" : "grid grid-cols-2 gap-2"}`}>
            {(shown.length ? shown : [{ name: "Votre produit" }, { name: "Votre produit" }]).map((p, i) => (
              <div
                key={p.id || `draft-${i}`}
                className={`animate-fade-in rounded-xl p-2 shadow-card ${biz.display_style === "list" ? "flex items-center gap-2" : ""}`}
                style={{ backgroundColor: cardBg }}
              >
                {p.image_url
                  ? <img src={mediaUrl(p.image_url)} alt="" className={`rounded-lg object-cover ${biz.display_style === "list" ? "h-12 w-12" : "mb-1.5 h-16 w-full"}`} />
                  : <div className={`grid place-items-center rounded-lg bg-black/5 text-ink-300 ${biz.display_style === "list" ? "h-12 w-12 shrink-0" : "mb-1.5 h-16"}`}><ShoppingBag size={16} /></div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.7rem] font-semibold" style={{ color: textColor }}>{p.name}</p>
                  <p className="text-[0.7rem] font-bold" style={{ color: primary }}>{p.price ? `${fmt(p.price)} F` : "— F"}</p>
                  <span className="mt-1 block rounded-md py-1 text-center text-[0.6rem] font-semibold text-white transition-colors duration-500" style={{ backgroundColor: button }}>Commander</span>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1">
            {payment.is_wave_enabled ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[0.6rem] font-semibold text-sky-700">Wave</span> : null}
            {payment.is_cod_enabled ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-700">A la livraison</span> : null}
            {payment.is_whatsapp_enabled ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700">WhatsApp</span> : null}
          </div>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-ink-500">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
        Apercu en direct
      </p>
    </div>
  );
}

// Bloc titre + aide pour l'etape Design.
function DesignBlock({ title, hint, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {hint ? <p className="text-xs text-ink-400">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// Pastilles de couleur : la couleur choisie grossit et affiche une coche.
function Swatches({ label, value, onChange }) {
  const custom = value && !COLOR_PRESETS.some((c) => c.value === value);
  return (
    <div>
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        {COLOR_PRESETS.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              title={c.name}
              aria-label={c.name}
              aria-pressed={selected}
              className={`grid h-10 w-10 place-items-center rounded-full text-white shadow-card transition-all duration-200 hover:scale-110 ${selected ? "scale-110 ring-2 ring-ink-900 ring-offset-2" : ""}`}
              style={{ backgroundColor: c.value }}
            >
              {selected ? <Check size={16} strokeWidth={3} className="animate-pop-in drop-shadow" /> : null}
            </button>
          );
        })}
        {/* Couleur libre */}
        <label
          title="Autre couleur"
          className={`relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full shadow-card transition-all duration-200 hover:scale-110 ${custom ? "scale-110 ring-2 ring-ink-900 ring-offset-2" : ""}`}
          style={{ background: custom ? value : "conic-gradient(#F76707, #FFD633, #25D366, #38BDF8, #7C3AED, #EC4899, #F76707)" }}
        >
          <input type="color" value={value || "#272C68"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`${label} : autre couleur`} />
          {custom ? <Check size={16} strokeWidth={3} className="text-white drop-shadow" /> : <span className="h-4 w-4 rounded-full bg-white" />}
        </label>
      </div>
    </div>
  );
}

// Confettis de la publication (CSS uniquement, desactives si "reduire les animations").
const CONFETTI_COLORS = ["#F76707", "#FFD633", "#25D366", "#272C68", "#EC4899", "#38BDF8"];
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.12}s`,
            animationDuration: `${2.4 + (i % 5) * 0.35}s`,
            "--r": `${(i % 2 ? 1 : -1) * (240 + (i % 7) * 60)}deg`,
            "--x": `${((i % 5) - 2) * 18}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function OnboardingPage({ user, setView }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biz, setBiz] = useState({});
  const [payment, setPayment] = useState({});
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [quickProds, setQuickProds] = useState([{ name: "", price: "", description: "", category: "" }]);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);
  const [published, setPublished] = useState(false);
  const [back, setBack] = useState(false); // sens de la transition entre deux etapes
  const [previewOpen, setPreviewOpen] = useState(false); // apercu plein ecran sur mobile

  // Change d'etape avec la bonne animation et remonte en haut de page.
  function goToStep(next) {
    setBack(next < step);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    getOnboardingData()
      .then((d) => {
        setBiz(d.business || {});
        setPayment(d.paymentSettings || {});
        if (d.messageTemplates?.length) setMessages(d.messageTemplates);
        setCategories(d.categories || []);
        setTemplates(d.templates || []);
        setExistingProducts(d.products || []);
        if (d.completed) {
          setPublished(true);
          setStep(10);
        } else if (d.currentStep > 0) {
          // Reprise : etape suivante, au plus l'etape 9 (apercu + bouton Publier).
          setStep(Math.min(d.currentStep + 1, 9));
        }
      })
      .catch(() => toast.error("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, []);

  function updateBiz(field, value) {
    setBiz((prev) => ({ ...prev, [field]: value }));
  }

  function updatePayment(field, value) {
    setPayment((prev) => ({ ...prev, [field]: value }));
  }

  async function saveCurrentStep() {
    setSaving(true);
    try {
      let data = {};
      if (step === 2) data = { name: biz.name, description: biz.description, category_id: biz.category_id, city: biz.city, commune: biz.commune, logo_url: biz.logo_url, banner_url: biz.banner_url };
      else if (step === 3) data = { business_type: biz.business_type };
      else if (step === 4) data = { whatsapp_number: biz.whatsapp_number, phone_number: biz.phone_number, email: biz.email, address: biz.address, google_maps_url: biz.google_maps_url, opening_hours: biz.opening_hours };
      else if (step === 5) data = payment;
      else if (step === 6) data = { primary_color: biz.primary_color, secondary_color: biz.secondary_color, button_color: biz.button_color, text_color: biz.text_color, background_color: biz.background_color, font_family: biz.font_family, theme_mode: biz.theme_mode, template_id: biz.template_id, display_style: biz.display_style };
      else if (step === 7) data = { templates: messages };

      await saveOnboardingStep(step, data);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (step >= 2 && step <= 7) {
      const ok = await saveCurrentStep();
      if (!ok) return;
    }
    if (step < TOTAL) goToStep(step + 1);
  }

  async function goPrev() {
    if (step > 1) goToStep(step - 1);
  }

  async function handleSaveLater() {
    const ok = step >= 2 && step <= 7 ? await saveCurrentStep() : true;
    if (!ok) return;
    toast.success("Progres sauvegarde !");
    setView("dashboard");
  }

  async function handlePublish() {
    setSaving(true);
    try {
      await completeOnboarding();
      setPublished(true);
      setStep(10);
      toast.success("Boutique publiee !");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de publication.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickProductsSave() {
    const valid = quickProds.filter((p) => p.name && p.price);
    if (!valid.length) { toast("Ajoutez au moins un produit."); return; }
    setSaving(true);
    try {
      const suggestedFields = getSuggestedFields(biz.business_type);
      const prods = valid.map((p) => ({ ...p, suggested_fields: suggestedFields }));
      const result = await createQuickProducts(prods);
      setExistingProducts((prev) => [...result.products, ...prev]);
      toast.success(`${result.products.length} produit(s) ajoute(s) !`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'ajout.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Chargement de l'assistant..." />;

  const publicUrl = `${window.location.origin}/catalogue/${biz.slug}`;
  const primaryColor = biz.primary_color || "#272C68";
  const buttonColor = biz.button_color || primaryColor;
  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const categoryName = categories.find((c) => c.id === Number(biz.category_id))?.name || "";
  // Produits deja enregistres + ceux en cours de saisie (apercu en direct)
  const previewProducts = [...quickProds.filter((p) => p.name), ...existingProducts];
  const showPreview = step >= 2 && step <= 8;
  const maxReachable = Math.max((biz.onboarding_step || 0) + 1, step);
  const showNav = step !== 1 && !(step === TOTAL && published);

  // Apercu de l'etape 9 : la boutique telle que les clients la verront (produits deja enregistres).
  const previewBusiness = { ...biz, category: categoryName ? { name: categoryName } : null, products: existingProducts, paymentSettings: payment };
  const readiness = [
    { label: "Nom de la boutique", ok: !!biz.name?.trim(), step: 2 },
    { label: "Logo", ok: !!biz.logo_url, step: 2 },
    { label: "Description", ok: !!biz.description?.trim(), step: 2 },
    { label: "Numero WhatsApp", ok: !!biz.whatsapp_number, step: 4 },
    { label: "Moyen de paiement", ok: !!(payment.is_wave_enabled || payment.is_cod_enabled || payment.is_whatsapp_enabled), step: 5 },
    { label: "Au moins un produit", ok: existingProducts.length > 0, step: 8 },
  ];
  const readinessPct = Math.round((readiness.filter((r) => r.ok).length / readiness.length) * 100);

  return (
    <div className="draw-now min-h-screen bg-gradient-to-b from-[#FFF8F3] via-surface to-surface font-landing">
      {/* ─── En-tete : logo, progression, sortie ─── */}
      <header className="sticky top-0 z-30 border-b border-surface-border/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <Logo />
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-500 sm:block">
                <span className="font-semibold text-ink-900">{Math.round(((step - 1) / (TOTAL - 1)) * 100)}%</span> complete
              </span>
              {step < TOTAL && step > 1 ? (
                <button
                  type="button"
                  onClick={handleSaveLater}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900 disabled:opacity-50"
                >
                  <Save size={15} /> <span className="hidden sm:inline">Enregistrer et quitter</span><span className="sm:hidden">Quitter</span>
                </button>
              ) : null}
            </div>
          </div>
          <div className="pb-3 lg:pb-2">
            <Stepper step={step} maxReachable={maxReachable} onSelect={goToStep} />
            <p className="mt-2 text-center text-xs font-medium text-ink-500 lg:hidden">
              Etape {step}/{TOTAL} · <span className="text-ink-900">{STEPS[step - 1].label}</span>
            </p>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 pt-8 sm:px-6 ${showNav ? "pb-32" : "pb-12"} ${showPreview || step === 9 ? "max-w-7xl" : "max-w-3xl"}`}>
        <div className={showPreview ? "grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-16" : ""}>
        {/* key = etape : la transition rejoue a chaque changement (vers l'avant ou en arriere) */}
        <div key={step} className={back ? "step-back" : "step-in"}>
        {step >= 2 && step <= 9 ? <StepHeader step={step} /> : null}

        {/* ─── STEP 1: Welcome ─── */}
        {step === 1 && (
          <section className="relative overflow-hidden rounded-[2rem] border border-surface-border bg-white px-6 py-12 text-center shadow-card sm:px-12 sm:py-14">
            {/* Decor : halos, arcs, icones 3D flottantes */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-100/70 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent-100/70 blur-3xl" aria-hidden="true" />
            <svg viewBox="0 0 400 400" className="spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 text-ink-100" aria-hidden="true">
              <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" />
              <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="120 40 6 40" />
            </svg>
            {[
              { img: "icone-catalogue", pos: "left-[5%] top-[10%]", d: "500ms", float: "animate-float" },
              { img: "icone-whatsapp", pos: "right-[5%] top-[16%]", d: "650ms", float: "animate-float-slow" },
              { img: "icone-paiement", pos: "right-[9%] bottom-[10%]", d: "800ms", float: "animate-float" },
            ].map(({ img, pos, d, float }) => (
              <div key={img} className={`pointer-events-none absolute hidden w-16 sm:block lg:w-20 ${pos}`} aria-hidden="true">
                <div className="seq-pop" style={{ "--d": d }}>
                  <img src={`/landing/${img}.webp`} alt="" className={`${float} w-full drop-shadow-[0_12px_18px_rgba(17,24,39,0.15)]`} />
                </div>
              </div>
            ))}

            <div className="relative">
              <p className="seq inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.18em] text-brand-700" style={{ "--d": "100ms" }}>
                <Sparkles size={14} /> Configuration de votre boutique
              </p>
              <h1 className="seq mt-6 text-[2.4rem] font-bold leading-[1.15] tracking-tight text-ink-900 sm:text-5xl" style={{ "--d": "200ms" }}>
                Bienvenue{firstName ? "," : ""} <Brush>{firstName || "a vous"} !</Brush>
                <Sparkle className="-mt-10 ml-1 inline-block" />
              </h1>
              <p className="seq mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-500" style={{ "--d": "350ms" }}>
                Nous allons creer votre boutique digitale en quelques etapes simples. Vous pourrez modifier chaque detail plus tard.
              </p>

              <div className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                {[
                  { icon: Clock, title: "5-10 minutes", text: "Pour tout configurer" },
                  { icon: Save, title: "Sauvegarde", text: "A chaque etape" },
                  { icon: Eye, title: "Apercu en direct", text: "Le resultat sous vos yeux" },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div
                    key={title}
                    className="seq group rounded-2xl border border-surface-border bg-white/80 px-2 py-4 backdrop-blur sm:px-4 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
                    style={{ "--d": `${480 + i * 110}ms` }}
                  >
                    <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white"><Icon size={18} /></span>
                    <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
                    <p className="hidden text-xs text-ink-500 sm:block">{text}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="seq group mt-10 inline-flex items-center gap-2.5 rounded-full bg-ink-900 px-9 py-4 text-base font-medium text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-ink-800"
                style={{ "--d": "850ms" }}
              >
                Commencer
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        )}

        {/* ─── STEP 2: Business Info ─── */}
        {step === 2 && (
          <div className="card space-y-6 p-6 sm:p-7">
            <Input label="Nom de la boutique *" value={biz.name || ""} onChange={(e) => updateBiz("name", e.target.value)} placeholder="Ex: Chez Awa Food" />
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink-700">Description</span>
              <textarea value={biz.description || ""} onChange={(e) => updateBiz("description", e.target.value)} rows={3} className="input-base resize-none" placeholder="Decrivez votre boutique en quelques mots..." />
            </div>
            <Select label="Categorie" value={biz.category_id || ""} onChange={(e) => updateBiz("category_id", e.target.value)}>
              <option value="">Choisir une categorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Ville" value={biz.city || ""} onChange={(e) => updateBiz("city", e.target.value)} placeholder="Ex: Abidjan" />
              <Input label="Commune" value={biz.commune || ""} onChange={(e) => updateBiz("commune", e.target.value)} placeholder="Ex: Cocody" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUpload
                label="Logo de la boutique"
                value={biz.logo_url}
                onChange={(url) => updateBiz("logo_url", url)}
                onUpload={uploadBusinessImage}
                shape="round"
              />
              <ImageUpload
                label="Banniere"
                value={biz.banner_url}
                onChange={(url) => updateBiz("banner_url", url)}
                onUpload={uploadBusinessImage}
              />
            </div>
          </div>
        )}

        {/* ─── STEP 3: Business Type ─── */}
        {step === 3 && (
          <div className="card space-y-6 p-6 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {BUSINESS_TYPES.map((t, i) => {
                const Icon = t.icon;
                const selected = biz.business_type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateBiz("business_type", t.value)}
                    className={`seq group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selected ? "border-brand-500 bg-brand-50 shadow-[0_10px_24px_-14px_rgba(247,103,7,0.8)]" : "border-surface-border bg-white hover:border-brand-200 hover:shadow-card-hover"
                    }`}
                    style={{ "--d": `${120 + i * 50}ms` }}
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${selected ? "bg-brand-500 text-white" : "bg-surface text-ink-400 group-hover:text-brand-500"}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`flex-1 text-[0.95rem] font-medium leading-snug ${selected ? "text-ink-900" : "text-ink-600"}`}>{t.label}</span>
                    {selected ? <span className="animate-pop-in grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-white"><Check size={14} strokeWidth={3} /></span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Contact & Location ─── */}
        {step === 4 && (
          <div className="card space-y-6 p-6 sm:p-7">
            <Input label="Numero WhatsApp *" value={biz.whatsapp_number || ""} onChange={(e) => updateBiz("whatsapp_number", e.target.value)} placeholder="225XXXXXXXXXX" inputMode="tel" />
            <Input label="Telephone" value={biz.phone_number || ""} onChange={(e) => updateBiz("phone_number", e.target.value)} placeholder="225XXXXXXXXXX" inputMode="tel" />
            <Input label="Email" type="email" value={biz.email || ""} onChange={(e) => updateBiz("email", e.target.value)} placeholder="contact@boutique.com" />
            <Input label="Adresse" value={biz.address || ""} onChange={(e) => updateBiz("address", e.target.value)} placeholder="Cocody, Abidjan" />
            <Input label="Lien Google Maps" value={biz.google_maps_url || ""} onChange={(e) => updateBiz("google_maps_url", e.target.value)} placeholder="https://maps.google.com/..." />
            <Input label="Horaires d'ouverture" value={biz.opening_hours || ""} onChange={(e) => updateBiz("opening_hours", e.target.value)} placeholder="Lun-Sam 08h-20h" />
          </div>
        )}

        {/* ─── STEP 5: Payment ─── */}
        {step === 5 && (
          <div className="card space-y-6 p-6 sm:p-7">
            <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-card"><CreditCard size={17} /></span>
              <div>
                <p className="font-semibold text-ink-900">Comment fonctionne Wave manuel ?</p>
                <p className="mt-1 text-ink-600">Le client voit votre numero Wave, paie depuis son app Wave, puis clique "J'ai paye". Vous confirmez dans votre dashboard.</p>
              </div>
            </div>
            {[
              { key: "is_wave_enabled", label: "Wave manuel", desc: "Paiement via votre numero Wave", icon: CreditCard },
              { key: "is_cod_enabled", label: "Paiement a la livraison", desc: "Le client paie en especes a la reception", icon: Truck },
              { key: "is_whatsapp_enabled", label: "WhatsApp", desc: "Le client vous contacte avant de payer", icon: MessageCircle },
            ].map(({ key, label, desc, icon: Icon }) => (
              <label key={key} className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 hover:-translate-y-0.5 ${payment[key] ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${payment[key] ? "bg-brand-500 text-white" : "bg-surface text-ink-400"}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{label}</p>
                  <p className="text-xs text-ink-500">{desc}</p>
                </div>
                {/* Interrupteur : la case reste accessible (lecteurs d'ecran, clavier) */}
                <input type="checkbox" checked={!!payment[key]} onChange={(e) => updatePayment(key, e.target.checked)} className="peer sr-only" />
                <span className="relative h-7 w-12 shrink-0 rounded-full bg-ink-200 transition-colors duration-300 peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 peer-checked:after:translate-x-5" />
              </label>
            ))}
            {payment.is_wave_enabled ? (
              <div className="space-y-4 rounded-xl border border-surface-border bg-surface p-4">
                <Input label="Numero Wave" value={payment.wave_phone_number || ""} onChange={(e) => updatePayment("wave_phone_number", e.target.value)} placeholder="225XXXXXXXXXX" />
                <Input label="Nom du compte Wave" value={payment.wave_account_name || ""} onChange={(e) => updatePayment("wave_account_name", e.target.value)} placeholder="Ex: Awa Kouassi" />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink-700">Instructions de paiement (optionnel)</span>
              <textarea value={payment.payment_instructions || ""} onChange={(e) => updatePayment("payment_instructions", e.target.value)} rows={2} className="input-base resize-none" placeholder="Ex: Envoyez le montant exact et mentionnez votre nom..." />
            </div>
          </div>
        )}

        {/* ─── STEP 6: Design ─── */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="card space-y-8 p-6 sm:p-7">

              {/* Color pickers */}
              <Swatches label="Couleur principale" value={biz.primary_color} onChange={(v) => updateBiz("primary_color", v)} />
              <Swatches label="Couleur des boutons" value={biz.button_color} onChange={(v) => updateBiz("button_color", v)} />

              {/* Font */}
              <DesignBlock title="Police d'ecriture" hint="Le style des textes de votre boutique.">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {FONTS.map((f) => {
                    const selected = (biz.font_family || "Inter") === f;
                    return (
                      <button key={f} type="button" aria-pressed={selected} onClick={() => updateBiz("font_family", f)}
                        className={`relative rounded-2xl border-2 px-3 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}>
                        <span className="block text-2xl font-semibold leading-none text-ink-900" style={{ fontFamily: f }}>Aa</span>
                        <span className="mt-2 block truncate text-xs font-medium text-ink-500">{f}</span>
                        {selected ? <Check size={14} strokeWidth={3} className="animate-pop-in absolute right-2.5 top-2.5 text-brand-600" /> : null}
                      </button>
                    );
                  })}
                </div>
              </DesignBlock>

              {/* Theme mode + display style */}
              <div className="grid gap-6 sm:grid-cols-2">
                <DesignBlock title="Ambiance">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[{ mode: "light", label: "Clair" }, { mode: "dark", label: "Sombre" }].map(({ mode, label }) => {
                      const selected = (biz.theme_mode || "light") === mode;
                      const dark = mode === "dark";
                      return (
                        <button key={mode} type="button" aria-pressed={selected} onClick={() => updateBiz("theme_mode", mode)}
                          className={`rounded-2xl border-2 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}>
                          {/* Mini maquette de la boutique dans cette ambiance */}
                          <div className={`overflow-hidden rounded-xl border ${dark ? "border-ink-700 bg-ink-900" : "border-surface-border bg-surface"}`}>
                            <div className="h-5" style={{ backgroundColor: primaryColor }} />
                            <div className="grid grid-cols-2 gap-1 p-1.5">
                              {[0, 1].map((k) => (
                                <div key={k} className={`rounded-md p-1 ${dark ? "bg-ink-800" : "bg-white"}`}>
                                  <div className={`h-4 rounded ${dark ? "bg-ink-700" : "bg-ink-100"}`} />
                                  <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: buttonColor }} />
                                </div>
                              ))}
                            </div>
                          </div>
                          <span className="mt-2 flex items-center justify-between text-sm font-medium text-ink-800">
                            {label}
                            {selected ? <Check size={14} strokeWidth={3} className="animate-pop-in text-brand-600" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </DesignBlock>

                <DesignBlock title="Affichage des produits">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[{ ds: "grid", label: "Grille" }, { ds: "list", label: "Liste" }].map(({ ds, label }) => {
                      const selected = (biz.display_style || "grid") === ds;
                      return (
                        <button key={ds} type="button" aria-pressed={selected} onClick={() => updateBiz("display_style", ds)}
                          className={`rounded-2xl border-2 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}>
                          <div className="rounded-xl border border-surface-border bg-surface p-1.5">
                            {ds === "grid" ? (
                              <div className="grid grid-cols-2 gap-1">
                                {[0, 1, 2, 3].map((k) => <div key={k} className="h-5 rounded-md bg-white shadow-sm"><div className="h-3 rounded-t-md bg-ink-100" /></div>)}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {[0, 1, 2].map((k) => (
                                  <div key={k} className="flex items-center gap-1 rounded-md bg-white p-0.5 shadow-sm">
                                    <div className="h-3.5 w-3.5 rounded bg-ink-100" />
                                    <div className="h-1.5 flex-1 rounded-full bg-ink-100" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="mt-2 flex items-center justify-between text-sm font-medium text-ink-800">
                            {label}
                            {selected ? <Check size={14} strokeWidth={3} className="animate-pop-in text-brand-600" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </DesignBlock>
              </div>

              {/* Template */}
              {templates.length ? (
                <DesignBlock title="Modele" hint="Une base de mise en page, modifiable plus tard.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templates.map((t, i) => {
                      const selected = biz.template_id === t.id;
                      const hue = (i * 47) % 360;
                      return (
                        <button key={t.id} type="button" aria-pressed={selected} onClick={() => updateBiz("template_id", t.id)}
                          className={`group flex items-center gap-3.5 rounded-2xl border-2 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}>
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 58%), hsl(${(hue + 40) % 360} 75% 45%))` }}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-semibold text-ink-900">{t.name}</span>
                              {t.is_premium ? <Badge variant="warning">Premium</Badge> : null}
                            </span>
                            {t.description ? <span className="mt-0.5 line-clamp-2 block text-xs text-ink-500">{t.description}</span> : null}
                          </span>
                          {selected ? <span className="animate-pop-in grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-white"><Check size={14} strokeWidth={3} /></span> : null}
                        </button>
                      );
                    })}
                  </div>
                </DesignBlock>
              ) : null}
            </div>
          </div>
        )}

        {/* ─── STEP 7: Messages ─── */}
        {step === 7 && (
          <div className="card space-y-6 p-6 sm:p-7">
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-sm font-medium text-ink-800">Variables disponibles <span className="font-normal text-ink-400">(cliquez pour copier)</span></p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {MESSAGE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { navigator.clipboard?.writeText(v); toast.success(`${v} copie`); }}
                    className="rounded-full border border-surface-border bg-white px-3 py-1 font-mono text-xs text-ink-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={m.type} className="space-y-2 rounded-xl border border-surface-border p-4">
                <p className="text-sm font-semibold text-ink-800">{m.title}</p>
                <textarea
                  value={m.content}
                  onChange={(e) => {
                    const next = [...messages];
                    next[i] = { ...next[i], content: e.target.value };
                    setMessages(next);
                  }}
                  rows={3}
                  className="input-base resize-none text-sm"
                />
                <div className="rounded-lg bg-surface p-3 text-xs text-gray-500">
                  <p className="font-semibold text-ink-700">Apercu :</p>
                  <p className="mt-1">{m.content.replace(/\{customer_name\}/g, "Awa").replace(/\{business_name\}/g, biz.name || "Ma boutique").replace(/\{product_name\}/g, "Poulet braise").replace(/\{price\}/g, "3 500").replace(/\{order_number\}/g, "42")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── STEP 8: Quick Products ─── */}
        {step === 8 && (
          <div className="card space-y-6 p-6 sm:p-7">

            {existingProducts.length ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">{existingProducts.length} produit(s) deja ajoute(s)</p>
              </div>
            ) : null}

            {biz.business_type ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm">
                <p className="font-semibold text-ink-900">Champs suggeres pour "{BUSINESS_TYPES.find((t) => t.value === biz.business_type)?.label || biz.business_type}" :</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {getSuggestedFields(biz.business_type).map((f) => (
                    <span key={f.label} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-700 shadow-card">{f.label}</span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-500">Ces champs seront automatiquement ajoutes a vos produits.</p>
              </div>
            ) : null}

            {quickProds.map((p, i) => (
              <div key={i} className="rounded-xl border border-surface-border p-4">
                <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                  <ImageUpload
                    value={p.image_url}
                    onChange={(url) => { const next = [...quickProds]; next[i] = { ...next[i], image_url: url }; setQuickProds(next); }}
                    onUpload={uploadOnboardingProductImage}
                  />
                  <div className="grid gap-3">
                    <Input label={`Produit ${i + 1} — Nom *`} value={p.name} onChange={(e) => { const next = [...quickProds]; next[i] = { ...next[i], name: e.target.value }; setQuickProds(next); }} placeholder="Ex: Poulet braise" />
                    <Input label="Prix (FCFA) *" type="number" value={p.price} onChange={(e) => { const next = [...quickProds]; next[i] = { ...next[i], price: e.target.value }; setQuickProds(next); }} placeholder="3500" inputMode="numeric" />
                    <Input label="Description" value={p.description} onChange={(e) => { const next = [...quickProds]; next[i] = { ...next[i], description: e.target.value }; setQuickProds(next); }} placeholder="Courte description..." />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 border-t border-surface-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              {quickProds.length < 5 ? (
                <button
                  type="button"
                  onClick={() => setQuickProds([...quickProds, { name: "", price: "", description: "", category: "" }])}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Plus size={16} /> Ajouter un autre produit
                </button>
              ) : <span className="text-sm text-ink-400">5 produits maximum ici, ajoutez les autres plus tard.</span>}
              <button
                type="button"
                onClick={handleQuickProductsSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(247,103,7,0.8)] transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                Enregistrer {quickProds.filter((p) => p.name && p.price).length > 1 ? "les produits" : "le produit"}
              </button>
            </div>

            <p className="text-xs text-ink-400">Vous pouvez aussi passer cette etape et ajouter vos produits plus tard.</p>
          </div>
        )}

        {/* ─── STEP 9: Preview ─── */}
        {step === 9 && (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            {/* La vraie vitrine (meme composant que la page publique) dans un cadre de navigateur */}
            <div className="seq overflow-hidden rounded-[1.5rem] border border-surface-border bg-white shadow-modal" style={{ "--d": "120ms" }}>
              <div className="flex items-center gap-3 border-b border-surface-border bg-surface/80 px-4 py-3">
                <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs text-ink-500 shadow-card">
                  <Lock size={12} className="shrink-0 text-emerald-600" />
                  <span className="truncate">{publicUrl.replace(/^https?:\/\//, "")}</span>
                </span>
              </div>
              <div className="max-h-[calc(100vh-17rem)] min-h-[28rem] overflow-y-auto">
                <Storefront business={previewBusiness} mode="preview" />
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-36">
              {/* Etat de preparation : chaque element manquant renvoie a son etape */}
              <div className="seq rounded-[1.5rem] border border-surface-border bg-white p-5 shadow-card" style={{ "--d": "220ms" }}>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ECEAE6" strokeWidth="3.5" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" stroke={readinessPct === 100 ? "#10B981" : "#F76707"} strokeWidth="3.5" strokeLinecap="round"
                        strokeDasharray={`${(readinessPct / 100) * 97.4} 97.4`}
                        className="transition-[stroke-dasharray] duration-700"
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center text-sm font-bold text-ink-900">{readinessPct}%</span>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{readinessPct === 100 ? "Tout est pret !" : "Presque pret"}</p>
                    <p className="text-sm text-ink-500">{readinessPct === 100 ? "Votre boutique est complete." : "Completez pour inspirer confiance."}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-1">
                  {readiness.map((item) => (
                    <li key={item.label} className="flex items-center gap-3 rounded-xl px-2 py-2">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${item.ok ? "bg-emerald-500 text-white" : "border-2 border-dashed border-ink-200"}`}>
                        {item.ok ? <Check size={13} strokeWidth={3} /> : null}
                      </span>
                      <span className={`flex-1 text-sm ${item.ok ? "text-ink-700" : "text-ink-500"}`}>{item.label}</span>
                      {item.ok ? null : (
                        <button type="button" onClick={() => goToStep(item.step)} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100">
                          Ajouter
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="seq flex items-center gap-4 rounded-[1.5rem] border border-surface-border bg-white p-5 shadow-card" style={{ "--d": "320ms" }}>
                <div className="shrink-0 rounded-xl border border-surface-border bg-white p-2"><QRCodeCanvas value={publicUrl} size={84} level="H" /></div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">QR code et lien</p>
                  <p className="mt-0.5 truncate text-xs text-brand-600">{publicUrl.replace(/^https?:\/\//, "")}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard?.writeText(publicUrl); toast.success("Lien copie !"); }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-100"
                  >
                    <Copy size={13} /> Copier le lien
                  </button>
                </div>
              </div>

              <p className="seq px-2 text-xs leading-relaxed text-ink-400" style={{ "--d": "400ms" }}>
                Vous pourrez tout modifier plus tard depuis l'onglet Ma boutique.
              </p>
            </aside>
          </div>
        )}

        {/* ─── STEP 10: Publish ─── */}
        {step === 10 && published && (
          <section className="relative overflow-hidden rounded-[2rem] border border-surface-border bg-white px-6 py-12 text-center shadow-card sm:px-12">
            <Confetti />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <div className="relative mx-auto grid h-24 w-24 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60" />
                <span className="seq-pop relative grid h-24 w-24 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-10px_rgba(16,185,129,0.7)]">
                  <Check size={46} strokeWidth={3} />
                </span>
              </div>
              <h1 className="seq mt-8 text-[2.4rem] font-bold leading-tight text-ink-900 sm:text-5xl" style={{ "--d": "250ms" }}>
                Felicitations <Brush>{firstName || ""} !</Brush>
              </h1>
              <p className="seq mx-auto mt-5 max-w-lg text-lg text-ink-500" style={{ "--d": "380ms" }}>
                Votre boutique digitale est prete. Partagez le lien ou le QR code avec vos clients.
              </p>

              <div className="seq mx-auto mt-8 flex max-w-md flex-col items-center gap-5 rounded-3xl border border-surface-border bg-surface/60 p-6 sm:flex-row sm:text-left" style={{ "--d": "500ms" }}>
                <div className="shrink-0 rounded-2xl bg-white p-3 shadow-card">
                  <QRCodeCanvas value={publicUrl} size={120} level="H" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">Le lien de votre boutique</p>
                  <p className="mt-1 break-all text-sm text-brand-600">{publicUrl}</p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Lien copie !"); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-card transition hover:-translate-y-0.5 hover:text-ink-900"
                  >
                    <Copy size={14} /> Copier le lien
                  </button>
                </div>
              </div>

              <div className="seq mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-2" style={{ "--d": "620ms" }}>
                <button
                  type="button"
                  onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                  className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink-900 px-5 py-3.5 font-medium text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  <Globe size={17} /> Voir ma boutique
                </button>
                <button
                  type="button"
                  onClick={() => setView("products")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink-900 px-5 py-3.5 font-medium text-ink-900 transition hover:-translate-y-0.5 hover:bg-ink-900 hover:text-white"
                >
                  <Package size={17} /> Ajouter des produits
                </button>
              </div>
              <button type="button" onClick={() => setView("dashboard")} className="seq group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900" style={{ "--d": "720ms" }}>
                Aller au tableau de bord <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        )}
        </div>

        {/* ─── Apercu en direct (grand ecran) ─── */}
        {showPreview ? (
          // self-stretch : la colonne fait la hauteur du formulaire, sinon le "sticky" n'a pas de place
          <aside className="hidden self-stretch lg:block">
            <div className="panel-in sticky top-36" style={{ "--d": "200ms" }}>
              <PhonePreview biz={biz} payment={payment} products={previewProducts} categoryName={categoryName} />
            </div>
          </aside>
        ) : null}
        </div>
      </main>

      {/* ─── Apercu plein ecran (mobile) ─── */}
      {showPreview ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="fixed bottom-24 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-modal transition hover:-translate-y-0.5 lg:hidden"
        >
          <Eye size={16} className="text-brand-500" /> Apercu
        </button>
      ) : null}
      {previewOpen && showPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink-900/60 p-4 backdrop-blur-sm animate-fade-in lg:hidden" onClick={() => setPreviewOpen(false)} role="dialog" aria-modal="true" aria-label="Apercu de la boutique">
          <div className="animate-pop-in relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fermer l'apercu" className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-ink-700 shadow-modal">
              <X size={18} />
            </button>
            <div className="rounded-[2rem] bg-white/90 p-4">
              <PhonePreview biz={biz} payment={payment} products={previewProducts} categoryName={categoryName} />
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Barre de navigation fixe ─── */}
      {showNav ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border/70 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={goPrev}
              className="group inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Precedent
            </button>
            {step === 9 ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-semibold text-white shadow-[0_12px_28px_-10px_rgba(247,103,7,0.8)] transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Rocket size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                Publier ma boutique
              </button>
            ) : step < TOTAL ? (
              <button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 font-medium text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-ink-800 disabled:opacity-60"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : null}
                {step === 8 && !previewProducts.length ? "Passer cette etape" : "Suivant"}
                {saving ? null : <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <Toaster position="top-center" />
    </div>
  );
}
