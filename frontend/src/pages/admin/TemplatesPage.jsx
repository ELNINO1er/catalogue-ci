import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
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
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="p-4" style={{ background: colors.background || colors.background_color || "#f8fafc" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="h-3 w-24 rounded-full" style={{ background: colors.primary || colors.primary_color || "#2f855a" }} />
            <div className="mt-2 h-2 w-16 rounded-full bg-white/80" />
          </div>
          <div className="h-8 w-8 rounded-lg" style={{ background: colors.accent || colors.accent_color || "#f6ad55" }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="h-2 w-20 rounded-full bg-slate-200" />
              <div className="mt-2 h-2 w-12 rounded-full" style={{ background: colors.primary || colors.primary_color || "#2f855a" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-slate-900">{template.name}</strong>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${template.is_premium ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {template.is_premium ? "Premium" : "Gratuit"}
          </span>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${template.is_active ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-700"}`}>
            {template.is_active ? "Actif" : "Inactif"}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{template.description || "Aucune description."}</p>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setItems(await listTemplates());
  }

  useEffect(() => {
    load().catch(() => setItems([]));
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

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Un template est un style reutilisable pour une boutique. Il se selectionne dans Boutiques, puis sert de base visuelle au catalogue public.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nouveau template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <TemplatePreview key={item.id} template={item} colors={parseColors(item.colors_json)} />
        ))}
        {!items.length ? <p className="text-sm text-slate-500">Aucun template trouve.</p> : null}
      </div>

      {modalOpen ? (
        <FormModal title="Nouveau template" description="Definissez le nom, le positionnement commercial et les couleurs principales." onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="grid gap-3">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Nom du template
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Restaurant premium" className="rounded-lg border px-3 py-2 font-normal" required />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Description
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Design adapte aux menus, plats et commandes rapides." rows={3} className="resize-none rounded-lg border px-3 py-2 font-normal" />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Primaire
                    <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 rounded-lg border px-2" />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Accent
                    <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 rounded-lg border px-2" />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Fond
                    <input type="color" value={form.background_color} onChange={(e) => setForm({ ...form, background_color: e.target.value })} className="h-10 rounded-lg border px-2" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
                  Template premium
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Disponible pour les boutiques
                </label>
              </div>
              <TemplatePreview
                template={previewTemplate}
                colors={{ primary: form.primary_color, accent: form.accent_color, background: form.background_color }}
              />
            </div>
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
