import { useEffect, useMemo, useState } from "react";
import { navigate } from "../../utils/navigation";
import { ArrowLeft, Clock, CreditCard, MapPin, MessageCircle, Phone, QrCode, Search, Share2, ShoppingBag, Truck, Waves, X } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import CheckoutModal from "../../components/modals/CheckoutModal";
import { getPublicCatalogue } from "../../services/businessService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";
import { safeHref, trackWhatsAppClick, waLink, waNumber } from "../../utils/whatsappMessage";
import toast, { Toaster } from "react-hot-toast";

// Polices proposees a l'onboarding (Inter et Poppins sont deja chargees par index.html).
const LOADABLE_FONTS = ["Nunito Sans", "Montserrat", "Roboto", "Playfair Display", "Merriweather"];

function useBusinessFont(fontFamily) {
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

function contactWhatsApp(business, product, message) {
  trackWhatsAppClick({ businessId: business.id, productId: product?.id, message });
}

/* ───── Product Detail Modal ───── */
function ProductModal({ business, product, onClose, onOrder, buttonStyle }) {
  const message = `Bonjour, je suis interesse(e) par "${product.name}" a ${fmt(product.price)} FCFA.`;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={product.name} className="relative max-h-[92vh] w-full max-w-lg animate-slide-up overflow-y-auto rounded-2xl bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"><X size={18} /></button>
        {product.image_url ? (
          <img src={mediaUrl(product.image_url)} alt={product.name} className="h-56 w-full rounded-t-2xl object-cover" />
        ) : <div className="h-12" />}

        <div className="space-y-5 p-6">
          <div>
            {product.category ? <Badge variant="brand" className="mb-2">{product.category}</Badge> : null}
            <h2 className="font-display text-2xl font-bold text-ink-800">{product.name}</h2>
            <p className="mt-2 text-2xl font-bold text-brand-500">{fmt(product.price)} FCFA</p>
          </div>

          {product.description ? <p className="text-sm leading-relaxed text-gray-500">{product.description}</p> : null}

          <Badge variant={product.is_available ? "success" : "danger"} dot>
            {product.is_available ? "Disponible" : "Indisponible"}
          </Badge>

          <div className="grid gap-2">
            <Button size="lg" className="w-full" style={buttonStyle} disabled={!product.is_available} onClick={onOrder}>
              <ShoppingBag size={18} /> Commander maintenant
            </Button>
            <a href={waLink(business.whatsapp_number, message)} target="_blank" rel="noreferrer" onClick={() => contactWhatsApp(business, product, message)}>
              <Button tone="whatsapp" size="lg" className="w-full">
                <MessageCircle size={18} /> Contacter sur WhatsApp
              </Button>
            </a>
            <Button tone="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Lien copie !"); }}>
              <Share2 size={15} /> Partager ce produit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Product Card ───── */
function ProductCard({ product, onDetails, onOrder, displayAsList, buttonStyle }) {
  if (displayAsList) {
    return (
      <div className="card-hover flex items-center gap-4 p-4">
        {product.image_url ? (
          <img src={mediaUrl(product.image_url)} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-surface text-gray-300"><ShoppingBag size={24} /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-800">{product.name}</p>
          {product.description ? <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{product.description}</p> : null}
          <p className="mt-1 text-lg font-bold text-brand-500">{fmt(product.price)} FCFA</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" style={buttonStyle} disabled={!product.is_available} onClick={() => onOrder(product)}>Commander</Button>
          <Button tone="ghost" size="sm" onClick={() => onDetails(product)}>Details</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-hover group overflow-hidden">
      <button onClick={() => onDetails(product)} className="w-full text-left">
        {product.image_url ? (
          <img src={mediaUrl(product.image_url)} alt={product.name} className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-44 place-items-center bg-surface text-gray-300"><ShoppingBag size={36} /></div>
        )}
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-800">{product.name}</p>
            {product.description ? <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{product.description}</p> : null}
          </div>
          {!product.is_available ? <Badge variant="danger" className="shrink-0">Epuise</Badge> : null}
        </div>
        <p className="mt-2 text-xl font-bold text-brand-500">{fmt(product.price)} FCFA</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button tone="secondary" size="sm" onClick={() => onDetails(product)}>Details</Button>
          <Button size="sm" style={buttonStyle} disabled={!product.is_available} onClick={() => onOrder(product)}>Commander</Button>
        </div>
      </div>
    </div>
  );
}

/* ───── Main Page ───── */
export default function PublicCataloguePage({ slug, onBack, setPublicPage, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  useBusinessFont(business?.font_family);

  useEffect(() => {
    getPublicCatalogue(slug).then(setBusiness).catch((err) => setError(err.response?.data?.message || "Catalogue introuvable."));
  }, [slug]);

  const categories = useMemo(() => {
    if (!business?.products) return [];
    return [...new Set(business.products.map((p) => p.category).filter(Boolean))];
  }, [business]);

  const products = useMemo(() => {
    if (!business?.products) return [];
    return business.products.filter((p) => {
      const matchSearch = `${p.name} ${p.description || ""}`.toLowerCase().includes(query.toLowerCase());
      const matchCat = !category || p.category === category;
      return matchSearch && matchCat;
    });
  }, [business, query, category]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface p-5">
        <div className="card max-w-sm p-8 text-center">
          <ShoppingBag size={40} className="mx-auto mb-4 text-brand-300" />
          <h2 className="font-display text-lg font-bold text-ink-800">Catalogue introuvable</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <Button tone="secondary" className="mt-6" onClick={onBack}>Retour</Button>
        </div>
      </main>
    );
  }

  if (!business) return <PageLoading message="Chargement du catalogue..." />;

  const displayAsList = business.display_style === "list";
  const ps = business.paymentSettings || {};
  const isDark = business.theme_mode === "dark";
  // Personnalisation choisie par le commercant (onboarding / Ma boutique).
  const pageStyle = {
    backgroundColor: business.background_color || (isDark ? "#111827" : undefined),
    fontFamily: business.font_family ? `"${business.font_family}", Inter, sans-serif` : undefined,
  };
  const headerStyle = business.primary_color ? { backgroundColor: business.primary_color } : undefined;
  const buttonStyle = business.button_color ? { backgroundColor: business.button_color } : undefined;
  const titleStyle = isDark ? { color: "#F9FAFB" } : business.text_color ? { color: business.text_color } : undefined;
  const mapsHref = safeHref(business.google_maps_url);
  const phoneDigits = waNumber(business.phone_number);

  return (
    <main className="min-h-screen bg-surface pb-8" style={pageStyle}>
      {/* Hero header */}
      <header className="relative bg-brand-600 text-white" style={headerStyle}>
        {business.banner_url ? (
          <div className="absolute inset-0">
            <img src={mediaUrl(business.banner_url)} alt="" className="h-full w-full object-cover opacity-30" />
            <div
              className={business.primary_color ? "absolute inset-0" : "absolute inset-0 bg-gradient-to-b from-brand-700/80 to-brand-600/95"}
              style={business.primary_color ? { backgroundColor: business.primary_color, opacity: 0.85 } : undefined}
            />
          </div>
        ) : null}

        <div className="relative mx-auto max-w-2xl px-5 pb-8 pt-6">
          <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20">
            <ArrowLeft size={14} /> Retour
          </button>

          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img src={mediaUrl(business.logo_url)} alt={`Logo ${business.name}`} className="h-16 w-16 rounded-2xl border-2 border-white/30 bg-white object-cover shadow-lg" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <ShoppingBag size={28} />
              </div>
            )}
            <div>
              {business.category?.name ? <span className="text-sm font-medium text-accent-400">{business.category.name}</span> : null}
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{business.name}</h1>
            </div>
          </div>

          {(business.welcome_message || business.description) ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">{business.welcome_message || business.description}</p>
          ) : null}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={waLink(business.whatsapp_number)} target="_blank" rel="noreferrer" onClick={() => contactWhatsApp(business, null)}>
              <Button tone="whatsapp" size="sm"><MessageCircle size={15} /> WhatsApp</Button>
            </a>
            {phoneDigits ? (
              <a href={`tel:+${phoneDigits}`}>
                <Button tone="secondary" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20"><Phone size={15} /> Appeler</Button>
              </a>
            ) : null}
            {mapsHref ? (
              <a href={mapsHref} target="_blank" rel="noreferrer">
                <Button tone="secondary" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20"><MapPin size={15} /> Localisation</Button>
              </a>
            ) : null}
            <Button tone="secondary" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setQrBusiness?.(business)}>
              <QrCode size={15} /> QR Code
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-5 pt-6">
        {/* Track order link */}
        <button
          onClick={() => setPublicPage?.("track-order")}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
        >
          <Search size={15} /> Suivre une commande
        </button>

        {/* Search & filter */}
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="input-base pl-10" placeholder="Rechercher un produit..." aria-label="Rechercher un produit" />
          </label>
          {categories.length > 1 ? (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base" aria-label="Categorie">
              <option value="">Toutes</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : null}
        </div>

        {/* Products count */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-800" style={titleStyle}>Catalogue</h2>
          <span className="text-sm text-gray-400">{products.length} produit{products.length > 1 ? "s" : ""}</span>
        </div>

        {/* Products grid */}
        <div className={displayAsList ? "grid gap-3" : "grid gap-4 grid-cols-2 sm:grid-cols-2"}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              displayAsList={displayAsList}
              buttonStyle={buttonStyle}
              onDetails={setDetailsProduct}
              onOrder={setCheckoutProduct}
            />
          ))}
        </div>

        {!products.length ? (
          <div className="card mt-4 p-8 text-center">
            <Search size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Aucun produit ne correspond a votre recherche.</p>
          </div>
        ) : null}

        {/* Payment methods */}
        <section className="card mt-6 p-5">
          <h3 className="mb-3 font-display text-sm font-bold text-ink-800">Moyens de paiement acceptes</h3>
          <div className="flex flex-wrap gap-2">
            {ps.is_wave_checkout_enabled ? <Badge variant="wave"><CreditCard size={12} /> Wave Checkout</Badge> : null}
            {ps.is_wave_enabled ? <Badge variant="wave"><Waves size={12} /> Wave</Badge> : null}
            {ps.is_cod_enabled ? <Badge variant="warning"><Truck size={12} /> Livraison</Badge> : null}
            {ps.is_whatsapp_enabled !== false ? <Badge variant="whatsapp"><MessageCircle size={12} /> WhatsApp</Badge> : null}
          </div>
        </section>

        {/* Business info */}
        {(business.opening_hours || business.terms_text || business.delivery_policy) ? (
          <section className="card mt-4 p-5">
            <h3 className="mb-3 font-display text-sm font-bold text-ink-800">Informations</h3>
            <div className="space-y-2 text-sm text-gray-500">
              {business.opening_hours ? <p className="flex items-start gap-2"><Clock size={14} className="mt-0.5 shrink-0 text-brand-400" /> {business.opening_hours}</p> : null}
              {business.delivery_policy ? <p className="flex items-start gap-2"><Truck size={14} className="mt-0.5 shrink-0 text-brand-400" /> {business.delivery_policy}</p> : null}
              {business.terms_text ? <p className="flex items-start gap-2"><ShoppingBag size={14} className="mt-0.5 shrink-0 text-brand-400" /> {business.terms_text}</p> : null}
            </div>
          </section>
        ) : null}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>Propulse par <span className="font-semibold text-brand-500">CatalogueCI</span></p>
          <p className="mt-1">
            <a href="/cgu" onClick={(e) => { e.preventDefault(); navigate("/cgu"); window.scrollTo(0, 0); }} className="hover:text-brand-600">Conditions d'utilisation</a>
            {" · "}
            <a href="/confidentialite" onClick={(e) => { e.preventDefault(); navigate("/confidentialite"); window.scrollTo(0, 0); }} className="hover:text-brand-600">Confidentialite</a>
          </p>
        </footer>
      </div>

      {/* Modals */}
      {detailsProduct ? (
        <ProductModal
          business={business}
          product={detailsProduct}
          buttonStyle={buttonStyle}
          onClose={() => setDetailsProduct(null)}
          onOrder={() => { setCheckoutProduct(detailsProduct); setDetailsProduct(null); }}
        />
      ) : null}
      {checkoutProduct ? (
        <CheckoutModal business={business} product={checkoutProduct} slug={slug} onClose={() => setCheckoutProduct(null)} />
      ) : null}
      <Toaster position="bottom-center" />
    </main>
  );
}
