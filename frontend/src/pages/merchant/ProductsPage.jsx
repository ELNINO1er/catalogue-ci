import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import CustomFieldsEditor from "../../components/common/CustomFieldsEditor";
import { me } from "../../services/authService";
import { createProduct, deleteProduct, listProductsByBusiness } from "../../services/productService";
import { fmt } from "../../utils/formatters";

export default function ProductsPage({ user }) {
  const [profile, setProfile] = useState(user);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

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

  async function addProduct(event) {
    event.preventDefault();
    if (!form.name || !form.price || !businessId) return;
    await createProduct(businessId, {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      is_available: true,
    });
    setForm({ name: "", price: "", description: "" });
    await loadProducts();
  }

  async function removeProduct(id) {
    await deleteProduct(id);
    await loadProducts();
  }

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Mes produits</h1>
      <form onSubmit={addProduct} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_160px_1fr_auto]">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nom"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <input
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          type="number"
          placeholder="Prix"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <input
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Description"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <Button type="submit">
          <Plus size={16} />
          Ajouter
        </Button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">{product.description}</p>
              </div>
              <Button tone="danger" onClick={() => removeProduct(product.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
            <p className="mt-3 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
            <CustomFieldsEditor product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
