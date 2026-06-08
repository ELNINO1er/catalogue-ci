import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { createPaymentMethod, listPaymentMethods, updatePaymentMethod } from "../../services/businessService";

export default function PaymentsPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setItems(await listPaymentMethods());
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await createPaymentMethod({ name });
      setName("");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de creer cette methode.");
    }
  }

  async function toggle(method) {
    await updatePaymentMethod(method.id, { is_active: !method.is_active });
    await load();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Methodes paiement</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ces methodes sont globales. Elles definissent ce que la plateforme peut proposer aux boutiques.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nouvelle methode
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.code}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {item.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
            <Button tone="secondary" className="mt-4 w-full" onClick={() => toggle(item)}>
              {item.is_active ? "Desactiver" : "Activer"}
            </Button>
          </div>
        ))}
      </div>
      {!items.length ? <p className="text-sm text-slate-500">Aucun moyen de paiement. Lancez le seeder.</p> : null}

      {modalOpen ? (
        <FormModal
          title="Nouvelle methode de paiement"
          description="Exemples : Wave, Orange Money, MTN Money, Especes, Virement bancaire."
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Nom
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border px-3 py-2 font-normal" required />
            </label>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
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
