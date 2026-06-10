import { useEffect, useState } from "react";
import QRModal from "./components/modals/QRModal";
import AppRoutes from "./routes/AppRoutes";
import { getStoredUser, logout as logoutRequest, me as fetchMe } from "./services/authService";

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState("dashboard");
  const [authPage, setAuthPage] = useState(null); // null = landing, "login", "register"
  const [publicSlug, setPublicSlug] = useState(() => {
    const match = window.location.pathname.match(/^\/catalogue\/([^/]+)/);
    return match?.[1] || null;
  });
  const [publicPage, setPublicPage] = useState(() => (
    window.location.pathname === "/suivi-commande" ? "track-order" : null
  ));
  const [qrBusiness, setQrBusiness] = useState(null);

  useEffect(() => {
    if (publicPage === "track-order") {
      window.history.replaceState(null, "", "/suivi-commande");
    } else if (publicSlug) {
      window.history.replaceState(null, "", `/catalogue/${publicSlug}`);
    } else if (authPage === "login") {
      window.history.replaceState(null, "", "/login");
    } else if (authPage === "register") {
      window.history.replaceState(null, "", "/inscription");
    } else if (!user) {
      window.history.replaceState(null, "", "/");
    }
  }, [publicSlug, publicPage, authPage, user]);

  function handleLogout() {
    logoutRequest();
    setUser(null);
    setView("dashboard");
    setAuthPage(null);
  }

  async function handleAuth(userData) {
    setUser(userData);
    setAuthPage(null);
    if (userData.role === "MERCHANT") {
      try {
        const fullUser = await fetchMe();
        if (fullUser?.business && !fullUser.business.onboarding_completed) {
          setView("onboarding");
          return;
        }
      } catch {
        setView("onboarding");
        return;
      }
    }
  }

  return (
    <>
      <AppRoutes
        user={user}
        view={view}
        setView={setView}
        onAuth={handleAuth}
        onLogout={handleLogout}
        publicSlug={publicSlug}
        setPublicSlug={setPublicSlug}
        publicPage={publicPage}
        setPublicPage={setPublicPage}
        setQrBusiness={setQrBusiness}
        authPage={authPage}
        setAuthPage={setAuthPage}
      />
      {qrBusiness ? <QRModal business={qrBusiness} onClose={() => setQrBusiness(null)} /> : null}
    </>
  );
}
