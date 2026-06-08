import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { createPlan, listPlans } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", product_limit: "", order_limit: "" });
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setPlans(await listPlans());
  }

  useEffect(() => { load().catch(() => setPlans([])); }, []);

  async function submit(event) {
    event.preventDefault();
    if (!form.name) return;
    await createPlan({
      ...form,
      price: Number(form.price || 0),
      product_limit: form.product_limit || null,
      order_limit: form.order_limit || null,
    });
    setForm({ name: "", price: "", product_limit: "", order_limit: "" });
    setModalOpen(false);
    await load();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nouveau plan</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-bold">{plan.name}</p>
            <p className="text-emerald-700 font-semibold">{fmt(plan.price)} FCFA/mois</p>
            <p className="text-sm text-slate-500">Produits: {plan.product_limit || "Illimite"} - Commandes: {plan.order_limit || "Illimite"}</p>
          </div>
        ))}
      </div>
      {modalOpen ? (
        <FormModal title="Nouveau plan" description="Definissez les limites commerciales d'une offre mensuelle." onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="rounded-lg border px-3 py-2" />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Prix mensuel" type="number" className="rounded-lg border px-3 py-2" />
            <input value={form.product_limit} onChange={(e) => setForm({ ...form, product_limit: e.target.value })} placeholder="Limite produits" type="number" className="rounded-lg border px-3 py-2" />
            <input value={form.order_limit} onChange={(e) => setForm({ ...form, order_limit: e.target.value })} placeholder="Limite commandes" type="number" className="rounded-lg border px-3 py-2" />
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
