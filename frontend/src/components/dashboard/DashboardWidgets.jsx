import { useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, Loader, Minus, XCircle } from "lucide-react";
import { fmt } from "../../utils/formatters";
import { AXIS, CATEGORICAL, GRID, SERIES, STATUS, compact } from "./chartTheme";

export const RANGE_OPTIONS = [
  { value: "today", label: "Aujourd'hui", compare: "vs hier" },
  { value: "7d", label: "7 jours", compare: "vs 7 j. prec." },
  { value: "30d", label: "30 jours", compare: "vs 30 j. prec." },
];

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`card flex min-w-0 flex-col p-5 ${className}`}>
      {title || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="font-display text-base font-bold text-ink-900">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function RangeTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Periode" className="inline-flex rounded-xl border border-surface-border bg-white p-1">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Change({ value, compareLabel }) {
  // undefined : pas de variation pour cette carte, on affiche juste le libelle.
  if (value === undefined) return compareLabel ? <p className="text-xs text-ink-500">{compareLabel}</p> : null;
  if (value === null) {
    return <p className="text-xs text-ink-400">Pas de base de comparaison</p>;
  }
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex items-center gap-1 whitespace-nowrap text-xs text-ink-500">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${flat ? "text-ink-500" : up ? "text-emerald-600" : "text-rose-600"}`}>
        <Icon size={14} aria-hidden="true" />
        {up ? "+" : ""}{value.toLocaleString("fr-FR")}%
      </span>
      {compareLabel}
    </p>
  );
}

export function KpiCard({ icon: Icon, label, value, unit, change, compareLabel, spark, sparkKey, sparkColor = SERIES.revenue.color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon size={18} />
          </span>
          <p className="truncate text-sm font-medium text-ink-600">{label}</p>
        </div>
        {spark?.length ? (
          <div className="h-9 w-20 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line type="monotone" dataKey={sparkKey} stroke={sparkColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink-900">
        {value}{unit ? <span className="ml-1 text-sm font-semibold text-ink-500">{unit}</span> : null}
      </p>
      <div className="mt-1"><Change value={change} compareLabel={compareLabel} /></div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-surface-border bg-white px-3 py-2 text-xs shadow-card-hover">
      <p className="mb-1 font-semibold text-ink-900">{label}</p>
      <p className="flex items-center gap-2 text-ink-600">
        <span className="h-2 w-2 rounded-full" style={{ background: SERIES.revenue.color }} />
        Ventes : <span className="font-semibold text-ink-900">{fmt(point.revenue)} FCFA</span>
      </p>
      <p className="flex items-center gap-2 text-ink-600">
        <span className="h-2 w-2 rounded-full" style={{ background: SERIES.orders.color }} />
        Commandes : <span className="font-semibold text-ink-900">{fmt(point.orders)}</span>
      </p>
    </div>
  );
}

// Une seule mesure a la fois (un seul axe) ; l'infobulle donne les deux valeurs.
export function TrendChart({ series, peak }) {
  const [metric, setMetric] = useState("revenue");
  const config = SERIES[metric];
  const hasData = series?.some((p) => p.revenue || p.orders);

  return (
    <Panel
      title="Evolution des ventes et commandes"
      className="lg:col-span-2"
      action={(
        <div role="tablist" aria-label="Mesure" className="inline-flex rounded-xl bg-surface p-1">
          {Object.entries(SERIES).map(([key, s]) => (
            <button
              key={key}
              role="tab"
              aria-selected={metric === key}
              onClick={() => setMetric(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${metric === key ? "bg-white text-ink-900 shadow-card" : "text-ink-500"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
            </button>
          ))}
        </div>
      )}
    >
      <div className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={compact} allowDecimals={false} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#D1D5DB", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey={metric}
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#fill-${metric})`}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-xl bg-surface text-sm text-ink-500">Aucune commande sur cette periode.</div>
        )}
      </div>
      {peak?.revenue || peak?.orders ? (
        <div className="mt-4 grid gap-3 border-t border-surface-border pt-4 text-sm sm:grid-cols-2">
          <p className="text-ink-500">Pic de ventes : <span className="font-semibold text-ink-900">{peak.revenue ? `${fmt(peak.revenue.value)} FCFA (${peak.revenue.label})` : "-"}</span></p>
          <p className="text-ink-500">Pic de commandes : <span className="font-semibold text-ink-900">{peak.orders ? `${fmt(peak.orders.value)} (${peak.orders.label})` : "-"}</span></p>
        </div>
      ) : null}
    </Panel>
  );
}

export function CategoryDonut({ title, categories }) {
  const total = categories?.reduce((sum, c) => sum + c.count, 0) || 0;
  return (
    <Panel title={title}>
      {total ? (
        <>
          <div className="relative mx-auto h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="count" nameKey="name" innerRadius="64%" outerRadius="100%" paddingAngle={categories.length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                  {categories.map((c, i) => <Cell key={c.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${fmt(value)} commande(s)`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-2xl font-bold text-ink-900">{fmt(total)}</p>
                <p className="text-xs text-ink-500">commandes</p>
              </div>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {categories.map((c, i) => (
              <li key={c.name} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CATEGORICAL[i % CATEGORICAL.length] }} />
                <span className="min-w-0 flex-1 truncate text-ink-700">{c.name}</span>
                <span className="text-ink-500">{fmt(c.count)}</span>
                <span className="w-12 text-right font-semibold text-ink-900">{Math.round((c.count / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="grid flex-1 place-items-center rounded-xl bg-surface py-12 text-sm text-ink-500">Pas encore de donnees.</p>
      )}
    </Panel>
  );
}

const STATUS_ICONS = { completed: CheckCircle2, in_progress: Loader, pending: Clock, cancelled: XCircle };

// Jauge en demi-cercle : part de chaque statut sur la periode.
export function StatusGauge({ statuses }) {
  const entries = Object.entries(STATUS).map(([key, s]) => ({ key, ...s, count: statuses?.[key] || 0 }));
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  return (
    <Panel title="Statut des commandes">
      {total ? (
        <div className="relative mx-auto h-28 w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={entries.filter((e) => e.count)}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius="140%"
                outerRadius="190%"
                paddingAngle={entries.filter((e) => e.count).length > 1 ? 2 : 0}
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {entries.filter((e) => e.count).map((e) => <Cell key={e.key} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [`${fmt(value)} commande(s)`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <p className="absolute inset-x-0 bottom-0 text-center font-display text-xl font-bold text-ink-900">{fmt(total)}</p>
        </div>
      ) : (
        <p className="rounded-xl bg-surface py-8 text-center text-sm text-ink-500">Aucune commande sur cette periode.</p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {entries.map(({ key, label, color, count }) => {
          const Icon = STATUS_ICONS[key];
          return (
            <div key={key} className="rounded-xl bg-surface px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <Icon size={13} style={{ color }} aria-hidden="true" /> {label}
              </p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">
                {fmt(count)} <span className="font-normal text-ink-500">· {total ? Math.round((count / total) * 100) : 0}%</span>
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function RankingList({ title, items, emptyLabel, onSeeAll }) {
  return (
    <Panel
      title={title}
      action={onSeeAll ? <button onClick={onSeeAll} className="rounded-lg border border-surface-border px-2.5 py-1 text-xs font-semibold text-ink-600 hover:bg-ink-50">Voir tout</button> : null}
    >
      {items?.length ? (
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-500">{fmt(item.orders)} commande(s)</p>
              </div>
              <span className="text-sm font-semibold text-ink-900">{fmt(item.revenue)} <span className="text-xs font-normal text-ink-500">FCFA</span></span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl bg-surface py-8 text-center text-sm text-ink-500">{emptyLabel}</p>
      )}
    </Panel>
  );
}

export function InsightsPanel({ title = "En bref", insights, footer }) {
  return (
    <Panel title={title}>
      <dl className="grid grid-cols-2 gap-3">
        {insights.map(({ label, value, hint }) => (
          <div key={label} className="rounded-xl bg-surface px-3 py-3">
            <dt className="text-xs text-ink-500">{label}</dt>
            <dd className="mt-1 truncate text-sm font-bold text-ink-900">{value}</dd>
            {hint ? <dd className="text-xs text-ink-500">{hint}</dd> : null}
          </div>
        ))}
      </dl>
      {footer ? <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-800">{footer}</p> : null}
    </Panel>
  );
}
