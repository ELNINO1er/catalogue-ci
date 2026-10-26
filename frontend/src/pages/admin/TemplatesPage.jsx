import { useEffect, useMemo, useState } from "react";
import { Crown, Gift, Palette, Plus, Power } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input, { Textarea } from "../../components/ui/Input";
import FormModal from "../../components/modals/FormModal";
import { CardGrid, FilterTabs, ListSkeleton, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar } from "../../components/ui/PageKit";
import { createTemplate, listTemplates } from "../../services/superAdminService";

const emptyForm = {
  name: "",
  description: "",
  primary_color: "#2f855a",
  accent_color: "#f6ad55",
  background_color: "#f8fafc",
  is_premium: false,
  is_active: true,
};

function parseColors(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function TemplatePreview({ template, colors }) {
  const primary = colors.primary || colors.primary_color || "#2f855a";
  const accent = colors.accent || colors.accent_color || "#f6ad55";
  const background = colors.background || colors.background_color || "#f8fafc";
  return (
    <article className="card-hover flex flex-col overflow-hidden">
      <div className="p-4" style={{ background }} aria-hidden="true">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="h-3 w-24 rounded-full" style={{ background: primary }} />
            <div className="mt-2 h-2 w-16 rounded-full bg-white/80" />
          </div>
          <div className="h-8 w-8 rounded-lg" style={{ background: accent }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="h-2 w-20 rounded-full bg-ink-200" />
              <div className="mt-2 h-2 w-12 rounded-full" style={{ background: primary }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="truncate font-display text-base font-bold text-ink-900">{template.name}</h2>
          <StatusPill tone={template.is_active ? "success" : "neutral"}>{template.is_active ? "Actif" : "Inactif"}</StatusPill>
        </div>
        <div className="mt-2">
          <StatusPill tone={template.is_premium ? "warning" : "info"} icon={template.is_premium ? Crown : Gift}>
            {template.is_premium ? "Premium" : "Gratuit"}
          </StatusPill>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-ink-500">{template.description || "Aucune description."}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-surface-border pt-3 text-xs text-ink-500">
          {[["Primaire", primary], ["Accent", accent], ["Fond", background]].map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full border border-surface-border" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function TemplatesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");

  async function load() {
    setItems(await listTemplates());
  }

  useEffect(() => {
    load()
      .catch((err) => {
        setItems([]);
        setLoadError(err.response?.data?.message || "Impossible de charger les templates.");
      })
      .finally(() => setLoading(false));
  }, []);

  const previewTemplate = useMemo(
    () => ({
      name: form.name || "Apercu template",
      description: form.description || "Ce rendu sera disponible dans la creation ou modification d'une boutique.",
      is_premium: form.is_premium,
      is_active: form.is_active,
    }),
    [form]
  );

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.name) return;

    try {
      await createTemplate({
        name: form.name,
        description: form.description,
        is_premium: form.is_premium,
        is_active: form.is_active,
        colors_json: {
          primary: form.primary_color,
          accent: form.accent_color,
          background: form.background_color,
        },
      });
      setForm(emptyForm);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de creer ce template.");
    }
  }

  const counts = useMemo(() => ({
    all: items.length,
    free: items.filter((t) => !t.is_premium).length,
    premium: items.filter((t) => t.is_premium).length,
    active: items.filter((t) => t.is_active).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      if (kind === "free" && t.is_premium) return false;
      if (kind === "premium" && !t.is_premium) return false;
      return !q || `${t.name} ${t.description || ""}`.toLowerCase().includes(q);
    });
  }, [items, kind, query]);

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Un template est un style reutilisable pour une boutique. Il se selectionne dans Boutiques, puis sert de base visuelle au catalogue public."
        actions={<Button onClick={() => { setError(""); setModalOpen(true); }}><Plus size={16} /> Nouveau template</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Templates", value: counts.all, icon: Palette },
          { label: "Disponibles", value: counts.active, icon: Power, tone: "success" },
          { label: "Gratuits", value: counts.free, icon: Gift, tone: "info" },
          { label: "Premium", value: counts.premium, icon: Crown, tone: "warning" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher un template" />}>
        <FilterTabs
          label="Type de template"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "free", label: "Gratuits", count: counts.free },
            { value: "premium", label: "Premium", count: counts.premium },
          ]}
        />
      </Toolbar>

      {loadError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p> : null}

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((item) => (
            <TemplatePreview key={item.id} template={item} colors={parseColors(item.colors_json)} />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Palette}
          title={items.length ? "Aucun template ne correspond" : "Aucun template"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Creez un premier style pour les boutiques."}
        />
      )}

      {modalOpen ? (
        <FormModal title="Nouveau template" description="Definissez le nom, le positionnement commercial et les couleurs principales." onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-[1fr_260px]">
              <div className="grid content-start gap-4">
                <Input label="Nom du template" placeholder="Restaurant premium" required {...field("name")} />
                <Textarea label="Description" placeholder="Design adapte aux menus, plats et commandes rapides." rows={3} {...field("description")} />
                <div className="grid gap-3 sm:grid-cols-3">
                  {[["primary_color", "Primaire"], ["accent_color", "Accent"], ["background_color", "Fond"]].map(([key, label]) => (
                    <label key={key} className="grid gap-1.5">
                      <span className="text-sm font-semibold text-ink-700">{label}</span>
                      <input type="color" {...field(key)} className="h-11 w-full cursor-pointer rounded-xl border border-surface-border bg-white px-1.5" />
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                  <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} className="h-4 w-4 accent-brand-500" />
                  Template premium
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-brand-500" />
                  Disponible pour les boutiques
                </label>
              </div>
              <TemplatePreview
                template={previewTemplate}
                colors={{ primary: form.primary_color, accent: form.accent_color, background: form.background_color }}
              />
            </div>
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
