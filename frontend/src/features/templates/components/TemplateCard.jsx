import { Bell, Image as ImageIcon, Megaphone, MoreVertical, Type } from 'lucide-react'

function QueenPreview({ media }) {
  if (media === 'Text') {
    return (
      <div className="flex h-[172px] items-center justify-center bg-[#fbfcfd]">
        <div className="grid h-20 w-20 place-items-center rounded-2xl border border-slate-200 bg-white text-[#238eea] shadow-sm">
          <Type size={42} strokeWidth={1.8} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[172px] items-center justify-center bg-white px-3 pt-3">
      <div className="w-full border-[3px] border-red-500 px-2 py-5 text-center text-red-600">
        <div className="text-[34px] font-light tracking-[-1.5px] sm:text-[38px]">QUEEN'S</div>
        <div className="mt-1 flex items-center justify-center text-[14px] font-light">
          <span className="h-[2px] flex-1 bg-red-500" />
          <span className="px-2">COLLECTION</span>
          <span className="h-[2px] flex-1 bg-red-500" />
        </div>
      </div>
    </div>
  )
}

export default function TemplateCard({ template }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[10px] border border-[#e6ebef] bg-white shadow-[0_2px_10px_rgba(15,23,42,.03)]">
      <QueenPreview media={template.media} />
      <div className="border-t border-[#eef2f4] px-3 pb-3 pt-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[#eef8ff] px-2 text-xs font-medium text-[#138de5]">
            {template.media === 'Text' ? <Type size={14} /> : <ImageIcon size={14} />}
            {template.media}
          </span>
          <span className={`grid h-7 w-7 place-items-center rounded-md ${template.icon === 'bell' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-amber-50 text-amber-500'}`}>
            {template.icon === 'bell' ? <Bell size={14} /> : <Megaphone size={14} />}
          </span>
          <span className={`ml-auto rounded-md border px-3 py-1 text-xs font-medium capitalize ${
            template.status === 'approved' ? 'border-[#bcecae] bg-[#ebffe6] text-[#56b532]' :
            template.status === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-600' :
            'border-amber-200 bg-amber-50 text-amber-700'
          }`}>{template.status || 'draft'}</span>
        </div>
        <h3 className="mt-3 truncate text-[16px] font-semibold text-[#111827]">{template.name}</h3>
        <p className="mt-2 line-clamp-3 min-h-[62px] text-[13px] leading-[21px] text-[#394553]">{template.body}</p>
        <div className="mt-2 flex justify-end">
          <button type="button" aria-label="Template actions" className="rounded-md p-1 text-slate-400 hover:bg-slate-50"><MoreVertical size={18} /></button>
        </div>
      </div>
    </article>
  )
}
