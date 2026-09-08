import { Building2, CheckCircle2, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../hooks/useBusiness";
import { assetUrl } from "../api/client";

export default function Header({ collapsed, onMobileMenu }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { businesses, activeBusiness, activeBusinessId, setActiveBusinessId } = useBusiness();

  useEffect(() => {
    const fn = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <header className={`fixed left-0 right-0 top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur transition-all ${collapsed ? "md:left-[84px]" : "md:left-[292px]"}`}>
      <div className="flex h-full items-center justify-between gap-3 px-4 md:justify-end md:px-7">
        <button onClick={onMobileMenu} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 md:hidden">☰</button>
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((v) => !v)} className="flex h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
            {activeBusiness?.logo_url
              ? <img src={assetUrl(activeBusiness.logo_url)} alt="" className="h-8 w-8 rounded-lg object-cover" />
              : <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100"><Building2 size={18} /></span>}
            <span className="hidden max-w-[180px] truncate sm:block">{activeBusiness?.name || "Select business"}</span>
            <ChevronDown size={16} className="hidden sm:block" />
          </button>
          {open && (
            <div className="absolute right-0 top-14 w-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
              <div className="border-b border-slate-100 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Switch Organization</div>
              <div className="max-h-64 overflow-y-auto">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-slate-50 ${b.id === activeBusinessId ? "font-semibold text-blue-600" : "text-slate-700"}`}
                    onClick={() => {
                      setActiveBusinessId(b.id);
                      setOpen(false);
                    }}
                  >
                    {b.logo_url
                      ? <img src={assetUrl(b.logo_url)} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      : <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100"><Building2 size={16} /></span>}
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                    {b.id === activeBusinessId && <CheckCircle2 size={18} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              <button
                className="flex w-full items-center gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-blue-600 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  navigate("/onboarding?new=1");
                }}
              >
                <Plus size={18} /> Create organization
              </button>
            </div>
          )}
        </div>
        <button className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><Search size={20} /></button>
      </div>
    </header>
  );
}
