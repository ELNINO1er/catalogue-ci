import { useEffect, useState } from "react";
import { MapPin, MessageCircle, Phone, QrCode } from "lucide-react";
import Button from "../../components/ui/Button";
import CheckoutModal from "../../components/modals/CheckoutModal";
import { getPublicCatalogue } from "../../services/businessService";
import { fmt } from "../../utils/formatters";
import { mediaUrl } from "../../utils/media";

export default function PublicCataloguePage({ slug, onBack, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);

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

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Catalogue</h2>
          <div className={displayAsList ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
            {business.products.map((product) => (
              <div key={product.id} className={`grid gap-3 rounded-lg border border-slate-200 bg-white p-4 ${displayAsList ? "sm:grid-cols-[1fr_auto] sm:items-center" : ""}`}>
                {product.image_url ? <img src={mediaUrl(product.image_url)} alt={product.name} className="h-36 w-full rounded-lg object-cover" /> : null}
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.description}</p>
                  <p className="mt-2 font-bold" style={{ color: primaryColor }}>{fmt(product.price)} FCFA</p>
                </div>
                <Button disabled={!product.is_available} onClick={() => setCheckoutProduct(product)} style={{ backgroundColor: product.is_available ? buttonColor : undefined }}>
                  <MessageCircle size={16} />
                  Commander
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Paiement</h2>
          <div className="flex flex-wrap gap-2">
            {business.paymentMethods.map((method) => (
              <span key={method.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {method.name}
              </span>
            ))}
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
    </main>
  );
}
