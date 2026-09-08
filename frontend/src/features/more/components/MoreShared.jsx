import { ChevronDown, Search } from 'lucide-react'
import { inputCls } from '../../../components/UiKit'

export function SearchBox({ value, onChange, placeholder = 'Search...' , className='' }) {
  return <div className={`relative ${className}`}><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-10`} /></div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="grid min-h-[440px] place-items-center px-5 py-12 text-center"><div><div className="mx-auto grid h-36 w-44 place-items-center rounded-[44px] bg-slate-50"><Icon size={64} strokeWidth={1.2} className="text-slate-300" /></div><h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>{description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}{action && <div className="mt-5">{action}</div>}</div></div>
}

export function Segmented({ options, value, onChange }) {
  return <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">{options.map((x) => <button key={x} onClick={() => onChange(x)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${value === x ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{x}</button>)}</div>
}

export function SelectLike({ children, className='' }) { return <button className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 ${className}`}>{children}<ChevronDown size={16} className="text-slate-400" /></button> }
