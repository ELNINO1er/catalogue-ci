import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, X } from "lucide-react";
import Button from "../ui/Button";
import toast from "react-hot-toast";

export default function QRModal({ business, onClose }) {
  const url = `${window.location.origin}/catalogue/${business.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    toast.success("Lien copie !");
  }

  function downloadQR() {
    const canvas = document.querySelector("#qr-canvas canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${business.slug}-qrcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR code telecharge !");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm animate-slide-up rounded-2xl bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h2 className="font-display font-bold text-brand-800">{business.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-surface hover:text-brand-700"><X size={18} /></button>
        </div>

        <div className="flex flex-col items-center px-6 py-8">
          <div id="qr-canvas" className="rounded-2xl bg-white p-4 shadow-card">
            <QRCodeCanvas value={url} size={200} includeMargin level="H" />
          </div>
          <p className="mt-4 break-all text-center text-xs text-gray-400">{url}</p>
        </div>

        <div className="flex gap-2 border-t border-surface-border px-6 py-4">
          <Button tone="secondary" className="flex-1" onClick={copyLink}><Copy size={15} /> Copier le lien</Button>
          <Button className="flex-1" onClick={downloadQR}><Download size={15} /> Telecharger</Button>
        </div>
      </div>
    </div>
  );
}
