import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

const NOTIFICATIONS_REFRESH_MS = 60_000;

export default function DashboardLayout({ user, roleLabel, menuItems, activeView, onNavigate, onLogout, promo, loadNotifications, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const title = menuItems.find((item) => item.key === activeView)?.label || "Dashboard";

  // Cloche : recharge a chaque changement de page et toutes les minutes.
  useEffect(() => {
    if (!loadNotifications) return undefined;
    let cancelled = false;
    const load = () => loadNotifications().then((data) => { if (!cancelled) setNotifications(data); }).catch(() => {});
    load();
    const timer = setInterval(load, NOTIFICATIONS_REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [loadNotifications, activeView]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <DashboardSidebar
        items={menuItems}
        activeView={activeView}
        onNavigate={onNavigate}
        onLogout={onLogout}
        promo={promo}
        roleLabel={roleLabel}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <DashboardHeader
          title={title}
          user={user}
          roleLabel={roleLabel}
          items={menuItems}
          onNavigate={onNavigate}
          onOpenMenu={() => setMobileOpen(true)}
          notifications={notifications}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
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
