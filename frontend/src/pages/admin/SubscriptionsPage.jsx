import { useEffect, useState } from "react";
import { listSubscriptions } from "../../services/superAdminService";

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { listSubscriptions().then(setItems).catch(() => setItems([])); }, []);
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold text-slate-900">Abonnements</h1>
      <div className="rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 border-b p-4 md:grid-cols-4">
            <strong>{item.business?.name}</strong>
            <span>{item.plan?.name}</span>
            <span>{item.status}</span>
            <span>{item.ends_at ? new Date(item.ends_at).toLocaleDateString("fr-FR") : "Sans expiration"}</span>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun abonnement.</p> : null}
      </div>
    </div>
  );
}
