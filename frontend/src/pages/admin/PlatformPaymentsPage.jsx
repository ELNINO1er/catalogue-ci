import { useEffect, useState } from "react";
import { listPlatformPayments } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

export default function PlatformPaymentsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { listPlatformPayments().then(setItems).catch(() => setItems([])); }, []);
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Paiements plateforme</h1>
      <div className="rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 border-b p-4 md:grid-cols-5">
            <strong>{item.business?.name}</strong>
            <span>{fmt(item.amount)} FCFA</span>
            <span>{item.method}</span>
            <span>{item.status}</span>
            <span>{item.reference || "-"}</span>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun paiement plateforme.</p> : null}
      </div>
    </div>
  );
}
