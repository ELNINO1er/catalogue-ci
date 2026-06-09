import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Button from "../ui/Button";

const config = {
  danger: { icon: AlertTriangle, iconColor: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
  success: { icon: CheckCircle2, iconColor: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  info: { icon: Info, iconColor: "text-brand-500", bg: "bg-brand-50", ring: "ring-brand-100" },
};

export default function ConfirmModal({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", tone = "danger", loading = false, onConfirm, onCancel }) {
  const { icon: Icon, iconColor, bg, ring } = config[tone] || config.info;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md animate-slide-up rounded-2xl bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className={`mb-4 inline-flex rounded-xl ${bg} ${ring} ring-4 p-3`}>
            <Icon size={24} className={iconColor} />
          </div>
          <h3 className="text-lg font-bold text-brand-800">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
          <Button tone="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button tone={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "En cours..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
