import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Grid2X2,
  Layers,
  LogOut,
  MessageCircle,
  Package,
  QrCode,
  Receipt,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  UserRound,
} from "lucide-react";
import Button from "../ui/Button";

const adminSections = [
  {
    title: "Pilotage",
    links: [
      { key: "dashboard", label: "Dashboard", icon: BarChart3 },
      { key: "orders", label: "Commandes globales", icon: ShoppingBag },
      { key: "activity-logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    title: "Commerces",
    links: [
      { key: "businesses", label: "Boutiques", icon: Store },
      { key: "merchants", label: "Commercants", icon: UserRound },
      { key: "categories", label: "Categories", icon: Grid2X2 },
      { key: "templates", label: "Templates", icon: Layers },
    ],
  },
  {
    title: "Monetisation",
    links: [
      { key: "plans", label: "Plans", icon: Tags },
      { key: "subscriptions", label: "Abonnements", icon: ClipboardList },
      { key: "platform-payments", label: "Paiements plateforme", icon: Receipt },
      { key: "payments", label: "Methodes paiement", icon: CreditCard },
    ],
  },
  {
    title: "Configuration",
    links: [
      { key: "settings", label: "Parametres globaux", icon: Settings },
    ],
  },
];

const merchantSections = [
  {
    title: "Vendre",
    links: [
      { key: "dashboard", label: "Dashboard", icon: BarChart3 },
      { key: "store-profile", label: "Ma boutique", icon: Store },
      { key: "products", label: "Produits / Services", icon: Package },
      { key: "orders", label: "Commandes", icon: ShoppingBag },
      { key: "payment-settings", label: "Paiements", icon: CreditCard },
    ],
  },
  {
    title: "Croissance",
    links: [
      { key: "messages", label: "Messages WhatsApp", icon: MessageCircle },
      { key: "qr-code", label: "QR Code", icon: QrCode },
      { key: "stats", label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    title: "Compte",
    links: [
      { key: "subscription", label: "Abonnement", icon: ClipboardList },
    ],
  },
];

export default function Sidebar({ user, view, setView, onLogout, mode }) {
  const sections = mode === "admin" ? adminSections : merchantSections;

  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white">
            <Store size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900">CatalogueCI</p>
            <p className="text-xs text-slate-500">{mode === "admin" ? "Super Admin" : "Commercant"}</p>
          </div>
        </div>
        <Button tone="ghost" onClick={onLogout} className="lg:hidden">
          <LogOut size={16} />
        </Button>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:flex-1 lg:space-y-5 lg:overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="lg:space-y-1">
            <p className="hidden px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400 lg:block">{section.title}</p>
            <div className="flex gap-1 lg:block lg:space-y-1">
              {section.links.map((link) => {
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
            </div>
          </div>
        ))}
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
