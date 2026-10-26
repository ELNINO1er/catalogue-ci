import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Edit3, Gift, Layers, Plus, Star } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import { CardGrid, ListSkeleton, PageHeader, StatusPill, SummaryStrip } from "../../components/ui/PageKit";
import api from "../../services/api";
import { createPlan, listPlans } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

const emptyForm = { name: "", price: "", product_limit: "", order_limit: "", is_active: true };

const featureLabels = {
  custom_fields: "Champs personnalises",
  advanced_stats: "Statistiques avancees",
  pdf_catalog: "Catalogue PDF",
  promo_codes: "Codes promo",
  premium_templates: "Templates premium",
  multi_staff: "Multi-utilisateurs",
};

function parseFeatures(plan) {
  if (!plan?.features_json) return [];
  try {
    const parsed = typeof plan.features_json === "string" ? JSON.parse(plan.features_json) : plan.features_json;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return Object.keys(parsed).filter((key) => parsed[key]);
    return [];
  } catch {
    return [];
  }
}

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  async function load() {
    setPlans(await listPlans());
  }

  useEffect(() => {
    load()
      .catch((err) => {
        setPlans([]);
        setLoadError(err.response?.data?.message || "Impossible de charger les plans.");
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingPlan(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      price: plan.price ?? "",
      product_limit: plan.product_limit ?? "",
      order_limit: plan.order_limit ?? "",
      is_active: plan.is_active !== false,
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name) return;
    setError("");
    const payload = {
      ...form,
      price: Number(form.price || 0),
      product_limit: form.product_limit || null,
      order_limit: form.order_limit || null,
    };
    try {
      if (editingPlan) {
        await api.put(`/super-admin/plans/${editingPlan.id}`, payload);
      } else {
        await createPlan(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer ce plan.");
    }
  }

  const counts = useMemo(() => ({
    all: plans.length,
    active: plans.filter((p) => p.is_active !== false).length,
    free: plans.filter((p) => Number(p.price) === 0).length,
    paid: plans.filter((p) => Number(p.price) > 0).length,
  }), [plans]);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Les offres mensuelles et leurs limites de produits et de commandes."
        actions={<Button onClick={openCreate}><Plus size={16} /> Nouveau plan</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Plans", value: counts.all, icon: Layers },
          { label: "Actifs", value: counts.active, icon: Star, tone: "success" },
          { label: "Gratuits", value: counts.free, icon: Gift, tone: "info" },
          { label: "Payants", value: counts.paid, icon: Crown, tone: "warning" },
        ]}
      />

      {loadError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p> : null}

      {loading ? <ListSkeleton /> : plans.length ? (
        <CardGrid>
          {plans.map((plan) => {
            const features = parseFeatures(plan);
            const isFree = Number(plan.price) === 0;
            return (
              <article key={plan.id} className="card-hover flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${isFree ? "bg-sky-50 text-sky-600" : "bg-brand-50 text-brand-600"}`}>
                      {isFree ? <Gift size={18} /> : <Crown size={18} />}
                    </span>
                    <h2 className="font-display text-lg font-bold text-ink-900">{plan.name}</h2>
                  </div>
                  <StatusPill tone={plan.is_active !== false ? "success" : "neutral"}>{plan.is_active !== false ? "Actif" : "Inactif"}</StatusPill>
                </div>

                <p className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold text-ink-900">{isFree ? "Gratuit" : fmt(plan.price)}</span>
                  {!isFree ? <span className="text-sm text-ink-500">FCFA / mois</span> : null}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-600">
                  <li className="flex items-center gap-2"><Check size={14} className="shrink-0 text-brand-500" />{plan.product_limit ? `${fmt(plan.product_limit)} produits` : "Produits illimites"}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="shrink-0 text-brand-500" />{plan.order_limit ? `${fmt(plan.order_limit)} commandes / mois` : "Commandes illimitees"}</li>
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check size={14} className="shrink-0 text-brand-500" />{featureLabels[f] || f}</li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-2 border-t border-surface-border pt-4">
                  <Button tone="secondary" size="sm" className="flex-1" onClick={() => openEdit(plan)} aria-label={`Modifier le plan ${plan.name}`}>
                    <Edit3 size={14} /> Modifier
                  </Button>
                </div>
              </article>
            );
          })}
        </CardGrid>
      ) : (
        <EmptyState icon={Layers} title="Aucun plan" description="Creez une premiere offre pour les commercants." />
      )}

      {modalOpen ? (
        <FormModal
          title={editingPlan ? "Modifier le plan" : "Nouveau plan"}
          description="Definissez les limites commerciales d'une offre mensuelle. Laissez une limite vide pour illimite."
          onClose={closeModal}
        >
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nom" placeholder="Ex: Pro" required {...field("name")} />
              <Input label="Prix mensuel (FCFA)" type="number" min="0" {...field("price")} />
              <Input label="Limite produits" type="number" min="0" placeholder="Illimite" {...field("product_limit")} />
              <Input label="Limite commandes / mois" type="number" min="0" placeholder="Illimite" {...field("order_limit")} />
              {editingPlan ? (
                <label className="flex items-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700 md:col-span-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-brand-500" />
                  Plan propose aux commercants
                </label>
              ) : null}
            </div>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editingPlan ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
