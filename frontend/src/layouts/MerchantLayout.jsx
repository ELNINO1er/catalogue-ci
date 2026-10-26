import { QrCode } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { merchantMenuItems } from "../constants/navigation";
import { getMerchantNotifications } from "../services/merchantService";

export default function MerchantLayout({ user, view, setView, onLogout, children }) {
  const promo = (
    <div className="rounded-2xl bg-brand-50 p-4">
      <p className="font-display text-sm font-bold text-ink-900">Partagez votre boutique</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-600">Plus vos clients voient votre QR code, plus vous recevez de commandes.</p>
      <button
        onClick={() => setView("qr-code")}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
      >
        <QrCode size={14} /> Mon QR code
      </button>
    </div>
  );

  return (
    <DashboardLayout
      user={user}
      roleLabel="Commercant"
      menuItems={merchantMenuItems}
      activeView={view}
      onNavigate={setView}
      onLogout={onLogout}
      promo={promo}
      loadNotifications={getMerchantNotifications}
    >
      {children}
    </DashboardLayout>
  );
}
