import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, PauseCircle, PlayCircle, Plus, Wallet } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import {
  Avatar, CardGrid, FilterTabs, ListSkeleton, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { createPaymentMethod, listPaymentMethods, updatePaymentMethod } from "../../services/businessService";

export default function PaymentsPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    setItems(await listPaymentMethods());
  }

  useEffect(() => {
    load().catch(() => setItems([])).finally(() => setLoading(false));
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

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter((m) => m.is_active).length,
    inactive: items.filter((m) => !m.is_active).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status === "active" && !item.is_active) return false;
      if (status === "inactive" && item.is_active) return false;
      return !q || `${item.name} ${item.code || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moyens de paiement"
        description="Methodes globales que la plateforme peut proposer aux boutiques."
        actions={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nouvelle methode</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Methodes", value: counts.all, icon: Wallet },
          { label: "Actives", value: counts.active, icon: CheckCircle2, tone: "success" },
          { label: "Inactives", value: counts.inactive, icon: PauseCircle, tone: "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher une methode" />}>
        <FilterTabs
          label="Statut des methodes"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Toutes", count: counts.all },
            { value: "active", label: "Actives", count: counts.active },
            { value: "inactive", label: "Inactives", count: counts.inactive },
          ]}
        />
      </Toolbar>

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((item) => (
            <article key={item.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={item.name} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink-900">{item.name}</h2>
                  <p className="truncate text-xs text-ink-500">Code : {item.code || "-"}</p>
                </div>
                <StatusPill tone={item.is_active ? "success" : "neutral"}>{item.is_active ? "Active" : "Inactive"}</StatusPill>
              </div>
              <Button
                tone={item.is_active ? "secondary" : "primary"}
                size="sm"
                className="mt-5 w-full"
                onClick={() => toggle(item)}
              >
                {item.is_active ? <><PauseCircle size={14} /> Desactiver</> : <><PlayCircle size={14} /> Activer</>}
              </Button>
            </article>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={CreditCard}
          title={items.length ? "Aucune methode ne correspond" : "Aucun moyen de paiement"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Ajoutez une methode ou lancez le seeder."}
        />
      )}

      {modalOpen ? (
        <FormModal
          title="Nouvelle methode de paiement"
          description="Exemples : Wave, Orange Money, MTN Money, Especes, Virement bancaire."
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={submit} className="grid gap-5">
            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
