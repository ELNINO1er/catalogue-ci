import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Eye, Maximize2, Printer, Share2, Store } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { PageHeader, StatusPill } from "../../components/ui/PageKit";
import { getMerchantDashboard } from "../../services/merchantService";

const IDEAS = [
  { icon: Printer, title: "Flyers et affiches", text: "Imprimez le QR code sur vos supports papier." },
  { icon: Store, title: "En boutique", text: "Posez-le sur le comptoir, les tables ou la vitrine." },
  { icon: Share2, title: "Statuts WhatsApp", text: "Partagez l'image ou le lien a vos contacts." },
];

export default function MerchantQrPage({ setPublicSlug, setQrBusiness }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  useEffect(() => {
    getMerchantDashboard()
      .then((data) => setBusiness(data.business))
      .catch(() => setBusiness(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading message="Chargement du QR code..." />;
  if (!business) return <EmptyState title="QR code indisponible" description="Impossible de charger votre boutique." />;

  const url = `${window.location.origin}/catalogue/${business.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copie !");
    } catch {
      toast.error("Copie impossible.");
    }
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-${business.slug}.png`;
    link.click();
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, text: `Decouvrez le catalogue de ${business.name}`, url });
      } catch {
        // partage annule
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code"
        description="Partagez ce QR code sur vos flyers, tables, statuts WhatsApp ou affiches."
        actions={<Button onClick={downloadQr}><Download size={16} /> Telecharger</Button>}
      />

      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid place-items-center bg-gradient-to-br from-brand-500 to-brand-700 p-8">
            <div ref={qrRef} className="rounded-3xl bg-white p-4 shadow-modal">
              <QRCodeCanvas value={url} size={240} includeMargin level="H" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-5 p-6 lg:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-ink-900">{business.name}</h2>
                <StatusPill tone={business.is_active ? "success" : "danger"}>{business.is_active ? "En ligne" : "Suspendue"}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-ink-500">Vos clients scannent ce code pour ouvrir votre catalogue et commander.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-700">{url}</span>
              <button type="button" onClick={copyLink} aria-label="Copier le lien" className="rounded-lg p-1.5 text-ink-500 hover:bg-white hover:text-ink-900">
                <Copy size={14} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button tone="secondary" onClick={copyLink}><Copy size={16} /> Copier le lien</Button>
              <Button tone="secondary" onClick={share}><Share2 size={16} /> Partager</Button>
              <Button tone="secondary" onClick={() => setQrBusiness(business)}><Maximize2 size={16} /> Agrandir</Button>
              <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}><Eye size={16} /> Voir la boutique</Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {IDEAS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-start gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={18} /></span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{title}</p>
              <p className="text-xs text-ink-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
