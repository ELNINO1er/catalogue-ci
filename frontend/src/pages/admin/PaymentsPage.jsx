import { useEffect, useState } from "react";
import { listPaymentMethods } from "../../services/businessService";

export default function PaymentsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listPaymentMethods().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Moyens de paiement</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-500">{item.code}</p>
          </div>
        ))}
      </div>
      {!items.length ? <p className="text-sm text-slate-500">Aucun moyen de paiement. Lancez le seeder.</p> : null}
    </div>
  );
}
