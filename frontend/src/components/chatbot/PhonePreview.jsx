import { ChevronLeft } from "lucide-react";
import { nodeLabel } from "./chatbotUtils";

export default function PhonePreview({ node }) {
  const type = node?.data?.nodeType;
  const config = node?.data?.config || {};

  return (
    <div className="mx-auto w-[265px] overflow-hidden rounded-[28px] border-[8px] border-slate-700 bg-[#efeae2] shadow-xl">
      <div className="flex h-12 items-center gap-2 bg-[#1e3a5f] px-4 text-xs font-semibold text-white">
        <ChevronLeft size={17} />
        <span>heights Bot</span>
      </div>
      <div className="min-h-[420px] p-3">
        {!node ? (
          <p className="pt-20 text-center text-xs text-slate-500">Select a node to preview</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{nodeLabel(type)}</p>
            <div className="max-w-[92%] rounded-xl rounded-tl-sm bg-white p-3 text-xs text-slate-800 shadow-sm">
              {type === "text" && <p className="whitespace-pre-wrap">{config.text || "Text message"}</p>}
              {(type === "image" || type === "video" || type === "document") && (
                <>
                  <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                    {type.toUpperCase()}
                  </div>
                  <p>{config.caption || "Media caption"}</p>
                </>
              )}
              {(type === "button" || type === "list" || type === "cta_url") && (
                <>
                  {config.header && <p className="mb-1 font-bold">{config.header}</p>}
                  <p className="whitespace-pre-wrap">{config.body || "Interactive message"}</p>
                  {config.footer && <p className="mt-2 text-[10px] text-slate-400">{config.footer}</p>}
                  {type === "button" &&
                    (config.buttons || []).map((b) => (
                      <button key={b.id} type="button" className="mt-2 block w-full rounded-md border border-slate-200 py-1.5 text-[11px] font-semibold text-blue-600">
                        {b.title}
                      </button>
                    ))}
                  {type === "list" && (
                    <button type="button" className="mt-2 block w-full rounded-md border border-slate-200 py-1.5 text-[11px] font-semibold text-blue-600">
                      {config.button_text || "View options"}
                    </button>
                  )}
                  {type === "cta_url" && (
                    <button type="button" className="mt-2 block w-full rounded-md bg-blue-50 py-1.5 text-[11px] font-semibold text-blue-600">
                      {config.display_text || "Visit"}
                    </button>
                  )}
                </>
              )}
              {type === "template" && <p>Template: {config.template_name || "—"}</p>}
              {type === "flow" && (
                <>
                  <p>{config.body || config.text || "Tap below to open the form"}</p>
                  <button type="button" className="mt-2 block w-full rounded-md bg-[#24aa82] py-1.5 text-[11px] font-semibold text-white">
                    {config.cta || config.button_text || "Open"}
                  </button>
                </>
              )}
              {type === "catalogue" && <p>{config.text || `Catalogue ${config.catalogue_id || ""}`}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
