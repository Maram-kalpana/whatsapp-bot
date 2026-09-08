import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicLeadForm, submitPublicLeadForm } from "../api/leadMagnets";
import { apiErrorMessage } from "../api/client";
import BrandLogo from "../components/BrandLogo";
import { btnPrimary, inputCls } from "../components/UiKit";

export default function PublicLeadCapturePage() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [values, setValues] = useState({ name: "", phone: "", email: "", fields: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicLeadForm(slug);
        if (!cancelled) setForm(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Form not found"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const setField = (key, value) => {
    setValues((v) => ({ ...v, fields: { ...v.fields, [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      const result = await submitPublicLeadForm(slug, values);
      setDone(result);
    } catch (err) {
      setError(apiErrorMessage(err, "Submission failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] text-sm text-slate-500">
        Loading form…
      </div>
    );
  }

  if (!form) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-6 text-center">
        <p className="text-rose-600">{error || "Form not found"}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
          <BrandLogo />
          <p className="mt-6 text-lg font-semibold text-slate-800">{done.thank_you_message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center"><BrandLogo /></div>
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-lg">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">{form.name}</h1>
          <p className="mb-6 text-sm text-slate-500">Fill in your details below.</p>

          {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Full Name *</span>
              <input
                required
                className={inputCls}
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Phone *</span>
              <input
                required
                className={inputCls}
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                className={inputCls}
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </label>

            {(form.form_fields || []).map((field) => (
              <label key={field.id} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}{field.required ? " *" : ""}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    className={`${inputCls} min-h-24`}
                    placeholder={field.placeholder || ""}
                    value={values.fields[field.id] || ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <select
                    required={field.required}
                    className={inputCls}
                    value={values.fields[field.id] || ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(field.options || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(values.fields[field.id])}
                      onChange={(e) => setField(field.id, e.target.checked)}
                    />
                    {field.placeholder || field.label}
                  </label>
                ) : (
                  <input
                    required={field.required}
                    type={field.type === "email" ? "email" : "text"}
                    className={inputCls}
                    placeholder={field.placeholder || ""}
                    value={values.fields[field.id] || ""}
                    onChange={(e) => setField(field.id, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>

          <button type="submit" disabled={submitting} className={`${btnPrimary} mt-6 w-full`}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
