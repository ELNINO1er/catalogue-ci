const tones = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-300",
  secondary: "bg-white text-brand-700 border border-surface-border hover:bg-surface active:bg-gray-100 focus-visible:ring-brand-200",
  accent: "bg-accent-500 text-brand-900 hover:bg-accent-400 active:bg-accent-600 focus-visible:ring-accent-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-300",
  ghost: "bg-transparent text-brand-600 hover:bg-brand-50 active:bg-brand-100 focus-visible:ring-brand-200",
  whatsapp: "bg-whatsapp text-white hover:bg-green-600 active:bg-green-700 focus-visible:ring-green-300",
  wave: "bg-wave text-white hover:bg-blue-500 active:bg-blue-600 focus-visible:ring-blue-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
  xl: "px-8 py-4 text-base gap-3",
};

export default function Button({ children, tone = "primary", size = "md", className = "", type = "button", disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${tones[tone] || tones.primary} ${sizes[size] || sizes.md} ${className}`}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
