import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  MessageCircle,
  Package,
  QrCode,
  Scissors,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  Truck,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import Button from "../../components/ui/Button";

/* ───── Header / Navbar ───── */
function Navbar({ onLogin, onRegister }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-surface-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold text-brand-700">CatalogueCI</span>
        </div>
        <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <a href="#features" className="hover:text-brand-600">Fonctionnalites</a>
          <a href="#how" className="hover:text-brand-600">Comment ca marche</a>
          <a href="#pricing" className="hover:text-brand-600">Tarifs</a>
          <a href="#faq" className="hover:text-brand-600">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="hidden text-sm font-medium text-gray-600 hover:text-brand-600 sm:block">Connexion</button>
          <Button size="sm" onClick={onRegister}>Creer ma boutique</Button>
        </div>
      </div>
    </nav>
  );
}

/* ───── Hero ───── */
function Hero({ onRegister, onDemo }) {
  return (
    <section className="overflow-hidden bg-brand-600 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
        {/* Left — mockup */}
        <div className="flex justify-center md:order-1">
          <div className="relative w-64 rounded-[2.5rem] border-[6px] border-white/20 bg-white shadow-2xl sm:w-72">
            <div className="rounded-[2rem] bg-brand-500 px-5 pb-6 pt-8 text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent-500" />
                <div>
                  <p className="text-2xs text-white/60">Restaurant</p>
                  <p className="text-sm font-bold">Chez Awa Food</p>
                </div>
              </div>
            </div>
            <div className="-mt-3 space-y-2.5 rounded-t-2xl bg-white px-4 pb-6 pt-4">
              {[
                { name: "Attieke poisson", price: "1 500" },
                { name: "Garba special", price: "1 000" },
                { name: "Jus de gingembre", price: "500" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3 rounded-xl border border-surface-border p-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-surface" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-brand-800">{item.name}</p>
                    <p className="text-xs font-bold text-brand-500">{item.price} FCFA</p>
                  </div>
                  <div className="h-7 w-16 rounded-lg bg-brand-500" />
                </div>
              ))}
              <div className="mt-2 flex gap-2">
                <div className="h-9 flex-1 rounded-lg bg-whatsapp" />
                <div className="h-9 w-9 rounded-lg bg-surface" />
              </div>
            </div>
          </div>
        </div>

        {/* Right — text */}
        <div className="text-center md:order-0 md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Zap size={14} className="text-accent-400" /> Plateforme #1 en Cote d'Ivoire
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Creez votre <span className="text-accent-400">boutique digitale</span> en quelques minutes
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-200">
            Catalogue en ligne, commandes WhatsApp, paiement Wave, QR code et dashboard — tout ce qu'il faut pour vendre plus, sans complications.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Button tone="accent" size="xl" onClick={onRegister}>
              Creer ma boutique <ArrowRight size={18} />
            </Button>
            <Button tone="secondary" size="xl" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onDemo}>
              Voir une demo
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-brand-200 md:justify-start">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-accent-400" /> Gratuit pour commencer</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-accent-400" /> Aucune carte requise</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-accent-400" /> Pret en 2 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── Features ───── */
const features = [
  { icon: Package, title: "Catalogue digital", desc: "Presentez vos produits et services avec photos, prix et descriptions dans un catalogue en ligne professionnel." },
  { icon: QrCode, title: "QR Code", desc: "Generez un QR code unique pour votre boutique. Imprimez-le ou partagez-le pour attirer des clients." },
  { icon: MessageCircle, title: "Commandes WhatsApp", desc: "Recevez les commandes directement sur WhatsApp avec tous les details du client." },
  { icon: CreditCard, title: "Paiement Wave", desc: "Acceptez les paiements Wave manuels ou automatiques. Vos clients paient en toute securite." },
  { icon: BarChart3, title: "Dashboard & Stats", desc: "Suivez vos ventes, commandes et clics en temps reel depuis votre tableau de bord." },
  { icon: Globe, title: "Lien public", desc: "Partagez le lien de votre boutique sur les reseaux sociaux, WhatsApp ou par SMS." },
];

function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">Fonctionnalites</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Tout ce qu'il faut pour vendre en ligne</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-500">Une solution complete conçue pour les petits commerces d'Abidjan et de Cote d'Ivoire.</p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-hover p-6">
              <div className="mb-4 inline-flex rounded-xl bg-brand-50 p-3 text-brand-500">
                <Icon size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-brand-800">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Business types ───── */
const businessTypes = [
  { icon: UtensilsCrossed, name: "Restaurants & Maquis" },
  { icon: ShoppingBag, name: "Boutiques & Mode" },
  { icon: Smartphone, name: "Services digitaux" },
  { icon: Scissors, name: "Salons de coiffure" },
  { icon: Star, name: "Formations" },
  { icon: Truck, name: "Livraisons & Services" },
];

function BusinessTypes() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">Pour qui ?</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Adapte a tous les types de business</h2>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {businessTypes.map(({ icon: Icon, name }) => (
            <div key={name} className="card flex flex-col items-center gap-3 p-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-50 text-accent-700">
                <Icon size={24} />
              </div>
              <p className="text-sm font-semibold text-brand-700">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── How it works ───── */
const steps = [
  { step: "1", title: "Creez votre boutique", desc: "Inscrivez-vous et configurez votre catalogue en quelques clics." },
  { step: "2", title: "Ajoutez vos produits", desc: "Photos, prix, descriptions et champs personnalises pour chaque produit ou service." },
  { step: "3", title: "Partagez le QR code", desc: "Imprimez votre QR code ou partagez le lien sur WhatsApp et les reseaux sociaux." },
  { step: "4", title: "Recevez des commandes", desc: "Vos clients commandent et paient via WhatsApp ou Wave. Vous gerez tout depuis le dashboard." },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">Comment ca marche</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Lancez votre boutique en 4 etapes</h2>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 font-display text-xl font-bold text-white">{step}</div>
              <h3 className="font-display text-lg font-bold text-brand-800">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Pricing ───── */
function Pricing() {
  return (
    <section id="pricing" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">Tarifs</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Des plans simples et accessibles</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-500">Commencez gratuitement, evoluez quand vous le souhaitez.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Starter", price: "Gratuit", period: "", features: ["5 produits", "Commandes WhatsApp", "QR code", "Lien public"], popular: false },
            { name: "Pro", price: "5 000", period: "/mois", features: ["Produits illimites", "Paiement Wave", "Dashboard complet", "Champs personnalises", "Support prioritaire"], popular: true },
            { name: "Business", price: "15 000", period: "/mois", features: ["Tout le plan Pro", "Templates premium", "Multi-utilisateurs", "Statistiques avancees", "Support dedie"], popular: false },
          ].map((plan) => (
            <div key={plan.name} className={`card relative p-8 ${plan.popular ? "border-2 border-brand-500 shadow-card-hover" : ""}`}>
              {plan.popular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold text-white">Populaire</div>
              ) : null}
              <h3 className="font-display text-xl font-bold text-brand-800">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-brand-800">{plan.price}</span>
                {plan.period ? <span className="text-sm text-gray-500"> FCFA{plan.period}</span> : null}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="shrink-0 text-brand-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button tone={plan.popular ? "primary" : "secondary"} size="lg" className="mt-8 w-full">
                Choisir {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Testimonials ───── */
function Testimonials() {
  const testimonials = [
    { name: "Awa K.", role: "Restauratrice, Cocody", text: "Grace a CatalogueCI, mes clients commandent directement depuis WhatsApp. Mes ventes ont augmente de 40% en 2 mois !" },
    { name: "Kouadio M.", role: "Vendeur de vetements, Adjame", text: "Le QR code devant ma boutique attire plein de nouveaux clients. C'est simple et ca marche vraiment." },
    { name: "Fatou D.", role: "Infographe, Plateau", text: "Je presente tous mes services avec les prix. Les clients commandent et paient via Wave. Super pratique !" },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">Temoignages</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Ce que disent nos commercants</h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="mb-3 flex gap-1 text-accent-500">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-sm leading-relaxed text-gray-600">"{t.text}"</p>
              <div className="mt-4 border-t border-surface-border pt-4">
                <p className="font-semibold text-brand-800">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── FAQ ───── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "CatalogueCI est-il gratuit ?", a: "Oui, vous pouvez commencer gratuitement avec le plan Starter qui inclut jusqu'a 5 produits, le QR code et les commandes WhatsApp." },
    { q: "Comment mes clients me paient ?", a: "Vos clients peuvent payer via Wave (manuel ou automatique), a la livraison, ou vous contacter sur WhatsApp pour convenir du paiement." },
    { q: "Faut-il un site web pour utiliser CatalogueCI ?", a: "Non ! CatalogueCI cree automatiquement une page publique pour votre boutique. Vous partagez simplement le lien ou le QR code." },
    { q: "Comment recevoir les commandes ?", a: "Les commandes arrivent dans votre dashboard. Vous recevez les details du client et du produit commande, et vous pouvez le contacter sur WhatsApp." },
    { q: "Puis-je personnaliser ma boutique ?", a: "Oui, vous pouvez changer les couleurs, ajouter votre logo, banniere, et choisir parmi plusieurs templates de presentation." },
  ];

  return (
    <section id="faq" className="bg-surface py-20">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-500">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-brand-800">Questions frequentes</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="card overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-6 py-4 text-left">
                <span className="pr-4 text-sm font-semibold text-brand-800">{q}</span>
                <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i ? (
                <div className="animate-fade-in border-t border-surface-border px-6 py-4">
                  <p className="text-sm leading-relaxed text-gray-500">{a}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── CTA ───── */
function CTA() {
  return (
    <section className="bg-brand-600 py-20 text-white">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Pret a digitaliser votre commerce ?</h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-brand-200">Rejoignez des centaines de commercants a Abidjan qui utilisent CatalogueCI pour vendre plus.</p>
        <Button tone="accent" size="xl" className="mt-8">
          Creer ma boutique gratuitement <ArrowRight size={18} />
        </Button>
      </div>
    </section>
  );
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="border-t border-surface-border bg-white py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-brand-700">CatalogueCI</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-gray-500">La plateforme digitale pour les petits commerces de Cote d'Ivoire.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-brand-800">Produit</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><a href="#features" className="hover:text-brand-600">Fonctionnalites</a></p>
            <p><a href="#pricing" className="hover:text-brand-600">Tarifs</a></p>
            <p><a href="#faq" className="hover:text-brand-600">FAQ</a></p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-brand-800">Contact</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Abidjan, Cote d'Ivoire</p>
            <p>support@catalogueci.com</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-surface-border px-5 pt-6">
        <p className="text-center text-xs text-gray-400">&copy; {new Date().getFullYear()} CatalogueCI. Tous droits reserves.</p>
      </div>
    </footer>
  );
}

/* ───── Main Landing Page ───── */
export default function LandingPage({ onLogin, onRegister, onDemo }) {
  return (
    <div className="min-h-screen">
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <Hero onRegister={onRegister} onDemo={onDemo} />
      <Features />
      <BusinessTypes />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
