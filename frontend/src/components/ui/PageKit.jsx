import { Search, X } from "lucide-react";

// Briques communes a toutes les pages du tableau de bord : meme en-tete, memes filtres,
// memes pastilles, pour que chaque onglet soit aligne de la meme facon.

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const TILE_TONES = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  info: "bg-sky-50 text-sky-600",
  neutral: "bg-ink-100 text-ink-600",
};

// Bande de petits chiffres cles en haut de page.
export function SummaryStrip({ items }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${items.length >= 4 ? "xl:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map(({ label, value, icon: Icon, tone = "brand", hint }) => (
        <div key={label} className="card flex items-center gap-3 p-4">
          {Icon ? (
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TILE_TONES[tone] || TILE_TONES.brand}`}>
              <Icon size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-500">{label}</p>
            <p className="truncate font-display text-xl font-bold text-ink-900">{value}</p>
            {hint ? <p className="truncate text-xs text-ink-400">{hint}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// Onglets de filtre en pilules (Tous / Actives / Suspendues...).
export function FilterTabs({ options, value, onChange, label = "Filtre" }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-surface-border bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900"
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className={`rounded-full px-1.5 text-2xs ${active ? "bg-white/25 text-white" : "bg-ink-100 text-ink-500"}`}>{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = "Rechercher...", className = "" }) {
  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-surface-border bg-white py-2.5 pl-10 pr-9 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
      />
      {value ? (
        <button onClick={() => onChange("")} aria-label="Effacer la recherche" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-700">
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

// Barre filtres + recherche, alignee sous l'en-tete.
export function Toolbar({ children, right }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  );
}

const AVATAR_TONES = [
  "bg-brand-100 text-brand-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
];

export function initialsOf(name = "") {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
}

// Carre a initiales, couleur stable par nom.
export function Avatar({ name, size = "md", className = "" }) {
  const hash = [...String(name || "")].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const sizes = { sm: "h-8 w-8 text-xs rounded-lg", md: "h-11 w-11 text-sm rounded-xl", lg: "h-14 w-14 text-base rounded-2xl" };
  return (
    <span className={`grid shrink-0 place-items-center font-display font-bold ${sizes[size] || sizes.md} ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${className}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}

const PILL_TONES = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
  brand: "bg-brand-50 text-brand-700",
  neutral: "bg-ink-100 text-ink-600",
  violet: "bg-violet-50 text-violet-700",
};
const DOT_TONES = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  brand: "bg-brand-500",
  neutral: "bg-ink-400",
  violet: "bg-violet-500",
};

// Pastille de statut : toujours un libelle, jamais la couleur seule.
export function StatusPill({ tone = "neutral", icon: Icon, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_TONES[tone] || PILL_TONES.neutral} ${className}`}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONES[tone] || DOT_TONES.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

// Bouton icone carre avec libelle accessible + infobulle.
export function IconButton({ icon: Icon, label, onClick, tone = "neutral", disabled }) {
  const tones = {
    neutral: "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
    brand: "text-brand-600 hover:bg-brand-50",
    danger: "text-rose-600 hover:bg-rose-50",
    success: "text-emerald-600 hover:bg-emerald-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-surface-border bg-white transition disabled:pointer-events-none disabled:opacity-40 ${tones[tone] || tones.neutral}`}
    >
      <Icon size={16} />
    </button>
  );
}

// Ligne "libelle : valeur" dans une carte.
export function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink-800">{children}</span>
    </div>
  );
}

// Grille de cartes responsive standard.
export function CardGrid({ children, cols = 3 }) {
  const map = {
    2: "grid gap-4 md:grid-cols-2 [&>*]:min-w-0",
    3: "grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0",
    4: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0",
  };
  return <div className={map[cols] || map[3]}>{children}</div>;
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card h-40 animate-pulse bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-ink-100" />
              <div className="h-3 w-1/3 rounded bg-ink-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
