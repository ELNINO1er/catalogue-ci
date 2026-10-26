import { useEffect, useState } from "react";
import { Edit3, Eye, FileText, MapPin, Palette, Phone, ShoppingBag, Store } from "lucide-react";
import Button from "../../components/ui/Button";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import Input, { Select, Textarea } from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import { MetaRow, PageHeader, StatusPill } from "../../components/ui/PageKit";
import { getMerchantBusiness, listMerchantCategories, listMerchantTemplates, updateMerchantBusiness } from "../../services/merchantService";
import { mediaUrl } from "../../utils/media";

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

function Section({ icon: Icon, title, children, className = "" }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-ink-900">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={16} /></span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FormSection({ title, children }) {
  return (
    <fieldset className="grid gap-4 md:grid-cols-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400 md:col-span-2">{title}</legend>
      {children}
    </fieldset>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-surface-border bg-white px-3 py-2">
        <input type="color" value={value} onChange={onChange} aria-label={label} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
        <span className="font-mono text-sm text-ink-600">{value}</span>
      </span>
    </label>
  );
}

// Apercu du haut du catalogue public avec les couleurs choisies.
function StorePreview({ data, categoryName }) {
  const primary = data.primary_color || "#2f855a";
  const button = data.button_color || "#2f855a";
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border">
      <div className="relative h-28" style={{ backgroundColor: primary }}>
        {data.banner_url ? <img src={mediaUrl(data.banner_url)} alt="" className="h-full w-full object-cover opacity-40" /> : null}
      </div>
      <div className="-mt-8 px-5 pb-5">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-white text-white shadow-card" style={{ backgroundColor: data.logo_url ? "#fff" : primary }}>
          {data.logo_url ? <img src={mediaUrl(data.logo_url)} alt={`Logo ${data.name}`} className="h-full w-full object-cover" /> : <Store size={24} />}
        </div>
        <p className="mt-3 font-display text-lg font-bold text-ink-900">{data.name || "Nom de la boutique"}</p>
        <p className="text-xs text-ink-500">{categoryName || "Sans categorie"}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink-600">{data.welcome_message || data.description || "Ajoutez un message d'accueil pour vos clients."}</p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-3">
          <span className="text-sm font-medium text-ink-700">Exemple de produit</span>
          <span className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: button }}>Commander</span>
        </div>
      </div>
    </div>
  );
}

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

  if (!business && !error) return <PageLoading message="Chargement de la boutique..." />;

  const field = (key) => ({ value: form[key] || "", onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const formCategory = categories.find((c) => String(c.id) === String(form.category_id))?.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ma boutique"
        description="Les informations ci-dessous apparaissent sur votre catalogue public."
        actions={(
          <>
            {business?.slug ? (
              <Button tone="secondary" onClick={() => setPublicSlug?.(business.slug)}><Eye size={16} /> Voir ma boutique</Button>
            ) : null}
            <Button onClick={() => setModalOpen(true)} disabled={!business}><Edit3 size={16} /> Modifier</Button>
          </>
        )}
      />

      {error && !modalOpen ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {saved ? <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Boutique enregistree.</p> : null}

      {business ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section icon={Store} title="Identite">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-500 text-white">
                  {business.logo_url ? <img src={mediaUrl(business.logo_url)} alt={`Logo ${business.name}`} className="h-full w-full object-cover" /> : <Store size={24} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold text-ink-900">{business.name}</p>
                    <StatusPill tone={business.is_active ? "success" : "danger"}>{business.is_active ? "En ligne" : "Suspendue"}</StatusPill>
                  </div>
                  <p className="text-sm text-ink-500">{business.category?.name || "Sans categorie"} · /catalogue/{business.slug}</p>
                  <p className="mt-2 text-sm text-ink-600">{business.description || "Aucune description."}</p>
                </div>
              </div>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section icon={Phone} title="Contact">
                <div className="divide-y divide-surface-border">
                  <MetaRow label="WhatsApp">{business.whatsapp_number}</MetaRow>
                  <MetaRow label="Telephone">{business.phone_number || "Non renseigne"}</MetaRow>
                  <MetaRow label="Email">{business.email || "Non renseigne"}</MetaRow>
                  <MetaRow label="Horaires">{business.opening_hours || "Non renseignes"}</MetaRow>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm text-ink-600">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" /> {business.address || "Adresse non renseignee"}
                </p>
              </Section>

              <Section icon={Palette} title="Apparence">
                <div className="divide-y divide-surface-border">
                  <MetaRow label="Template">{business.template?.name || "Par defaut"}</MetaRow>
                  <MetaRow label="Affichage">{business.display_style === "list" ? "Liste" : "Grille"}</MetaRow>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[["Principale", business.primary_color], ["Boutons", business.button_color]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
                      <span className="h-7 w-7 shrink-0 rounded-lg border border-white shadow-card" style={{ backgroundColor: color || "#2f855a" }} />
                      <span className="min-w-0">
                        <span className="block text-xs text-ink-500">{label}</span>
                        <span className="block truncate font-mono text-xs text-ink-800">{color || "#2f855a"}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section icon={FileText} title="Textes et conditions">
              <dl className="grid gap-3 md:grid-cols-3">
                {[
                  ["Message d'accueil", business.welcome_message],
                  ["Conditions de vente", business.terms_text],
                  ["Livraison", business.delivery_policy],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-surface p-3">
                    <dt className="text-xs font-semibold text-ink-500">{label}</dt>
                    <dd className="mt-1 text-sm text-ink-700">{value || "Non renseigne"}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>

          <Section icon={ShoppingBag} title="Apercu du catalogue" className="self-start">
            <StorePreview data={business} categoryName={business.category?.name} />
          </Section>
        </div>
      ) : null}

      {modalOpen ? (
        <FormModal title="Modifier ma boutique" description="Ces informations apparaissent sur votre catalogue public." onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-6">
            <FormSection title="Identite">
              <Input label="Nom de la boutique" required {...field("name")} />
              <Select label="Categorie" {...field("category_id")}>
                <option value="">Sans categorie</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
              <Input label="Logo (URL)" {...field("logo_url")} />
              <Input label="Banniere (URL)" {...field("banner_url")} />
              <div className="md:col-span-2"><Textarea label="Description" rows={3} {...field("description")} /></div>
            </FormSection>

            <FormSection title="Contact">
              <Input label="WhatsApp" required {...field("whatsapp_number")} />
              <Input label="Telephone" {...field("phone_number")} />
              <Input label="Email boutique" type="email" {...field("email")} />
              <Input label="Horaires" {...field("opening_hours")} />
              <div className="md:col-span-2"><Input label="Adresse" {...field("address")} /></div>
            </FormSection>

            <FormSection title="Apparence">
              <Select label="Template" {...field("template_id")}>
                <option value="">Template par defaut</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.is_premium ? " · Premium" : ""}</option>)}
              </Select>
              <Select label="Affichage produits" value={form.display_style || "grid"} onChange={(e) => setForm({ ...form, display_style: e.target.value })}>
                <option value="grid">Grille</option>
                <option value="list">Liste</option>
              </Select>
              <ColorField label="Couleur principale" value={form.primary_color || "#2f855a"} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
              <ColorField label="Couleur boutons" value={form.button_color || "#2f855a"} onChange={(e) => setForm({ ...form, button_color: e.target.value })} />
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-semibold text-ink-700">Apercu</p>
                <StorePreview data={form} categoryName={formCategory} />
              </div>
            </FormSection>

            <FormSection title="Textes">
              <div className="md:col-span-2"><Textarea label="Message d'accueil" rows={3} {...field("welcome_message")} /></div>
              <div className="md:col-span-2"><Textarea label="Conditions de vente" rows={3} {...field("terms_text")} /></div>
              <div className="md:col-span-2"><Textarea label="Politique de livraison" rows={3} {...field("delivery_policy")} /></div>
            </FormSection>

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
