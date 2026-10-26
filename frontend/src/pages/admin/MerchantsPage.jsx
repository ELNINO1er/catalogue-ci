import { useEffect, useMemo, useState } from "react";
import { Edit3, Link2Off, PauseCircle, PlayCircle, Plus, UserCheck, Users, UserX } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input, { Select } from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  Avatar, CardGrid, FilterTabs, IconButton, ListSkeleton, MetaRow, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { createMerchant, listBusinesses, listMerchants, toggleMerchant, updateMerchant } from "../../services/businessService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  business_id: "",
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function MerchantsPage() {
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [merchants, businessList] = await Promise.all([listMerchants(), listBusinesses()]);
    setItems(merchants);
    setBusinesses(businessList);
  }

  useEffect(() => {
    load()
      .catch((err) => {
        setItems([]);
        setBusinesses([]);
        setLoadError(err.response?.data?.message || "Impossible de charger les commercants.");
      })
      .finally(() => setLoading(false));
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

  function askToggle(merchant, isActive) {
    const action = isActive ? "reactiver" : "suspendre";
    setToggleConfirm({
      merchant, isActive,
      title: `${isActive ? "Reactiver" : "Suspendre"} le compte`,
      message: `Voulez-vous ${action} le compte de "${merchant.name}" ?`,
      tone: isActive ? "success" : "warning",
      confirmLabel: isActive ? "Reactiver" : "Suspendre",
    });
  }

  async function executeToggle() {
    if (!toggleConfirm) return;
    await toggleMerchant(toggleConfirm.merchant.id, toggleConfirm.isActive);
    setToggleConfirm(null);
    await load();
  }

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter((m) => m.is_active).length,
    disabled: items.filter((m) => !m.is_active).length,
    unlinked: items.filter((m) => !m.business_id).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((merchant) => {
      if (status === "active" && !merchant.is_active) return false;
      if (status === "disabled" && merchant.is_active) return false;
      return !q || `${merchant.name} ${merchant.email} ${merchant.business?.name || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, status]);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercants"
        description="Desactiver un commercant bloque sa connexion. Suspendre une boutique se fait dans l'onglet Boutiques."
        actions={<Button onClick={openCreateModal}><Plus size={16} /> Nouveau commercant</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Commercants", value: counts.all, icon: Users },
          { label: "Connexion active", value: counts.active, icon: UserCheck, tone: "success" },
          { label: "Connexion suspendue", value: counts.disabled, icon: UserX, tone: counts.disabled ? "danger" : "neutral" },
          { label: "Sans boutique", value: counts.unlinked, icon: Link2Off, tone: counts.unlinked ? "warning" : "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher un commercant" />}>
        <FilterTabs
          label="Statut des comptes"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "active", label: "Actifs", count: counts.active },
            { value: "disabled", label: "Desactives", count: counts.disabled },
          ]}
        />
      </Toolbar>

      {loadError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p> : null}

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((merchant) => (
            <article key={merchant.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={merchant.name} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink-900">{merchant.name}</h2>
                  <p className="truncate text-xs text-ink-500">{merchant.email}</p>
                </div>
                <StatusPill tone={merchant.is_active ? "success" : "danger"}>{merchant.is_active ? "Actif" : "Suspendu"}</StatusPill>
              </div>

              <div className="mt-4 flex-1 divide-y divide-surface-border rounded-xl bg-surface px-3">
                <MetaRow label="Boutique">{merchant.business?.name || "Non associe"}</MetaRow>
                <MetaRow label="Connexion">{merchant.is_active ? "Autorisee" : "Bloquee"}</MetaRow>
                <MetaRow label="Inscrit le">{formatDate(merchant.created_at)}</MetaRow>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button tone="secondary" size="sm" className="flex-1" onClick={() => openEditModal(merchant)}>
                  <Edit3 size={14} /> Modifier
                </Button>
                {merchant.is_active ? (
                  <IconButton icon={PauseCircle} label="Suspendre la connexion" tone="danger" onClick={() => askToggle(merchant, false)} />
                ) : (
                  <IconButton icon={PlayCircle} label="Reactiver la connexion" tone="success" onClick={() => askToggle(merchant, true)} />
                )}
              </div>
            </article>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Users}
          title={items.length ? "Aucun commercant ne correspond" : "Aucun commercant"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Les comptes commercants apparaitront ici."}
        />
      )}

      {modalOpen ? (
        <FormModal
          title={editingMerchant ? "Modifier le commercant" : "Nouveau commercant"}
          description="Un compte commercant permet de se connecter et de gerer la boutique associee."
          onClose={closeModal}
        >
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nom" required {...field("name")} />
              <Input label="Email de connexion" type="email" required {...field("email")} />
              <div className="grid gap-1.5">
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder={editingMerchant ? "Laisser vide pour ne pas changer" : "Ex: Strong123@"}
                  required={!editingMerchant}
                  {...field("password")}
                />
                <span className="text-xs text-ink-500">Minimum 8 caracteres, majuscule, minuscule, chiffre et caractere special.</span>
              </div>
              <Select label="Boutique associee" {...field("business_id")}>
                <option value="">Aucune boutique</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </Select>
            </div>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editingMerchant ? "Enregistrer" : "Creer le compte"}</Button>
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
