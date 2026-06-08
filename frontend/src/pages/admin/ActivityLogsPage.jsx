import { useEffect, useState } from "react";
import { listActivityLogs } from "../../services/superAdminService";

export default function ActivityLogsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { listActivityLogs().then(setItems).catch(() => setItems([])); }, []);
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold">Logs d'activite</h1>
      <div className="rounded-lg border bg-white">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 border-b p-4 md:grid-cols-5">
            <strong>{item.action}</strong>
            <span>{item.module}</span>
            <span>{item.user?.email || "Systeme"}</span>
            <span>{item.business?.name || "-"}</span>
            <span>{new Date(item.created_at).toLocaleString("fr-FR")}</span>
          </div>
        ))}
        {!items.length ? <p className="p-4 text-sm text-slate-500">Aucun log.</p> : null}
      </div>
    </div>
  );
}
