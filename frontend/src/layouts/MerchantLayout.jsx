import DashboardLayout from "../components/layout/DashboardLayout";
import { merchantMenuItems } from "../constants/navigation";

export default function MerchantLayout({ user, view, setView, onLogout, children }) {
  return (
    <DashboardLayout
      user={user}
      menuItems={merchantMenuItems}
      activeView={view}
      onNavigate={setView}
      onLogout={onLogout}
    >
      {children}
    </DashboardLayout>
  );
}
