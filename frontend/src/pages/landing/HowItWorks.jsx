import { useEffect, useRef, useState } from "react";
import { BarChart3, Check, CheckCircle2, Clock, Globe, ImagePlus, Palette, QrCode, ShoppingBag, Store, Truck } from "lucide-react";
import { useInView } from "./useLandingMotion";

const STEP_MS = 7500;
const IMG = (name) => `/landing/${name}.webp`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Element qui apparait a un instant donne de la sequence (en ms depuis le debut de l'etape).
function At({ d, as: Tag = "div", pop = false, className = "", style, children }) {
  return <Tag className={`${pop ? "seq-pop" : "seq"} ${className}`} style={{ "--d": `${d}ms`, ...style }}>{children}</Tag>;
}

// Etats successifs au meme endroit : visible de `d` a `o`. En mode reduit, seul l'etat final s'affiche.
function Swap({ d, o, reduced, last = false, className = "", children }) {
  if (reduced) return last ? <div className={className}>{children}</div> : null;
  return <div className={`seq-swap ${className}`} style={{ "--d": `${d}ms`, "--o": o ? `${o}ms` : "99s" }}>{children}</div>;
}

function Typed({ text, d, t = 1100, bg = "#fff" }) {
  return <span className="seq-type" style={{ "--d": `${d}ms`, "--t": `${t}ms`, "--n": text.length, "--type-bg": bg }}>{text}</span>;
}

// Nombre qui defile a partir d'un instant de la sequence.
function CountAt({ to, d, reduced, suffix = "" }) {
  const [value, setValue] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) return undefined;
    let frame;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 900);
        setValue(Math.round(to * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, d);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [to, d, reduced]);
  return <>{value.toLocaleString("fr-FR")}{suffix}</>;
}

function TypingDots({ className = "bg-white" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2.5 shadow-sm ${className}`} aria-label="En train d'ecrire">
      {[0, 150, 300].map((delay) => <span key={delay} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: `${delay}ms` }} />)}
    </span>
  );
}

/* ───── Scene 1 : ajouter un produit ───── */
function SceneProduct({ reduced }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex gap-4 rounded-2xl border border-surface-border bg-white p-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-surface">
          <div className="absolute inset-0 grid place-items-center text-ink-300"><ImagePlus size={26} /></div>
          <At d={200} pop className="absolute inset-0"><img src={IMG("plat-brochettes")} alt="" className="h-full w-full object-cover" /></At>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-400">Nom</p>
            <p className="text-sm font-semibold text-ink-900">{reduced ? "Brochettes de boeuf" : <Typed text="Brochettes de boeuf" d={900} />}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-400">Description</p>
            <p className="text-xs text-ink-500">{reduced ? "Avec alloco ou attieke" : <Typed text="Avec alloco ou attieke" d={1900} t={900} />}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-400">Prix</p>
            <p className="font-display text-lg font-bold text-brand-600"><CountAt to={1500} d={2800} reduced={reduced} suffix=" FCFA" /></p>
          </div>
        </div>
      </div>

      <At d={3900} className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white p-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-ink-600">
          <Globe size={15} className="shrink-0 text-brand-500" />
          <span className="truncate">catalogueci.com/<b className="text-ink-900">chez-tantie-awa</b></span>
        </div>
        <At d={4500} pop className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-white"><QrCode size={26} /></At>
      </At>

      <At d={5100} pop className="mt-auto self-start">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} /> Produit en ligne, visible par vos clients
        </span>
      </At>
    </div>
  );
}

/* ───── Scene 2 : le client commande ───── */
function SceneOrder({ reduced }) {
  return (
    <div className="relative flex h-full flex-col gap-2.5 rounded-2xl bg-[#ECE5DD] p-4">
      {/* Les "..." occupent la place du message a venir : pas de vide quand ils disparaissent */}
      <div className="relative ml-auto max-w-[85%]">
        <Swap d={300} o={1600} reduced={reduced} className="absolute right-0 top-0"><TypingDots className="bg-[#DCF8C6]" /></Swap>
        <At d={1700} className="rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 text-xs text-ink-800 shadow-sm">
          Bonjour, je veux commander : <b>Brochettes</b> x3. Livraison a Angre 8e tranche.
          <span className="mt-1 block text-right text-[10px] text-ink-400">12:41 ✓✓</span>
        </At>
      </div>

      <At d={2700} pop className="my-1 self-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-card-hover">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><ShoppingBag size={17} /></span>
          <div>
            <p className="text-2xs font-semibold text-emerald-700">Nouvelle commande · Tableau de bord</p>
            <p className="text-xs font-semibold text-ink-900">Brochettes x3 · <span className="text-brand-600">4 500 F</span></p>
          </div>
        </div>
      </At>

      <div className="relative max-w-[80%] self-start">
        <Swap d={3900} o={4900} reduced={reduced} className="absolute left-0 top-0"><TypingDots /></Swap>
        <At d={5000} className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-xs text-ink-800 shadow-sm">
          C'est note ! Livraison dans 30 min.
          <span className="mt-1 block text-right text-[10px] text-ink-400">12:42</span>
        </At>
      </div>
    </div>
  );
}

/* ───── Scene 3 : vous encaissez ───── */
const TIMELINE = [
  { d: 500, icon: ShoppingBag, label: "Commande recue", time: "12:41" },
  { d: 2300, icon: CheckCircle2, label: "Paiement Wave confirme", time: "12:43" },
  { d: 4400, icon: Truck, label: "En livraison", time: "12:50" },
];

function ScenePayment({ reduced }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <At d={100} className="rounded-2xl border border-surface-border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-ink-500">Commande #128 · Ref. T8K2-41Q</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink-900"><CountAt to={4500} d={400} reduced={reduced} suffix=" F" /></p>
          </div>
          <div className="relative h-7 w-32">
            <Swap d={200} o={2100} reduced={reduced} className="absolute right-0"><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-800"><Clock size={11} /> En attente</span></Swap>
            <Swap d={2200} o={4300} reduced={reduced} className="absolute right-0"><span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-2xs font-semibold text-sky-700"><Check size={11} /> Paiement recu</span></Swap>
            <Swap d={4400} reduced={reduced} last className="absolute right-0"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-2xs font-semibold text-emerald-700"><Truck size={11} /> En livraison</span></Swap>
          </div>
        </div>
      </At>

      <div className="rounded-2xl border border-surface-border bg-white p-4">
        <ol className="space-y-3">
          {TIMELINE.map(({ d, icon: Icon, label, time }) => (
            <At key={label} as="li" d={d} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon size={15} /></span>
              <span className="flex-1 text-sm font-medium text-ink-800">{label}</span>
              <span className="text-xs text-ink-400">{time}</span>
            </At>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ───── Etapes et legendes ───── */
const STEPS = [
  {
    title: "Ajoutez vos produits",
    text: "Une photo, un prix, une description. Votre catalogue a sa propre adresse et son QR code.",
    context: "Votre tableau de bord",
    scene: SceneProduct,
    captions: [
      { d: 0, o: 2600, text: "Vous ajoutez une photo de votre produit" },
      { d: 2600, o: 4700, text: "Vous indiquez son nom et son prix" },
      { d: 4700, text: "Votre page et votre QR code sont prets" },
    ],
  },
  {
    title: "Le client commande",
    text: "Il choisit, remplit ses infos et la commande vous arrive, claire, avec le bon prix.",
    context: "WhatsApp + votre tableau de bord",
    scene: SceneOrder,
    captions: [
      { d: 0, o: 2600, text: "Le client commande depuis votre catalogue" },
      { d: 2600, o: 4700, text: "La commande vous arrive, avec le bon prix" },
      { d: 4700, text: "Vous lui confirmez en un message" },
    ],
  },
  {
    title: "Vous encaissez",
    text: "Wave, a la livraison ou sur WhatsApp. Vous suivez chaque commande jusqu'a la livraison.",
    context: "Suivi de la commande",
    scene: ScenePayment,
    captions: [
      { d: 0, o: 2200, text: "Le client paie avec Wave" },
      { d: 2200, o: 4300, text: "Le paiement est confirme sur la commande" },
      { d: 4300, text: "Vous suivez la livraison jusqu'au client" },
    ],
  },
];

const EXTRAS = [
  { icon: BarChart3, label: "Statistiques de ventes" },
  { icon: Palette, label: "Couleurs et logo de votre marque" },
  { icon: Globe, label: "Lien a partager partout" },
  { icon: Store, label: "Suivi de commande pour le client" },
];

export default function HowItWorks({ Eyebrow }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [round, setRound] = useState(0); // relance la sequence si on reclique la meme etape
  const [sectionRef, inView] = useInView({ threshold: 0.35 });
  const reducedRef = useRef(prefersReducedMotion());
  const reduced = reducedRef.current;
  const paused = !inView || hovered;

  function goTo(index) {
    setActive(index);
    setRound((r) => r + 1);
  }

  function next() {
    if (!reduced) goTo((active + 1) % STEPS.length);
  }

  const step = STEPS[active];
  const Scene = step.scene;

  return (
    <section id="fonctionnement" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <Eyebrow>Fonctionnement</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.6rem]">Fini les captures d'ecran et les « c'est combien ? »</h2>
        </div>

        <div ref={sectionRef} className={`mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center ${paused ? "demo-paused" : ""}`}>
          {/* Etapes cliquables avec barre de progression */}
          <ol className="space-y-3" aria-label="Etapes">
            {STEPS.map(({ title, text }, i) => {
              const isActive = i === active;
              return (
                <li key={title} className="reveal" style={{ "--i": i + 1 }}>
                  <button
                    onClick={() => goTo(i)}
                    aria-current={isActive ? "step" : undefined}
                    className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left transition-all duration-500 ${
                      isActive ? "border-brand-200 bg-white shadow-card-hover" : "border-transparent hover:bg-white/60"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition-colors duration-500 ${isActive ? "bg-brand-500 text-white" : "bg-ink-900/5 text-ink-500 group-hover:bg-ink-900 group-hover:text-white"}`}>
                        {i + 1}
                      </span>
                      <div>
                        <h3 className={`font-display text-xl font-bold transition-colors duration-500 ${isActive ? "text-ink-900" : "text-ink-500"}`}>{title}</h3>
                        <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isActive ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                          <p className="overflow-hidden text-sm leading-relaxed text-ink-500"><span className="block pt-2">{text}</span></p>
                        </div>
                      </div>
                    </div>
                    {isActive && !reduced ? (
                      <span className="absolute inset-x-5 bottom-0 h-1 overflow-hidden rounded-full bg-brand-100">
                        <span key={round} className="seq-progress block h-full w-full rounded-full bg-brand-500" style={{ "--t": `${STEP_MS}ms` }} onAnimationEnd={next} />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Scene animee de l'etape active */}
          <div className="reveal reveal-right" style={{ "--i": 2 }}>
            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="overflow-hidden rounded-[2rem] border border-surface-border bg-surface shadow-modal"
            >
              <div className="flex items-center gap-2 border-b border-surface-border bg-white px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-2 text-xs font-medium text-ink-500">{step.context}</span>
                <span className="ml-auto text-2xs font-semibold text-ink-400">Etape {active + 1}/3 {hovered ? "· en pause" : ""}</span>
              </div>

              <div key={`${active}-${round}`} className="h-[22rem] p-5">
                <Scene reduced={reduced} />
              </div>

              {/* Legende : ce qui se passe a cet instant */}
              <div key={`cap-${active}-${round}`} className="relative h-14 border-t border-surface-border bg-white px-5" aria-live="polite">
                {step.captions.map((c, i) => (
                  <Swap key={c.text} d={c.d} o={c.o} reduced={reduced} last={i === step.captions.length - 1} className="absolute inset-x-5 inset-y-0 flex items-center">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-ink-800">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-2xs font-bold text-white">{i + 1}</span>
                      {c.text}
                    </p>
                  </Swap>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="reveal mt-14 flex flex-wrap gap-3">
          {EXTRAS.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 text-sm text-ink-700">
              <Icon size={16} className="text-brand-500" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
