import { useEffect, useState } from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import CustomFieldsEditor from "../../components/common/CustomFieldsEditor";
import FormModal from "../../components/modals/FormModal";
import { me } from "../../services/authService";
import { createProduct, deleteProduct, listProductsByBusiness, uploadProductImage } from "../../services/productService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";

const emptyForm = {
  name: "",
  price: "",
  image_file: null,
  image_preview: "",
  description: "",
  category: "",
};

const inputClass = "rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function ProductsPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    me().then(setProfile).catch(() => {});
  }, []);

  const businessId = profile?.business?.id || profile?.business_id;

  async function loadProducts() {
    if (!businessId) return;
    setProducts(await listProductsByBusiness(businessId));
  }

  useEffect(() => {
    loadProducts().catch(() => setProducts([]));
  }, [businessId]);

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setError("");
  }

  async function addProduct(event) {
    event.preventDefault();
    setError("");
    if (!form.name || !form.price || !businessId) return;
    try {
      const imageUrl = form.image_file ? await uploadProductImage(businessId, form.image_file) : null;
      await createProduct(businessId, {
        name: form.name,
        price: Number(form.price),
        image_url: imageUrl,
        description: form.description,
        category: form.category || null,
        is_available: true,
      });
      closeModal();
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter ce produit.");
    }
  }

  async function removeProduct(id) {
    await deleteProduct(id);
    await loadProducts();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes produits</h1>
          <p className="mt-1 text-sm text-slate-500">Ajoutez vos produits ou services, puis configurez leurs champs personnalisés.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nouveau produit
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4">
            {product.image_url ? (
              <img src={mediaUrl(product.image_url)} alt={product.name} className="mb-3 h-36 w-full rounded-lg object-cover" />
            ) : (
              <div className="mb-3 grid h-36 place-items-center rounded-lg bg-slate-100 text-slate-400">
                <ImageIcon size={28} />
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">{product.description}</p>
              </div>
              <Button tone="danger" onClick={() => removeProduct(product.id)} title="Supprimer">
                <Trash2 size={16} />
              </Button>
            </div>
            <p className="mt-3 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
            <CustomFieldsEditor product={product} />
          </div>
        ))}
        {!products.length ? <p className="text-sm text-slate-500">Aucun produit pour le moment.</p> : null}
      </div>

      {modalOpen ? (
        <FormModal title="Nouveau produit / service" description="Ajoutez une image depuis votre ordinateur. Formats acceptes : JPG, PNG, WEBP ou GIF." onClose={closeModal}>
          <form onSubmit={addProduct} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Nom
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Prix
                <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} type="number" className={inputClass} required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Image produit
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
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:font-semibold file:text-white hover:border-emerald-300"
                />
                {form.image_preview ? (
                  <img src={form.image_preview} alt="Apercu produit" className="h-40 w-full rounded-lg object-cover" />
                ) : null}
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Categorie produit
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputClass} placeholder="Abonnement digital, Restaurant..." />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
                Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className={`${inputClass} resize-none`} />
              </label>
            </div>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={closeModal}>Annuler</Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
