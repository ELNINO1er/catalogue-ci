import { useMemo } from "react";

// Contour simplifie de la Cote d'Ivoire (longitude, latitude), rempli d'hexagones comme la maquette.
const OUTLINE = [
  [-7.53, 4.35], [-6.0, 4.6], [-5.0, 5.1], [-4.0, 5.2], [-3.1, 5.1], [-2.85, 5.0], [-2.75, 5.6], [-3.0, 6.3],
  [-3.2, 6.9], [-3.0, 7.6], [-2.6, 8.0], [-2.5, 8.9], [-2.7, 9.5], [-3.0, 9.9], [-3.6, 9.9], [-4.3, 9.6],
  [-4.8, 9.9], [-5.5, 10.4], [-6.2, 10.5], [-6.9, 10.2], [-7.6, 10.4], [-8.2, 10.1], [-8.0, 9.4], [-7.8, 8.9],
  [-8.2, 8.5], [-8.2, 7.6], [-8.5, 7.6], [-7.9, 6.5], [-7.6, 5.7], [-7.5, 5.1],
];
const BOUNDS = { minLon: -8.7, maxLon: -2.3, minLat: 4.1, maxLat: 10.7 };
const WIDTH = 460;
const HEIGHT = 470;
const R = 4.6; // rayon d'un hexagone
const DX = R * Math.sqrt(3) + 1.6;
const DY = R * 1.5 + 1.6;

// Epingles : photos de commerces (illustration, pas des boutiques reelles). La plus grande est au centre.
const PINS = [
  { city: "Korhogo", lon: -5.63, lat: 9.6, img: "cas-coiffure", size: 58 },
  { city: "Man", lon: -7.55, lat: 7.5, img: "cas-mode", size: 54 },
  { city: "Bouake", lon: -5.03, lat: 7.75, img: "cas-maquis", size: 104, big: true },
  { city: "Abengourou", lon: -3.49, lat: 6.85, img: "cas-patisserie", size: 56 },
  { city: "San-Pedro", lon: -6.64, lat: 4.95, img: "cas-epicerie", size: 54 },
  { city: "Abidjan", lon: -4.03, lat: 5.45, img: "cas-services", size: 62 },
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

function hexPoints(cx, cy) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// Petite "fleur" orange sous chaque epingle (point d'ancrage de la maquette).
function Flower() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      {Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k;
        return <circle key={k} cx={10 + 5.5 * Math.cos(a)} cy={10 + 5.5 * Math.sin(a)} r="2.6" className="fill-brand-300" />;
      })}
      <circle cx="10" cy="10" r="3" className="fill-brand-500" />
    </svg>
  );
}

export default function IvoryCoastMap() {
  const hexes = useMemo(() => {
    const polygon = OUTLINE.map(([lon, lat]) => project(lon, lat));
    const points = [];
    for (let row = 0, y = R; y < HEIGHT; row++, y += DY) {
      for (let x = R + (row % 2 ? DX / 2 : 0); x < WIDTH; x += DX) {
        if (inside([x, y], polygon)) points.push([x, y]);
      }
    }
    return points;
  }, []);

  return (
    <div className="reveal-group relative mx-auto aspect-[46/47] w-full max-w-[30rem]">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {hexes.map(([x, y]) => <polygon key={`${x}-${y}`} points={hexPoints(x, y)} className="fill-brand-100/80" />)}
      </svg>

      {PINS.map(({ city, lon, lat, img, size, big }, i) => {
        const [x, y] = project(lon, lat);
        return (
          // Position (translate) / apparition (.pop) / flottement : trois niveaux distincts.
          <div key={city} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${(x / WIDTH) * 100}%`, top: `${(y / HEIGHT) * 100}%`, zIndex: big ? 2 : 1 }}>
            <div className="pop" style={{ "--i": big ? 0 : i + 1 }}>
              <div className={`${i % 2 ? "animate-float-slow" : "animate-float"} flex flex-col items-center`} style={{ animationDelay: `${i * 0.5}s` }}>
                <div className="relative">
                  <img
                    src={`/landing/${img}.webp`}
                    alt={`Commerce a ${city}`}
                    loading="lazy"
                    className="rounded-full border-[3px] border-white object-cover shadow-modal"
                    style={{ width: size, height: size }}
                  />
                  <span className="absolute left-1/2 top-full -mt-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
                </div>
                <div className="mt-1.5"><Flower /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
