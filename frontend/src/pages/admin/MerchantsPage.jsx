import { useEffect, useState } from "react";
import { Edit3, PauseCircle, PlayCircle, Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { createMerchant, listBusinesses, listMerchants, toggleMerchant, updateMerchant } from "../../services/businessService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  business_id: "",
};

export default function MerchantsPage() {
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [merchants, businessList] = await Promise.all([listMerchants(), listBusinesses()]);
    setItems(merchants);
    setBusinesses(businessList);
  }

  useEffect(() => {
    load().catch(() => {
      setItems([]);
      setBusinesses([]);
    });
  }, []);

  function openCreateModal() {
    setEditingMerchant(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(merchant) {
    setEditingMerchant(merchant);
    setForm({
      name: merchant.name || "",
      email: merchant.email || "",
      password: "",
      business_id: merchant.business_id || "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingMerchant(null);
    setForm(emptyForm);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      business_id: form.business_id || null,
    };
    if (editingMerchant && !payload.password) {
      delete payload.password;
    }

    try {
      if (editingMerchant) {
        await updateMerchant(editingMerchant.id, payload);
      } else {
        await createMerchant(payload);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer ce commercant.");
    }
  }

  async function setMerchantActive(merchant, isActive) {
    await toggleMerchant(merchant.id, isActive);
    await load();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commercants</h1>
          <p className="mt-1 text-sm text-slate-500">
            Desactiver un commercant bloque sa connexion. Suspendre une boutique se fait dans l'onglet Boutiques.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Nouveau commercant
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {items.map((merchant) => (
          <div key={merchant.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 lg:grid-cols-[1.1fr_1.3fr_1.1fr_auto] lg:items-center">
            <p className="font-semibold text-slate-900">{merchant.name}</p>
            <p className="text-sm text-slate-600">{merchant.email}</p>
            <div>
              <p className="text-sm text-slate-600">{merchant.business?.name || "Non associe"}</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${merchant.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {merchant.is_active ? "Connexion active" : "Connexion suspendue"}
              </span>
            </div>
            <div className="flex justify-start gap-2 lg:justify-end">
              <Button tone="secondary" onClick={() => openEditModal(merchant)} title="Modifier le commercant">
                <Edit3 size={16} />
              </Button>
              {merchant.is_active ? (
                <Button tone="secondary" onClick={() => setMerchantActive(merchant, false)} title="Suspendre la connexion">
                  <PauseCircle size={16} />
                </Button>
              ) : (
                <Button tone="secondary" onClick={() => setMerchantActive(merchant, true)} title="Reactiver la connexion">
                  <PlayCircle size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun commercant trouve.</p> : null}
      </div>

      {modalOpen ? (
        <FormModal
          title={editingMerchant ? "Modifier le commercant" : "Nouveau commercant"}
          description="Un compte commercant permet de se connecter et de gerer la boutique associee."
          onClose={closeModal}
        >
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Nom
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Email de connexion
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Mot de passe
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-lg border px-3 py-2 font-normal"
                placeholder={editingMerchant ? "Laisser vide pour ne pas changer" : "Ex: Strong123@"}
                required={!editingMerchant}
              />
              <span className="text-xs font-normal text-slate-500">Minimum 8 caracteres, majuscule, minuscule, chiffre et caractere special.</span>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Boutique associee
              <select value={form.business_id} onChange={(e) => setForm({ ...form, business_id: e.target.value })} className="rounded-lg border px-3 py-2 font-normal">
                <option value="">Aucune boutique</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            </label>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editingMerchant ? "Enregistrer" : "Creer le compte"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
