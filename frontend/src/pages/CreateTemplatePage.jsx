import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTemplate } from "../api/templates";
import { apiErrorMessage } from "../api/client";
import TemplateSetupStep from "../features/templates/components/TemplateSetupStep";
import TemplateEditorStep from "../features/templates/components/TemplateEditorStep";

const initialForm = {
  name: "",
  language: "English",
  headerType: "Text",
  header: "",
  body: "",
  footer: "",
  buttons: [],
  linkedProductIds: [],
};

const typeMap = {
  Default: "default",
  Catalogue: "catalogue",
  Flows: "flow",
  "Order Details": "order_details",
  Carousel: "carousel",
};

const langMap = {
  English: "en_US",
  Hindi: "hi",
  Spanish: "es",
};

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Marketing");
  const [type, setType] = useState("Default");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError("");
      const result = await createTemplate({
        name: form.name || "Untitled Template",
        category: category.toLowerCase(),
        type: typeMap[type] || "default",
        language: langMap[form.language] || "en_US",
        header_type: (form.headerType || "None").toLowerCase(),
        header_content: form.header || null,
        body: form.body || `${type} WhatsApp message template`,
        footer: form.footer || null,
        buttons: form.buttons.map((b) => ({
          type: b.type,
          text: b.text,
          url: b.url,
          phone: b.phone,
        })),
        linked_product_ids: form.linkedProductIds || [],
      });
      if (result.warning) {
        console.warn("Template saved as draft:", result.warning);
      }
      navigate("/templates");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create template"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-7 sm:px-7 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827]">Create Template</h1>
          <p className="mt-2 text-[14px] text-[#8a979f]">
            <button onClick={() => navigate("/")} className="text-[#27313a]">
              WhatsApp
            </button>
            <span className="px-2">•</span>
            <button onClick={() => navigate("/templates")} className="text-[#27313a]">
              Templates
            </button>
            <span className="px-2">•</span>
            Create Template
          </p>
        </div>
        {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
        {step === 1 ? (
          <TemplateSetupStep
            category={category}
            setCategory={setCategory}
            type={type}
            setType={setType}
            onCancel={() => navigate("/templates")}
            onContinue={() => setStep(2)}
          />
        ) : (
          <TemplateEditorStep
            form={form}
            setForm={setForm}
            category={category}
            type={type}
            onBack={() => setStep(1)}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
