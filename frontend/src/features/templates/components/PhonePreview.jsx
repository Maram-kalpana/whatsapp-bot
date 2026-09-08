import { Camera, MoreHorizontal, Plus } from 'lucide-react'

export default function PhonePreview({ name='', header='', body='', footer='', buttons=[], type='Default', category='Marketing', carouselCards=[] }) {
  const visibleButtons = buttons.filter(b=>b.text).slice(0,3)
  return (
    <div className="sticky top-24 mx-auto w-full max-w-[330px]">
      <div className="rounded-[40px] border-[6px] border-[#e3e4df] bg-[#f7f5ed] px-3 pb-4 pt-3 shadow-[0_16px_40px_rgba(15,23,42,.09)]">
        <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-black"><span>3:56</span><span className="h-[18px] w-[58px] rounded-full bg-black"/><span className="tracking-tight">▮⌁▰</span></div>
        <div className="relative mt-3 min-h-[505px] overflow-hidden rounded-[29px] bg-[#f3efe4] px-3 py-8" style={{backgroundImage:'radial-gradient(#ded9cb 0.7px, transparent 0.7px)',backgroundSize:'10px 10px'}}>
          {type==='Carousel' && carouselCards?.length ? (
            <div className="mt-20 flex gap-2 overflow-hidden">
              {carouselCards.slice(0,2).map((c,i)=><div key={c.id||i} className="min-w-[180px] rounded-xl bg-white p-2 shadow-sm"><div className="h-28 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200"/><p className="mt-2 text-xs font-medium">{c.body || `Carousel card ${i+1}`}</p></div>)}
            </div>
          ) : (
            <div className="mt-10 rounded-[10px] bg-white p-3 shadow-sm">
              {category==='Marketing'&&type==='Catalogue'&&<div className="mb-3 overflow-hidden rounded-md border border-slate-100"><div className="bg-emerald-700 px-3 py-2 text-center text-xs font-semibold text-white">Catalog</div><div className="grid grid-cols-3 gap-1 p-2"><div className="h-12 rounded bg-lime-100"/><div className="h-12 rounded bg-amber-100"/><div className="h-12 rounded bg-green-100"/></div></div>}
              {type==='Flows'&&<div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">Sign up form preview</div>}
              {type==='Order Details'&&<div className="mb-3 rounded-md bg-slate-50 p-3 text-xs"><div className="font-semibold tracking-wide text-slate-500">ORDER #238990321</div><div className="mt-2 flex items-center justify-between"><span>Monthly Membership</span><strong>₹400.00</strong></div></div>}
              <p className="text-[14px] font-semibold text-[#20262b]">{header || name || ' '}</p>
              <p className="mt-2 whitespace-pre-wrap text-[12px] leading-[18px] text-[#2c3338]">{body || ' '}</p>
              {footer&&<p className="mt-2 text-[11px] text-[#7d878d]">{footer}</p>}
              <p className="mt-1 text-right text-[9px] text-[#8b9499]">11:36</p>
              {(visibleButtons.length ? visibleButtons : type==='Flows' ? [{text:'View Flow'},{text:'View Flow'}] : type==='Catalogue' ? [{text:'View catalog'}] : type==='Order Details' ? [{text:'Review and Pay'}] : []).map((b,i)=><div key={i} className="mt-2 border-t border-[#edf0f1] pt-2 text-center text-[12px] font-medium text-[#27a2d7]">{b.text}</div>)}
              {buttons.filter(b=>b.text).length>3&&<div className="mt-2 border-t border-[#edf0f1] pt-2 text-center text-[12px] font-medium text-[#27a2d7]">See all options</div>}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 px-1 text-[#4a555d]"><Plus size={18}/><div className="h-8 flex-1 rounded-full border border-[#dadfe1] bg-white"/><Camera size={16}/><MoreHorizontal size={17}/></div>
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-black"/>
      </div>
    </div>
  )
}
