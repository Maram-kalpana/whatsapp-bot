import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Plus, Save, Trash2 } from "lucide-react";
import { getLeadMagnet, publicCaptureUrl, updateLeadMagnet } from "../api/leadMagnets";
import { listChatbots } from "../api/chatbots";
import { apiErrorMessage } from "../api/client";
import { btnOutline, btnPrimary, Card, Field, inputCls } from "../components/UiKit";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

function newField() {
  return { id: `field_${Date.now()}`, type: "text", label: "New Field", required: false, placeholder: "" };
}

export default function LeadMagnetBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [magnet, setMagnet] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [m, chatbots] = await Promise.all([getLeadMagnet(id), listChatbots()]);
        if (!cancelled) {
          setMagnet(m);
          setBots(chatbots);
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load lead magnet"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateField = (index, patch) => {
    setMagnet((m) => ({
      ...m,
      form_fields: m.form_fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const updated = await updateLeadMagnet(id, {
        name: magnet.name,
        form_fields: magnet.form_fields,
        thank_you_message: magnet.thank_you_message,
        linked_bot_id: magnet.linked_bot_id || null,
      });
      setMagnet(updated);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading…</div>;
  if (!magnet) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600">{error || "Not found"}</p>
        <button className={`${btnOutline} mt-4`} onClick={() => navigate("/lead-magnets")}>Back</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className={btnOutline} onClick={() => navigate("/lead-magnets")}><ArrowLeft size={16} /> Back</button>
          <div>
            <h1 className="text-2xl font-bold">Lead Magnet Builder</h1>
            <p className="text-sm text-slate-500">Configure your public capture form</p>
          </div>
        </div>
        <button className={btnPrimary} onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save"}</button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <div className="space-y-5">
            <Field label="Name">
              <input className={inputCls} value={magnet.name} onChange={(e) => setMagnet({ ...magnet, name: e.target.value })} />
            </Field>
            <Field label="Thank-you message">
              <textarea
                className={`${inputCls} min-h-24`}
                value={magnet.thank_you_message || ""}
                onChange={(e) => setMagnet({ ...magnet, thank_you_message: e.target.value })}
              />
            </Field>
            <Field label="Linked chatbot (optional)">
              <select
                className={inputCls}
                value={magnet.linked_bot_id || ""}
                onChange={(e) => setMagnet({ ...magnet, linked_bot_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">None</option>
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Form fields</h3>
                <button
                  type="button"
                  onClick={() => setMagnet({ ...magnet, form_fields: [...(magnet.form_fields || []), newField()] })}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600"
                >
                  <Plus size={15} /> Add field
                </button>
              </div>
              <div className="space-y-3">
                {(magnet.form_fields || []).map((field, index) => (
                  <div key={field.id || index} className="rounded-xl border border-slate-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Label">
                        <input className={inputCls} value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                      </Field>
                      <Field label="Type">
                        <select className={inputCls} value={field.type} onChange={(e) => updateField(index, { type: e.target.value })}>
                          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </Field>
                      <Field label="Placeholder">
                        <input className={inputCls} value={field.placeholder || ""} onChange={(e) => updateField(index, { placeholder: e.target.value })} />
                      </Field>
                      <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-600">
                        <input type="checkbox" checked={Boolean(field.required)} onChange={(e) => updateField(index, { required: e.target.checked })} />
                        Required
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMagnet({ ...magnet, form_fields: magnet.form_fields.filter((_, i) => i !== index) })}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-rose-500"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-2 font-bold">Public capture page</h3>
            <p className="mb-3 text-xs text-slate-500">Share this link or embed it on your website.</p>
            <code className="block break-all rounded-lg bg-slate-100 p-3 text-xs">{publicCaptureUrl(magnet.public_slug)}</code>
            <button
              type="button"
              className={`${btnOutline} mt-3 w-full`}
              onClick={() => navigator.clipboard?.writeText(publicCaptureUrl(magnet.public_slug))}
            >
              <Copy size={15} /> Copy link
            </button>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-bold">Preview</h3>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="mb-4 text-lg font-semibold">{magnet.name}</p>
              <div className="space-y-3">
                <input className={inputCls} placeholder="Full Name" disabled />
                <input className={inputCls} placeholder="Phone" disabled />
                {(magnet.form_fields || []).map((f) => (
                  <input key={f.id} className={inputCls} placeholder={f.label} disabled />
                ))}
                <button className={`${btnPrimary} w-full`} disabled>Submit</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
