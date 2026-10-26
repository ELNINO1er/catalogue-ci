import { useMemo } from "react";
import { Croissant, Scissors, Shirt, ShoppingBasket, Smartphone, Sparkles, UtensilsCrossed } from "lucide-react";

// Contour simplifie de la Cote d'Ivoire (longitude, latitude), dessine en grille de points.
const OUTLINE = [
  [-7.53, 4.35], [-6.0, 4.6], [-5.0, 5.1], [-4.0, 5.2], [-3.1, 5.1], [-2.85, 5.0], [-2.75, 5.6], [-3.0, 6.3],
  [-3.2, 6.9], [-3.0, 7.6], [-2.6, 8.0], [-2.5, 8.9], [-2.7, 9.5], [-3.0, 9.9], [-3.6, 9.9], [-4.3, 9.6],
  [-4.8, 9.9], [-5.5, 10.4], [-6.2, 10.5], [-6.9, 10.2], [-7.6, 10.4], [-8.2, 10.1], [-8.0, 9.4], [-7.8, 8.9],
  [-8.2, 8.5], [-8.2, 7.6], [-8.5, 7.6], [-7.9, 6.5], [-7.6, 5.7], [-7.5, 5.1],
];
const BOUNDS = { minLon: -8.7, maxLon: -2.3, minLat: 4.1, maxLat: 10.7 };
const WIDTH = 440;
const HEIGHT = 450;
const STEP = 11;

// Villes et types de commerces : illustration, pas des boutiques reelles.
const PINS = [
  { city: "Abidjan", lon: -4.03, lat: 5.36, icon: UtensilsCrossed, label: "Maquis", color: "bg-brand-500" },
  { city: "Bouake", lon: -5.03, lat: 7.69, icon: Shirt, label: "Mode", color: "bg-sky-500" },
  { city: "Abengourou", lon: -3.49, lat: 6.73, icon: Croissant, label: "Patisserie", color: "bg-amber-500" },
  { city: "San-Pedro", lon: -6.64, lat: 4.75, icon: ShoppingBasket, label: "Epicerie", color: "bg-emerald-500" },
  { city: "Korhogo", lon: -5.63, lat: 9.46, icon: Sparkles, label: "Beaute", color: "bg-rose-500" },
  { city: "Daloa", lon: -6.45, lat: 6.88, icon: Smartphone, label: "Services", color: "bg-violet-500" },
  { city: "Man", lon: -7.55, lat: 7.41, icon: Scissors, label: "Coiffure", color: "bg-teal-500" },
];

function project(lon, lat) {
  return [
    ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * WIDTH,
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * HEIGHT,
  ];
}

function inside([x, y], polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export default function IvoryCoastMap() {
  const dots = useMemo(() => {
    const polygon = OUTLINE.map(([lon, lat]) => project(lon, lat));
    const points = [];
    for (let y = STEP / 2; y < HEIGHT; y += STEP) {
      for (let x = STEP / 2; x < WIDTH; x += STEP) {
        if (inside([x, y], polygon)) points.push([x, y]);
      }
    }
    return points;
  }, []);

  return (
    <div className="reveal-group relative mx-auto aspect-[44/45] w-full max-w-md">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" className="fill-brand-200" />)}
      </svg>

      {PINS.map(({ city, lon, lat, icon: Icon, label, color }, i) => {
        const [x, y] = project(lon, lat);
        return (
          // Trois niveaux : position (translate), apparition (.pop, scale), flottement (float).
          <div
            key={city}
            className="absolute -translate-x-1/2 -translate-y-[85%]"
            style={{ left: `${(x / WIDTH) * 100}%`, top: `${(y / HEIGHT) * 100}%` }}
          >
            <div className="pop" style={{ "--i": i }}>
            <div className={`${i % 2 ? "animate-float-slow" : "animate-float"} flex flex-col items-center`} style={{ animationDelay: `${i * 0.4}s` }}>
              <div className="relative">
                <span className={`absolute inset-0 rounded-full ${color} opacity-40 motion-safe:animate-ping`} aria-hidden="true" />
                <span className={`relative grid h-11 w-11 place-items-center rounded-full border-[3px] border-white ${color} text-white shadow-card-hover`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-2xs font-semibold text-ink-700 shadow-card">
                {label} · {city}
              </span>
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
