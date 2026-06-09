import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "Rien a afficher", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-white px-6 py-12 text-center">
      <div className="rounded-2xl bg-surface p-4">
        <Icon size={32} className="text-brand-300" />
      </div>
      <h3 className="text-lg font-semibold text-brand-700">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-gray-500">{description}</p> : null}
      {action || null}
    </div>
  );
}
