import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// Liste deroulante sur mesure, a la place du <select> natif (dont la liste ne se style pas).
// - La liste est rendue dans <body> en position fixe : jamais coupee par une modale ou un conteneur.
// - Elle s'aligne exactement sous le champ (meme largeur) et s'ouvre vers le haut s'il manque de place.
// - Clavier : fleches, Entree/Espace, Echap, Debut/Fin et saisie d'une lettre pour aller a l'option.
const SIZES = {
  md: "rounded-xl px-4 py-3 text-sm",
  sm: "rounded-xl px-3 py-2.5 text-sm",
};

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Choisir",
  ariaLabel,
  id,
  size = "md",
  disabled = false,
  className = "",
  buttonClassName = "",
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value ?? ""));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const showPlaceholder = !selected || selected.value === "";

  // Position de la liste, recalculee au defilement et au redimensionnement
  useLayoutEffect(() => {
    if (!open) return undefined;
    function place() {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const maxHeight = 280;
      const below = window.innerHeight - r.bottom - 12;
      const up = below < Math.min(maxHeight, options.length * 44 + 12) && r.top > below;
      setPos({
        left: r.left,
        width: r.width,
        top: up ? undefined : r.bottom + 8,
        bottom: up ? window.innerHeight - r.top + 8 : undefined,
        maxHeight: Math.max(140, Math.min(maxHeight, (up ? r.top : below) - 12)),
        up,
      });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, options.length]);

  // Fermeture au clic exterieur
  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (!buttonRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // L'option active reste visible dans la liste
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(index) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function move(delta) {
    setActive((i) => {
      let next = i;
      for (let n = 0; n < options.length; n += 1) {
        next = (next + delta + options.length) % options.length;
        if (!options[next].disabled) return next;
      }
      return i;
    });
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openList();
      else move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else openList();
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    } else if (open && (e.key === "Home" || e.key === "End")) {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : options.length - 1);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Saisie rapide : "r" va a "Restaurant", "re" affine si on tape vite
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const found = options.findIndex((o) => String(o.label).toLowerCase().startsWith(typed.current.text));
      if (found >= 0) {
        if (!open) openList();
        setActive(found);
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2.5 border bg-white text-left outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60 ${SIZES[size] || SIZES.md} ${
          open ? "border-brand-400 ring-2 ring-brand-100" : "border-surface-border hover:border-ink-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
        } ${buttonClassName}`}
      >
        {Icon ? <Icon size={16} className="shrink-0 text-brand-500" /> : null}
        <span className={`min-w-0 flex-1 truncate ${showPlaceholder ? "text-ink-400" : "font-medium text-ink-800"}`}>
          {showPlaceholder ? (selected?.label || placeholder) : selected.label}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? "rotate-180 text-brand-500" : ""}`} />
      </button>

      {open && pos
        ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={`dropdown-list fixed z-[100] overflow-y-auto rounded-2xl border border-surface-border bg-white p-1.5 shadow-modal ${pos.up ? "origin-bottom" : "origin-top"}`}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={`${option.value}-${index}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => { e.preventDefault(); choose(index); }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    option.disabled ? "cursor-not-allowed text-ink-300" : index === active ? "bg-brand-50 text-brand-800" : "text-ink-700"
                  } ${isSelected ? "font-semibold" : ""} ${option.value === "" ? "text-ink-400" : ""}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && option.value !== "" ? <Check size={15} className="shrink-0 text-brand-600" /> : null}
                </li>
              );
            })}
          </ul>,
          document.body,
        )
        : null}
    </div>
  );
}
