import { useEffect, useMemo, useState } from "react";
import { Edit3, ExternalLink, Package, PauseCircle, PlayCircle, Plus, QrCode, Store } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input, { Select, Textarea } from "../../components/ui/Input";
import {
  Avatar, CardGrid, FilterTabs, IconButton, ListSkeleton, MetaRow, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
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

const SUBSCRIPTION_LABELS = { TRIAL: "Essai", ACTIVE: "Actif", EXPIRED: "Expire", SUSPENDED: "Suspendu", CANCELLED: "Annule" };

function planLabel(subscription) {
  if (!subscription?.plan) return "Aucun plan";
  return `${subscription.plan.name} · ${SUBSCRIPTION_LABELS[subscription.status] || subscription.status}`;
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
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

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
    loadBusinesses().catch(() => setItems([])).finally(() => setLoading(false));
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

  function askToggle(business) {
    const action = business.is_active ? "suspendre" : "reactiver";
    setToggleConfirm({
      business,
      title: `${business.is_active ? "Suspendre" : "Reactiver"} la boutique`,
      message: `Voulez-vous ${action} la boutique "${business.name}" ?`,
      tone: business.is_active ? "warning" : "success",
      confirmLabel: business.is_active ? "Suspendre" : "Reactiver",
    });
  }

  async function executeToggle() {
    if (!toggleConfirm) return;
    await updateBusiness(toggleConfirm.business.id, { is_active: !toggleConfirm.business.is_active });
    setToggleConfirm(null);
    await loadBusinesses();
  }

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter((b) => b.is_active).length,
    suspended: items.filter((b) => !b.is_active).length,
    products: items.reduce((sum, b) => sum + Number(b.products_count || 0), 0),
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status === "active" && !item.is_active) return false;
      if (status === "suspended" && item.is_active) return false;
      return !q || `${item.name} ${item.slug} ${item.category?.name || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, status]);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boutiques"
        description="Chaque boutique a son catalogue public. Les comptes de connexion se gerent dans l'onglet Commercants."
        actions={<Button onClick={openCreateModal}><Plus size={16} /> Nouvelle boutique</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Boutiques", value: counts.all, icon: Store },
          { label: "En ligne", value: counts.active, icon: PlayCircle, tone: "success" },
          { label: "Suspendues", value: counts.suspended, icon: PauseCircle, tone: counts.suspended ? "danger" : "neutral" },
          { label: "Produits publies", value: counts.products, icon: Package, tone: "info" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher une boutique" />}>
        <FilterTabs
          label="Statut des boutiques"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Toutes", count: counts.all },
            { value: "active", label: "En ligne", count: counts.active },
            { value: "suspended", label: "Suspendues", count: counts.suspended },
          ]}
        />
      </Toolbar>

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((business) => (
            <article key={business.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={business.name} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink-900">{business.name}</h2>
                  <p className="truncate text-xs text-ink-500">/catalogue/{business.slug}</p>
                </div>
                <StatusPill tone={business.is_active ? "success" : "danger"}>{business.is_active ? "En ligne" : "Suspendue"}</StatusPill>
              </div>

              <div className="mt-4 divide-y divide-surface-border rounded-xl bg-surface px-3">
                <MetaRow label="Categorie">{business.category?.name || "Sans categorie"}</MetaRow>
                <MetaRow label="Plan">{planLabel(business.current_subscription)}</MetaRow>
                <MetaRow label="Template">{business.template?.name || "Par defaut"}</MetaRow>
                <MetaRow label="Produits">{business.products_count || 0}</MetaRow>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button tone="secondary" size="sm" className="flex-1" onClick={() => setPublicSlug(business.slug)}>
                  <ExternalLink size={14} /> Voir le catalogue
                </Button>
                <IconButton icon={Edit3} label="Modifier la boutique" onClick={() => openEditModal(business)} />
                <IconButton icon={QrCode} label="QR code" onClick={() => setQrBusiness(business)} />
                <IconButton
                  icon={business.is_active ? PauseCircle : PlayCircle}
                  label={business.is_active ? "Suspendre la boutique" : "Reactiver la boutique"}
                  tone={business.is_active ? "danger" : "success"}
                  onClick={() => askToggle(business)}
                />
              </div>
            </article>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Store}
          title={items.length ? "Aucune boutique ne correspond" : "Aucune boutique"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Les boutiques creees par les commercants apparaitront ici."}
        />
      )}

      {modalOpen ? (
        <FormModal
          title={editingBusiness ? "Modifier la boutique" : "Nouvelle boutique"}
          description="Le plan applique les limites d'abonnement ; le template donne le style du catalogue public."
          onClose={closeModal}
        >
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nom de la boutique" required {...field("name")} />
              <Select label="Categorie" {...field("category_id")}>
                <option value="">Sans categorie</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </Select>
              <Select label="Plan d'abonnement" {...field("plan_id")}>
                <option value="">Aucun plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {Number(plan.price).toLocaleString("fr-FR")} FCFA/mois · {plan.product_limit || "illimite"} produits
                  </option>
                ))}
              </Select>
              <Select label="Template" {...field("template_id")}>
                <option value="">Template par defaut</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.is_premium ? " · Premium" : ""}</option>)}
              </Select>
              <Input label="WhatsApp" placeholder="2250700000000" required {...field("whatsapp_number")} />
              <Input label="Telephone" {...field("phone_number")} />
              <div className="md:col-span-2"><Input label="Adresse" {...field("address")} /></div>
              <Input label="Horaires" placeholder="Lun-Sam 08h-20h" {...field("opening_hours")} />
              <label className="flex items-center gap-2 self-end rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-brand-500" />
                Boutique en ligne
              </label>
              <div className="md:col-span-2"><Textarea label="Description" rows={3} {...field("description")} /></div>
            </div>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editingBusiness ? "Enregistrer" : "Creer la boutique"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {toggleConfirm ? (
        <ConfirmModal
          title={toggleConfirm.title}
          message={toggleConfirm.message}
          tone={toggleConfirm.tone}
          confirmLabel={toggleConfirm.confirmLabel}
          onConfirm={executeToggle}
          onCancel={() => setToggleConfirm(null)}
        />
      ) : null}
    </div>
  );
}
