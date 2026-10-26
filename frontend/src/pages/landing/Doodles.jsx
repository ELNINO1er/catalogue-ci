import { ShoppingBag } from "lucide-react";

// Dessins a main levee et logo partages par la landing et les pages de connexion / inscription.

/* ───── Petits dessins a main levee de la maquette ───── */
// Trois traits rayonnants (devant les titres de section)
export function Sparkle({ className = "", tone = "text-brand-500" }) {
  return (
    <svg viewBox="0 0 32 32" className={`h-7 w-7 ${tone} ${className}`} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path className="draw-path" pathLength="1" d="M4 14 L12 20" />
        <path className="draw-path" pathLength="1" d="M15 4 L16 14" />
        <path className="draw-path" pathLength="1" d="M3 26 L10 25" />
      </g>
    </svg>
  );
}

// Eclat a la fin d'un titre (orange dans la maquette)
export function Spark({ className = "" }) {
  return (
    <svg viewBox="0 0 28 28" className={`inline-block h-6 w-6 text-brand-500 ${className}`} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path className="draw-path" pathLength="1" d="M6 4 L8 14" />
        <path className="draw-path" pathLength="1" d="M20 2 L13 14" />
        <path className="draw-path" pathLength="1" d="M24 14 L15 18" />
      </g>
    </svg>
  );
}

// Gribouillis du hero (traits + boucle), a cote de la premiere ligne
export function HeroDoodle({ className = "" }) {
  return (
    <svg viewBox="0 0 120 80" className={`text-brand-500 ${className}`} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <path className="draw-path" pathLength="1" d="M8 34 C 20 42, 30 50, 38 54" />
        <path className="draw-path" pathLength="1" d="M34 8 L44 40" />
        <path className="draw-path" pathLength="1" d="M58 4 L52 38" />
        <path className="draw-path" pathLength="1" d="M48 50 C 62 28, 92 26, 100 46 C 106 60, 90 66, 84 56" />
      </g>
    </svg>
  );
}

// Trait de pinceau sous les derniers mots du titre
export function Brush({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg viewBox="0 0 320 24" preserveAspectRatio="none" className="absolute -bottom-2 left-[-2%] h-4 w-[104%] text-brand-500" aria-hidden="true">
        <path className="draw-path" pathLength="1" d="M4 15 C 70 9, 150 6, 316 11" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path className="draw-path" pathLength="1" d="M60 19 C 140 14, 220 14, 300 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
      </svg>
    </span>
  );
}

export function Cloud({ className = "" }) {
  return (
    <svg viewBox="0 0 120 50" className={`drop-shadow-[0_6px_10px_rgba(17,24,39,0.06)] ${className}`} aria-hidden="true">
      <path d="M22 44 C 8 44 4 32 14 27 C 12 16 26 10 34 17 C 38 6 58 4 64 15 C 72 8 88 12 88 24 C 100 22 110 30 104 40 C 102 43 98 44 94 44 Z" fill="white" />
    </svg>
  );
}

export function Birds({ className = "" }) {
  return (
    <svg viewBox="0 0 40 70" className={`text-brand-400 ${className}`} aria-hidden="true">
      {[[8, 6], [24, 26], [12, 50]].map(([x, y], i) => (
        <g key={i} className="flap" style={{ animationDelay: `${i * 0.3}s`, transformBox: "fill-box" }}>
          <path d={`M${x} ${y} l5 5 l5 -5`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
    </svg>
  );
}

export function Swirl({ className = "", d = "M10 90 C 60 70, 40 10, 90 20 C 130 28, 110 80, 70 70 C 40 62, 70 20, 150 10" }) {
  return (
    <svg viewBox="0 0 160 100" className={`reveal-group text-ink-300 ${className}`} aria-hidden="true">
      <path className="draw-path" pathLength="1" d={d} stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid h-9 w-9 place-items-center rounded-[0.9rem] rounded-b-md ${light ? "bg-white text-brand-500" : "bg-brand-500 text-white"}`}>
        <ShoppingBag size={18} strokeWidth={2.4} />
      </span>
      <span className={`font-landing text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>CatalogueCI.</span>
    </span>
  );
}
