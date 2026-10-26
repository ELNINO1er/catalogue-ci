import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import {
  Avatar, CardGrid, FilterTabs, ListSkeleton, MetaRow, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { listSubscriptions } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

const STATUS = {
  TRIAL: { label: "Essai", tone: "warning" },
  ACTIVE: { label: "Actif", tone: "success" },
  EXPIRED: { label: "Expire", tone: "danger" },
  SUSPENDED: { label: "Suspendu", tone: "danger" },
  CANCELLED: { label: "Annule", tone: "neutral" },
};

function formatDate(value) {
  if (!value) return "Sans expiration";
  return new Date(value).toLocaleDateString("fr-FR");
}

// Un abonnement dont la date de fin est passee est affiche comme expire.
function effectiveStatus(item) {
  if (["TRIAL", "ACTIVE"].includes(item.status) && item.ends_at && new Date(item.ends_at) < new Date()) return "EXPIRED";
  return item.status;
}

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listSubscriptions()
      .then(setItems)
      .catch((err) => {
        setItems([]);
        setError(err.response?.data?.message || "Impossible de charger les abonnements.");
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: items.length, ACTIVE: 0, TRIAL: 0, EXPIRED: 0 };
    items.forEach((item) => {
      const s = effectiveStatus(item);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && effectiveStatus(item) !== status) return false;
      return !q || `${item.business?.name || ""} ${item.plan?.name || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Abonnements" description="Le plan en cours de chaque boutique et sa date de fin." />

      <SummaryStrip
        items={[
          { label: "Abonnements", value: counts.all, icon: FileText },
          { label: "Actifs", value: counts.ACTIVE, icon: CheckCircle2, tone: "success" },
          { label: "En essai", value: counts.TRIAL, icon: Clock, tone: "warning" },
          { label: "Expires", value: counts.EXPIRED, icon: AlertTriangle, tone: counts.EXPIRED ? "danger" : "neutral" },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Rechercher une boutique" />}>
        <FilterTabs
          label="Statut des abonnements"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "ACTIVE", label: "Actifs", count: counts.ACTIVE },
            { value: "TRIAL", label: "Essai", count: counts.TRIAL },
            { value: "EXPIRED", label: "Expires", count: counts.EXPIRED },
          ]}
        />
      </Toolbar>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((item) => {
            const s = STATUS[effectiveStatus(item)] || { label: item.status, tone: "neutral" };
            return (
              <article key={item.id} className="card-hover flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={item.business?.name || "?"} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base font-bold text-ink-900">{item.business?.name || "Boutique supprimee"}</h2>
                    <p className="truncate text-xs text-ink-500">{item.business?.slug ? `/catalogue/${item.business.slug}` : "-"}</p>
                  </div>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </div>
                <div className="mt-4 divide-y divide-surface-border rounded-xl bg-surface px-3">
                  <MetaRow label="Plan">{item.plan?.name || "-"}</MetaRow>
                  <MetaRow label="Prix">{item.plan ? (Number(item.plan.price) ? `${fmt(item.plan.price)} FCFA/mois` : "Gratuit") : "-"}</MetaRow>
                  <MetaRow label="Debut">{item.starts_at ? formatDate(item.starts_at) : "-"}</MetaRow>
                  <MetaRow label="Fin">{formatDate(item.ends_at)}</MetaRow>
                </div>
              </article>
            );
          })}
        </CardGrid>
      ) : (
        <EmptyState
          icon={FileText}
          title={items.length ? "Aucun abonnement ne correspond" : "Aucun abonnement"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Les abonnements des boutiques apparaitront ici."}
        />
      )}
    </div>
  );
}
