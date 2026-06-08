import { useEffect, useState } from "react";
import QRModal from "./components/modals/QRModal";
import AppRoutes from "./routes/AppRoutes";
import { getStoredUser, logout as logoutRequest } from "./services/authService";

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState("dashboard");
  const [publicSlug, setPublicSlug] = useState(() => {
    const match = window.location.pathname.match(/^\/catalogue\/([^/]+)/);
    return match?.[1] || null;
  });
  const [qrBusiness, setQrBusiness] = useState(null);

  useEffect(() => {
    if (publicSlug) {
      window.history.replaceState(null, "", `/catalogue/${publicSlug}`);
    } else {
      window.history.replaceState(null, "", "/");
    }
  }, [publicSlug]);

  function handleLogout() {
    logoutRequest();
    setUser(null);
    setView("dashboard");
  }

  return (
    <>
      <AppRoutes
        user={user}
        view={view}
        setView={setView}
        onLogin={setUser}
        onLogout={handleLogout}
        publicSlug={publicSlug}
        setPublicSlug={setPublicSlug}
        setQrBusiness={setQrBusiness}
      />
      {qrBusiness ? <QRModal business={qrBusiness} onClose={() => setQrBusiness(null)} /> : null}
    </>
  );
}
