import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
}

// Ferme un menu deroulant au clic exterieur ou sur Echap.
function useDismiss(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);
  return ref;
}

export default function DashboardHeader({ title, user, roleLabel, items, onNavigate, onOpenMenu, notifications }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useDismiss(searchOpen, setSearchOpen);
  const bellRef = useDismiss(bellOpen, setBellOpen);

  // Recherche rapide : aller directement a une page du menu.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  function go(view) {
    onNavigate(view);
    setQuery("");
    setSearchOpen(false);
    setBellOpen(false);
  }

  const total = notifications?.total || 0;
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-8">
        <button
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Le titre est porte par chaque page ; l'en-tete affiche la page courante (mobile) et la date. */}
        <p className="truncate font-display text-base font-bold text-ink-900 md:hidden">{title}</p>
        <p className="hidden whitespace-nowrap text-sm font-medium capitalize text-ink-500 md:block">{today}</p>

        {/* Recherche */}
        <div ref={searchRef} className="relative ml-auto w-full max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].key); }}
            placeholder="Rechercher une page..."
            aria-label="Rechercher une page"
            className="w-full rounded-xl border border-surface-border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          {searchOpen ? (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-xl border border-surface-border bg-white p-1.5 shadow-card-hover">
              {results.length ? results.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => go(key)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon size={16} className="text-ink-400" /> {label}
                </button>
              )) : <p className="px-3 py-2 text-sm text-ink-500">Aucune page trouvee.</p>}
            </div>
          ) : null}
        </div>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            aria-label={total ? `${total} notification(s)` : "Notifications"}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-surface-border bg-white text-ink-600 transition hover:bg-ink-50"
          >
            <Bell size={18} />
            {total ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-2xs font-bold text-white">
                {total > 99 ? "99+" : total}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-surface-border bg-white p-1.5 shadow-card-hover">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">A traiter</p>
              {notifications?.items?.length ? notifications.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => go(item.view)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink-700 hover:bg-brand-50"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" /> {item.label}
                </button>
              )) : <p className="px-3 py-2.5 text-sm text-ink-500">Rien a traiter pour le moment.</p>}
            </div>
          ) : null}
        </div>

        {/* Profil */}
        <div className="flex items-center gap-3 border-l border-surface-border pl-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-700">
            {initials(user.name)}
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="max-w-[10rem] truncate text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="max-w-[10rem] truncate text-xs text-ink-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
