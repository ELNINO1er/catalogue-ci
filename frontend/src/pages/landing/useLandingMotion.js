import { useEffect, useLayoutEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Revele au defilement les elements .reveal, .reveal-group et .photo-reveal (une seule fois).
// La classe .js-reveal n'est posee que si IntersectionObserver existe : sinon tout reste visible.
export function useReveal() {
  const rootRef = useRef(null);

  // useLayoutEffect : la classe est posee avant le premier affichage, sinon le contenu
  // apparaitrait puis disparaitrait (clignotement) avant son animation d'entree.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    root.classList.add("js-reveal");

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.dataset.visible = "";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    root.querySelectorAll(".reveal, .reveal-group, .photo-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return rootRef;
}

// Vrai des que l'element entre dans l'ecran.
export function useInView(options = { threshold: 0.4 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

// Compteur anime de 0 a la valeur cible (ease-out), lance quand `start` devient vrai.
export function useCountUp(target, start, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - begin) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return value;
}

// Leger decalage vertical lie au defilement (effet de profondeur), desactive si
// l'utilisateur prefere moins d'animations. N'utilise que transform.
export function useParallax(strength = 0.08) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * strength;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}
