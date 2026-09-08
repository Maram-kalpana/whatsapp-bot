export default function BrandLogo({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative h-10 w-10 shrink-0">
        <span className={`absolute left-0 top-1 h-3 w-7 rotate-[-30deg] rounded-sm ${light ? "bg-sky-300" : "bg-sky-500"}`} />
        <span className={`absolute left-2 top-3.5 h-3 w-7 rotate-[-30deg] rounded-sm ${light ? "bg-blue-300" : "bg-blue-500"}`} />
        <span className={`absolute left-0 top-6 h-3 w-7 rotate-[-30deg] rounded-sm ${light ? "bg-sky-200" : "bg-sky-400"}`} />
      </div>
      {!compact && (
        <span className={`text-[34px] font-bold tracking-[-1.5px] ${light ? "text-white" : "text-slate-900"}`}>
          heights
        </span>
      )}
    </div>
  );
}
