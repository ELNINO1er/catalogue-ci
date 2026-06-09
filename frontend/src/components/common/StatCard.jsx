const toneClasses = {
  brand: "bg-brand-50 text-brand-500",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  info: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  wave: "bg-wave-light text-wave",
  whatsapp: "bg-whatsapp-light text-whatsapp",
};

export default function StatCard({ icon: Icon, label, value, tone = "brand", subtitle, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      className={`card group p-5 text-left ${onClick ? "cursor-pointer hover:shadow-card-hover" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-800">{value}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p> : null}
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${toneClasses[tone] || toneClasses.brand}`}>
          <Icon size={22} />
        </div>
      </div>
    </Wrapper>
  );
}
