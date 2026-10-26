import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Wallet, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/modals/ConfirmModal";
import {
  Avatar, CardGrid, FilterTabs, ListSkeleton, MetaRow, PageHeader, SearchField, StatusPill, SummaryStrip, Toolbar,
} from "../../components/ui/PageKit";
import { listPlatformPayments, updatePlatformPayment } from "../../services/superAdminService";
import { fmt } from "../../utils/formatters";

const STATUS = {
  PENDING: { label: "En attente", tone: "warning" },
  PAID: { label: "Valide", tone: "success" },
  FAILED: { label: "Refuse", tone: "danger" },
  CANCELLED: { label: "Annule", tone: "neutral" },
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function PlatformPaymentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await listPlatformPayments());
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Valider un paiement active le plan demande pour un mois (cote serveur).
  async function executeAction() {
    setActionLoading(true);
    setError("");
    try {
      await updatePlatformPayment(confirm.item.id, { status: confirm.status });
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Mise a jour impossible.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  }

  const counts = useMemo(() => ({
    all: items.length,
    PENDING: items.filter((i) => i.status === "PENDING").length,
    PAID: items.filter((i) => i.status === "PAID").length,
    FAILED: items.filter((i) => i.status === "FAILED").length,
    total: items.filter((i) => i.status === "PAID").reduce((sum, i) => sum + Number(i.amount || 0), 0),
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      return !q || `${item.business?.name || ""} ${item.reference || ""} ${item.plan?.name || ""}`.toLowerCase().includes(q);
    });
  }, [items, query, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Paiements plateforme" description="Les paiements d'abonnement envoyes par les commercants. Validez-les apres verification sur Wave." />

      <SummaryStrip
        items={[
          { label: "A valider", value: counts.PENDING, icon: Clock, tone: counts.PENDING ? "warning" : "neutral" },
          { label: "Valides", value: counts.PAID, icon: CheckCircle2, tone: "success" },
          { label: "Refuses", value: counts.FAILED, icon: XCircle, tone: counts.FAILED ? "danger" : "neutral" },
          { label: "Montant encaisse", value: `${fmt(counts.total)} FCFA`, icon: Wallet },
        ]}
      />

      <Toolbar right={<SearchField value={query} onChange={setQuery} placeholder="Boutique ou reference" />}>
        <FilterTabs
          label="Statut des paiements"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tous", count: counts.all },
            { value: "PENDING", label: "En attente", count: counts.PENDING },
            { value: "PAID", label: "Valides", count: counts.PAID },
            { value: "FAILED", label: "Refuses", count: counts.FAILED },
          ]}
        />
      </Toolbar>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {loading ? <ListSkeleton /> : filtered.length ? (
        <CardGrid>
          {filtered.map((item) => {
            const s = STATUS[item.status] || { label: item.status, tone: "neutral" };
            return (
              <article key={item.id} className={`card-hover flex flex-col p-5 ${item.status === "PENDING" && item.reference ? "ring-2 ring-amber-200" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={item.business?.name || "?"} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base font-bold text-ink-900">{item.business?.name || "Boutique supprimee"}</h2>
                    <p className="truncate text-xs text-ink-500">Demande le {formatDate(item.created_at)}</p>
                  </div>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </div>

                <p className="mt-4 font-display text-2xl font-bold text-ink-900">
                  {fmt(item.amount)} <span className="text-sm font-semibold text-ink-500">FCFA</span>
                </p>

                <div className="mt-3 flex-1 divide-y divide-surface-border rounded-xl bg-surface px-3">
                  <MetaRow label="Plan demande">{item.plan?.name || "-"}</MetaRow>
                  <MetaRow label="Methode">{item.method || "-"}</MetaRow>
                  <MetaRow label="Reference">{item.reference || "Pas encore de reference"}</MetaRow>
                  {item.paid_at ? <MetaRow label="Valide le">{formatDate(item.paid_at)}</MetaRow> : null}
                </div>

                {item.status === "PENDING" ? (
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" className="flex-1" disabled={!item.reference} onClick={() => setConfirm({ item, status: "PAID" })}>
                      <CheckCircle2 size={14} /> Valider
                    </Button>
                    <Button size="sm" tone="dangerSoft" className="flex-1" onClick={() => setConfirm({ item, status: "FAILED" })}>
                      <XCircle size={14} /> Refuser
                    </Button>
                  </div>
                ) : null}
                {item.status === "PENDING" && !item.reference ? (
                  <p className="mt-2 text-xs text-ink-500">En attente de la reference de transaction du commercant.</p>
                ) : null}
              </article>
            );
          })}
        </CardGrid>
      ) : (
        <EmptyState
          icon={Wallet}
          title={items.length ? "Aucun paiement ne correspond" : "Aucun paiement plateforme"}
          description={items.length ? "Modifiez la recherche ou le filtre." : "Les paiements d'abonnement apparaitront ici."}
        />
      )}

      {confirm ? (
        <ConfirmModal
          title={confirm.status === "PAID" ? "Valider le paiement" : "Refuser le paiement"}
          message={confirm.status === "PAID"
            ? `Confirmez-vous avoir recu ${fmt(confirm.item.amount)} FCFA (ref. ${confirm.item.reference}) de ${confirm.item.business?.name} ? Le plan ${confirm.item.plan?.name || ""} sera active pour un mois.`
            : `Refuser le paiement de ${confirm.item.business?.name} ? Son abonnement actuel ne change pas.`}
          tone={confirm.status === "PAID" ? "success" : "danger"}
          confirmLabel={confirm.status === "PAID" ? "Oui, valider" : "Refuser"}
          loading={actionLoading}
          onConfirm={executeAction}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  );
}
