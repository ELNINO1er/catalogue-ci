import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import FormModal from "../../components/modals/FormModal";
import { getPlatformSettings, savePlatformSettings } from "../../services/superAdminService";

export default function PlatformSettingsPage() {
  const [form, setForm] = useState({
    platform_name: "CatalogueCI",
    currency: "FCFA",
    country: "Cote d'Ivoire",
    support_email: "",
    support_whatsapp: "",
    maintenance_mode: "false",
  });
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    getPlatformSettings().then((data) => setForm((current) => ({ ...current, ...data }))).catch(() => {});
  }, []);

  async function submit(event) {
    event.preventDefault();
    await savePlatformSettings(form);
    setSaved(true);
    setModalOpen(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Parametres globaux</h1>
          <p className="mt-1 text-sm text-slate-500">Configuration generale de la plateforme CatalogueCI.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Modifier</Button>
      </div>
      <div className="rounded-lg border bg-white p-4 text-sm">
        {Object.entries(form).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4 border-b py-2 last:border-0">
            <span className="font-semibold text-slate-700">{key}</span>
            <span className="text-slate-500">{String(value || "-")}</span>
          </div>
        ))}
      </div>
      {saved ? <p className="text-sm text-emerald-700">Parametres enregistres.</p> : null}
      {modalOpen ? (
        <FormModal title="Modifier les parametres" onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="grid gap-3">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className="grid gap-1 text-sm font-semibold text-slate-700">
                {key}
                <input value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="rounded-lg border px-3 py-2 font-normal" />
              </label>
            ))}
            <div className="flex justify-end gap-2">
              <Button tone="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </FormModal>
      ) : null}
    </div>
  );
}
