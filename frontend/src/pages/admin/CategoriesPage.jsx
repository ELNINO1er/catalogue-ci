import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { createAdminCategory, listAdminCategories } from "../../services/superAdminService";

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  async function load() { setItems(await listAdminCategories()); }
  useEffect(() => { load().catch(() => setItems([])); }, []);

  async function submit(event) {
    event.preventDefault();
    if (!name) return;
    await createAdminCategory({ name });
    setName("");
    setModalOpen(false);
    await load();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nouvelle categorie</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {items.map((item) => <div key={item.id} className="rounded-lg border bg-white p-4"><strong>{item.name}</strong><p className="text-sm text-slate-500">{item.slug}</p></div>)}
      </div>
      {modalOpen ? (
        <FormModal title="Nouvelle categorie" description="Les categories servent a classer les boutiques de la plateforme." onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Restaurant, Mode, Services digitaux" className="rounded-lg border px-3 py-2" />
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
