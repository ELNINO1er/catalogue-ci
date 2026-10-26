import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import CheckoutModal from "../../components/modals/CheckoutModal";
import Storefront, { ProductSheet } from "../../components/shop/Storefront";
import { getPublicCatalogue } from "../../services/businessService";
import { trackWhatsAppClick } from "../../utils/whatsappMessage";
import toast, { Toaster } from "react-hot-toast";

export default function PublicCataloguePage({ slug, onBack, setPublicPage, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [detailsProduct, setDetailsProduct] = useState(null);

  useEffect(() => {
    getPublicCatalogue(slug).then(setBusiness).catch((err) => setError(err.response?.data?.message || "Catalogue introuvable."));
  }, [slug]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-b from-[#FFF8F3] to-surface p-5 font-landing">
        <div className="w-full max-w-sm animate-fade-up rounded-[1.75rem] border border-surface-border bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500"><ShoppingBag size={30} /></span>
          <h2 className="mt-5 text-xl font-bold text-ink-900">Catalogue introuvable</h2>
          <p className="mt-2 text-sm text-ink-500">{error}</p>
          <button type="button" onClick={onBack} className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5">
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </main>
    );
  }

  if (!business) return <PageLoading message="Chargement du catalogue..." />;

  function trackWhatsApp(product, message) {
    trackWhatsAppClick({ businessId: business.id, productId: product?.id, message });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: business.name, url });
      else {
        await navigator.clipboard?.writeText(url);
        toast.success("Lien de la boutique copie !");
      }
    } catch {
      // Partage annule par l'utilisateur : rien a faire
    }
  }

  return (
    <main>
      <Storefront
        business={business}
        mode="live"
        onBack={onBack}
        onTrack={() => setPublicPage?.("track-order")}
        onQr={setQrBusiness ? () => setQrBusiness(business) : undefined}
        onShare={share}
        onDetails={setDetailsProduct}
        onOrder={setCheckoutProduct}
        onWhatsApp={trackWhatsApp}
      />

      {detailsProduct ? (
        <ProductSheet
          business={business}
          product={detailsProduct}
          onClose={() => setDetailsProduct(null)}
          onOrder={() => { setCheckoutProduct(detailsProduct); setDetailsProduct(null); }}
          onWhatsApp={trackWhatsApp}
        />
      ) : null}
      {checkoutProduct ? (
        <CheckoutModal business={business} product={checkoutProduct} slug={slug} onClose={() => setCheckoutProduct(null)} />
      ) : null}
      <Toaster position="top-center" />
    </main>
  );
}
