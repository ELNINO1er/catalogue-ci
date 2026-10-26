import { useCallback, useEffect, useRef, useState } from "react";
import QRModal from "./components/modals/QRModal";
import AppRoutes from "./routes/AppRoutes";
import { UNAUTHORIZED_EVENT } from "./services/api";
import { getStoredUser, logout as logoutRequest, me as fetchMe } from "./services/authService";
import { buildPath, parseLocation } from "./utils/navigation";

function initialState(user) {
  const parsed = parseLocation();
  // Lien vers le tableau de bord sans etre connecte : on passe par la connexion.
  if (!user && parsed.view) return { ...parsed, view: null, authPage: "login" };
  return parsed;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [initial] = useState(() => initialState(user));
  const [view, setView] = useState(initial.view || "dashboard");
  const [authPage, setAuthPage] = useState(initial.authPage); // null = landing, "login", "register"
  const [publicSlug, setPublicSlug] = useState(initial.publicSlug);
  const [publicPage, setPublicPage] = useState(initial.publicPage);
  const [qrBusiness, setQrBusiness] = useState(null);
  const firstSync = useRef(true);

  // Etat -> URL : chaque ecran a sa propre adresse (rafraichir, retour arriere et favoris fonctionnent).
  useEffect(() => {
    const path = buildPath({ user, view, authPage, publicSlug, publicPage });
    if (path !== window.location.pathname) {
      if (firstSync.current) window.history.replaceState(null, "", path);
      else window.history.pushState(null, "", path);
    }
    firstSync.current = false;
  }, [user, view, authPage, publicSlug, publicPage]);

  // URL -> etat : boutons precedent/suivant du navigateur et navigate().
  useEffect(() => {
    function onPopState() {
      const parsed = parseLocation();
      setPublicSlug(parsed.publicSlug);
      setPublicPage(parsed.publicPage);
      setAuthPage(parsed.authPage);
      if (parsed.view) setView(parsed.view);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleLogout = useCallback(() => {
    logoutRequest();
    setUser(null);
    setView("dashboard");
    setAuthPage(null);
  }, []);

  // Session expiree ou boutique suspendue : retour a la connexion.
  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setView("dashboard");
      setAuthPage("login");
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // L'onboarding est impose tant qu'il n'est pas termine, y compris apres un rafraichissement.
  const checkOnboarding = useCallback(async (currentUser) => {
    if (currentUser?.role !== "MERCHANT") return;
    try {
      const fullUser = await fetchMe();
      if (fullUser?.business && !fullUser.business.onboarding_completed) setView("onboarding");
    } catch {
      // 401 : gere par UNAUTHORIZED_EVENT ; autre erreur reseau : on laisse l'utilisateur ou il est.
    }
  }, []);

  useEffect(() => {
    if (user) checkOnboarding(user);
    // Verification unique au chargement ; handleAuth la refait apres une connexion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuth(userData) {
    setUser(userData);
    setAuthPage(null);
    setView("dashboard");
    await checkOnboarding(userData);
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
