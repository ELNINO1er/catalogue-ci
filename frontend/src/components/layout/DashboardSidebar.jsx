import { LogOut, ShoppingBag, X } from "lucide-react";

function SidebarContent({ items, activeView, onNavigate, onLogout, promo, roleLabel }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm">
          <ShoppingBag size={20} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight text-ink-900">CatalogueCI</p>
          <p className="truncate text-xs text-ink-500">{roleLabel}</p>
        </div>
      </div>

      {/* Menu */}
      <nav aria-label="Menu principal" className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-ink-400"} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Encart (ex. "Lancement gratuit") */}
      {promo ? <div className="px-4 pt-4">{promo}</div> : null}

      <div className="p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
        >
          <LogOut size={16} />
          Deconnexion
        </button>
      </div>
    </>
  );
}

export default function DashboardSidebar({ mobileOpen, onCloseMobile, onNavigate, ...props }) {
  function navigate(key) {
    onNavigate(key);
    onCloseMobile();
  }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-surface-border bg-white lg:flex">
        <SidebarContent {...props} onNavigate={navigate} />
      </aside>

      {/* Mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative flex w-72 animate-slide-in-right flex-col bg-white shadow-2xl">
            <button
              onClick={onCloseMobile}
              aria-label="Fermer le menu"
              className="absolute right-3 top-6 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
            >
              <X size={20} />
            </button>
            <SidebarContent {...props} onNavigate={navigate} />
          </div>
        </div>
      ) : null}
    </>
  );
}
