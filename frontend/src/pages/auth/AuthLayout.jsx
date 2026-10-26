import { ArrowLeft, ArrowRight, Check, Link2, MessageCircle, Wallet } from "lucide-react";
import { navigate } from "../../utils/navigation";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Birds, Brush, Cloud, Logo, Spark } from "../landing/Doodles";

// Cadre commun connexion / inscription / mot de passe, dans le style de la landing :
// formulaire a gauche, panneau orange illustre (photo, cartes flottantes) a droite.
const IMG = (name) => `/landing/${name}.webp`;

function goTo(path) {
  return (e) => {
    e.preventDefault();
    navigate(path);
  };
}

/* ───── Champs ───── */
export function AuthField({ icon: Icon, label, aside, hint, delay, children }) {
  return (
    <div className="seq grid gap-2" style={{ "--d": delay }}>
      <span className="flex items-center justify-between text-sm font-medium text-ink-800">
        {label}
        {aside}
      </span>
      <label className="auth-field">
        <Icon size={18} />
        {children}
      </label>
      {hint}
    </div>
  );
}

export function AuthSubmit({ loading, loadingText, children, disabled, delay }) {
  // L'animation d'entree est sur l'enveloppe : sinon son opacite finale masquerait l'etat desactive.
  return (
    <div className="seq w-full" style={{ "--d": delay }}>
      <button
        type="submit"
        disabled={disabled || loading}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-4 text-base font-medium text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-ink-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-ink-900"
      >
        {loading ? <LoadingSpinner size="sm" className="text-white" /> : null}
        {loading ? loadingText : children}
        {loading ? null : <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />}
      </button>
    </div>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  // key = message : l'animation "shake" rejoue a chaque nouvelle erreur
  return (
    <p key={message} role="alert" className="shake rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </p>
  );
}

/* ───── Panneau illustre ───── */
function FloatCard({ className = "", delay, float = "animate-float", children }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="seq-pop" style={{ "--d": delay }}>
        <div className={`${float} rounded-2xl bg-white p-3.5 shadow-modal`}>{children}</div>
      </div>
    </div>
  );
}

function Avatars({ delay }) {
  return (
    <div className="seq flex items-center gap-3" style={{ "--d": delay }}>
      <div className="flex -space-x-3">
        {[1, 2, 3, 4].map((n) => (
          <img key={n} src={IMG(`client-${n}`)} alt="" className="h-10 w-10 rounded-full border-2 border-brand-500 object-cover" />
        ))}
      </div>
      <p className="text-sm leading-snug text-white/90">Commandes par WhatsApp,<br />paiement par Wave.</p>
    </div>
  );
}

function slugPreview(name) {
  const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.slice(0, 28) || "votre-boutique";
}

const VISUALS = {
  login: {
    kicker: "Espace commercant",
    title: <>Vos commandes<br />vous <span className="text-accent-400">attendent.</span></>,
    photo: "hero",
  },
  register: {
    kicker: "Gratuit pendant le lancement",
    title: <>Votre boutique<br />en ligne en <span className="text-accent-400">5 minutes.</span></>,
    photo: "cas-mode",
  },
  reset: {
    kicker: "Compte securise",
    title: <>On vous remet<br />en selle <span className="text-accent-400">rapidement.</span></>,
    photo: "cas-services",
  },
};

function AuthVisual({ variant, shopName }) {
  const v = VISUALS[variant];
  return (
    <aside className="relative hidden h-screen p-4 lg:sticky lg:top-0 lg:block" aria-hidden="true">
      <div className="panel-in relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-600" style={{ "--d": "100ms" }}>
        {/* Trame de points + arcs pointilles qui tournent lentement */}
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1.1px,transparent_1.2px)] [background-size:22px_22px]" />
        <svg viewBox="0 0 400 400" className="spin-slow absolute left-1/2 top-[58%] h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 text-white/25">
          <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="120 40 6 40" />
        </svg>

        <div className="relative z-10 p-10 xl:p-12">
          <p className="seq text-xs font-semibold uppercase tracking-[0.22em] text-white/75" style={{ "--d": "450ms" }}>{v.kicker}</p>
          <h2 className="seq mt-3 font-landing text-[2.3rem] font-bold leading-[1.15] text-white xl:text-[2.7rem]" style={{ "--d": "550ms" }}>{v.title}</h2>
          <div className="mt-6"><Avatars delay="700ms" /></div>
        </div>

        <Cloud className="drift absolute left-[6%] top-[52%] w-24 opacity-90" />
        <Cloud className="drift-slow absolute right-[5%] top-[40%] w-20 opacity-90" />
        <Birds className="absolute right-[12%] top-[14%] w-7 !text-white/80" />

        {/* Photo ronde au centre bas */}
        <div className="absolute bottom-[-7%] left-1/2 aspect-square w-[58%] max-w-[26rem] -translate-x-1/2">
          <div className="seq-pop h-full w-full" style={{ "--d": "400ms" }}>
            <img src={IMG(v.photo)} alt="" className="h-full w-full rounded-full border-[10px] border-white/25 object-cover" />
          </div>
        </div>

        {variant === "register" ? (
          <>
            <FloatCard className="left-[7%] bottom-[30%]" delay="900ms">
              <p className="text-[0.7rem] font-medium uppercase tracking-wider text-ink-400">Votre lien</p>
              {/* Apercu indicatif : le lien definitif est genere par le serveur */}
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
                <Link2 size={15} className="text-brand-500" />
                catalogueci.com/catalogue/
              </p>
              <p className="max-w-[14rem] truncate pl-[1.3rem] text-sm font-semibold text-brand-600">{slugPreview(shopName || "")}</p>
            </FloatCard>
            <FloatCard className="right-[6%] bottom-[12%]" delay="1100ms" float="animate-float-slow">
              {["Catalogue cree", "Lien partage", "Premiere commande"].map((step, i) => (
                <p key={step} className="seq flex items-center gap-2 py-0.5 text-sm text-ink-800" style={{ "--d": `${1300 + i * 250}ms` }}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"><Check size={12} strokeWidth={3} /></span>
                  {step}
                </p>
              ))}
            </FloatCard>
          </>
        ) : (
          <>
            <FloatCard className="left-[6%] bottom-[28%]" delay="900ms">
              <div className="flex items-center gap-3">
                <img src={IMG("plat-jollof")} alt="" className="h-11 w-11 rounded-xl object-cover" />
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><MessageCircle size={13} /> Nouvelle commande</p>
                  <p className="text-sm font-semibold text-ink-900">2 x Riz gras</p>
                  <p className="text-xs text-ink-400">5 000 F · Cocody</p>
                </div>
              </div>
            </FloatCard>
            <FloatCard className="right-[6%] bottom-[14%]" delay="1150ms" float="animate-float-slow">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600"><Wallet size={18} /></span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Paiement Wave recu</p>
                  <p className="text-xs text-ink-400">5 000 F · verifie</p>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><Check size={14} strokeWidth={3} /></span>
              </div>
            </FloatCard>
          </>
        )}
      </div>
    </aside>
  );
}

/* ───── Cadre ───── */
export default function AuthLayout({ variant = "login", title, highlight, subtitle, shopName, children }) {
  return (
    // overflow-x: clip (et non hidden) : evite la barre de defilement pendant l'entree sans casser le "sticky"
    <main className="draw-now min-h-screen [overflow-x:clip] bg-gradient-to-b from-[#FFF8F3] via-white to-[#FBFAF8] font-landing lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 xl:px-16">
        <header className="seq-down flex items-center justify-between">
          <a href="/" onClick={goTo("/")} aria-label="Accueil CatalogueCI"><Logo /></a>
          <a href="/" onClick={goTo("/")} className="group inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-white hover:text-ink-900">
            <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
            Accueil
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[27rem]">
            <h1 className="seq relative font-landing text-[2.2rem] font-bold leading-[1.15] tracking-tight text-ink-900 sm:text-[2.6rem]" style={{ "--d": "150ms" }}>
              {title}
              {/* Mot souligne + eclat colles : l'eclat ne part jamais seul a la ligne */}
              {highlight ? <> <span className="whitespace-nowrap"><Brush>{highlight}</Brush><Spark className="-mt-8 ml-1" /></span></> : null}
            </h1>
            {subtitle ? <p className="seq mt-4 leading-relaxed text-ink-500" style={{ "--d": "250ms" }}>{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
          <span>&copy; {new Date().getFullYear()} CatalogueCI · Abidjan</span>
          <span className="flex gap-4">
            <a href="/cgu" onClick={goTo("/cgu")} className="hover:text-ink-700">Conditions</a>
            <a href="/confidentialite" onClick={goTo("/confidentialite")} className="hover:text-ink-700">Confidentialite</a>
          </span>
        </footer>
      </div>

      <AuthVisual variant={variant} shopName={shopName} />
    </main>
  );
}
