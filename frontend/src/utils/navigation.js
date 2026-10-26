// Navigation legere basee sur l'URL (sans routeur) : App.jsx ecoute "popstate"
// et reconstruit son etat a partir de window.location.

export function navigate(path) {
  if (`${window.location.pathname}${window.location.search}` === path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function parseLocation(pathname = window.location.pathname) {
  const catalogue = pathname.match(/^\/catalogue\/([^/]+)/);
  if (catalogue) return { publicSlug: decodeURIComponent(catalogue[1]), publicPage: null, authPage: null, view: null };
  if (pathname === "/suivi-commande") return { publicSlug: null, publicPage: "track-order", authPage: null, view: null };
  if (pathname === "/cgu") return { publicSlug: null, publicPage: "cgu", authPage: null, view: null };
  if (pathname === "/confidentialite") return { publicSlug: null, publicPage: "privacy", authPage: null, view: null };
  if (pathname === "/mot-de-passe-oublie") return { publicSlug: null, publicPage: null, authPage: "forgot", view: null };
  if (pathname === "/reinitialiser-mot-de-passe") return { publicSlug: null, publicPage: null, authPage: "reset", view: null };
  if (pathname === "/login") return { publicSlug: null, publicPage: null, authPage: "login", view: null };
  if (pathname === "/inscription") return { publicSlug: null, publicPage: null, authPage: "register", view: null };
  const app = pathname.match(/^\/app(?:\/([a-z-]+))?\/?$/);
  if (app) return { publicSlug: null, publicPage: null, authPage: null, view: app[1] || "dashboard" };
  return { publicSlug: null, publicPage: null, authPage: null, view: null };
}

export function buildPath({ user, view, authPage, publicSlug, publicPage }) {
  if (publicPage === "track-order") return "/suivi-commande";
  if (publicPage === "cgu") return "/cgu";
  if (publicPage === "privacy") return "/confidentialite";
  if (publicSlug) return `/catalogue/${encodeURIComponent(publicSlug)}`;
  if (!user) {
    if (authPage === "login") return "/login";
    if (authPage === "register") return "/inscription";
    if (authPage === "forgot") return "/mot-de-passe-oublie";
    if (authPage === "reset") return "/reinitialiser-mot-de-passe";
    return "/";
  }
  return !view || view === "dashboard" ? "/app" : `/app/${view}`;
}
