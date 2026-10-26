import { Children, isValidElement, useId } from "react";
import Dropdown from "./Dropdown";

export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-sm font-semibold text-ink-700">{label}</span> : null}
      <input className={`input-base ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`} {...props} />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-sm font-semibold text-ink-700">{label}</span> : null}
      <textarea className={`input-base resize-none ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`} {...props} />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

// Lit les <option> passees en enfants (meme API qu'un <select>) pour la liste sur mesure.
function readOptions(children) {
  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === "option")
    .map((child) => ({
      value: child.props.value ?? String(child.props.children ?? ""),
      label: Children.toArray(child.props.children).join(""),
      disabled: !!child.props.disabled,
    }));
}

// Meme API qu'avant (label, value, onChange(event), <option>…) mais avec la liste Dropdown.
export function Select({ label, error, children, className = "", value, onChange, disabled, placeholder, "aria-label": ariaLabel }) {
  const fieldId = useId();
  const options = readOptions(children);
  return (
    <div className="grid gap-1.5">
      {label ? <label htmlFor={fieldId} className="text-sm font-semibold text-ink-700">{label}</label> : null}
      <Dropdown
        id={fieldId}
        value={value}
        options={options}
        disabled={disabled}
        placeholder={placeholder || options.find((o) => o.value === "")?.label}
        ariaLabel={ariaLabel || label}
        buttonClassName={`${error ? "!border-rose-400" : ""} ${className}`}
        onChange={(next) => onChange?.({ target: { value: next } })}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
