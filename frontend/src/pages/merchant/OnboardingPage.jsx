import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Copy, CreditCard, Download,
  Eye, Globe, Loader2, MapPin, MessageCircle, Package, Palette, Phone, QrCode,
  Rocket, Save, ShoppingBag, Smartphone, Sparkles, Star, Store, Truck, Type, Users, Zap,
} from "lucide-react";
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
  { id: 2, label: "Boutique", icon: Store },
  { id: 3, label: "Activite", icon: ShoppingBag },
  { id: 4, label: "Contact", icon: Phone },
  { id: 5, label: "Paiement", icon: CreditCard },
  { id: 6, label: "Design", icon: Palette },
  { id: 7, label: "Messages", icon: MessageCircle },
  { id: 8, label: "Produits", icon: Package },
  { id: 9, label: "Apercu", icon: Eye },
  { id: 10, label: "Publication", icon: Rocket },
];

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

  useEffect(() => {
    getOnboardingData()
      .then((d) => {
        setBiz(d.business || {});
        setPayment(d.paymentSettings || {});
        if (d.messageTemplates?.length) setMessages(d.messageTemplates);
        setCategories(d.categories || []);
        setTemplates(d.templates || []);
        setExistingProducts(d.products || []);
        if (d.completed) setPublished(true);
        if (d.currentStep > 0 && d.currentStep < 10) setStep(Math.min(d.currentStep + 1, 10));
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
    if (step < 10) setStep(step + 1);
  }

  async function goPrev() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSaveLater() {
    await saveCurrentStep();
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

  return (
    <div className="min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 border-b border-surface-border bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3">
          {/* Top row: logo + step counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-brand-500" />
              <span className="font-display text-sm font-bold text-brand-700">CatalogueCI</span>
            </div>
            <span className="text-sm font-medium text-gray-500">Etape {step} sur 10</span>
          </div>
          {/* Progress bar visual */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(step / 10) * 100}%` }} />
          </div>
          {/* Step labels - scrollable */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => s.id <= (biz.onboarding_step || 0) + 1 && setStep(s.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition ${active ? "bg-brand-500 text-white shadow-sm" : done ? "bg-brand-50 text-brand-600" : "text-gray-400 hover:bg-surface"}`}
                >
                  {done ? <Check size={12} /> : <Icon size={12} />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* ─── STEP 1: Welcome ─── */}
        {step === 1 && (
          <div className="card animate-fade-in p-8 text-center">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-brand-50">
              <Sparkles size={36} className="text-brand-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-brand-800">Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""} !</h1>
            <p className="mx-auto mt-4 max-w-lg text-gray-500">
              Nous allons creer votre boutique digitale en quelques etapes simples. Vous pourrez modifier chaque detail plus tard.
            </p>
            <div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-400" /> 5-10 minutes</span>
              <span className="flex items-center gap-1.5"><Save size={14} className="text-brand-400" /> Sauvegarde auto</span>
              <span className="flex items-center gap-1.5"><Eye size={14} className="text-brand-400" /> Apercu en direct</span>
            </div>
            <Button size="xl" className="mt-8" onClick={goNext}>Commencer <ArrowRight size={18} /></Button>
          </div>
        )}

        {/* ─── STEP 2: Business Info ─── */}
        {step === 2 && (
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Informations de votre boutique</h2>
              <p className="text-sm text-gray-500">Les informations de base de votre commerce.</p>
            </div>
            <Input label="Nom de la boutique *" value={biz.name || ""} onChange={(e) => updateBiz("name", e.target.value)} placeholder="Ex: Chez Awa Food" />
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-brand-700">Description</span>
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
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Type d'activite</h2>
              <p className="text-sm text-gray-500">Quel type de boutique voulez-vous creer ?</p>
            </div>
            <div className="grid gap-3">
              {BUSINESS_TYPES.map((t) => {
                const Icon = t.icon;
                const selected = biz.business_type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => updateBiz("business_type", t.value)}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition ${selected ? "border-brand-500 bg-brand-50" : "border-surface-border bg-white hover:border-brand-200"}`}
                  >
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-brand-500 text-white" : "bg-surface text-gray-400"}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`font-medium ${selected ? "text-brand-800" : "text-gray-600"}`}>{t.label}</span>
                    {selected ? <Check size={18} className="ml-auto text-brand-500" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Contact & Location ─── */}
        {step === 4 && (
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Contact et localisation</h2>
              <p className="text-sm text-gray-500">Comment vos clients vous contactent.</p>
            </div>
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
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Moyens de paiement</h2>
              <p className="text-sm text-gray-500">Comment vos clients vous paient.</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold">Comment fonctionne Wave manuel ?</p>
              <p className="mt-1 text-blue-600">Le client voit votre numero Wave, paie depuis son app Wave, puis clique "J'ai paye". Vous confirmez dans votre dashboard.</p>
            </div>
            {[
              { key: "is_wave_enabled", label: "Wave manuel", desc: "Paiement via votre numero Wave", icon: CreditCard },
              { key: "is_cod_enabled", label: "Paiement a la livraison", desc: "Le client paie en especes a la reception", icon: Truck },
              { key: "is_whatsapp_enabled", label: "WhatsApp", desc: "Le client vous contacte avant de payer", icon: MessageCircle },
            ].map(({ key, label, desc, icon: Icon }) => (
              <label key={key} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${payment[key] ? "border-brand-500 bg-brand-50" : "border-surface-border"}`}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${payment[key] ? "bg-brand-500 text-white" : "bg-surface text-gray-400"}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-brand-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <input type="checkbox" checked={!!payment[key]} onChange={(e) => updatePayment(key, e.target.checked)} className="h-5 w-5 accent-brand-500" />
              </label>
            ))}
            {payment.is_wave_enabled ? (
              <div className="space-y-4 rounded-xl border border-surface-border bg-surface p-4">
                <Input label="Numero Wave" value={payment.wave_phone_number || ""} onChange={(e) => updatePayment("wave_phone_number", e.target.value)} placeholder="225XXXXXXXXXX" />
                <Input label="Nom du compte Wave" value={payment.wave_account_name || ""} onChange={(e) => updatePayment("wave_account_name", e.target.value)} placeholder="Ex: Awa Kouassi" />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold text-brand-700">Instructions de paiement (optionnel)</span>
              <textarea value={payment.payment_instructions || ""} onChange={(e) => updatePayment("payment_instructions", e.target.value)} rows={2} className="input-base resize-none" placeholder="Ex: Envoyez le montant exact et mentionnez votre nom..." />
            </div>
          </div>
        )}

        {/* ─── STEP 6: Design ─── */}
        {step === 6 && (
          <div className="animate-fade-in space-y-6">
            <div className="card space-y-6 p-6">
              <div>
                <h2 className="font-display text-xl font-bold text-brand-800">Design de votre boutique</h2>
                <p className="text-sm text-gray-500">Choisissez les couleurs, la police et le style.</p>
              </div>

              {/* Color pickers */}
              <div>
                <span className="text-sm font-semibold text-brand-700">Couleur principale</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c.value} onClick={() => updateBiz("primary_color", c.value)} title={c.name}
                      className={`h-10 w-10 rounded-xl border-2 transition ${biz.primary_color === c.value ? "border-brand-800 ring-2 ring-brand-200" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                  <input type="color" value={biz.primary_color || "#272C68"} onChange={(e) => updateBiz("primary_color", e.target.value)} className="h-10 w-10 cursor-pointer rounded-xl border-0" />
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold text-brand-700">Couleur des boutons</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c.value} onClick={() => updateBiz("button_color", c.value)} title={c.name}
                      className={`h-10 w-10 rounded-xl border-2 transition ${biz.button_color === c.value ? "border-brand-800 ring-2 ring-brand-200" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }} />
                  ))}
                  <input type="color" value={biz.button_color || "#272C68"} onChange={(e) => updateBiz("button_color", e.target.value)} className="h-10 w-10 cursor-pointer rounded-xl border-0" />
                </div>
              </div>

              {/* Font */}
              <div>
                <span className="text-sm font-semibold text-brand-700">Police d'ecriture</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FONTS.map((f) => (
                    <button key={f} onClick={() => updateBiz("font_family", f)}
                      className={`rounded-xl border-2 px-3 py-3 text-center transition ${biz.font_family === f ? "border-brand-500 bg-brand-50" : "border-surface-border"}`}
                      style={{ fontFamily: f }}>
                      <span className="text-lg font-semibold text-brand-800">{f}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme mode */}
              <div className="grid grid-cols-2 gap-3">
                {["light", "dark"].map((mode) => (
                  <button key={mode} onClick={() => updateBiz("theme_mode", mode)}
                    className={`rounded-xl border-2 px-4 py-4 text-center transition ${biz.theme_mode === mode ? "border-brand-500 bg-brand-50" : "border-surface-border"}`}>
                    <div className={`mx-auto mb-2 h-8 w-16 rounded-lg ${mode === "dark" ? "bg-gray-900" : "bg-white border border-gray-200"}`} />
                    <span className="text-sm font-medium text-brand-800">{mode === "light" ? "Clair" : "Sombre"}</span>
                  </button>
                ))}
              </div>

              {/* Display style */}
              <div className="grid grid-cols-2 gap-3">
                {["grid", "list"].map((ds) => (
                  <button key={ds} onClick={() => updateBiz("display_style", ds)}
                    className={`rounded-xl border-2 px-4 py-4 text-center transition ${biz.display_style === ds ? "border-brand-500 bg-brand-50" : "border-surface-border"}`}>
                    <span className="text-sm font-medium text-brand-800">{ds === "grid" ? "Grille" : "Liste"}</span>
                  </button>
                ))}
              </div>

              {/* Template */}
              {templates.length ? (
                <div>
                  <span className="text-sm font-semibold text-brand-700">Template</span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {templates.map((t) => (
                      <button key={t.id} onClick={() => updateBiz("template_id", t.id)}
                        className={`rounded-xl border-2 p-4 text-left transition ${biz.template_id === t.id ? "border-brand-500 bg-brand-50" : "border-surface-border"}`}>
                        <p className="font-semibold text-brand-800">{t.name}</p>
                        {t.description ? <p className="mt-1 text-xs text-gray-500">{t.description}</p> : null}
                        {t.is_premium ? <Badge variant="warning" className="mt-2">Premium</Badge> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Live Preview */}
            <div className="card overflow-hidden">
              <div className="border-b border-surface-border px-4 py-3">
                <p className="text-sm font-semibold text-brand-700"><Eye size={14} className="mr-1.5 inline" /> Apercu en direct</p>
              </div>
              <div className="p-4" style={{ backgroundColor: biz.background_color || "#F8F9FC", fontFamily: biz.font_family || "Inter" }}>
                <div className="rounded-xl p-5 text-white" style={{ backgroundColor: primaryColor }}>
                  <div className="flex items-center gap-3">
                    {biz.logo_url ? <img src={biz.logo_url} alt="" className="h-10 w-10 rounded-xl bg-white object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20"><Store size={18} /></div>}
                    <div>
                      <p className="text-xs text-white/60">{categories.find((c) => c.id === Number(biz.category_id))?.name || "Commerce"}</p>
                      <p className="font-bold">{biz.name || "Nom de votre boutique"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-surface-border bg-white p-4">
                  <p className="text-sm font-semibold" style={{ color: biz.text_color || "#1A1A2E" }}>Exemple de produit</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: primaryColor }}>1 500 FCFA</p>
                  <button className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: buttonColor }}>Commander</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 7: Messages ─── */}
        {step === 7 && (
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Messages automatiques</h2>
              <p className="text-sm text-gray-500">Personnalisez les messages envoyes a vos clients. Utilisez les variables : {"{customer_name}"}, {"{product_name}"}, {"{business_name}"}, {"{price}"}, {"{order_number}"}</p>
            </div>
            {messages.map((m, i) => (
              <div key={m.type} className="space-y-2 rounded-xl border border-surface-border p-4">
                <p className="text-sm font-semibold text-brand-800">{m.title}</p>
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
                  <p className="font-semibold text-brand-700">Apercu :</p>
                  <p className="mt-1">{m.content.replace(/\{customer_name\}/g, "Awa").replace(/\{business_name\}/g, biz.name || "Ma boutique").replace(/\{product_name\}/g, "Poulet braise").replace(/\{price\}/g, "3 500").replace(/\{order_number\}/g, "42")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── STEP 8: Quick Products ─── */}
        {step === 8 && (
          <div className="card animate-fade-in space-y-6 p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-800">Premiers produits</h2>
              <p className="text-sm text-gray-500">Ajoutez vos premiers produits ou services (vous pourrez en ajouter plus tard).</p>
            </div>

            {existingProducts.length ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">{existingProducts.length} produit(s) deja ajoute(s)</p>
              </div>
            ) : null}

            {biz.business_type ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">Champs suggeres pour "{BUSINESS_TYPES.find((t) => t.value === biz.business_type)?.label || biz.business_type}" :</p>
                <p className="mt-1 text-blue-600">{getSuggestedFields(biz.business_type).map((f) => f.label).join(", ")}</p>
                <p className="mt-1 text-xs text-blue-500">Ces champs seront automatiquement ajoutes a vos produits.</p>
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

            {quickProds.length < 5 ? (
              <Button tone="secondary" onClick={() => setQuickProds([...quickProds, { name: "", price: "", description: "", category: "" }])}>
                + Ajouter un produit
              </Button>
            ) : null}

            <Button onClick={handleQuickProductsSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
              Enregistrer les produits
            </Button>

            <p className="text-xs text-gray-400">Vous pouvez aussi passer cette etape et ajouter vos produits plus tard.</p>
          </div>
        )}

        {/* ─── STEP 9: Preview ─── */}
        {step === 9 && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-brand-800">Apercu de votre boutique</h2>
              <p className="text-sm text-gray-500">Voici a quoi ressemblera votre boutique pour vos clients.</p>
            </div>

            {/* Full preview */}
            <div className="card overflow-hidden" style={{ fontFamily: biz.font_family || "Inter" }}>
              {/* Header */}
              <div className="relative p-6 text-white" style={{ backgroundColor: primaryColor }}>
                {biz.banner_url ? <div className="absolute inset-0"><img src={biz.banner_url} alt="" className="h-full w-full object-cover opacity-30" /><div className="absolute inset-0" style={{ backgroundColor: `${primaryColor}cc` }} /></div> : null}
                <div className="relative flex items-center gap-4">
                  {biz.logo_url ? <img src={biz.logo_url} alt="" className="h-14 w-14 rounded-2xl border-2 border-white/30 bg-white object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20"><Store size={24} /></div>}
                  <div>
                    <p className="text-sm text-white/60">{categories.find((c) => c.id === Number(biz.category_id))?.name || ""}</p>
                    <p className="text-xl font-bold">{biz.name || "Ma boutique"}</p>
                  </div>
                </div>
                {biz.description ? <p className="relative mt-3 text-sm text-white/80">{biz.description}</p> : null}
              </div>

              {/* Contact buttons */}
              <div className="flex gap-2 border-b border-surface-border p-4">
                <span className="flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2 text-xs font-semibold text-white"><MessageCircle size={14} /> WhatsApp</span>
                {biz.phone_number ? <span className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-gray-600"><Phone size={14} /> Appeler</span> : null}
                {biz.address ? <span className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-gray-600"><MapPin size={14} /> Carte</span> : null}
              </div>

              {/* Products */}
              <div className="p-4" style={{ backgroundColor: biz.background_color || "#F8F9FC" }}>
                <p className="mb-3 text-sm font-semibold" style={{ color: biz.text_color || "#1A1A2E" }}>Catalogue</p>
                <div className={biz.display_style === "list" ? "space-y-3" : "grid grid-cols-2 gap-3"}>
                  {(existingProducts.length ? existingProducts.slice(0, 4) : [{ name: "Exemple produit", price: 2500 }]).map((p, i) => (
                    <div key={i} className="rounded-xl border border-surface-border bg-white p-3">
                      {p.image_url ? <img src={mediaUrl(p.image_url)} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" /> : <div className="mb-2 grid h-24 place-items-center rounded-lg bg-surface text-gray-300"><ShoppingBag size={20} /></div>}
                      <p className="text-sm font-semibold" style={{ color: biz.text_color || "#1A1A2E" }}>{p.name}</p>
                      <p className="text-sm font-bold" style={{ color: primaryColor }}>{fmt(p.price)} FCFA</p>
                      <button className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: buttonColor }}>Commander</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment methods */}
              <div className="border-t border-surface-border p-4">
                <p className="mb-2 text-xs font-semibold text-gray-500">Paiement</p>
                <div className="flex flex-wrap gap-2">
                  {payment.is_wave_enabled ? <Badge variant="wave">Wave</Badge> : null}
                  {payment.is_cod_enabled ? <Badge variant="warning">Livraison</Badge> : null}
                  {payment.is_whatsapp_enabled ? <Badge variant="whatsapp">WhatsApp</Badge> : null}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="card flex items-center gap-6 p-6">
              <QRCodeCanvas value={publicUrl} size={120} level="H" />
              <div>
                <p className="font-semibold text-brand-800">QR Code de votre boutique</p>
                <p className="mt-1 break-all text-sm text-gray-500">{publicUrl}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 10: Publish ─── */}
        {step === 10 && published && (
          <div className="card animate-fade-in p-8 text-center">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-brand-800">Felicitations !</h1>
            <p className="mx-auto mt-3 max-w-lg text-gray-500">Votre boutique digitale est prete. Partagez le lien ou le QR code avec vos clients.</p>

            <div className="mx-auto mt-6 flex justify-center">
              <QRCodeCanvas value={publicUrl} size={160} level="H" />
            </div>
            <p className="mt-3 break-all text-sm text-gray-500">{publicUrl}</p>

            <div className="mx-auto mt-6 grid max-w-sm gap-3">
              <Button size="lg" onClick={() => window.open(publicUrl, "_blank")}><Globe size={16} /> Voir ma boutique</Button>
              <Button tone="secondary" size="lg" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Lien copie !"); }}><Copy size={16} /> Copier le lien</Button>
              <Button tone="accent" size="lg" onClick={() => setView("products")}><Package size={16} /> Ajouter des produits</Button>
              <Button tone="ghost" onClick={() => setView("dashboard")}>Aller au dashboard</Button>
            </div>
          </div>
        )}

        {/* ─── Navigation buttons ─── */}
        {step !== 10 || !published ? (
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 1 ? (
                <Button tone="ghost" onClick={goPrev}><ArrowLeft size={16} /> Precedent</Button>
              ) : null}
            </div>
            <div className="flex gap-3">
              {step >= 2 && step <= 8 ? (
                <Button tone="secondary" onClick={handleSaveLater} disabled={saving}>
                  <Save size={15} /> Enregistrer
                </Button>
              ) : null}
              {step === 9 ? (
                <Button tone="accent" size="lg" onClick={handlePublish} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                  Publier ma boutique
                </Button>
              ) : step < 10 ? (
                <Button onClick={goNext} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  Suivant <ArrowRight size={16} />
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}
