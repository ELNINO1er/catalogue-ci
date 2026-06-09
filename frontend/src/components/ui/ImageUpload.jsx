import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { mediaUrl } from "../../utils/media";

export default function ImageUpload({ label, value, onChange, onUpload, accept = "image/jpeg,image/png,image/webp,image/gif", maxSizeMB = 3, shape = "rect", className = "" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const preview = value ? mediaUrl(value) : null;
  const isRound = shape === "round";

  async function handleFile(file) {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Le fichier ne doit pas depasser ${maxSizeMB} Mo.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Seules les images sont acceptees.");
      return;
    }

    setUploading(true);
    try {
      if (onUpload) {
        const url = await onUpload(file);
        onChange(url);
      } else {
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result);
        reader.readAsDataURL(file);
      }
    } catch {
      alert("Erreur lors du telechargement.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function remove(e) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div className={`grid gap-1.5 ${className}`}>
      {label ? <span className="text-sm font-semibold text-brand-700">{label}</span> : null}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`group relative cursor-pointer overflow-hidden border-2 border-dashed transition-all ${dragOver ? "border-brand-400 bg-brand-50" : "border-surface-border bg-surface hover:border-brand-300 hover:bg-brand-50/50"} ${isRound ? "mx-auto h-32 w-32 rounded-full" : "rounded-2xl"}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className={`h-full w-full object-cover ${isRound ? "" : "h-40"}`} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <button className="rounded-full bg-white/90 p-2 text-brand-700 shadow transition hover:bg-white"><Camera size={16} /></button>
              <button onClick={remove} className="rounded-full bg-white/90 p-2 text-rose-600 shadow transition hover:bg-white"><Trash2 size={16} /></button>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center gap-2 text-center ${isRound ? "h-full" : "py-8"}`}>
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-brand-400" />
            ) : (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-500">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-700">
                    {isRound ? "Ajouter" : "Cliquez ou glissez une image"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">JPG, PNG, WEBP — max {maxSizeMB} Mo</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
    </div>
  );
}
