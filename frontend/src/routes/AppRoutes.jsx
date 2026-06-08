import { useMemo } from "react";
import AdminLayout from "../layouts/AdminLayout";
import MerchantLayout from "../layouts/MerchantLayout";
import LoginPage from "../pages/auth/LoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import BusinessesPage from "../pages/admin/BusinessesPage";
import MerchantsPage from "../pages/admin/MerchantsPage";
import PaymentsPage from "../pages/admin/PaymentsPage";
import MerchantDashboardPage from "../pages/merchant/MerchantDashboardPage";
import ProductsPage from "../pages/merchant/ProductsPage";
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
      if (view === "payments") return <PaymentsPage />;
      return <AdminDashboardPage setPublicSlug={setPublicSlug} />;
    }

    if (view === "products") return <ProductsPage user={user} />;
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
