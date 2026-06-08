import { useEffect, useState } from "react";
import { MapPin, MessageCircle, Phone, QrCode } from "lucide-react";
import Button from "../../components/ui/Button";
import CheckoutModal from "../../components/modals/CheckoutModal";
import { getPublicCatalogue } from "../../services/businessService";
import { fmt } from "../../utils/formatters";

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

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <button onClick={onBack} className="mb-6 text-sm text-slate-300 hover:text-white">Retour</button>
          <p className="text-sm text-emerald-300">{business.category?.name || "Commerce"}</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          <p className="mt-3 max-w-xl text-slate-300">{business.description}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <a className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-3 font-semibold text-white" href={`https://wa.me/${business.whatsapp_number}`} target="_blank" rel="noreferrer">
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
          <div className="grid gap-3">
            {business.products.map((product) => (
              <div key={product.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.description}</p>
                  <p className="mt-2 font-bold text-emerald-700">{fmt(product.price)} FCFA</p>
                </div>
                <Button disabled={!product.is_available} onClick={() => setCheckoutProduct(product)}>
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
