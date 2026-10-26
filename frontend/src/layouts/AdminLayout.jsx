import { Settings } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { adminMenuItems } from "../constants/navigation";
import { getAdminNotifications } from "../services/superAdminService";

export default function AdminLayout({ user, view, setView, onLogout, children }) {
  const promo = (
    <div className="rounded-2xl bg-brand-50 p-4">
      <p className="font-display text-sm font-bold text-ink-900">Lancement de la plateforme</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-600">Activez les abonnements payants quand vous serez pret.</p>
      <button
        onClick={() => setView("settings")}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
      >
        <Settings size={14} /> Parametres
      </button>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      roleLabel="Super administrateur"
      menuItems={adminMenuItems}
      activeView={view}
      onNavigate={setView}
      onLogout={onLogout}
      promo={promo}
      loadNotifications={getAdminNotifications}
    >
      {children}
    </DashboardLayout>
  );
}
