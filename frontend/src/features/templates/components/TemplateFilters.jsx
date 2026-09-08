import { Filter, Search, X } from 'lucide-react'
import { useState } from 'react'

export default function TemplateFilters({ search, setSearch, filters, setFilters }) {
  const [open, setOpen] = useState(false)
  const hasFilters = filters.category || filters.media
  return (
    <div className="relative flex items-center gap-4">
      <div className="relative w-full max-w-[310px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa6ad]" size={18} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Templates..." className="h-11 w-full rounded-[9px] border border-[#e1e6ea] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#2998e9] focus:ring-2 focus:ring-blue-50" />
      </div>
      <button onClick={()=>setOpen(v=>!v)} className="relative grid h-10 w-10 place-items-center rounded-lg text-[#60717a] hover:bg-slate-50"><Filter size={19}/>{hasFilters && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"/>}</button>
      {open && <div className="absolute left-[320px] top-12 z-30 w-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Filter templates</h3><button onClick={()=>setOpen(false)}><X size={18}/></button></div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
        <select value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="">All categories</option><option>Marketing</option><option>Utility</option><option>Authentication</option></select>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Media</label>
        <select value={filters.media} onChange={e=>setFilters({...filters,media:e.target.value})} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="">All media</option><option>Image</option><option>Text</option></select>
        <div className="mt-4 flex gap-2"><button onClick={()=>setFilters({category:'',media:''})} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-medium">Clear</button><button onClick={()=>setOpen(false)} className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white">Apply</button></div>
      </div>}
    </div>
  )
}
