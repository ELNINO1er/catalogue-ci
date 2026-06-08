import { useEffect, useState } from "react";
import { listMerchants } from "../../services/businessService";

export default function MerchantsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listMerchants().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Commercants</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {items.map((merchant) => (
          <div key={merchant.id} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-4">
            <p className="font-semibold text-slate-900">{merchant.name}</p>
            <p className="text-sm text-slate-600">{merchant.email}</p>
            <p className="text-sm text-slate-600">{merchant.business?.name || "Non associe"}</p>
            <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${merchant.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {merchant.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun commercant trouve.</p> : null}
      </div>
    </div>
  );
}
