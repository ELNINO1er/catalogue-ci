import { X } from "lucide-react";

export default function FormModal({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl animate-slide-up overflow-y-auto rounded-2xl bg-white shadow-modal" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-surface-border p-6">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-800">{title}</h2>
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-surface hover:text-brand-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
