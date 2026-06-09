export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-sm font-semibold text-brand-700">{label}</span> : null}
      <input className={`input-base ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`} {...props} />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-sm font-semibold text-brand-700">{label}</span> : null}
      <textarea className={`input-base resize-none ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`} {...props} />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Select({ label, error, children, className = "", ...props }) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-sm font-semibold text-brand-700">{label}</span> : null}
      <select className={`input-base ${className}`} {...props}>{children}</select>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
