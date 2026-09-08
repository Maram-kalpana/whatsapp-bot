import { Handle, Position } from "reactflow";
import { branchHandles, nodeLabel } from "./chatbotUtils";

export default function ChatbotFlowNode({ data, selected }) {
  const handles = branchHandles(data.nodeType, data.config);
  const isBranching = data.nodeType === "button" || data.nodeType === "list";

  return (
    <div
      className={`min-w-[210px] rounded-xl border bg-white shadow-md transition ${
        selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-400" />
      <div className="border-b px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{nodeLabel(data.nodeType)}</p>
        <p className="truncate text-sm font-semibold text-slate-800">
          {data.config?.body || data.config?.text || data.config?.template_name || "Configure node"}
        </p>
      </div>
      {isBranching ? (
        <div className="space-y-1 px-3 py-2">
          {handles.map((handleId, index) => {
            const btn = (data.config?.buttons || []).find((b) => String(b.id) === handleId);
            const row = (data.config?.sections || [])
              .flatMap((s) => s.rows || [])
              .find((r) => String(r.id) === handleId);
            const label = btn?.title || row?.title || handleId;
            return (
              <div key={handleId} className="relative flex items-center justify-end rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
                <span className="truncate pr-3">{label}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handleId}
                  style={{ top: `${((index + 1) / (handles.length + 1)) * 100}%` }}
                  className="!h-2.5 !w-2.5 !bg-blue-500"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} id="default" className="!h-3 !w-3 !bg-blue-500" />
      )}
    </div>
  );
}
