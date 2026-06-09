const variants = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  brand: "bg-brand-50 text-brand-600 border-brand-200",
  accent: "bg-accent-50 text-accent-800 border-accent-200",
  wave: "bg-wave-light text-wave border-blue-200",
  whatsapp: "bg-whatsapp-light text-green-700 border-green-200",
};

export default function Badge({ children, variant = "neutral", dot = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant] || variants.neutral} ${className}`}>
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${variant === "success" ? "bg-emerald-500" : variant === "danger" ? "bg-rose-500" : variant === "warning" ? "bg-amber-500" : "bg-current"}`} /> : null}
      {children}
    </span>
  );
}
