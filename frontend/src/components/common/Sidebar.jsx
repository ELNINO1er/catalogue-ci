import { BarChart3, CreditCard, LogOut, Package, Store, UserRound } from "lucide-react";
import Button from "../ui/Button";

const adminLinks = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "businesses", label: "Commerces", icon: Store },
  { key: "merchants", label: "Commercants", icon: UserRound },
  { key: "payments", label: "Paiements", icon: CreditCard },
];

const merchantLinks = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "products", label: "Produits", icon: Package },
];

export default function Sidebar({ user, view, setView, onLogout, mode }) {
  const links = mode === "admin" ? adminLinks : merchantLinks;

  return (
    <aside className="border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 p-4 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white">
            <Store size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900">CatalogueCI</p>
            <p className="text-xs text-slate-500">{mode === "admin" ? "Administrateur" : "Commercant"}</p>
          </div>
        </div>
        <Button tone="ghost" onClick={onLogout} className="lg:hidden">
          <LogOut size={16} />
        </Button>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.key}
              onClick={() => setView(link.key)}
              className={`flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold lg:w-full ${
                view === link.key ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={17} />
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-200 p-3 lg:block">
        <div className="mb-2 px-2 py-1">
          <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <Button tone="ghost" onClick={onLogout} className="w-full justify-start">
          <LogOut size={16} />
          Deconnexion
        </Button>
      </div>
    </aside>
  );
}
