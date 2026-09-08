import { Bot, CheckCircle2, ChevronDown, ContactRound, MessageCircleMore, Store, UsersRound } from 'lucide-react'
import { useState } from 'react'

const modules = [
  ['WhatsApp', '12 sections', MessageCircleMore],
  ['Chat App', '2 sections', Bot],
  ['Contacts', '3 sections', ContactRound],
  ['Google My Business', '7 sections', Store],
  ['Social Media Planner', '6 sections', MessageCircleMore],
  ['CRM', '1 section', UsersRound],
]

export default function ModuleSwitcher({ collapsed }) {
  const [open, setOpen] = useState(false)
  if (collapsed) return <button onClick={() => setOpen(!open)} className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-sky-300"><MessageCircleMore size={22}/></button>
  return (
    <div className="relative px-3">
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-sky-300 shadow"><MessageCircleMore size={24}/></span>
        <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Module</span><span className="block text-[16px] font-semibold text-white">WhatsApp</span></span>
        <ChevronDown size={18} className={`text-sky-300 transition ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="absolute left-5 right-[-55px] top-[86px] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/50">
          <p className="px-2 pb-3 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Switch Module</p>
          <div className="space-y-1">
            {modules.map(([name, sections, Icon], i) => (
              <button key={name} onClick={() => i === 0 && setOpen(false)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === 0 ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${i === 0 ? 'bg-[#1e3a5f] text-white' : 'bg-slate-100 text-slate-500'}`}><Icon size={18}/></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span><span className="text-xs text-slate-400">{sections}</span></span>
                {i === 0 && <CheckCircle2 className="text-[#1e3a5f]" size={18}/>} 
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
