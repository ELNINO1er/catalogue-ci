import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Eye, QrCode } from "lucide-react";
import Button from "../../components/ui/Button";
import { getMerchantDashboard } from "../../services/merchantService";

export default function MerchantQrPage({ setPublicSlug, setQrBusiness }) {
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    getMerchantDashboard().then((data) => setBusiness(data.business)).catch(() => setBusiness(null));
  }, []);

  if (!business) return <p className="p-5 text-sm text-slate-500">Chargement du QR code...</p>;

  const url = `${window.location.origin}/catalogue/${business.slug}`;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR Code</h1>
        <p className="mt-1 text-sm text-slate-500">Partagez ce QR code sur vos flyers, tables, statuts WhatsApp ou affiches.</p>
      </div>
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-5 text-center">
        <div className="flex justify-center">
          <QRCodeCanvas value={url} size={260} includeMargin />
        </div>
        <p className="mt-4 font-semibold text-slate-900">{business.name}</p>
        <p className="mt-1 break-all text-xs text-slate-500">{url}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => setQrBusiness(business)}><QrCode size={16} /> Agrandir</Button>
          <Button tone="secondary" onClick={() => setPublicSlug(business.slug)}><Eye size={16} /> Voir boutique</Button>
        </div>
      </div>
    </div>
  );
}
