import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, PauseCircle, PlayCircle, Plus, QrCode, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { createBusiness, listBusinesses, updateBusiness } from "../../services/businessService";
import { listAdminCategories, listPlans, listTemplates } from "../../services/superAdminService";

const emptyForm = {
  name: "",
  category_id: "",
  template_id: "",
  plan_id: "",
  whatsapp_number: "",
  phone_number: "",
  address: "",
  opening_hours: "",
  description: "",
  is_active: true,
};

function planLabel(subscription) {
  if (!subscription?.plan) return "Aucun plan";
  return `${subscription.plan.name} - ${subscription.status}`;
}

export default function BusinessesPage({ setPublicSlug, setQrBusiness }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadBusinesses() {
    setItems(await listBusinesses());
  }

  async function loadReferences() {
    const [categoryList, planList, templateList] = await Promise.all([
      listAdminCategories(),
      listPlans(),
      listTemplates(),
    ]);
    setCategories(categoryList);
    setPlans(planList.filter((plan) => plan.is_active));
    setTemplates(templateList.filter((template) => template.is_active));
  }

  useEffect(() => {
    loadBusinesses().catch(() => setItems([]));
    loadReferences().catch(() => {
      setCategories([]);
      setPlans([]);
      setTemplates([]);
    });
  }, []);

  function openCreateModal() {
    setEditingBusiness(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(business) {
    setEditingBusiness(business);
    setForm({
      name: business.name || "",
      category_id: business.category_id || "",
      template_id: business.template_id || "",
      plan_id: business.current_subscription?.plan_id || "",
      whatsapp_number: business.whatsapp_number || "",
      phone_number: business.phone_number || "",
      address: business.address || "",
      opening_hours: business.opening_hours || "",
      description: business.description || "",
      is_active: Boolean(business.is_active),
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBusiness(null);
    setForm(emptyForm);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      category_id: form.category_id || null,
      template_id: form.template_id || null,
      plan_id: form.plan_id || null,
      phone_number: form.phone_number || form.whatsapp_number,
      google_maps_url: form.address ? `https://maps.google.com/?q=${encodeURIComponent(form.address)}` : null,
    };

    try {
      if (editingBusiness) {
        await updateBusiness(editingBusiness.id, payload);
      } else {
        await createBusiness(payload);
      }
      closeModal();
      await loadBusinesses();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer cette boutique.");
    }
  }

  async function toggleBusiness(business) {
    await updateBusiness(business.id, { is_active: !business.is_active });
    await loadBusinesses();
  }

  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boutiques</h1>
          <p className="mt-1 text-sm text-slate-500">
            Une boutique gere le catalogue public. Le compte commercant est gere dans l'onglet Commercants.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Nouvelle boutique
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.map((business) => (
          <div key={business.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{business.name}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${business.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {business.is_active ? "Active" : "Suspendue"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                /catalogue/{business.slug} - {business.products_count || 0} produits
              </p>
            </div>
            <p className="text-sm text-slate-600">{planLabel(business.current_subscription)}</p>
            <p className="text-sm text-slate-600">{business.template?.name || "Template par defaut"}</p>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <Button tone="secondary" onClick={() => openEditModal(business)} title="Modifier la boutique">
                <Edit3 size={16} />
              </Button>
              <Button tone="secondary" onClick={() => toggleBusiness(business)} title={business.is_active ? "Suspendre la boutique" : "Reactiver la boutique"}>
                {business.is_active ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
              </Button>
              <Button tone="secondary" onClick={() => setQrBusiness(business)} title="Generer le QR code">
                <QrCode size={16} />
              </Button>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)} title="Voir le catalogue">
                <Eye size={16} />
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length ? <p className="p-4 text-sm text-slate-500">Aucune boutique trouvee.</p> : null}
      </div>

      {modalOpen ? (
        <FormModal
          title={editingBusiness ? "Modifier la boutique" : "Nouvelle boutique"}
          description="Choisissez un plan pour activer les limites d'abonnement et un template pour le rendu public."
          onClose={closeModal}
        >
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Nom de la boutique
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Categorie
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-lg border px-3 py-2 font-normal">
                  <option value="">Sans categorie</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Plan d'abonnement
                <select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} className="rounded-lg border px-3 py-2 font-normal">
                  <option value="">Aucun plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {Number(plan.price).toLocaleString("fr-FR")} FCFA/mois - {plan.product_limit || "illimite"} produits
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Template
                <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className="rounded-lg border px-3 py-2 font-normal">
                  <option value="">Template par defaut</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.is_premium ? " - Premium" : ""}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                WhatsApp
                <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" placeholder="2250700000000" required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Telephone
                <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
                Adresse
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Horaires
                <input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" placeholder="Lun-Sam 08h-20h" />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Boutique active
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
                Description
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none rounded-lg border px-3 py-2 font-normal" />
              </label>
            </div>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editingBusiness ? "Enregistrer" : "Creer la boutique"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
