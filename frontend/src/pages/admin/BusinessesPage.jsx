import { useEffect, useState } from "react";
import { Eye, Plus, QrCode, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import { listBusinesses } from "../../services/businessService";

export default function BusinessesPage({ setPublicSlug, setQrBusiness }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listBusinesses().then(setItems).catch(() => setItems([]));
  }, []);

  const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Commerces</h1>
        <Button disabled title="CRUD creation a brancher sur un formulaire complet">
          <Plus size={16} />
          Nouveau
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher"
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.map((business) => (
          <div key={business.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0">
            <div>
              <p className="font-semibold text-slate-900">{business.name}</p>
              <p className="text-sm text-slate-500">
                /catalogue/{business.slug} - {business.products_count || 0} produits
              </p>
            </div>
            <div className="flex gap-2">
              <Button tone="secondary" onClick={() => setQrBusiness(business)}>
                <QrCode size={16} />
              </Button>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}>
                <Eye size={16} />
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length ? <p className="p-4 text-sm text-slate-500">Aucun commerce trouve.</p> : null}
      </div>
    </div>
  );
}
