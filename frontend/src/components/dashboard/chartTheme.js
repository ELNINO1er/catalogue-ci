// Couleurs des graphiques. Palette categorielle validee (lisibilite + daltonisme) :
// toujours attribuee dans cet ordre, jamais recyclee. Au-dela de 5 : "Autres".
export const CATEGORICAL = ["#E8590C", "#2563EB", "#16A34A", "#9333EA", "#CA8A04"];

// Statuts : reserves aux etats de commande, toujours accompagnes d'un libelle.
export const STATUS = {
  completed: { color: "#15803D", label: "Livrees" },
  in_progress: { color: "#0284C7", label: "En cours" },
  pending: { color: "#F59E0B", label: "En attente" },
  cancelled: { color: "#DC2626", label: "Annulees" },
};

export const SERIES = {
  revenue: { color: "#E8590C", label: "Ventes", unit: "FCFA" },
  orders: { color: "#16A34A", label: "Commandes", unit: "" },
};

export const AXIS = { stroke: "#9CA3AF", fontSize: 12 };
export const GRID = "#F0EEEA";

// 12500 -> "12,5k" pour les axes ; les valeurs exactes restent dans les infobulles.
export function compact(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString("fr-FR");
}
