import { X } from 'lucide-react'

export function PageTitle({title, crumb, action}){
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div><h1 className="text-[24px] font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">WhatsApp <span className="mx-1">•</span> {crumb || title}</p></div>{action}
  </div>
}
export function Card({children,className=''}){return <section className={`rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.04)] ${className}`}>{children}</section>}
export function Modal({open,onClose,title,children,footer,max='max-w-2xl'}){if(!open)return null;return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4" onMouseDown={onClose}><div onMouseDown={e=>e.stopPropagation()} className={`max-h-[92vh] w-full ${max} overflow-hidden rounded-2xl bg-white shadow-2xl`}><div className="flex items-center justify-between border-b px-6 py-5"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></div><div className="soft-scrollbar max-h-[68vh] overflow-y-auto p-6">{children}</div>{footer&&<div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">{footer}</div>}</div></div>}
export function Field({label,children,hint}){return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>{children}{hint&&<span className="mt-1 block text-xs text-slate-400">{hint}</span>}</label>}
export const inputCls='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
export const btnPrimary='inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
export const btnOutline='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
