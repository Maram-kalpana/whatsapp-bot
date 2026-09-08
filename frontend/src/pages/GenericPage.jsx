import { Search, Plus, CalendarDays, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { pageMeta } from '../data/navigation'

const rows = ['Aarav Sharma','Ananya Rao','Revathi B','Sanjana','Tejaswi Kumar']
export default function GenericPage(){
  const {pathname}=useLocation()
  const [title,desc]=pageMeta[pathname]||['Page','Workspace page']
  const isPayments=pathname==='/payments/history'
  const isContacts=pathname==='/contacts'
  const isFlows=pathname==='/flows'
  return <div className="p-4 md:p-6 xl:p-8"><div className="mx-auto max-w-[1400px]">
    <div className="mb-6"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-slate-500">WhatsApp &nbsp;•&nbsp; {title}</p></div>
    {isPayments && <div className="mb-5 grid gap-4 sm:grid-cols-3"><Stat label="Total Payments" value="0"/><Stat label="Successful" value="0"/><Stat label="Pending" value="0"/></div>}
    <section className="min-h-[580px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><label className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={18} className="text-slate-400"/><input className="min-w-0 flex-1" placeholder={`Search ${title.toLowerCase()}...`}/></label><button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Create</button></div>
      {isPayments && <div className="m-5 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500"><CalendarDays size={18}/>Aug 01, 2026 <ChevronRight size={15}/> Aug 29, 2026</div>}
      {isContacts ? <div><div className="grid grid-cols-[1.4fr_1fr_.7fr] bg-slate-50 px-6 py-4 text-sm font-semibold"><span>Name ↑</span><span>Phone</span><span>Status</span></div>{rows.map((r,i)=><div key={r} className="grid grid-cols-[1.4fr_1fr_.7fr] items-center border-t px-6 py-4 text-sm"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-blue-500 text-blue-600">{r[0]}</span>{r}</span><span className="text-slate-500">+91 9{i+1}77 352 132</span><span className="text-emerald-500">Active</span></div>)}</div> : <div className="grid h-[430px] place-items-center text-center"><div><p className="text-lg font-bold text-slate-700">{isFlows?'No Flows Found':`No ${title} data yet`}</p><p className="mt-1 max-w-sm text-sm text-slate-400">{desc}</p></div></div>}
    </section>
  </div></div>
}
function Stat({label,value}){return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div>}
