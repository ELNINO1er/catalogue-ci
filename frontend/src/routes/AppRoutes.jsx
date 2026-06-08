import { useMemo } from "react";
import AdminLayout from "../layouts/AdminLayout";
import MerchantLayout from "../layouts/MerchantLayout";
import LoginPage from "../pages/auth/LoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import BusinessesPage from "../pages/admin/BusinessesPage";
import MerchantsPage from "../pages/admin/MerchantsPage";
import PaymentsPage from "../pages/admin/PaymentsPage";
import PlansPage from "../pages/admin/PlansPage";
import SubscriptionsPage from "../pages/admin/SubscriptionsPage";
import PlatformPaymentsPage from "../pages/admin/PlatformPaymentsPage";
import CategoriesPage from "../pages/admin/CategoriesPage";
import TemplatesPage from "../pages/admin/TemplatesPage";
import ActivityLogsPage from "../pages/admin/ActivityLogsPage";
import PlatformSettingsPage from "../pages/admin/PlatformSettingsPage";
import MerchantDashboardPage from "../pages/merchant/MerchantDashboardPage";
import MerchantBusinessPage from "../pages/merchant/MerchantBusinessPage";
import ProductsPage from "../pages/merchant/ProductsPage";
import OrdersPage from "../pages/merchant/OrdersPage";
import PaymentSettingsPage from "../pages/merchant/PaymentSettingsPage";
import MerchantMessagesPage from "../pages/merchant/MerchantMessagesPage";
import MerchantQrPage from "../pages/merchant/MerchantQrPage";
import MerchantStatsPage from "../pages/merchant/MerchantStatsPage";
import MerchantSubscriptionPage from "../pages/merchant/MerchantSubscriptionPage";
import PublicCataloguePage from "../pages/public/PublicCataloguePage";

export default function AppRoutes({
  user,
  view,
  setView,
  onLogin,
  onLogout,
  publicSlug,
  setPublicSlug,
  setQrBusiness,
}) {
  const content = useMemo(() => {
    if (!user) return null;

    if (user.role === "SUPER_ADMIN") {
      if (view === "businesses") return <BusinessesPage setPublicSlug={setPublicSlug} setQrBusiness={setQrBusiness} />;
      if (view === "merchants") return <MerchantsPage />;
      if (view === "plans") return <PlansPage />;
      if (view === "subscriptions") return <SubscriptionsPage />;
      if (view === "platform-payments") return <PlatformPaymentsPage />;
      if (view === "orders") return <OrdersPage user={user} />;
      if (view === "categories") return <CategoriesPage />;
      if (view === "templates") return <TemplatesPage />;
      if (view === "payments") return <PaymentsPage />;
      if (view === "activity-logs") return <ActivityLogsPage />;
      if (view === "payment-settings") return <PaymentSettingsPage user={user} />;
      if (view === "settings") return <PlatformSettingsPage />;
      return <AdminDashboardPage setPublicSlug={setPublicSlug} />;
    }

    if (view === "store-profile") return <MerchantBusinessPage setPublicSlug={setPublicSlug} />;
    if (view === "products") return <ProductsPage user={user} />;
    if (view === "orders") return <OrdersPage user={user} />;
    if (view === "payment-settings") return <PaymentSettingsPage user={user} />;
    if (view === "messages") return <MerchantMessagesPage />;
    if (view === "qr-code") return <MerchantQrPage setPublicSlug={setPublicSlug} setQrBusiness={setQrBusiness} />;
    if (view === "stats") return <MerchantStatsPage />;
    if (view === "subscription") return <MerchantSubscriptionPage />;
    return (
      <MerchantDashboardPage
        user={user}
        setView={setView}
        setPublicSlug={setPublicSlug}
        setQrBusiness={setQrBusiness}
      />
    );
  }, [user, view, setView, setPublicSlug, setQrBusiness]);

  if (publicSlug) {
    return (
      <PublicCataloguePage
        slug={publicSlug}
        onBack={() => setPublicSlug(null)}
        setQrBusiness={setQrBusiness}
      />
    );
  }

  if (!user) return <LoginPage onLogin={onLogin} />;

  if (user.role === "SUPER_ADMIN") {
    return (
      <AdminLayout user={user} view={view} setView={setView} onLogout={onLogout}>
        {content}
      </AdminLayout>
    );
  }

  return (
    <MerchantLayout user={user} view={view} setView={setView} onLogout={onLogout}>
      {content}
    </MerchantLayout>
  );
}
