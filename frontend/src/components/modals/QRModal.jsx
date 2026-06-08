import { QRCodeCanvas } from "qrcode.react";
import Button from "../ui/Button";

export default function QRModal({ business, onClose }) {
  const url = `${window.location.origin}/catalogue/${business.slug}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-left font-bold text-slate-900">{business.name}</h2>
          <Button tone="ghost" onClick={onClose}>Fermer</Button>
        </div>
        <div className="flex justify-center">
          <QRCodeCanvas value={url} size={220} includeMargin />
        </div>
        <p className="mt-3 break-all text-xs text-slate-500">{url}</p>
      </div>
    </div>
  );
}
