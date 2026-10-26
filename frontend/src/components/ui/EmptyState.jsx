import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "Rien a afficher", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50">
        <Icon size={26} className="text-brand-500" />
      </div>
      <h3 className="font-display text-base font-bold text-ink-900">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-500">{description}</p> : null}
      {action || null}
    </div>
  );
}
