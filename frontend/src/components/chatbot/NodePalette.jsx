import { NODE_PALETTE } from "./chatbotUtils";

export default function NodePalette() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="border-r border-slate-200 bg-white p-3">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Nodes</p>
      <div className="grid grid-cols-2 gap-2">
        {NODE_PALETTE.map(({ type, label }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex min-h-16 cursor-grab flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:cursor-grabbing"
          >
            <span className="text-center">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
