import { useEffect, useState } from "react";
import { Eye, MapPin, MessageCircle, Phone, QrCode, Search, Share2 } from "lucide-react";
import Button from "../../components/ui/Button";
import CheckoutModal from "../../components/modals/CheckoutModal";
import { getPublicCatalogue } from "../../services/businessService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";

function ProductDetailsModal({ business, product, onClose, onOrder }) {
  const primaryColor = business.primary_color || "#059669";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        {product.image_url ? <img src={mediaUrl(product.image_url)} alt={product.name} className="h-56 w-full object-cover" /> : null}
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{product.category || "Produit / service"}</p>
              <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
              <p className="mt-1 text-xl font-bold" style={{ color: primaryColor }}>{fmt(product.price)} FCFA</p>
            </div>
            <Button tone="ghost" onClick={onClose}>Fermer</Button>
          </div>
          <p className="text-sm leading-6 text-slate-600">{product.description || "Aucune description."}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onOrder} style={{ backgroundColor: primaryColor }}>
              <MessageCircle size={16} />
              Commander maintenant
            </Button>
            <a href={`https://wa.me/${business.whatsapp_number}?text=${encodeURIComponent(`Bonjour, je suis interesse par ${product.name} a ${fmt(product.price)} FCFA.`)}`} target="_blank" rel="noreferrer">
              <Button tone="secondary"><MessageCircle size={16} /> WhatsApp</Button>
            </a>
            <Button tone="secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
              <Share2 size={16} />
              Copier lien
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicCataloguePage({ slug, onBack, setPublicPage, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    getPublicCatalogue(slug)
      .then(setBusiness)
      .catch((err) => setError(err.response?.data?.message || "Catalogue introuvable."));
  }, [slug]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="mb-4 text-slate-600">{error}</p>
          <Button tone="secondary" onClick={onBack}>Retour</Button>
        </div>
      </main>
    );
  }

  if (!business) return <p className="p-5 text-sm text-slate-500">Chargement...</p>;

  const primaryColor = business.primary_color || "#059669";
  const buttonColor = business.button_color || primaryColor;
  const displayAsList = business.display_style === "list";
  const categories = [...new Set((business.products || []).map((product) => product.category).filter(Boolean))];
  const products = (business.products || []).filter((product) => {
    const matchesSearch = `${product.name} ${product.description || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="text-white" style={{ backgroundColor: primaryColor }}>
        <div className="mx-auto max-w-3xl px-5 py-8">
          <button onClick={onBack} className="mb-6 text-sm text-slate-300 hover:text-white">Retour</button>
          {business.banner_url ? <img src={business.banner_url} alt="" className="mb-5 h-40 w-full rounded-lg object-cover" /> : null}
          <div className="flex items-center gap-3">
            {business.logo_url ? <img src={business.logo_url} alt={business.name} className="h-14 w-14 rounded-lg bg-white object-cover" /> : null}
            <div>
              <p className="text-sm text-white/80">{business.category?.name || "Commerce"}</p>
              <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-white/85">{business.welcome_message || business.description}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <a className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 font-semibold text-white" style={{ backgroundColor: buttonColor }} href={`https://wa.me/${business.whatsapp_number}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold text-slate-700" href={`tel:+${business.phone_number}`}>
            <Phone size={18} />
            Appeler
          </a>
          <a className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold text-slate-700" href={business.google_maps_url} target="_blank" rel="noreferrer">
            <MapPin size={18} />
            Localisation
          </a>
        </div>
        <button
          onClick={() => {
            setPublicPage?.("track-order");
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold text-slate-700"
        >
          Suivre une commande
        </button>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Catalogue</h2>
            <span className="text-sm text-slate-500">{products.length} produit(s)</span>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Rechercher un produit"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Toutes les categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className={displayAsList ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
            {products.map((product) => (
              <div key={product.id} className={`grid gap-3 rounded-lg border border-slate-200 bg-white p-4 ${displayAsList ? "sm:grid-cols-[1fr_auto] sm:items-center" : ""}`}>
                {product.image_url ? <img src={mediaUrl(product.image_url)} alt={product.name} className="h-36 w-full rounded-lg object-cover" /> : null}
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.description}</p>
                  <p className="mt-2 font-bold" style={{ color: primaryColor }}>{fmt(product.price)} FCFA</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button tone="secondary" onClick={() => setDetailsProduct(product)}>
                    <Eye size={16} />
                    Details
                  </Button>
                  <Button disabled={!product.is_available} onClick={() => setCheckoutProduct(product)} style={{ backgroundColor: product.is_available ? buttonColor : undefined }}>
                    <MessageCircle size={16} />
                    Commander
                  </Button>
                </div>
              </div>
            ))}
            {!products.length ? <p className="rounded-lg bg-white p-4 text-sm text-slate-500">Aucun produit ne correspond a votre recherche.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Paiement</h2>
          <div className="flex flex-wrap gap-2">
            {business.paymentSettings?.is_wave_enabled ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">Wave manuel</span> : null}
            {business.paymentSettings?.is_cod_enabled ? <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">Paiement a la livraison</span> : null}
            {business.paymentSettings?.is_whatsapp_enabled !== false ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">WhatsApp</span> : null}
          </div>
        </section>

        {(business.terms_text || business.delivery_policy || business.opening_hours) ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Informations</h2>
            <div className="space-y-2 text-sm text-slate-600">
              {business.opening_hours ? <p><span className="font-semibold text-slate-800">Horaires :</span> {business.opening_hours}</p> : null}
              {business.terms_text ? <p><span className="font-semibold text-slate-800">Conditions :</span> {business.terms_text}</p> : null}
              {business.delivery_policy ? <p><span className="font-semibold text-slate-800">Livraison :</span> {business.delivery_policy}</p> : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">QR code</h2>
              <p className="text-sm text-slate-500">A scanner pour ouvrir ce catalogue.</p>
            </div>
            <Button tone="secondary" onClick={() => setQrBusiness(business)}>
              <QrCode size={16} />
              Agrandir
            </Button>
          </div>
        </section>
      </div>

      {checkoutProduct ? (
        <CheckoutModal business={business} product={checkoutProduct} slug={slug} onClose={() => setCheckoutProduct(null)} />
      ) : null}
      {detailsProduct ? (
        <ProductDetailsModal
          business={business}
          product={detailsProduct}
          onClose={() => setDetailsProduct(null)}
          onOrder={() => {
            setCheckoutProduct(detailsProduct);
            setDetailsProduct(null);
          }}
        />
      ) : null}
    </main>
  );
}
