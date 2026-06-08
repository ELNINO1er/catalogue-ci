import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { createCustomField, deleteCustomField, listCustomFields } from "../../services/customFieldService";

const fieldTypes = ["text", "textarea", "number", "phone", "email", "date", "time", "select", "checkbox", "radio", "file", "address"];

export default function CustomFieldsEditor({ product }) {
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState({
    label: "",
    field_type: "text",
    options_json: "",
    is_required: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadFields() {
    setFields(await listCustomFields(product.id));
  }

  useEffect(() => {
    loadFields().catch(() => setFields([]));
  }, [product.id]);

  async function addField(event) {
    event.preventDefault();
    setError("");

    if (!form.label.trim()) {
      setError("Le label du champ est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      await createCustomField(product.id, {
        ...form,
        label: form.label.trim(),
        options_json: form.options_json ? form.options_json.split(",").map((item) => item.trim()).filter(Boolean) : null,
        sort_order: fields.length + 1,
      });
      setForm({ label: "", field_type: "text", options_json: "", is_required: false });
      await loadFields();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter ce champ.");
    } finally {
      setSaving(false);
    }
  }

  async function removeField(fieldId) {
    await deleteCustomField(fieldId);
    await loadFields();
  }

  const needsOptions = ["select", "checkbox", "radio"].includes(form.field_type);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-3 text-sm font-bold text-slate-800">Champs personnalises</p>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{field.label}</p>
              <p className="text-xs text-slate-500">
                {field.field_type} {field.is_required ? "- obligatoire" : "- optionnel"}
              </p>
            </div>
            <Button type="button" tone="danger" onClick={() => removeField(field.id)} aria-label="Supprimer le champ">
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={addField} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px]">
          <input
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder="Label du champ"
            className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <select
            value={form.field_type}
            onChange={(event) => setForm({ ...form, field_type: event.target.value, options_json: "" })}
            className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {needsOptions ? (
          <input
            value={form.options_json}
            onChange={(event) => setForm({ ...form, options_json: event.target.value })}
            placeholder="Options separees par des virgules : S, M, L, XL"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={(event) => setForm({ ...form, is_required: event.target.checked })}
              className="h-4 w-4 accent-emerald-600"
            />
            Obligatoire
          </label>

          <Button type="submit" disabled={saving}>
            <Plus size={14} />
            Ajouter le champ
          </Button>
        </div>

        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </form>
    </div>
  );
}
