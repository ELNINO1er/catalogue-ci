import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Grid3X3, Plus, Store, Tag } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import { ListSkeleton, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar } from "../../components/ui/PageKit";
import { listBusinesses } from "../../services/businessService";
import { createAdminCategory, listAdminCategories } from "../../services/superAdminService";

const ICON_TONES = [
  "bg-brand-50 text-brand-600",
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-600",
];

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [name, setName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  async function load() { setItems(await listAdminCategories()); }

  useEffect(() => {
    Promise.all([
      load(),
      // Nombre de boutiques par categorie (indicatif ; la page reste utilisable sans).
      listBusinesses().then(setBusinesses).catch(() => setBusinesses([])),
    ])
      .catch((err) => {
        setItems([]);
        setLoadError(err.response?.data?.message || "Impossible de charger les categories.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!name) return;
    setError("");
    try {
      await createAdminCategory({ name });
      setName("");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de creer cette categorie.");
    }
  }

  const countByCategory = useMemo(() => {
    const map = new Map();
    businesses.forEach((b) => {
      if (b.category_id) map.set(Number(b.category_id), (map.get(Number(b.category_id)) || 0) + 1);
    });
    return map;
  }, [businesses]);

  const used = items.filter((c) => countByCategory.get(Number(c.id))).length;
  const uncategorized = businesses.filter((b) => !b.category_id).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => !q || `${c.name} ${c.slug}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Les categories servent a classer les boutiques de la plateforme."
        actions={<Button onClick={() => { setError(""); setModalOpen(true); }}><Plus size={16} /> Nouvelle categorie</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Categories", value: items.length, icon: Grid3X3 },
          { label: "Utilisees", value: used, icon: Tag, tone: "success" },
          { label: "Boutiques sans categorie", value: uncategorized, icon: Store, tone: uncategorized ? "warning" : "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher une categorie" />} />

      {loadError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p> : null}

      {loading ? <ListSkeleton rows={4} /> : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => {
            const count = countByCategory.get(Number(item.id)) || 0;
            return (
              <article key={item.id} className="card-hover flex items-center gap-4 p-5">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${ICON_TONES[i % ICON_TONES.length]}`}>
                  <FolderOpen size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink-900">{item.name}</h2>
                  <p className="truncate text-xs text-ink-500">/{item.slug}</p>
                </div>
                <StatusPill tone={count ? "brand" : "neutral"}>{count} boutique{count > 1 ? "s" : ""}</StatusPill>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Grid3X3}
          title={items.length ? "Aucune categorie ne correspond" : "Aucune categorie"}
          description={items.length ? "Modifiez la recherche." : "Creez une premiere categorie pour classer les boutiques."}
        />
      )}

      {modalOpen ? (
        <FormModal title="Nouvelle categorie" description="Les categories servent a classer les boutiques de la plateforme." onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-5">
            <Input label="Nom de la categorie" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Restaurant, Mode, Services digitaux" required />
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
