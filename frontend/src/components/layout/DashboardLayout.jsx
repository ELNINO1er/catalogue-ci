import { Toaster } from "react-hot-toast";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardLayout({ user, menuItems, activeView, onNavigate, onLogout, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <DashboardSidebar
        user={user}
        items={menuItems}
        activeView={activeView}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!rounded-xl !shadow-card !border !border-surface-border !text-sm !font-medium",
          duration: 3000,
        }}
      />
    </div>
  );
}
