import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit3, ImageIcon, Package, Plus, SlidersHorizontal, Tag, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input, { Textarea } from "../../components/ui/Input";
import CustomFieldsEditor from "../../components/common/CustomFieldsEditor";
import FormModal from "../../components/modals/FormModal";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  CardGrid, FilterTabs, IconButton, ListSkeleton, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { me } from "../../services/authService";
import { createProduct, deleteProduct, listProductsByBusiness, updateProduct, uploadProductImage } from "../../services/productService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";

const emptyForm = {
  name: "",
  price: "",
  image_file: null,
  image_preview: "",
  description: "",
  category: "",
  is_available: true,
};

// Carte produit facon vitrine ; les champs personnalises sont repliables.
function ProductCard({ product, onEdit, onDelete }) {
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const available = product.is_available !== false;

  return (
    <article className="card-hover flex flex-col overflow-hidden">
      <div className="relative">
        {product.image_url ? (
          <img src={mediaUrl(product.image_url)} alt={product.name} className="h-44 w-full object-cover" />
        ) : (
          <div className="grid h-44 place-items-center bg-surface text-ink-300">
            <ImageIcon size={32} aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusPill tone={available ? "success" : "neutral"} className="bg-white/95 shadow-card">{available ? "Disponible" : "Indisponible"}</StatusPill>
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <IconButton icon={Edit3} label={`Modifier ${product.name}`} onClick={() => onEdit(product)} />
          <IconButton icon={Trash2} label={`Supprimer ${product.name}`} tone="danger" onClick={() => onDelete(product)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.category ? (
          <StatusPill tone="brand" icon={Tag} className="self-start">{product.category}</StatusPill>
        ) : null}
        <h2 className="mt-2 truncate font-display text-base font-bold text-ink-900">{product.name}</h2>
        {product.description ? <p className="mt-1 line-clamp-2 text-sm text-ink-500">{product.description}</p> : null}
        <p className="mt-3 font-display text-2xl font-bold text-ink-900">
          {fmt(product.price)} <span className="text-sm font-semibold text-ink-500">FCFA</span>
        </p>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => setFieldsOpen((v) => !v)}
            aria-expanded={fieldsOpen}
            className="flex w-full items-center justify-between rounded-xl border border-surface-border px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            <span className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-brand-500" /> Champs personnalises</span>
            <ChevronDown size={16} className={`text-ink-400 transition-transform ${fieldsOpen ? "rotate-180" : ""}`} />
          </button>
          {fieldsOpen ? <CustomFieldsEditor product={product} /> : null}
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  async function loadProducts() {
    if (!businessId) return;
    setProducts(await listProductsByBusiness(businessId));
  }

  useEffect(() => {
    if (!businessId) return;
    loadProducts().catch(() => setProducts([])).finally(() => setLoading(false));
  }, [businessId]);

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      image_file: null,
      image_preview: product.image_url ? mediaUrl(product.image_url) : "",
      description: product.description || "",
      category: product.category || "",
      is_available: product.is_available !== false,
    });
    setError("");
    setModalOpen(true);
  }

  async function addProduct(event) {
    event.preventDefault();
    setError("");
    if (!form.name || form.price === "" || !businessId) return;
    try {
      // Nouvelle image envoyee seulement si le commercant en a choisi une.
      const uploadedUrl = form.image_file ? await uploadProductImage(businessId, form.image_file) : null;
      const payload = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category: form.category || null,
        is_available: form.is_available,
      };
      if (editing) {
        await updateProduct(editing.id, uploadedUrl ? { ...payload, image_url: uploadedUrl } : payload);
      } else {
        await createProduct(businessId, { ...payload, image_url: uploadedUrl });
      }
      closeModal();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'enregistrer ce produit.");
    }
  }

  async function removeProduct() {
    if (!deleteConfirm) return;
    await deleteProduct(deleteConfirm.id);
    setDeleteConfirm(null);
    await loadProducts();
  }

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      return !q || `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase().includes(q);
    });
  }, [products, query, category]);

  const availableCount = products.filter((p) => p.is_available !== false).length;
  const averagePrice = products.length ? Math.round(products.reduce((s, p) => s + Number(p.price || 0), 0) / products.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produits et services"
        description="Ajoutez vos produits ou services, puis configurez les informations a demander au client."
        actions={<Button onClick={openCreate}><Plus size={16} /> Nouveau produit</Button>}
      />

      <SummaryStrip
        items={[
          { label: "Produits", value: fmt(products.length), icon: Package },
          { label: "Disponibles", value: fmt(availableCount), icon: Package, tone: "success" },
          { label: "Categories", value: fmt(categories.length), icon: Tag, tone: "info" },
          { label: "Prix moyen", value: `${fmt(averagePrice)} FCFA`, icon: Tag, tone: "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher un produit" />}>
        {categories.length ? (
          <FilterTabs
            label="Categorie de produit"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "Tous", count: products.length },
              ...categories.map((c) => ({ value: c, label: c, count: products.filter((p) => p.category === c).length })),
            ]}
          />
        ) : null}
      </Toolbar>

      {loading && businessId !== undefined ? <ListSkeleton /> : visible.length ? (
        <CardGrid>
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} onEdit={openEdit} onDelete={setDeleteConfirm} />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Package}
          title={products.length ? "Aucun produit ne correspond" : "Aucun produit pour le moment"}
          description={products.length ? "Modifiez la recherche ou la categorie." : "Ajoutez votre premier produit pour remplir votre catalogue."}
          action={products.length ? null : <Button onClick={openCreate}><Plus size={16} /> Ajouter un produit</Button>}
        />
      )}

      {modalOpen ? (
        <FormModal title={editing ? `Modifier ${editing.name}` : "Nouveau produit / service"} description="Ajoutez une image depuis votre ordinateur. Formats acceptes : JPG, PNG, WEBP ou GIF." onClose={closeModal}>
          <form onSubmit={addProduct} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nom" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input label="Prix (FCFA)" type="number" min="0" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              <label className="grid gap-1.5 md:col-span-2">
                <span className="text-sm font-semibold text-ink-700">Image produit</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setForm({
                      ...form,
                      image_file: file,
                      image_preview: file ? URL.createObjectURL(file) : "",
                    });
                  }}
                  className="rounded-xl border border-dashed border-ink-300 bg-surface px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:font-semibold file:text-white hover:border-brand-300"
                />
                {form.image_preview ? (
                  <img src={form.image_preview} alt="Apercu produit" className="h-40 w-full rounded-xl object-cover" />
                ) : null}
              </label>
              <Input label="Categorie produit" placeholder="Abonnement digital, Restaurant..." value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              <label className="flex items-center gap-2 self-end rounded-xl border border-surface-border px-4 py-3 text-sm font-semibold text-ink-700">
                <input type="checkbox" checked={form.is_available} onChange={(event) => setForm({ ...form, is_available: event.target.checked })} className="h-4 w-4 accent-brand-500" />
                Disponible a la commande
              </label>
              <div className="md:col-span-2">
                <Textarea label="Description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
            </div>
            {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">{editing ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {deleteConfirm ? (
        <ConfirmModal
          title="Supprimer le produit"
          message={`Supprimer "${deleteConfirm.name}" ? Cette action est irreversible et supprimera aussi les champs personnalises associes.`}
          tone="danger"
          confirmLabel="Supprimer"
          onConfirm={removeProduct}
          onCancel={() => setDeleteConfirm(null)}
        />
      ) : null}
    </div>
  );
}
