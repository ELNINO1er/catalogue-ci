import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, Mail, MapPin, Menu, MessageCircle, QrCode, Search, ShoppingBag, Store, X,
} from "lucide-react";
import { navigate } from "../../utils/navigation";
import IvoryCoastMap from "./IvoryCoastMap";
import CitySelect from "./CitySelect";
import HowItWorks from "./HowItWorks";
import { useCountUp, useInView, useParallax, useReveal } from "./useLandingMotion";

const SUPPORT_EMAIL = "support@catalogueci.com";
const IMG = (name) => `/landing/${name}.webp`;

function goTo(path) {
  return (e) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo(0, 0);
  };
}

function Eyebrow({ children, light = false }) {
  return (
    <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${light ? "text-white/80" : "text-brand-600"}`}>
      <span className={`h-px w-6 ${light ? "bg-white/60" : "bg-brand-500"}`} /> {children}
    </p>
  );
}

/* Trait de feutre sous un mot, qui se dessine a l'arrivee */
function Underlined({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-3 w-full text-brand-500" aria-hidden="true">
        <path className="draw-path" pathLength="1" d="M4 13 C 80 5, 170 5, 296 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

/* ───── Navigation ───── */
const NAV_LINKS = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#commerces", label: "Commerces" },
  { href: "#villes", label: "Partout en CI" },
  { href: "#faq", label: "FAQ" },
];

function Navbar({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${scrolled || open ? "bg-white/90 shadow-card backdrop-blur-md" : "bg-transparent"}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4" aria-label="Navigation principale">
        <a href="/" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white"><ShoppingBag size={18} /></span>
          <span className="font-display text-lg font-bold text-ink-900">CatalogueCI</span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="group relative py-1 transition-colors hover:text-ink-900">
              {link.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand-500 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button onClick={onLogin} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition hover:text-ink-900">Connexion</button>
          <button onClick={onRegister} className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-ink-800 active:translate-y-0">
            Creer ma boutique
          </button>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} className="rounded-xl p-2 text-ink-800 hover:bg-ink-100 sm:hidden">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out sm:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-1 border-t border-surface-border px-5 pb-5 pt-3">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">{link.label}</a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={onLogin} className="rounded-full border border-ink-300 py-2.5 text-sm font-semibold text-ink-800">Connexion</button>
              <button onClick={onRegister} className="rounded-full bg-ink-900 py-2.5 text-sm font-semibold text-white">Creer ma boutique</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ───── Hero : photo reelle + apercus de l'interface ───── */
const PHONE_PRODUCTS = [
  { name: "Riz gras poisson", price: "2 500", img: "plat-jollof" },
  { name: "Brochettes", price: "1 500", img: "plat-brochettes" },
  { name: "Poulet braise", price: "3 500", img: "plat-poulet" },
  { name: "Assiette du jour", price: "2 000", img: "plat-street" },
];

function HeroVisual() {
  const phoneRef = useParallax(-0.06);
  const cardRef = useParallax(0.05);

  return (
    <div className="relative mx-auto w-full max-w-[34rem] pb-10 pl-6 sm:pl-10">
      {/* Photo de la commercante */}
      <div className="photo-reveal relative aspect-[5/6] w-[78%] rounded-[2rem] shadow-modal">
        <img src={IMG("hero")} alt="Commercante dans sa boutique, telephone en main" className="h-full w-full rounded-[2rem] object-cover" fetchpriority="high" />
      </div>

      {/* Telephone : apercu reel d'un catalogue */}
      <div ref={phoneRef} className="absolute bottom-0 right-0 w-[46%] min-w-[11rem]">
        <div className="reveal reveal-right" style={{ "--i": 3 }}>
          <div className="rounded-[2rem] bg-ink-900 p-1.5 shadow-modal">
            <div className="overflow-hidden rounded-[1.6rem] bg-surface">
              <div className="bg-brand-500 px-3 pb-5 pt-4 text-white">
                <p className="text-[9px] text-white/75">Maquis · Cocody Angre</p>
                <p className="font-display text-xs font-bold">Chez Tantie Awa</p>
              </div>
              <div className="-mt-3 grid grid-cols-2 gap-1.5 rounded-t-2xl bg-surface p-2">
                {PHONE_PRODUCTS.map((p) => (
                  <div key={p.name} className="rounded-xl bg-white p-1 shadow-card">
                    <img src={IMG(p.img)} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
                    <p className="mt-1 truncate px-0.5 text-[9px] font-semibold text-ink-800">{p.name}</p>
                    <p className="px-0.5 pb-0.5 text-[9px] font-bold text-brand-600">{p.price} F</p>
                  </div>
                ))}
              </div>
              <div className="px-2 pb-3">
                <div className="flex items-center justify-center gap-1 rounded-lg bg-whatsapp py-1.5 text-[9px] font-bold text-white">
                  <MessageCircle size={10} /> Commander
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification de commande */}
      <div ref={cardRef} className="absolute -right-4 top-[3%] hidden sm:block">
        <div className="reveal reveal-right" style={{ "--i": 5 }}>
          <div className="w-56 rounded-2xl bg-white p-3 shadow-modal">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                Nouvelle commande
              </span>
              <span className="text-2xs text-ink-400">a l'instant</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink-900">Riz gras poisson x2</p>
            <p className="text-xs text-ink-500">Koffi · Livraison Riviera 2</p>
            <div className="mt-2 flex items-center justify-between border-t border-surface-border pt-2">
              <span className="text-xs text-ink-500">Paye par Wave</span>
              <span className="font-display text-sm font-bold text-ink-900">5 000 F</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onRegister }) {
  return (
    <section className="draw-now relative">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-8 lg:grid-cols-[1fr_1.05fr] lg:pt-14">
        <div className="text-center lg:text-left">
          <div className="reveal" style={{ "--i": 0 }}><Eyebrow>Boutique en ligne · Cote d'Ivoire</Eyebrow></div>
          <h1 className="reveal mt-5 font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-6xl" style={{ "--i": 1 }}>
            Vendez sur WhatsApp, mais <Underlined>en mieux.</Underlined>
          </h1>
          <p className="reveal mx-auto mt-6 max-w-md text-[1.05rem] leading-relaxed text-ink-500 lg:mx-0" style={{ "--i": 2 }}>
            Vos produits, vos prix et vos photos sur une vraie page. Le client commande, paie avec Wave, et vous recevez tout au meme endroit.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ "--i": 3 }}>
            <button onClick={onRegister} className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-card-hover transition hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0">
              Creer ma boutique gratuitement
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <a href="#fonctionnement" className="rounded-full border border-ink-200 px-6 py-3.5 text-sm font-semibold text-ink-800 transition hover:border-ink-900">
              Comment ca marche
            </a>
          </div>
          <ul className="reveal mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-500 lg:justify-start" style={{ "--i": 4 }}>
            {["Pret en 5 minutes", "Sans site web", "Gratuit au lancement"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> {t}</li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/* ───── Bandeau defilant des commerces ───── */
const TRADES = ["Maquis", "Boutique de pagnes", "Salon de tresses", "Patisserie", "Epicerie", "Vente de credit", "Friperie", "Cosmetiques", "Traiteur", "Telephonie", "Couture", "Garba"];

function Marquee() {
  const items = [...TRADES, ...TRADES];
  return (
    <div className="marquee overflow-hidden border-y border-surface-border bg-white py-4" aria-label="Types de commerces">
      <div className="marquee-track flex w-max items-center gap-8">
        {items.map((t, i) => (
          <span key={`${t}-${i}`} className="flex items-center gap-8 whitespace-nowrap font-display text-lg font-semibold text-ink-300" aria-hidden={i >= TRADES.length}>
            {t} <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───── Chiffres (faits reels, pas de statistiques inventees) ───── */
const FACTS = [
  { value: 5, suffix: " min", label: "pour mettre sa boutique en ligne" },
  { value: 0, suffix: " FCFA", label: "pendant toute la phase de lancement" },
  { value: 24, suffix: "h/24", label: "vos clients peuvent commander" },
  { value: 3, suffix: "", label: "moyens de paiement : Wave, livraison, WhatsApp" },
];

function Fact({ value, suffix, label, start, index }) {
  const count = useCountUp(value, start);
  return (
    <div className={`px-2 py-2 ${index ? "lg:border-l lg:border-white/20 lg:pl-8" : ""}`}>
      <p className="whitespace-nowrap font-display text-4xl font-bold tabular-nums">{count}{suffix}</p>
      <p className="mt-1 max-w-[13rem] text-sm leading-snug text-white/80">{label}</p>
    </div>
  );
}

function FactsBand() {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <section className="px-5 pt-16">
      <div ref={ref} className="reveal mx-auto grid max-w-6xl gap-6 rounded-[2rem] bg-brand-500 px-8 py-10 text-white sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((fact, i) => <Fact key={fact.label} {...fact} index={i} start={inView} />)}
      </div>
    </section>
  );
}

/* ───── Commerces (photos reelles) ───── */
// Exemples d'utilisation illustres par des photos libres, pas des temoignages de clients.
const USE_CASES = [
  { img: "cas-maquis", title: "Maquis et restaurants", text: "Le menu du jour en photos, les commandes a emporter et les paiements Wave sans erreur de montant." },
  { img: "cas-mode", title: "Couture et pagnes", text: "Chaque modele avec la taille et le tissu demandes au client. Plus besoin d'envoyer dix photos par conversation." },
  { img: "cas-coiffure", title: "Coiffure et beaute", text: "Vos prestations et vos prix affiches clairement. La cliente choisit et indique le jour qui lui convient." },
  { img: "cas-services", title: "Services et credit", text: "Abonnements, recharges, graphisme : un lien a partager, une commande claire, un paiement verifie." },
  { img: "cas-patisserie", title: "Boulangerie et patisserie", text: "Les commandes pour les fetes avec la date de retrait et les precisions, au meme endroit." },
  { img: "cas-epicerie", title: "Epicerie et marche", text: "Le client commande, paie a la livraison ou par Wave, et suit sa commande avec son numero." },
];

function UseCases() {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [current, setCurrent] = useState(0);

  function updateEdges() {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    const card = el.querySelector("article");
    if (card) setCurrent(Math.min(USE_CASES.length - 1, Math.round(el.scrollLeft / (card.offsetWidth + 24))));
  }

  function scrollToCard(index) {
    const el = trackRef.current;
    const card = el?.querySelectorAll("article")[index];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: "smooth" });
  }

  function scroll(direction) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    el.scrollBy({ left: direction * ((card?.offsetWidth || 300) + 24), behavior: "smooth" });
  }

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, []);

  const arrow = "grid h-11 w-11 place-items-center rounded-full border border-ink-200 text-ink-700 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section id="commerces" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="reveal max-w-xl">
            <Eyebrow>Pour qui ?</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.6rem]">Pense pour les commerces d'ici</h2>
          </div>
          <div className="reveal flex gap-2">
            <button onClick={() => scroll(-1)} disabled={edges.start} aria-label="Precedent" className={arrow}><ArrowLeft size={18} /></button>
            <button onClick={() => scroll(1)} disabled={edges.end} aria-label="Suivant" className={arrow}><ArrowRight size={18} /></button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {USE_CASES.map(({ img, title, text }, i) => (
            <article key={title} className="reveal group w-[82%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" style={{ "--i": Math.min(i, 3) }}>
              <div className="overflow-hidden rounded-3xl">
                <img src={IMG(img)} alt={title} loading="lazy" className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
            </article>
          ))}
        </div>

        {/* Position dans le carrousel */}
        <div className="mt-4 flex items-center justify-center gap-2" aria-label="Choisir un commerce">
          {USE_CASES.map(({ title }, i) => (
            <button
              key={title}
              onClick={() => scrollToCard(i)}
              aria-label={title}
              aria-current={i === current ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-brand-500" : "w-2 bg-ink-200 hover:bg-ink-300"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Carte : partout en Cote d'Ivoire ───── */
const CITIES = ["Abidjan", "Bouake", "Yamoussoukro", "San-Pedro", "Korhogo", "Daloa", "Man", "Autre ville"];

function MapSection() {
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
    <section id="villes" className="scroll-mt-24 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
        <IvoryCoastMap />
        <div className="reveal reveal-right">
          <Eyebrow>Partout en Cote d'Ivoire</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.6rem]">
            D'Abidjan a Korhogo, votre boutique ouvre aujourd'hui.
          </h2>
          <p className="mt-4 max-w-md text-ink-500">Donnez-lui un nom, choisissez votre ville. Le reste se fait en quelques minutes.</p>

          <form onSubmit={start} className="mt-8 flex flex-col gap-1 rounded-[1.75rem] bg-white p-2 shadow-card-hover ring-1 ring-surface-border sm:flex-row sm:items-center sm:rounded-full">
            <label className="flex flex-1 items-center gap-3 rounded-full px-4 py-2">
              <Store size={18} className="shrink-0 text-brand-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink-900">Ma boutique</span>
                <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Nom de votre boutique" className="w-full bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-400" />
              </span>
            </label>
            <span className="hidden h-8 w-px bg-surface-border sm:block" />
            <div className="sm:w-48"><CitySelect value={city} onChange={setCity} options={CITIES} /></div>
            <button type="submit" aria-label="Creer ma boutique" className="mt-1 grid h-12 w-full shrink-0 place-items-center rounded-full bg-ink-900 text-white transition hover:bg-brand-600 sm:mt-0 sm:w-12">
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ───── Partage : vrais visages ───── */
const FACES = [
  { img: "client-1", pos: "left-[4%] top-[16%]", delay: "0s" },
  { img: "client-2", pos: "right-[8%] top-[4%]", delay: "1.1s" },
  { img: "client-3", pos: "left-[14%] bottom-[8%]", delay: "0.6s" },
  { img: "client-4", pos: "right-[2%] bottom-[24%]", delay: "1.8s" },
  { img: "client-5", pos: "left-[44%] -top-[2%]", delay: "2.4s" },
];
const BUBBLES = [
  { text: "C'est combien le pagne ?", pos: "left-[-2%] top-[44%]", i: 1 },
  { text: "Je prends 2 !", pos: "right-[-2%] top-[42%]", i: 3 },
  { text: "Livraison a Yopougon ?", pos: "left-[28%] bottom-[-2%]", i: 5 },
];

function Community({ onRegister }) {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="reveal-group relative order-1 mx-auto aspect-square w-full max-w-md" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-brand-200">
            <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 8" />
            <circle cx="200" cy="200" r="178" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 9" />
          </svg>
          <div className="pop absolute left-1/2 top-1/2 -ml-[4.5rem] -mt-[4.5rem]" style={{ "--i": 0 }}>
            <div className="grid h-36 w-36 place-items-center rounded-full bg-white shadow-modal ring-8 ring-brand-50">
              <div className="text-center">
                <QrCode size={52} className="mx-auto text-ink-900" />
                <p className="mt-1 text-2xs font-semibold text-ink-500">Votre lien</p>
              </div>
            </div>
          </div>
          {FACES.map(({ img, pos, delay }, i) => (
            <div key={img} className={`absolute ${pos}`}>
              <div className="pop" style={{ "--i": i + 1 }}>
                <img src={IMG(img)} alt="" loading="lazy" className="h-16 w-16 animate-float rounded-full object-cover shadow-card-hover ring-4 ring-white" style={{ animationDelay: delay }} />
              </div>
            </div>
          ))}
          {BUBBLES.map(({ text, pos, i }) => (
            <div key={text} className={`absolute ${pos}`}>
              <div className="pop" style={{ "--i": i + 3 }}>
                <span className="block animate-float-slow whitespace-nowrap rounded-2xl rounded-bl-sm bg-[#DCF8C6] px-3 py-2 text-xs font-medium text-ink-800 shadow-card-hover" style={{ animationDelay: `${i * 0.5}s` }}>{text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="reveal reveal-right order-2">
          <Eyebrow>Partage</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.6rem]">
            Vos clients sont sur leur telephone. Votre boutique aussi.
          </h2>
          <p className="mt-4 max-w-md text-ink-500">
            Mettez votre lien dans vos statuts WhatsApp, sur TikTok ou Facebook, et collez le QR code sur votre comptoir. Chaque message devient une commande claire.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
            {["Un lien court a votre nom", "Un QR code pret a imprimer", "Les commandes arrivent avec le bon produit et le bon prix"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><BadgeCheck size={18} className="shrink-0 text-brand-500" /> {t}</li>
            ))}
          </ul>
          <button onClick={onRegister} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-ink-800">
            Obtenir mon lien <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───── FAQ ───── */
const FAQS = [
  { q: "CatalogueCI est-il gratuit ?", a: "Oui. Pendant le lancement, toutes les fonctionnalites sont gratuites, sans limite de produits ni de commandes. Vous serez prevenu a l'avance si des offres payantes arrivent." },
  { q: "Comment mes clients me paient ?", a: "Par Wave (manuel ou automatique), a la livraison, ou en vous contactant sur WhatsApp. Vous choisissez les moyens que vous acceptez." },
  { q: "Faut-il un site web ?", a: "Non. CatalogueCI cree la page de votre boutique. Il suffit de partager le lien ou le QR code." },
  { q: "Comment je recois les commandes ?", a: "Elles arrivent dans votre tableau de bord avec les infos du client et du produit, et vous pouvez lui ecrire sur WhatsApp en un clic." },
  { q: "Puis-je personnaliser ma boutique ?", a: "Oui : logo, banniere, couleurs, police et mise en page. Un apercu vous montre le resultat en direct." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  const [email, setEmail] = useState("");

  function ask(e) {
    e.preventDefault();
    const subject = encodeURIComponent("Question sur CatalogueCI");
    const body = encodeURIComponent(`Bonjour,\n\nJ'ai une question :\n\n\n(Mon email : ${email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <section id="faq" className="scroll-mt-24 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="reveal">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.6rem]">Une question sur CatalogueCI&nbsp;?</h2>
          <p className="mt-4 max-w-md text-ink-500">Les reponses aux questions qu'on nous pose le plus. Pour le reste, ecrivez-nous.</p>
          <form onSubmit={ask} className="mt-8 flex max-w-md items-center gap-2 rounded-full border border-ink-200 bg-white p-1.5 pl-5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <Mail size={16} className="shrink-0 text-ink-400" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre email" aria-label="Votre email" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400" />
            <button type="submit" className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">Ecrire</button>
          </form>
        </div>

        <div className="reveal divide-y divide-surface-border rounded-3xl border border-surface-border bg-white px-6" style={{ "--i": 1 }}>
          {FAQS.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className={`text-[0.95rem] font-semibold transition-colors ${isOpen ? "text-brand-700" : "text-ink-900"}`}>{q}</span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${isOpen ? "rotate-45 bg-brand-500 text-white" : "bg-ink-100 text-ink-600"}`} aria-hidden="true">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className={`pb-5 pr-10 text-sm leading-relaxed text-ink-500 transition duration-500 ${isOpen ? "translate-y-0 opacity-100 delay-150" : "-translate-y-2 opacity-0"}`}>{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───── Appel final + pied de page ───── */
function FinalCta({ onRegister }) {
  return (
    <section className="px-5 pb-24">
      <div className="reveal relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-ink-900 text-white md:grid-cols-[1.2fr_1fr]">
        <div className="relative z-10 p-8 sm:p-12">
          <Eyebrow light>Lancement</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">Ouvrez votre boutique en ligne aujourd'hui.</h2>
          <p className="mt-4 max-w-md text-white/70">Gratuit pendant le lancement, sans engagement. Il vous faut juste un telephone et quelques photos de vos produits.</p>
          <button onClick={onRegister} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-600">
            Creer ma boutique <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        <div className="relative min-h-[16rem]">
          <img src={IMG("cas-mode")} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent md:bg-gradient-to-r" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-surface-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white"><ShoppingBag size={18} /></span>
            <span className="font-display text-lg font-bold text-ink-900">CatalogueCI</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">La boutique en ligne des commercants de Cote d'Ivoire : catalogue, QR code, WhatsApp et Wave.</p>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-ink-900">Plateforme</p>
          <ul className="space-y-2.5 text-sm text-ink-500">
            {NAV_LINKS.map((link) => <li key={link.href}><a href={link.href} className="transition hover:text-ink-900">{link.label}</a></li>)}
            <li><a href="/cgu" onClick={goTo("/cgu")} className="transition hover:text-ink-900">Conditions d'utilisation</a></li>
            <li><a href="/confidentialite" onClick={goTo("/confidentialite")} className="transition hover:text-ink-900">Confidentialite</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-ink-900">Contact</p>
          <ul className="space-y-2.5 text-sm text-ink-500">
            <li className="flex items-center gap-2"><MapPin size={15} /> Abidjan, Cote d'Ivoire</li>
            <li><a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 transition hover:text-ink-900"><Mail size={15} /> {SUPPORT_EMAIL}</a></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-surface-border py-6 text-center text-xs text-ink-400">&copy; {new Date().getFullYear()} CatalogueCI. Tous droits reserves.</p>
    </footer>
  );
}

/* ───── Page ───── */
export default function LandingPage({ onLogin, onRegister }) {
  const rootRef = useReveal();
  return (
    <div ref={rootRef} className="min-h-screen overflow-x-hidden bg-surface">
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <main>
        <Hero onRegister={onRegister} />
        <Marquee />
        <FactsBand />
        <HowItWorks Eyebrow={Eyebrow} />
        <UseCases />
        <MapSection />
        <Community onRegister={onRegister} />
        <FAQ />
        <FinalCta onRegister={onRegister} />
      </main>
      <Footer />
    </div>
  );
}
