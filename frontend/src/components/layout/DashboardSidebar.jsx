import { LogOut, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

export default function DashboardSidebar({ user, items, activeView, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(key) {
    onNavigate(key);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500">
          <ShoppingBag size={18} className="text-brand-900" />
        </div>
        <span className="font-display text-lg font-bold text-white">CatalogueCI</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-brand-200 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-accent-400" : ""} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Profil */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-brand-300">{user.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand-300 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut size={16} />
          Deconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-600 shadow-sidebar lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl bg-brand-500 p-2.5 text-white shadow-lg lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-72 flex-col bg-brand-600 shadow-2xl animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-1.5 text-brand-300 hover:text-white"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      ) : null}
    </>
  );
}
