import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

// Liste deroulante sur mesure : alignee sous le champ, animee, navigable au clavier
// (fleches, Entree, Echap), accessible (role listbox).
export default function CitySelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, options.indexOf(value)));
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onClick(e) { if (!rootRef.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function choose(index) {
    onChange(options[index]);
    setActive(index);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Ville : ${value}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-left transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      >
        <MapPin size={18} className="shrink-0 text-brand-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-ink-900">Ville</span>
          <span className="block truncate text-sm text-ink-600">{value}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label="Choisir une ville"
        className={`absolute left-0 right-0 top-[calc(100%+10px)] z-20 max-h-64 min-w-[12rem] origin-top overflow-y-auto rounded-2xl border border-surface-border bg-white p-1.5 shadow-modal transition duration-200 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const selected = option === value;
          return (
            <li
              key={option}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(e) => { e.preventDefault(); choose(index); }}
              className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                index === active ? "bg-brand-50 text-brand-800" : "text-ink-700"
              } ${selected ? "font-semibold" : ""}`}
            >
              {option}
              {selected ? <Check size={15} className="text-brand-600" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
