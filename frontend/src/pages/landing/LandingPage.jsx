import { useEffect, useRef, useState } from "react";
import {
  Bell, ChevronDown, ChevronRight, Facebook, Home, Instagram, Mail, MapPin, Menu, MessageCircle, Music2, Search,
  Store, User, X,
} from "lucide-react";
import { navigate } from "../../utils/navigation";
import IvoryCoastMap from "./IvoryCoastMap";
import CitySelect from "./CitySelect";
import { Birds, Brush, Cloud, HeroDoodle, Logo, Spark, Sparkle, Swirl } from "./Doodles";
import { useCountUp, useInView, useReveal } from "./useLandingMotion";

// Reproduction de la maquette video (Campy) aux couleurs CatalogueCI :
// bleu de la maquette -> orange (brand), noir-bleu -> encre (ink).
const SUPPORT_EMAIL = "support@catalogueci.com";
const IMG = (name) => `/landing/${name}.webp`;

function goTo(path) {
  return (e) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo(0, 0);
  };
}

/* ───── Navigation ───── */
const NAV = [
  { href: "#accueil", label: "Accueil" },
  { href: "#atouts", label: "Atouts" },
  { href: "#commerces", label: "Commerces", menu: true },
  { href: "#faq", label: "Contact" },
  { href: "#villes", label: "Villes" },
];
const COMMERCE_LINKS = ["Maquis et restaurants", "Couture et pagnes", "Coiffure et beaute", "Epicerie et marche"];

function Navbar({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${scrolled || open ? "bg-white/90 shadow-card backdrop-blur-md" : "bg-transparent"}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5" aria-label="Navigation principale">
        <a href="#accueil" className="seq-down" style={{ "--d": "0ms" }}><Logo /></a>

        <ul className="hidden items-center gap-10 text-[0.95rem] text-ink-700 md:flex">
          {NAV.map((item, i) => (
            <li key={item.label} className="seq-down relative" style={{ "--d": `${120 + i * 80}ms` }} onMouseLeave={() => item.menu && setMenu(false)}>
              <a
                href={item.href}
                onMouseEnter={() => item.menu && setMenu(true)}
                className={`group relative flex items-center gap-1 py-1 transition-colors hover:text-ink-900 ${i === 0 ? "text-ink-900" : ""}`}
              >
                {item.label}
                {item.menu ? <ChevronDown size={14} className="text-brand-500" /> : null}
                {/* Petit trait sous le lien actif (Accueil), comme la maquette */}
                <span className={`absolute -bottom-1.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-brand-500 transition-transform duration-300 ${i === 0 ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              </a>
              {item.menu ? (
                <div className={`absolute left-1/2 top-full z-10 w-56 -translate-x-1/2 pt-3 transition duration-200 ${menu ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
                  <div className="rounded-2xl border border-surface-border bg-white p-2 shadow-modal">
                    {COMMERCE_LINKS.map((label) => (
                      <a key={label} href="#commerces" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700">{label}</a>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 sm:flex">
          <button onClick={onLogin} className="seq-down rounded-full bg-ink-900 px-7 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800" style={{ "--d": "560ms" }}>Connexion</button>
          <button onClick={onRegister} className="seq-down rounded-full border border-ink-800 px-6 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ink-900 hover:text-white" style={{ "--d": "680ms" }}>Inscription</button>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} className="rounded-xl p-2 text-ink-800 hover:bg-ink-100 md:hidden">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-1 border-t border-surface-border px-5 pb-5 pt-3">
            {NAV.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50">{item.label}</a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={onLogin} className="rounded-full bg-ink-900 py-2.5 text-sm font-medium text-white">Connexion</button>
              <button onClick={onRegister} className="rounded-full border border-ink-800 py-2.5 text-sm font-medium text-ink-900">Inscription</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ───── Hero : la main tient le telephone, l'ecran affiche l'appli ───── */
function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-white font-landing text-ink-900">
      {/* Encoche de l'iPhone */}
      <div className="absolute left-1/2 top-0 z-10 h-[4%] w-[52%] -translate-x-1/2 rounded-b-2xl bg-black" />

      <div className="seq relative overflow-hidden bg-gradient-to-b from-brand-100 to-brand-50 px-3 pb-4 pt-7" style={{ "--d": "900ms" }}>
        <Cloud className="drift absolute -right-3 top-6 w-16 opacity-90" />
        <Cloud className="drift-slow absolute left-10 top-12 w-12 opacity-80" />
        <div className="relative flex items-center justify-between">
          <span className="flex flex-col gap-[3px]"><span className="h-[2px] w-3 rounded bg-ink-800" /><span className="h-[2px] w-2 rounded bg-ink-800" /></span>
          <span className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
            <img src={IMG("client-2")} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
            <span className="text-[7px] font-semibold">Awa</span>
          </span>
        </div>
        <p className="relative mt-3 text-[13px] font-bold leading-tight">Votre boutique<br />en un clic.</p>
      </div>

      <div className="seq flex-1 space-y-2 px-3 pt-2.5" style={{ "--d": "1150ms" }}>
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold">Recommandes</p>
          <p className="flex items-center text-[7px] text-ink-400">Voir tout <ChevronRight size={8} /></p>
        </div>
        <div className="flex gap-1.5 overflow-hidden">
          {[
            { img: "plat-jollof", name: "Riz gras", price: "2 500 F" },
            { img: "plat-brochettes", name: "Brochettes", price: "1 500 F" },
          ].map((p) => (
            <div key={p.name} className="relative w-[62%] shrink-0 overflow-hidden rounded-xl shadow-card">
              <img src={IMG(p.img)} alt="" className="h-[4.6rem] w-full object-cover" />
              <div className="absolute inset-x-1 bottom-1 rounded-lg bg-white/90 px-1.5 py-0.5">
                <p className="text-[7px] font-bold">{p.name}</p>
                <p className="text-[6px] text-brand-600">{p.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="seq flex items-center justify-between pt-1" style={{ "--d": "1400ms" }}>
          <p className="text-[9px] font-bold">Mes commandes</p>
          <p className="flex items-center text-[7px] text-ink-400">Voir <ChevronRight size={8} /></p>
        </div>
        <div className="seq flex items-center gap-2 rounded-xl bg-surface p-1.5" style={{ "--d": "1550ms" }}>
          <img src={IMG("plat-poulet")} alt="" className="h-7 w-7 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[7px] font-semibold">Poulet braise x2</p>
            <p className="text-[6px] text-ink-400">12:41 · Riviera</p>
          </div>
          <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[6px] font-semibold text-white">Payee</span>
        </div>
      </div>

      <div className="seq flex items-center justify-around border-t border-surface-border px-2 py-2 text-ink-300" style={{ "--d": "1700ms" }}>
        <Home size={11} className="text-brand-500" />
        <Bell size={11} />
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white shadow-card"><Search size={10} /></span>
        <MessageCircle size={11} />
        <User size={11} />
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]" aria-hidden="true">
      {/* Arcs pointilles derriere le telephone */}
      <svg viewBox="0 0 400 400" className="spin-slow absolute inset-[6%] h-[88%] w-[88%] text-ink-200">
        <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" />
        <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="120 40 6 40" />
      </svg>

      <div className="seq-right absolute inset-0" style={{ "--d": "250ms" }}>
        {/* Main et telephone (photo en noir et blanc, fond blanc fondu dans la page) */}
        <img src={IMG("main-telephone")} alt="" className="absolute inset-0 h-full w-full object-contain" fetchpriority="high" />
        {/* Ecran incruste exactement dans l'ecran de la photo */}
        <div className="absolute overflow-hidden rounded-[1.6rem]" style={{ left: "33.2%", top: "9.1%", width: "35.3%", height: "76.8%", transform: "rotate(0.45deg)" }}>
          <PhoneScreen />
        </div>
      </div>

      {/* Largeurs en % : les nuages restent a cote de l'ecran, meme sur mobile */}
      <Cloud className="drift absolute left-[8%] top-[20%] w-[21%]" />
      <Cloud className="drift-slow absolute right-[2%] top-[17%] w-[18%]" />
      <Birds className="absolute right-[6%] top-[34%] w-7" />
      <Swirl className="absolute bottom-[2%] right-[-4%] w-44" d="M4 80 C 40 60, 90 96, 120 70 C 140 52, 150 40, 156 30" />
    </div>
  );
}

function Hero({ onRegister }) {
  return (
    <section id="accueil" className="draw-now relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
        <div className="relative">
          <h1 className="font-landing text-[2.8rem] font-bold leading-[1.18] tracking-tight text-ink-900 sm:text-6xl lg:text-[4.2rem]">
            <span className="seq block" style={{ "--d": "300ms" }}>
              Vendez sur
              <HeroDoodle className="absolute -top-9 left-[52%] hidden w-24 sm:block" />
            </span>
            <span className="seq block whitespace-nowrap" style={{ "--d": "450ms" }}>WhatsApp, mais</span>
            <span className="seq block" style={{ "--d": "600ms" }}><Brush>en mieux !</Brush></span>
          </h1>
          <p className="seq mt-7 max-w-md font-landing text-lg leading-relaxed text-ink-500" style={{ "--d": "800ms" }}>
            Vos produits, vos prix et vos photos sur une seule page. Vos clients commandent et paient avec Wave.
          </p>
          <button onClick={onRegister} className="seq mt-9 rounded-full bg-ink-900 px-9 py-4 font-landing text-base font-medium text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-ink-800" style={{ "--d": "950ms" }}>
            Creer ma boutique
          </button>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/* ───── Bande de chiffres ───── */
const STATS = [
  { value: 5, suffix: " min", label: ["Pour creer", "sa boutique"] },
  { value: 0, suffix: " F", label: ["Pendant le", "lancement"] },
  { value: 24, suffix: "h/24", label: ["Vos clients", "commandent"] },
  { value: 3, suffix: "", label: ["Moyens de", "paiement"] },
];

function Stat({ value, suffix, label, start }) {
  const n = useCountUp(value, start);
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2">
      <span className="whitespace-nowrap font-landing text-4xl font-medium tabular-nums lg:text-5xl">{n}{suffix}</span>
      <span className="text-xs leading-tight text-white/80">{label[0]}<br />{label[1]}</span>
    </div>
  );
}

function StatsBand() {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <section ref={ref} className="reveal bg-brand-500 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-5 py-9 lg:grid-cols-4 lg:divide-x lg:divide-white/25">
        {STATS.map((s) => <Stat key={s.suffix + s.label[0]} {...s} start={inView} />)}
      </div>
    </section>
  );
}

/* ───── Atouts : 3 icones 3D ───── */
const FEATURES = [
  { icon: "icone-catalogue", title: "Catalogue et QR code", text: "Vos produits avec photos et prix sur une page a votre nom." },
  { icon: "icone-whatsapp", title: "Commandes WhatsApp", text: "La commande arrive complete, avec le bon produit et le bon prix." },
  { icon: "icone-paiement", title: "Paiement Wave", text: "Wave, a la livraison ou sur WhatsApp : vous choisissez." },
];

function Features() {
  return (
    <section id="atouts" className="scroll-mt-24 pt-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_2fr]">
        <div className="reveal relative">
          <Sparkle className="absolute -left-7 -top-6" />
          <h2 className="font-landing text-[2.4rem] font-bold leading-[1.2] text-ink-900">C'est comme ca<br />qu'on vend !</h2>
          <p className="mt-5 max-w-xs font-landing text-[1.05rem] leading-relaxed text-ink-500">Profitez de tous les avantages en utilisant nos services.</p>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {FEATURES.map(({ icon, title, text }, i) => (
            <div key={title}>
              <img src={IMG(icon)} alt="" className="reveal reveal-icon h-16 w-16 object-contain drop-shadow-[0_8px_10px_rgba(17,24,39,0.12)]" style={{ "--i": i + 1 }} />
              <div className="reveal" style={{ "--i": i + 3 }}>
                <h3 className="mt-5 font-landing text-lg font-bold text-ink-900">{title}</h3>
                <p className="mt-3 font-landing text-[0.95rem] leading-relaxed text-ink-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Carte + recherche ───── */
const CITIES = ["Abidjan", "Bouake", "Yamoussoukro", "San-Pedro", "Korhogo", "Daloa", "Man", "Autre ville"];

function MapSearch() {
  const [shop, setShop] = useState("");
  const [city, setCity] = useState("Abidjan");

  function start(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (shop.trim()) params.set("boutique", shop.trim());
    params.set("ville", city);
    navigate(`/inscription?${params}`);
    window.scrollTo(0, 0);
  }

  return (
    <section id="villes" className="relative scroll-mt-24 overflow-hidden pb-24 pt-16">
      <Swirl className="absolute right-[4%] top-10 hidden w-40 lg:block" d="M150 8 C 100 30, 150 60, 120 80 C 92 98, 60 70, 96 52 C 120 40, 60 30, 10 44" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <IvoryCoastMap />
        <div className="reveal reveal-right">
          <h2 className="font-landing text-[2.4rem] font-bold leading-[1.2] text-ink-900">Maquis, boutique,<br />salon… qu'est-ce qu'il<br />vous faut de plus ?</h2>
          <p className="mt-5 max-w-md font-landing text-[1.05rem] leading-relaxed text-ink-500">Des commerces dans toute la Cote d'Ivoire. Trouvez le nom de votre boutique et ouvrez-la maintenant.</p>

          <form onSubmit={start} className="mt-9 flex flex-col gap-1 rounded-[1.6rem] bg-white p-2 shadow-modal sm:flex-row sm:items-center sm:rounded-full">
            <label className="flex flex-1 items-center gap-3 rounded-full px-4 py-2">
              <Store size={20} className="shrink-0 text-brand-500" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-landing text-sm font-semibold text-ink-900">Boutique <ChevronDown size={13} /></span>
                <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Nom de votre boutique" className="w-full bg-transparent font-landing text-sm text-ink-600 outline-none placeholder:text-ink-400" />
              </span>
            </label>
            <div className="sm:w-48"><CitySelect value={city} onChange={setCity} options={CITIES} /></div>
            <button type="submit" aria-label="Creer ma boutique" className="mt-1 grid h-14 w-full shrink-0 place-items-center rounded-full bg-ink-900 text-white transition hover:bg-brand-600 sm:mt-0 sm:w-14">
              <Search size={20} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ───── Communaute ───── */
const PEOPLE = [
  { img: "client-1", pos: "left-[6%] top-[10%]", ring: "ring-emerald-100", size: "h-[4.5rem] w-[4.5rem]" },
  { img: "client-4", pos: "right-[10%] top-[16%]", ring: "ring-violet-100", size: "h-16 w-16" },
  { img: "client-3", pos: "right-[2%] top-[46%]", ring: "ring-orange-100", size: "h-[4.5rem] w-[4.5rem]" },
  { img: "client-5", pos: "left-[4%] bottom-[10%]", ring: "ring-rose-100", size: "h-[4.75rem] w-[4.75rem]" },
  { img: "client-2", pos: "right-[22%] bottom-[12%]", ring: "ring-amber-100", size: "h-14 w-14" },
];
const BUBBLES = [
  { text: "Akwaba !!", pos: "left-[28%] top-[34%]" },
  { text: "On y va !!", pos: "right-[14%] top-[8%]" },
  { text: "Je commande !!", pos: "right-[18%] bottom-[28%]" },
];
const SOCIALS = [
  { icon: Facebook, pos: "left-[42%] top-[2%]", color: "text-blue-600" },
  { icon: Instagram, pos: "left-[18%] top-[48%]", color: "text-pink-600" },
  { icon: Music2, pos: "left-[44%] bottom-[4%]", color: "text-ink-900" },
];

function Community({ onRegister }) {
  return (
    <section className="relative py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="font-landing text-[2.4rem] font-bold leading-[1.2] text-ink-900">
            Vos clients sont sur<Spark className="-mt-6 ml-1" /><br />WhatsApp, votre<br />boutique aussi.
          </h2>
          <p className="mt-5 max-w-sm font-landing text-[1.05rem] leading-relaxed text-ink-500">Partagez votre lien dans vos statuts, sur TikTok ou Facebook, et recevez des commandes claires.</p>
          <button onClick={onRegister} className="mt-9 rounded-full bg-ink-900 px-9 py-4 font-landing text-base font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink-800">Obtenir mon lien</button>
        </div>

        <div className="reveal-group relative mx-auto aspect-[1.15] w-full max-w-lg" aria-hidden="true">
          {/* Rectangle teinte derriere l'avatar central */}
          <div className="pop absolute left-[22%] top-[20%] h-[62%] w-[60%] rounded-[1.75rem] bg-brand-50" style={{ "--i": 0 }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="pop" style={{ "--i": 1 }}>
              <img src={IMG("client-3")} alt="" className="h-32 w-32 rounded-full object-cover shadow-modal ring-[10px] ring-brand-100" />
            </div>
          </div>
          {PEOPLE.map(({ img, pos, ring, size }, i) => (
            <div key={img + pos} className={`absolute ${pos}`}>
              <div className="pop" style={{ "--i": i + 2 }}>
                <img src={IMG(img)} alt="" className={`${size} animate-float rounded-full object-cover shadow-card-hover ring-[6px] ${ring}`} style={{ animationDelay: `${i * 0.6}s` }} />
              </div>
            </div>
          ))}
          {SOCIALS.map(({ icon: Icon, pos, color }, i) => (
            <div key={pos} className={`absolute ${pos}`}>
              <div className="pop" style={{ "--i": i + 6 }}>
                <span className={`grid h-12 w-12 animate-float-slow place-items-center rounded-full bg-white shadow-card-hover ${color}`} style={{ animationDelay: `${i * 0.8}s` }}><Icon size={20} /></span>
              </div>
            </div>
          ))}
          {BUBBLES.map(({ text, pos }, i) => (
            <div key={text} className={`absolute ${pos}`}>
              <div className="pop" style={{ "--i": i + 8 }}>
                <span className="block whitespace-nowrap rounded-full rounded-bl-md bg-ink-900 px-3 py-1.5 font-landing text-xs font-semibold text-white shadow-card-hover">{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Carrousel (emplacement des temoignages de la maquette) ───── */
// Exemples d'utilisation, pas des temoignages : remplacer par de vrais avis clients des qu'il y en a.
const SHOWCASE = [
  { img: "cas-maquis", name: "Maquis et restaurants", place: "Abidjan", text: "Le menu du jour en photos et les paiements Wave sans erreur de montant.", tags: ["Catalogue", "Wave"] },
  { img: "cas-mode", name: "Couture et pagnes", place: "Bouake", text: "Chaque modele avec la taille et le tissu demandes au client.", tags: ["Champs", "WhatsApp"] },
  { img: "cas-coiffure", name: "Coiffure et beaute", place: "Korhogo", text: "Vos prestations et vos prix affiches clairement, la cliente choisit son jour.", tags: ["Services"] },
  { img: "cas-services", name: "Services et credit", place: "Daloa", text: "Un lien a partager, une commande claire, un paiement verifie.", tags: ["Lien", "Wave"] },
  { img: "cas-patisserie", name: "Boulangerie", place: "Yamoussoukro", text: "Les commandes pour les fetes avec la date de retrait au meme endroit.", tags: ["Commandes"] },
  { img: "cas-epicerie", name: "Epicerie et marche", place: "San-Pedro", text: "Le client paie a la livraison ou par Wave et suit sa commande.", tags: ["Livraison"] },
];

function LongArrow({ dir = 1 }) {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-12" aria-hidden="true" style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}>
      <path d="M2 8 C 16 7, 30 9, 44 8 M36 2 C 40 5, 42 7, 45 8 C 42 9, 40 11, 36 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Showcase() {
  const viewportRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [cardW, setCardW] = useState(0);
  const [hover, setHover] = useState(false);
  const visible = cardW ? Math.max(1, Math.round((viewportRef.current?.clientWidth || 0) / cardW)) : 3;
  const maxIndex = Math.max(0, SHOWCASE.length - visible);

  useEffect(() => {
    function measure() {
      const card = viewportRef.current?.querySelector("article");
      if (card) setCardW(card.getBoundingClientRect().width + 32);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Defilement automatique d'une carte toutes les 3,5 s (pause au survol)
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (hover || reduced) return undefined;
    const timer = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), 3500);
    return () => clearInterval(timer);
  }, [hover, maxIndex]);

  return (
    <section id="commerces" className="relative scroll-mt-24 pb-24">
      {/* Ligne a main levee qui descend de la communaute vers ce titre */}
      <svg viewBox="0 0 600 160" className="reveal-group pointer-events-none absolute -top-24 left-[30%] hidden w-[38rem] text-ink-300 lg:block" aria-hidden="true">
        <path className="draw-path" pathLength="1" d="M560 4 C 560 60, 470 70, 440 50 C 412 30, 450 6, 470 30 C 500 70, 380 110, 300 100 C 200 88, 120 120, 40 150" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path className="draw-path" pathLength="1" d="M52 138 L40 150 L56 152" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>

      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="reveal relative">
            <Sparkle className="absolute -left-8 -top-6" />
            <h2 className="font-landing text-[2.4rem] font-bold leading-[1.2] text-ink-900">Un catalogue pour<br />chaque commerce.</h2>
          </div>
          <div className="reveal flex items-center gap-4 text-ink-700">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Precedent" className="transition hover:text-brand-600 disabled:opacity-30"><LongArrow dir={-1} /></button>
            <button onClick={() => setIndex((i) => (i >= maxIndex ? 0 : i + 1))} aria-label="Suivant" className="transition hover:text-brand-600"><LongArrow /></button>
          </div>
        </div>

        <div ref={viewportRef} className="reveal mask-fade-x mt-12 overflow-hidden" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <div className="flex gap-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${index * cardW}px)` }}>
            {SHOWCASE.map(({ img, name, place, text, tags }) => (
              <article key={name} className="w-full shrink-0 sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)]">
                <span className="font-landing text-4xl font-bold leading-none text-brand-500" aria-hidden="true">&#8220;</span>
                <p className="mt-2 min-h-[4.5rem] font-landing text-[1.05rem] leading-relaxed text-ink-800">{text}</p>
                <div className="mt-5 border-t border-surface-border pt-5">
                  <div className="flex items-center gap-3">
                    <img src={IMG(img)} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                    <div>
                      <p className="font-landing text-sm font-bold text-ink-900">{name}</p>
                      <p className="font-landing text-xs text-ink-400">{place}</p>
                      <div className="mt-1 flex gap-1">
                        {tags.map((t) => <span key={t} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── FAQ ───── */
const FAQS = [
  { q: "CatalogueCI est-il gratuit ?", a: "Oui. Pendant le lancement, tout est gratuit, sans limite de produits ni de commandes." },
  { q: "Comment mes clients me paient ?", a: "Par Wave (manuel ou automatique), a la livraison, ou en vous contactant sur WhatsApp." },
  { q: "Faut-il un site web ?", a: "Non. CatalogueCI cree la page de votre boutique : il suffit de partager le lien ou le QR code." },
  { q: "Comment je recois les commandes ?", a: "Dans votre tableau de bord, avec les infos du client et du produit. Vous lui ecrivez sur WhatsApp en un clic." },
];

function FAQ() {
  const [open, setOpen] = useState(-1);
  const [email, setEmail] = useState("");

  function ask(e) {
    e.preventDefault();
    const subject = encodeURIComponent("Question sur CatalogueCI");
    const body = encodeURIComponent(`Bonjour,\n\nJ'ai une question :\n\n\n(Mon email : ${email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <section id="faq" className="relative scroll-mt-24 pb-28 pt-10">
      <Swirl className="absolute left-0 top-6 hidden w-24 lg:block" d="M60 6 C 20 20, 40 50, 70 40 C 96 30, 70 4, 40 30 C 18 50, 30 80, 60 94" />
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="font-landing text-[2.4rem] font-bold leading-[1.2] text-ink-900">Une question sur<Spark className="-mt-6 ml-1" /><br />CatalogueCI ?</h2>
          <p className="mt-5 max-w-sm font-landing text-[1.05rem] leading-relaxed text-ink-500">Si vous avez une question, ecrivez-nous : nous repondons a toutes vos questions.</p>
          <form onSubmit={ask} className="mt-9 flex max-w-sm items-center rounded-full border border-ink-400 bg-white p-1 pl-6">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre email" aria-label="Votre email" className="min-w-0 flex-1 bg-transparent font-landing text-sm outline-none placeholder:text-ink-400" />
            <button type="submit" className="rounded-full bg-ink-900 px-7 py-3 font-landing text-sm font-medium text-white transition hover:bg-brand-600">Envoyer</button>
          </form>
        </div>

        <div>
          <p className="reveal max-w-sm font-landing text-[1.05rem] leading-relaxed text-ink-800">Votre question a peut-etre deja une reponse, regardez ici.</p>
          <ul className="mt-6">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = open === i;
              return (
                <li key={q} className="reveal border-b border-surface-border" style={{ "--i": i + 1 }}>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                    <span className="font-landing text-[1.05rem] text-ink-900">{q}</span>
                    <span className={`text-brand-500 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}><LongArrow /></span>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className={`pb-5 pr-10 font-landing text-[0.95rem] leading-relaxed text-ink-500 transition duration-500 ${isOpen ? "translate-y-0 opacity-100 delay-150" : "-translate-y-2 opacity-0"}`}>{a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───── Pied de page plein (bleu dans la maquette -> orange) ───── */
function Footer({ onLogin, onRegister }) {
  const linkClass = "text-sm text-white/80 transition hover:text-white";
  const columns = [
    { title: "Plateforme", links: [["Accueil", "#accueil"], ["Atouts", "#atouts"], ["Commerces", "#commerces"], ["FAQ", "#faq"]] },
    { title: "Ressources", links: [["Conditions d'utilisation", "/cgu"], ["Confidentialite", "/confidentialite"], ["Suivre une commande", "/suivi-commande"]] },
    { title: "Compte", links: [["Connexion", onLogin], ["Inscription", onRegister], ["Mot de passe oublie", "/mot-de-passe-oublie"]] },
  ];

  return (
    <footer className="bg-brand-500 font-landing text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 pt-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr]">
        <div className="reveal">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/85">Nous aidons chaque commercant a vendre plus simplement, en lui offrant tous les outils possibles.</p>
        </div>
        {columns.map(({ title, links }, i) => (
          <div key={title} className="reveal" style={{ "--i": i + 1 }}>
            <p className="mb-5 font-semibold">{title}</p>
            <ul className="space-y-3">
              {links.map(([label, target]) => (
                <li key={label}>
                  {typeof target === "function" ? (
                    <button onClick={target} className={linkClass}>{label}</button>
                  ) : target.startsWith("/") ? (
                    <a href={target} onClick={goTo(target)} className={linkClass}>{label}</a>
                  ) : (
                    <a href={target} className={linkClass}>{label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="reveal" style={{ "--i": 4 }}>
          <p className="mb-5 font-semibold">Contact</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>{SUPPORT_EMAIL}</a>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80"><MapPin size={14} /> Abidjan</p>
          <div className="mt-4 flex gap-2.5">
            <a href={`mailto:${SUPPORT_EMAIL}`} aria-label="Nous ecrire" className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-600 transition hover:scale-110"><Mail size={16} /></a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5">
        <p className="border-t border-white/25 py-6 text-center text-sm text-white/85">Copyright © {new Date().getFullYear()} CatalogueCI. Tous droits reserves.</p>
      </div>
    </footer>
  );
}

/* ───── Page ───── */
export default function LandingPage({ onLogin, onRegister }) {
  const rootRef = useReveal();
  return (
    <div ref={rootRef} className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#FFF8F3] via-white to-[#FBFAF8] font-landing">
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <main>
        <Hero onRegister={onRegister} />
        <StatsBand />
        <Features />
        <MapSearch />
        <Community onRegister={onRegister} />
        <Showcase />
        <FAQ />
      </main>
      <Footer onLogin={onLogin} onRegister={onRegister} />
    </div>
  );
}
