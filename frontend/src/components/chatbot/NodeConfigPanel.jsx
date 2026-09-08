import { useEffect, useState } from "react";
import { Field, inputCls } from "../UiKit";
import { nodeLabel } from "./chatbotUtils";
import { listPublishedFlows } from "../../api/flows";

function ButtonEditor({ config, onChange }) {
  const buttons = config.buttons || [];
  const updateButton = (index, patch) => {
    const next = buttons.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange({ buttons: next });
  };
  const addButton = () => {
    if (buttons.length >= 3) return;
    onChange({ buttons: [...buttons, { id: `btn_${Date.now()}`, title: `Option ${buttons.length + 1}` }] });
  };
  const removeButton = (index) => onChange({ buttons: buttons.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      {buttons.map((btn, index) => (
        <div key={btn.id || index} className="rounded-xl border border-slate-200 p-3">
          <Field label={`Button ${index + 1}`}>
            <input
              className={inputCls}
              value={btn.title || ""}
              onChange={(e) => updateButton(index, { title: e.target.value })}
              placeholder="Button label"
            />
          </Field>
          <p className="mt-1 text-[10px] text-slate-400">Handle ID: {btn.id}</p>
          {buttons.length > 1 && (
            <button type="button" onClick={() => removeButton(index)} className="mt-2 text-xs text-rose-500">
              Remove
            </button>
          )}
        </div>
      ))}
      {buttons.length < 3 && (
        <button type="button" onClick={addButton} className="text-sm font-medium text-blue-600">
          + Add button
        </button>
      )}
    </div>
  );
}

function ListEditor({ config, onChange }) {
  const section = (config.sections || [])[0] || { title: "Options", rows: [] };
  const rows = section.rows || [];
  const updateRows = (nextRows) =>
    onChange({ sections: [{ ...section, rows: nextRows }] });

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.id || index} className="rounded-xl border border-slate-200 p-3">
          <Field label={`Row ${index + 1}`}>
            <input
              className={inputCls}
              value={row.title || ""}
              onChange={(e) =>
                updateRows(rows.map((r, i) => (i === index ? { ...r, title: e.target.value } : r)))
              }
            />
          </Field>
          <Field label="Description">
            <input
              className={inputCls}
              value={row.description || ""}
              onChange={(e) =>
                updateRows(rows.map((r, i) => (i === index ? { ...r, description: e.target.value } : r)))
              }
            />
          </Field>
          <p className="text-[10px] text-slate-400">Handle ID: {row.id}</p>
        </div>
      ))}
      <button
        type="button"
        onClick={() => updateRows([...rows, { id: `row_${Date.now()}`, title: `Option ${rows.length + 1}`, description: "" }])}
        className="text-sm font-medium text-blue-600"
      >
        + Add row
      </button>
    </div>
  );
}

export default function NodeConfigPanel({ node, onChange }) {
  const [publishedFlows, setPublishedFlows] = useState([]);

  useEffect(() => {
    if (node?.data?.nodeType === "flow") {
      listPublishedFlows().then(setPublishedFlows).catch(() => setPublishedFlows([]));
    }
  }, [node?.data?.nodeType]);

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">
        Select a node to configure
      </div>
    );
  }

  const { nodeType, config } = node.data;
  const patch = (updates) => onChange({ ...config, ...updates });

  return (
    <div className="soft-scrollbar h-full overflow-y-auto p-4">
      <h3 className="mb-4 text-sm font-bold text-slate-800">{nodeLabel(nodeType)} settings</h3>
      <div className="space-y-4">
        {(nodeType === "text" || nodeType === "flow" || nodeType === "catalogue") && (
          <Field label="Message text">
            <textarea
              className={`${inputCls} min-h-28`}
              value={config.text || ""}
              onChange={(e) => patch({ text: e.target.value })}
            />
          </Field>
        )}

        {(nodeType === "image" || nodeType === "video" || nodeType === "document") && (
          <>
            <Field label="Media URL">
              <input className={inputCls} value={config.url || ""} onChange={(e) => patch({ url: e.target.value })} />
            </Field>
            <Field label="Caption">
              <textarea className={inputCls} value={config.caption || ""} onChange={(e) => patch({ caption: e.target.value })} />
            </Field>
          </>
        )}

        {(nodeType === "button" || nodeType === "list" || nodeType === "cta_url") && (
          <>
            <Field label="Body">
              <textarea className={inputCls} value={config.body || ""} onChange={(e) => patch({ body: e.target.value })} />
            </Field>
            <Field label="Header">
              <input className={inputCls} value={config.header || ""} onChange={(e) => patch({ header: e.target.value })} />
            </Field>
            <Field label="Footer">
              <input className={inputCls} value={config.footer || ""} onChange={(e) => patch({ footer: e.target.value })} />
            </Field>
          </>
        )}

        {nodeType === "button" && <ButtonEditor config={config} onChange={patch} />}

        {nodeType === "list" && (
          <>
            <Field label="List button text">
              <input
                className={inputCls}
                value={config.button_text || ""}
                onChange={(e) => patch({ button_text: e.target.value })}
              />
            </Field>
            <ListEditor config={config} onChange={patch} />
          </>
        )}

        {nodeType === "template" && (
          <>
            <Field label="Template name">
              <input
                className={inputCls}
                value={config.template_name || ""}
                onChange={(e) => patch({ template_name: e.target.value })}
              />
            </Field>
            <Field label="Language">
              <input className={inputCls} value={config.language || "en_US"} onChange={(e) => patch({ language: e.target.value })} />
            </Field>
          </>
        )}

        {nodeType === "flow" && (
          <>
            <Field label="Published WhatsApp Flow">
              <select
                className={inputCls}
                value={config.flow_id || ""}
                onChange={(e) => {
                  const selected = publishedFlows.find((f) => String(f.id) === e.target.value);
                  patch({
                    flow_id: e.target.value ? Number(e.target.value) : null,
                    whatsapp_flow_id: e.target.value ? Number(e.target.value) : null,
                    meta_flow_id: selected?.meta_flow_id || null,
                  });
                }}
              >
                <option value="">Select a published flow…</option>
                {publishedFlows.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.meta_flow_id || "no meta id"})</option>
                ))}
              </select>
            </Field>
            <Field label="Message body">
              <textarea className={`${inputCls} min-h-20`} value={config.body || config.text || ""} onChange={(e) => patch({ body: e.target.value, text: e.target.value })} />
            </Field>
            <Field label="CTA button text">
              <input className={inputCls} value={config.cta || config.button_text || "Open"} onChange={(e) => patch({ cta: e.target.value, button_text: e.target.value })} />
            </Field>
            <Field label="Header">
              <input className={inputCls} value={config.header || ""} onChange={(e) => patch({ header: e.target.value })} />
            </Field>
            <Field label="Footer">
              <input className={inputCls} value={config.footer || ""} onChange={(e) => patch({ footer: e.target.value })} />
            </Field>
          </>
        )}

        {nodeType === "cta_url" && (
          <>
            <Field label="Button text">
              <input
                className={inputCls}
                value={config.display_text || ""}
                onChange={(e) => patch({ display_text: e.target.value })}
              />
            </Field>
            <Field label="URL">
              <input className={inputCls} value={config.url || ""} onChange={(e) => patch({ url: e.target.value })} />
            </Field>
          </>
        )}

        {nodeType === "catalogue" && (
          <Field label="Catalogue ID">
            <input
              className={inputCls}
              value={config.catalogue_id || ""}
              onChange={(e) => patch({ catalogue_id: e.target.value })}
            />
          </Field>
        )}
      </div>
    </div>
  );
}
