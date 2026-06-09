import DashboardLayout from "../components/layout/DashboardLayout";
import { adminMenuItems } from "../constants/navigation";

export default function AdminLayout({ user, view, setView, onLogout, children }) {
  return (
    <DashboardLayout
      user={user}
      menuItems={adminMenuItems}
      activeView={view}
      onNavigate={setView}
      onLogout={onLogout}
    >
      {children}
    </DashboardLayout>
  );
}
