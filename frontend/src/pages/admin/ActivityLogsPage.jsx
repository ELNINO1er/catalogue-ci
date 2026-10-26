import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, Cpu, ScrollText, Store, Users } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import {
  Avatar, FilterTabs, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { listActivityLogs } from "../../services/superAdminService";

// "UPDATE_PLATFORM_PAYMENT" / "update_order_status" -> "Update platform payment"
function humanize(value = "") {
  const text = String(value).replace(/[_-]+/g, " ").trim().toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : "-";
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function dayKey(value) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default function ActivityLogsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");

  useEffect(() => {
    listActivityLogs().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const modules = useMemo(() => {
    const counts = new Map();
    for (const item of items) counts.set(item.module, (counts.get(item.module) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (module !== "all" && item.module !== module) return false;
      return !q || `${item.action} ${item.module} ${item.user?.name || ""} ${item.user?.email || ""} ${item.business?.name || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, module]);

  // Regroupement par jour pour une lecture en fil chronologique.
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const key = dayKey(item.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  const actors = new Set(items.map((i) => i.user?.id).filter(Boolean)).size;
  const today = new Date().toDateString();
  const todayCount = items.filter((i) => new Date(i.created_at).toDateString() === today).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs d'activite"
        description="Historique des actions effectuees sur la plateforme (100 dernieres)."
      />

      <SummaryStrip
        items={[
          { label: "Actions", value: items.length, icon: Activity },
          { label: "Aujourd'hui", value: todayCount, icon: Clock, tone: "info" },
          { label: "Utilisateurs", value: actors, icon: Users, tone: "success" },
          { label: "Modules", value: modules.length, icon: Cpu, tone: "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher une action" />}>
        <FilterTabs
          label="Module"
          value={module}
          onChange={setModule}
          options={[
            { value: "all", label: "Tous", count: items.length },
            ...modules.map(([name, count]) => ({ value: name, label: humanize(name), count })),
          ]}
        />
      </Toolbar>

      {loading ? (
        <div className="card h-48 animate-pulse" aria-busy="true" aria-label="Chargement" />
      ) : groups.length ? (
        <div className="space-y-6">
          {groups.map(([day, logs]) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{day}</h2>
              <ol className="card divide-y divide-surface-border">
                {logs.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                    {item.user ? <Avatar name={item.user.name || item.user.email} size="sm" /> : (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500" aria-hidden="true"><Cpu size={14} /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{humanize(item.action)}</p>
                      <p className="truncate text-xs text-ink-500">
                        {item.user ? (item.user.name || item.user.email) : "Systeme"}
                        {item.business?.name ? <> · <Store size={11} className="inline" aria-hidden="true" /> {item.business.name}</> : null}
                      </p>
                    </div>
                    <StatusPill tone="brand">{humanize(item.module)}</StatusPill>
                    <time dateTime={item.created_at} className="w-full whitespace-nowrap text-xs text-ink-400 sm:w-auto">{formatDate(item.created_at)}</time>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title={items.length ? "Aucune action ne correspond" : "Aucun log"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Les actions des administrateurs et commercants apparaitront ici."}
        />
      )}
    </div>
  );
}
