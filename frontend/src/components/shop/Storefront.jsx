import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Clock, CreditCard, Eye, MapPin, MessageCircle, Navigation, Package, Phone, QrCode,
  Search, Share2, ShieldCheck, ShoppingBag, Store, Truck, Wallet, X,
} from "lucide-react";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";
import { safeHref, waLink, waNumber } from "../../utils/whatsappMessage";
import { navigate } from "../../utils/navigation";

function legal(path) {
  return (e) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo(0, 0);
  };
}

// Vitrine d'une boutique, partagee par la page publique et l'apercu de l'onboarding.
// mode "live"    : page reelle (liens, commandes, bouton WhatsApp flottant)
// mode "preview" : apercu inerte, mise en page compacte pour tenir dans un cadre
const LOADABLE_FONTS = ["Nunito Sans", "Montserrat", "Roboto", "Playfair Display", "Merriweather"];
const DEFAULT_PRIMARY = "#F76707";

export function useBusinessFont(fontFamily) {
  useEffect(() => {
    if (!LOADABLE_FONTS.includes(fontFamily)) return;
    const id = `font-${fontFamily.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);
}

// "#F76707" + 0.2 -> "rgba(247, 103, 7, 0.2)" (couleur du commercant en transparence)
function alpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return `rgba(247, 103, 7, ${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function themeOf(business) {
  const dark = business.theme_mode === "dark";
  const primary = business.primary_color || DEFAULT_PRIMARY;
  return {
    dark,
    primary,
    button: business.button_color || primary,
    page: business.background_color && !dark ? business.background_color : dark ? "#0B1120" : "#F7F6F3",
    card: dark ? "#111827" : "#FFFFFF",
    border: dark ? "rgba(255,255,255,0.08)" : "#ECEAE6",
    text: dark ? "#F9FAFB" : business.text_color || "#111827",
    muted: dark ? "#9CA3AF" : "#6B7280",
    soft: dark ? "rgba(255,255,255,0.06)" : "#F7F6F3",
  };
}

/* ───── Carte produit ───── */
function ProductCard({ product, theme, list, compact, index, onDetails, onOrder }) {
  const unavailable = product.is_available === false;
  const delay = { animationDelay: `${Math.min(index, 8) * 60}ms` };

  if (list) {
    return (
      <article
        className="group flex animate-fade-up items-center gap-4 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
        style={{ ...delay, backgroundColor: theme.card, borderColor: theme.border }}
      >
        <button type="button" onClick={() => onDetails(product)} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl" aria-label={`Voir ${product.name}`}>
          {product.image_url
            ? <img src={mediaUrl(product.image_url)} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            : <span className="grid h-full w-full place-items-center" style={{ backgroundColor: theme.soft, color: theme.muted }}><ShoppingBag size={24} /></span>}
        </button>
        <div className="min-w-0 flex-1">
          {product.category ? <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>{product.category}</p> : null}
          <h3 className="truncate font-semibold" style={{ color: theme.text }}>{product.name}</h3>
          {product.description ? <p className="mt-0.5 line-clamp-1 text-sm" style={{ color: theme.muted }}>{product.description}</p> : null}
          <p className="mt-1.5 text-lg font-bold" style={{ color: theme.primary }}>{fmt(product.price)} <span className="text-xs font-semibold">FCFA</span></p>
        </div>
        <button
          type="button"
          disabled={unavailable}
          onClick={() => onOrder(product)}
          className="shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40"
          style={{ backgroundColor: theme.button }}
        >
          {unavailable ? "Epuise" : "Commander"}
        </button>
      </article>
    );
  }

  return (
    <article
      className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      style={{ ...delay, backgroundColor: theme.card, borderColor: theme.border }}
    >
      <button type="button" onClick={() => onDetails(product)} className="relative block aspect-square w-full overflow-hidden text-left" aria-label={`Voir ${product.name}`}>
        {product.image_url
          ? <img src={mediaUrl(product.image_url)} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          : <span className="grid h-full w-full place-items-center" style={{ backgroundColor: theme.soft, color: theme.muted }}><ShoppingBag size={compact ? 26 : 36} /></span>}
        {product.category ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-semibold text-ink-800 shadow-card backdrop-blur">{product.category}</span>
        ) : null}
        {unavailable ? (
          <span className="absolute inset-0 grid place-items-center bg-ink-900/55 text-sm font-semibold uppercase tracking-wider text-white">Epuise</span>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white text-ink-800 opacity-0 shadow-card transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Eye size={16} />
          </span>
        )}
      </button>
      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
        <h3 className={`line-clamp-1 font-semibold ${compact ? "text-sm" : ""}`} style={{ color: theme.text }}>{product.name}</h3>
        {product.description && !compact ? <p className="mt-1 line-clamp-2 text-sm leading-snug" style={{ color: theme.muted }}>{product.description}</p> : null}
        <div className="mt-auto pt-3">
          <p className={`font-bold ${compact ? "text-base" : "text-xl"}`} style={{ color: theme.primary }}>
            {fmt(product.price)} <span className="text-xs font-semibold">FCFA</span>
          </p>
          <button
            type="button"
            disabled={unavailable}
            onClick={() => onOrder(product)}
            className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-full font-semibold text-white transition hover:brightness-110 disabled:opacity-40 ${compact ? "py-2 text-xs" : "py-2.5 text-sm"}`}
            style={{ backgroundColor: theme.button }}
          >
            <ShoppingBag size={compact ? 13 : 15} /> Commander
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───── Fiche produit ───── */
export function ProductSheet({ business, product, onClose, onOrder, onWhatsApp }) {
  const theme = themeOf(business);
  const unavailable = product.is_available === false;
  const message = `Bonjour, je suis interesse(e) par "${product.name}" a ${fmt(product.price)} FCFA.`;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/55 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative max-h-[92vh] w-full max-w-3xl animate-slide-up overflow-y-auto rounded-t-[1.75rem] bg-white shadow-modal sm:rounded-[1.75rem] md:grid md:grid-cols-2 md:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-800 shadow-card backdrop-blur transition hover:bg-white">
          <X size={18} />
        </button>
        <div className="relative aspect-square bg-surface md:aspect-auto md:h-full">
          {product.image_url
            ? <img src={mediaUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
            : <span className="grid h-full min-h-[14rem] place-items-center text-ink-300"><ShoppingBag size={48} /></span>}
        </div>
        <div className="flex flex-col p-6 md:max-h-[92vh] md:overflow-y-auto md:p-8">
          {product.category ? <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.primary }}>{product.category}</p> : null}
          <h2 className="mt-1 text-2xl font-bold text-ink-900 sm:text-[1.7rem]">{product.name}</h2>
          <p className="mt-3 text-3xl font-bold" style={{ color: theme.primary }}>{fmt(product.price)} <span className="text-base">FCFA</span></p>
          <span className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${unavailable ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${unavailable ? "bg-rose-500" : "bg-emerald-500"}`} />
            {unavailable ? "Indisponible" : "Disponible"}
          </span>
          {product.description ? <p className="mt-5 leading-relaxed text-ink-600">{product.description}</p> : null}

          <div className="mt-auto grid gap-2.5 pt-7">
            <button
              type="button"
              disabled={unavailable}
              onClick={onOrder}
              className="flex items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white shadow-card-hover transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40"
              style={{ backgroundColor: theme.button }}
            >
              <ShoppingBag size={18} /> Commander maintenant
            </button>
            <a
              href={waLink(business.whatsapp_number, message)}
              target="_blank"
              rel="noreferrer"
              onClick={() => onWhatsApp?.(product, message)}
              className="flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <MessageCircle size={18} /> Poser une question sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Vitrine ───── */
export default function Storefront({
  business,
  mode = "live",
  onBack,
  onTrack,
  onQr,
  onShare,
  onDetails,
  onOrder,
  onWhatsApp,
}) {
  const live = mode === "live";
  const compact = !live;
  const theme = themeOf(business);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  useBusinessFont(business.font_family);

  const allProducts = business.products || [];
  const categories = useMemo(() => [...new Set(allProducts.map((p) => p.category).filter(Boolean))], [allProducts]);
  const products = useMemo(() => allProducts.filter((p) => {
    const matchSearch = `${p.name} ${p.description || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchSearch && (!category || p.category === category);
  }), [allProducts, query, category]);

  const ps = business.paymentSettings || {};
  const list = business.display_style === "list";
  const mapsHref = safeHref(business.google_maps_url);
  const phoneDigits = waNumber(business.phone_number);
  const place = [business.commune, business.city].filter(Boolean).join(", ") || business.address;
  const noop = () => {};
  const details = live ? onDetails || noop : noop;
  const order = live ? onOrder || noop : noop;

  // Atouts affiches sous l'en-tete : uniquement ce que la boutique propose vraiment.
  const perks = [
    { show: true, icon: MessageCircle, title: "Commande WhatsApp", text: "Reponse directe du vendeur" },
    { show: ps.is_wave_enabled || ps.is_wave_checkout_enabled, icon: Wallet, title: "Paiement Wave", text: "Simple et rapide" },
    { show: ps.is_cod_enabled, icon: Truck, title: "Paiement a la livraison", text: "Payez a la reception" },
    { show: true, icon: Package, title: `${allProducts.length} produit${allProducts.length > 1 ? "s" : ""}`, text: "Dans le catalogue" },
  ].filter((p) => p.show);

  const wrap = compact ? "px-4" : "mx-auto max-w-6xl px-4 sm:px-6";
  const gridCols = compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const actionBtn = "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20";

  return (
    <div
      className={`relative ${live ? "min-h-screen pb-16" : "pb-8"}`}
      style={{ backgroundColor: theme.page, color: theme.text, fontFamily: business.font_family ? `"${business.font_family}", Inter, sans-serif` : undefined }}
    >
      {/* ─── En-tete ─── */}
      <header className="relative overflow-hidden text-white" style={{ backgroundColor: theme.primary }}>
        {business.banner_url ? (
          <img src={mediaUrl(business.banner_url)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {/* Voile de la couleur de la boutique + decor */}
        <div className="absolute inset-0" style={{ background: business.banner_url
          ? `linear-gradient(180deg, ${alpha(theme.primary, 0.55)} 0%, ${alpha(theme.primary, 0.92)} 100%)`
          : `radial-gradient(circle at 85% 15%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 10% 90%, rgba(0,0,0,0.18), transparent 50%)` }} />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(white_1px,transparent_1.2px)] [background-size:20px_20px]" />

        <div className={`relative ${wrap} ${compact ? "pb-14 pt-5" : "pb-20 pt-6 sm:pb-24"}`}>
          <div className="flex items-center justify-between gap-3">
            {live && onBack ? (
              <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25">
                <ArrowLeft size={15} /> Retour
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button type="button" onClick={live ? onTrack : noop} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25">
                <Search size={15} /> <span className={compact ? "hidden" : "hidden sm:inline"}>Suivre une commande</span>
              </button>
              <button type="button" onClick={live ? onShare : noop} aria-label="Partager la boutique" className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className={`flex gap-5 ${compact ? "mt-6 flex-col" : "mt-8 flex-col sm:flex-row sm:items-end"}`}>
            <div className="seq-pop shrink-0" style={{ "--d": "80ms" }}>
              {business.logo_url
                ? <img src={mediaUrl(business.logo_url)} alt={`Logo ${business.name}`} className={`rounded-3xl border-4 border-white/90 bg-white object-cover shadow-modal ${compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"}`} />
                : <span className={`grid place-items-center rounded-3xl border-4 border-white/40 bg-white/15 backdrop-blur ${compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"}`}><Store size={compact ? 30 : 38} /></span>}
            </div>
            <div className="min-w-0">
              {business.category?.name ? (
                <span className="seq inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur" style={{ "--d": "150ms" }}>{business.category.name}</span>
              ) : null}
              <h1 className={`seq mt-2 font-bold leading-tight ${compact ? "text-3xl" : "text-3xl sm:text-5xl"}`} style={{ "--d": "220ms" }}>{business.name || "Ma boutique"}</h1>
              {(business.welcome_message || business.description) ? (
                <p className={`seq mt-3 max-w-2xl leading-relaxed text-white/85 ${compact ? "text-sm" : "sm:text-lg"}`} style={{ "--d": "300ms" }}>{business.welcome_message || business.description}</p>
              ) : null}
              <div className="seq mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/85" style={{ "--d": "360ms" }}>
                {place ? <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {place}</span> : null}
                {business.opening_hours ? <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {business.opening_hours}</span> : null}
              </div>
            </div>
          </div>

          <div className="seq mt-7 flex flex-wrap gap-2.5" style={{ "--d": "420ms" }}>
            <a
              href={live ? waLink(business.whatsapp_number) : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={() => live && onWhatsApp?.(null)}
              className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,211,102,0.9)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <MessageCircle size={16} /> Ecrire sur WhatsApp
            </a>
            {phoneDigits ? <a href={live ? `tel:+${phoneDigits}` : undefined} className={actionBtn}><Phone size={15} /> Appeler</a> : null}
            {mapsHref ? <a href={live ? mapsHref : undefined} target="_blank" rel="noreferrer" className={actionBtn}><Navigation size={15} /> Itineraire</a> : null}
            {live && onQr ? <button type="button" onClick={onQr} className={actionBtn}><QrCode size={15} /> QR Code</button> : null}
          </div>
        </div>
      </header>

      {/* ─── Atouts (carte qui chevauche l'en-tete) ─── */}
      <div className={`relative z-10 ${wrap} ${compact ? "-mt-8" : "-mt-12"}`}>
        <div
          className={`grid gap-px overflow-hidden rounded-2xl border shadow-card-hover ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}
          style={{ backgroundColor: theme.border, borderColor: theme.border }}
        >
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4" style={{ backgroundColor: theme.card }}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10" style={{ backgroundColor: alpha(theme.primary, 0.12), color: theme.primary }}><Icon size={17} /></span>
              {/* Texte sur deux lignes si besoin (pas de coupure "Command...") */}
              <div className="min-w-0">
                <p className="text-[0.8rem] font-semibold leading-tight sm:text-sm" style={{ color: theme.text }}>{title}</p>
                <p className="mt-0.5 text-[0.7rem] leading-tight sm:text-xs" style={{ color: theme.muted }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Catalogue ─── */}
      <section className={`${wrap} ${compact ? "pt-8" : "pt-12"}`}>
        <div className={`flex gap-4 ${compact ? "flex-col" : "flex-col md:flex-row md:items-end md:justify-between"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.primary }}>Catalogue</p>
            <h2 className={`mt-1 font-bold ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`} style={{ color: theme.text }}>Nos produits</h2>
          </div>
          <label className={`relative block ${compact ? "" : "md:w-80"}`}>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: theme.muted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              aria-label="Rechercher un produit"
              className="w-full rounded-full border py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2"
              style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text, "--tw-ring-color": alpha(theme.primary, 0.25) }}
            />
          </label>
        </div>

        {categories.length > 1 ? (
          <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categories">
            {["", ...categories].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c || "all"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c)}
                  className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                  style={active
                    ? { backgroundColor: theme.primary, borderColor: theme.primary, color: "#fff" }
                    : { backgroundColor: theme.card, borderColor: theme.border, color: theme.muted }}
                >
                  {c || "Tout"}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className="mt-5 text-sm" style={{ color: theme.muted }}>{products.length} produit{products.length > 1 ? "s" : ""}{category ? ` · ${category}` : ""}</p>

        {products.length ? (
          <div className={`mt-4 grid gap-3 sm:gap-4 ${list ? (compact ? "grid-cols-1" : "md:grid-cols-2") : gridCols}`}>
            {products.map((p, i) => (
              <ProductCard key={p.id || `p-${i}`} index={i} product={p} theme={theme} list={list} compact={compact} onDetails={details} onOrder={order} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
            <Search size={30} className="mx-auto mb-3" style={{ color: theme.muted }} />
            <p className="font-medium" style={{ color: theme.text }}>{allProducts.length ? "Aucun produit ne correspond" : "Le catalogue arrive bientot"}</p>
            <p className="mt-1 text-sm" style={{ color: theme.muted }}>{allProducts.length ? "Essayez un autre mot ou une autre categorie." : "Ecrivez-nous sur WhatsApp pour commander."}</p>
          </div>
        )}
      </section>

      {/* ─── Paiement et infos pratiques ─── */}
      <section className={`${wrap} grid gap-4 pt-10 ${compact ? "" : "md:grid-cols-2"}`}>
        <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <h3 className="flex items-center gap-2 font-bold" style={{ color: theme.text }}><ShieldCheck size={18} style={{ color: theme.primary }} /> Comment payer ?</h3>
          <ul className="mt-4 space-y-3">
            {ps.is_wave_checkout_enabled ? <PayRow theme={theme} icon={CreditCard} title="Wave en ligne" text="Paiement securise depuis votre telephone." /> : null}
            {ps.is_wave_enabled ? <PayRow theme={theme} icon={Wallet} title="Wave" text="Envoyez le montant au numero Wave du vendeur, puis confirmez." /> : null}
            {ps.is_cod_enabled ? <PayRow theme={theme} icon={Truck} title="A la livraison" text="Payez en especes a la reception." /> : null}
            {ps.is_whatsapp_enabled !== false ? <PayRow theme={theme} icon={MessageCircle} title="Via WhatsApp" text="Convenez du paiement directement avec le vendeur." /> : null}
          </ul>
        </div>
        <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          <h3 className="flex items-center gap-2 font-bold" style={{ color: theme.text }}><Store size={18} style={{ color: theme.primary }} /> Infos pratiques</h3>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: theme.muted }}>
            {place ? <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }} /><span>{business.address && business.address !== place ? `${business.address} — ${place}` : place}</span></li> : null}
            {business.opening_hours ? <li className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }} /><span>{business.opening_hours}</span></li> : null}
            {business.delivery_policy ? <li className="flex gap-3"><Truck size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }} /><span>{business.delivery_policy}</span></li> : null}
            {business.terms_text ? <li className="flex gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }} /><span>{business.terms_text}</span></li> : null}
            <li className="flex gap-3"><MessageCircle size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }} /><span>Une question ? Ecrivez au vendeur sur WhatsApp, il vous repond directement.</span></li>
          </ul>
        </div>
      </section>

      {/* ─── Pied de page ─── */}
      <footer className={`${wrap} pt-10 text-center text-xs`} style={{ color: theme.muted }}>
        <p className="inline-flex items-center gap-1.5">
          Boutique propulsee par
          <span className="inline-flex items-center gap-1 font-semibold text-brand-500"><ShoppingBag size={13} /> CatalogueCI</span>
        </p>
        {live ? (
          <p className="mt-1.5">
            <a href="/cgu" onClick={legal("/cgu")} className="hover:underline">Conditions d'utilisation</a>
            {" · "}
            <a href="/confidentialite" onClick={legal("/confidentialite")} className="hover:underline">Confidentialite</a>
          </p>
        ) : null}
      </footer>

      {/* ─── Bouton WhatsApp flottant ─── */}
      {live ? (
        <a
          href={waLink(business.whatsapp_number)}
          target="_blank"
          rel="noreferrer"
          onClick={() => onWhatsApp?.(null)}
          aria-label="Ecrire a la boutique sur WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-[0_14px_30px_-8px_rgba(37,211,102,0.8)] transition hover:scale-110"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-whatsapp/40" />
          <MessageCircle size={26} className="relative" />
        </a>
      ) : null}
    </div>
  );
}

function PayRow({ theme, icon: Icon, title, text }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: alpha(theme.primary, 0.12), color: theme.primary }}><Icon size={16} /></span>
      <div>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>{title}</p>
        <p className="text-sm" style={{ color: theme.muted }}>{text}</p>
      </div>
    </li>
  );
}
