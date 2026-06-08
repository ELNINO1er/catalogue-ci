import { useEffect, useState } from "react";
import { Edit3, Eye, MapPin, Palette, Store } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { getMerchantBusiness, listMerchantCategories, listMerchantTemplates, updateMerchantBusiness } from "../../services/merchantService";

const emptyForm = {
  name: "",
  logo_url: "",
  banner_url: "",
  description: "",
  category_id: "",
  template_id: "",
  whatsapp_number: "",
  phone_number: "",
  email: "",
  address: "",
  google_maps_url: "",
  opening_hours: "",
  terms_text: "",
  delivery_policy: "",
  welcome_message: "",
  primary_color: "#2f855a",
  button_color: "#2f855a",
  display_style: "grid",
};

const inputClass = "rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const selectClass = `${inputClass} bg-white text-slate-800 accent-emerald-600`;

export default function MerchantBusinessPage({ setPublicSlug }) {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [businessData, categoryList, templateList] = await Promise.all([
      getMerchantBusiness(),
      listMerchantCategories(),
      listMerchantTemplates(),
    ]);
    setBusiness(businessData);
    setForm({
      ...emptyForm,
      ...businessData,
      category_id: businessData.category_id || "",
      template_id: businessData.template_id || "",
      primary_color: businessData.primary_color || "#2f855a",
      button_color: businessData.button_color || "#2f855a",
      display_style: businessData.display_style || "grid",
    });
    setCategories(categoryList);
    setTemplates(templateList);
  }

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Impossible de charger la boutique."));
  }, []);

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      const updated = await updateMerchantBusiness({
        ...form,
        category_id: form.category_id || null,
        template_id: form.template_id || null,
      });
      setBusiness(updated);
      setForm({ ...emptyForm, ...updated, category_id: updated.category_id || "", template_id: updated.template_id || "" });
      setModalOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer la boutique.");
    }
  }

  if (!business && !error) return <p className="p-5 text-sm text-slate-500">Chargement de la boutique...</p>;

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ma boutique</h1>
          <p className="mt-1 text-sm text-slate-500">Modifiez les informations publiques depuis une modale.</p>
        </div>
        <div className="flex gap-2">
          {business?.slug ? (
            <Button tone="secondary" onClick={() => setPublicSlug?.(business.slug)}><Eye size={16} /> Voir</Button>
          ) : null}
          <Button onClick={() => setModalOpen(true)}><Edit3 size={16} /> Modifier</Button>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {saved ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Boutique enregistree.</p> : null}

      {business ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
            {business.banner_url ? <img src={business.banner_url} alt="" className="mb-4 h-44 w-full rounded-lg object-cover" /> : null}
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-emerald-600 text-white">
                {business.logo_url ? <img src={business.logo_url} alt={business.name} className="h-full w-full rounded-lg object-cover" /> : <Store size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{business.name}</h2>
                <p className="text-sm text-slate-500">{business.category?.name || "Sans categorie"}</p>
                <p className="mt-2 text-sm text-slate-600">{business.description || "Aucune description."}</p>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-slate-900">Contact</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>WhatsApp :</strong> {business.whatsapp_number}</p>
              <p><strong>Telephone :</strong> {business.phone_number || "Non renseigne"}</p>
              <p><strong>Email :</strong> {business.email || "Non renseigne"}</p>
              <p className="flex gap-2"><MapPin size={16} /> {business.address || "Adresse non renseignee"}</p>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><Palette size={18} /> Design</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Template :</strong> {business.template?.name || "Template par defaut"}</p>
              <p><strong>Affichage :</strong> {business.display_style === "list" ? "Liste" : "Grille"}</p>
              <div className="flex gap-2">
                <span className="h-8 w-8 rounded-lg border" style={{ backgroundColor: business.primary_color || "#2f855a" }} />
                <span className="h-8 w-8 rounded-lg border" style={{ backgroundColor: business.button_color || "#2f855a" }} />
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
            <h2 className="mb-3 font-bold text-slate-900">Messages et conditions</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Accueil :</strong> {business.welcome_message || "Non renseigne"}</p>
              <p><strong>Conditions :</strong> {business.terms_text || "Non renseigne"}</p>
              <p><strong>Livraison :</strong> {business.delivery_policy || "Non renseigne"}</p>
            </div>
          </section>
        </div>
      ) : null}

      {modalOpen ? (
        <FormModal title="Modifier ma boutique" description="Ces informations apparaissent sur votre catalogue public." onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Nom de la boutique<input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Categorie<select value={form.category_id || ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={selectClass}><option value="">Sans categorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">WhatsApp<input value={form.whatsapp_number || ""} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className={inputClass} required /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Telephone<input value={form.phone_number || ""} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Email boutique<input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Horaires<input value={form.opening_hours || ""} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">Adresse<input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Template<select value={form.template_id || ""} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className={selectClass}><option value="">Template par defaut</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.is_premium ? " - Premium" : ""}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Affichage produits<select value={form.display_style || "grid"} onChange={(e) => setForm({ ...form, display_style: e.target.value })} className={selectClass}><option value="grid">Grille</option><option value="list">Liste</option></select></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Couleur principale<input type="color" value={form.primary_color || "#2f855a"} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 rounded-lg border px-2" /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Couleur boutons<input type="color" value={form.button_color || "#2f855a"} onChange={(e) => setForm({ ...form, button_color: e.target.value })} className="h-10 rounded-lg border px-2" /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Logo URL<input value={form.logo_url || ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">Banniere URL<input value={form.banner_url || ""} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className={inputClass} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">Message d'accueil<textarea value={form.welcome_message || ""} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} rows={3} className={`${inputClass} resize-none`} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">Conditions de vente<textarea value={form.terms_text || ""} onChange={(e) => setForm({ ...form, terms_text: e.target.value })} rows={3} className={`${inputClass} resize-none`} /></label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">Politique de livraison<textarea value={form.delivery_policy || ""} onChange={(e) => setForm({ ...form, delivery_policy: e.target.value })} rows={3} className={`${inputClass} resize-none`} /></label>
            </div>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2"><Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button><Button type="submit">Enregistrer</Button></div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
