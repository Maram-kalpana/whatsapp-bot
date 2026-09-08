import { useMemo, useState } from 'react'
import { ChevronLeft, Search, UserRound, CircleDot, Tag, MailPlus, X, Check, Image, MapPin, Smile, Paperclip, MessageCircleMore } from 'lucide-react'

const conversations = [
  {initial:'V',name:'Vidya',msg:'Plot No.45 G V Colo...',time:'22 hrs',count:15,color:'bg-red-500'},
  {initial:'T',name:'Tejaswi Phani Kumar🧑',msg:'Do you have night dre...',time:'1 d',count:1,color:'bg-orange-500'},
  {initial:'V',name:'Vysali Anagha Agasthya',msg:'📷 Image',time:'1 d',count:3,color:'bg-fuchsia-600'},
  {initial:'B',name:'bhagavatgeeta Bendalam',msg:'New message',time:'1 d',count:4,color:'bg-fuchsia-600'},
  {initial:'',name:'Hii',msg:'Hii',time:'1 d',count:1,color:'bg-blue-500'},
  {initial:'R',name:'Revathi B',msg:'📍 Location',time:'1 d',count:1,color:'bg-orange-500'},
  {initial:'V',name:'Vasudha',msg:'New message',time:'1 d',count:2,color:'bg-pink-600'},
  {initial:'N',name:'Nidhi',msg:'📷 Image',time:'2 d',count:2,color:'bg-red-800'},
]

function Popover({type,onClose}) {
  const [query,setQuery]=useState('')
  const title = type==='agent'?'Select Agents':type==='status'?'Select Status':'Select Tags'
  return <div className="absolute left-[110px] top-[62px] z-30 w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/60">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><button onClick={onClose} className="text-slate-400"><X size={16}/></button></div>
    {type!=='status' && <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-500"><Search size={17} className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm" placeholder={type==='agent'?'Search agents...':'Search tags...'}/></label>}
    <div className="mt-3 min-h-[170px]">
      {type==='agent' && <label className="flex items-center gap-3 rounded-xl bg-blue-50 p-3"><input type="checkbox" defaultChecked className="accent-blue-600"/><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 font-bold text-white">Q</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">Queens Collection</span><span className="block truncate text-xs text-slate-400">queenscollection...</span></span><span className="rounded-full bg-lime-400 px-2 py-1 text-[10px]">online</span></label>}
      {type==='status' && <div className="space-y-3 pt-1">{['Open','Closed','Pending','Archived'].map(s=><label key={s} className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-blue-600"/>{s}</label>)}</div>}
      {type==='tag' && <p className="pt-8 text-center text-sm text-slate-500">No tags available</p>}
    </div>
    <div className="grid grid-cols-2 gap-2"><button onClick={onClose} className="rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white">Apply</button><button onClick={onClose} className="rounded-lg border border-blue-300 py-2 text-sm font-semibold text-blue-600">Clear</button></div>
  </div>
}

export default function InboxPage(){
  const [searchOpen,setSearchOpen]=useState(false)
  const [search,setSearch]=useState('')
  const [popover,setPopover]=useState(null)
  const [collapsedList,setCollapsedList]=useState(false)
  const [active,setActive]=useState(null)
  const filtered=useMemo(()=>conversations.filter(c=>(c.name+c.msg).toLowerCase().includes(search.toLowerCase())),[search])
  return <div className="p-4 md:p-6 xl:p-8">
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Inbox</h1><p className="mt-2 text-sm text-slate-500"><span className="font-medium text-slate-700">WhatsApp</span> &nbsp;•&nbsp; Inbox</p></div><button className="flex items-center gap-2 rounded-full bg-[#0795eb] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100"><MailPlus size={17}/>Create WhatsApp Inbox</button></div>
      <div className="flex min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <section className={`relative shrink-0 border-r border-slate-200 transition-all duration-300 ${collapsedList?'w-[86px]':'w-full sm:w-[380px]'} ${active && !collapsedList?'hidden sm:block':''}`}>
          <div className={`flex h-[72px] items-center gap-5 border-b border-slate-100 ${collapsedList?'justify-center px-2':'px-6'}`}>
            <button onClick={()=>setCollapsedList(v=>!v)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><ChevronLeft size={21} className={`transition ${collapsedList?'rotate-180':''}`}/></button>
            {!collapsedList && <>
              <button onClick={()=>setSearchOpen(v=>!v)} className={`grid h-9 w-9 place-items-center rounded-full ${searchOpen?'bg-blue-50 text-blue-600':'text-slate-400 hover:bg-slate-100'}`}><Search size={20}/></button>
              <button onClick={()=>setPopover(popover==='agent'?null:'agent')} className="relative grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"><UserRound size={20}/><span className="absolute -right-1 top-0 rounded-full bg-blue-600 px-1.5 text-[10px] text-white">1</span></button>
              <button onClick={()=>setPopover(popover==='status'?null:'status')} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"><CircleDot size={20}/></button>
              <button onClick={()=>setPopover(popover==='tag'?null:'tag')} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"><Tag size={20}/></button>
            </>}
          </div>
          {!collapsedList && searchOpen && <div className="px-5 py-3"><label className="flex h-11 items-center gap-2 rounded-xl border-2 border-blue-500 px-3"><Search size={17} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} autoFocus className="min-w-0 flex-1 text-sm" placeholder="Search conversations..."/></label></div>}
          {!collapsedList && popover && <Popover type={popover} onClose={()=>setPopover(null)}/>} 
          {!collapsedList && popover==='agent' && <div className="mx-5 my-2 inline-flex items-center gap-1 rounded-full border border-blue-500 px-2 py-1 text-xs text-blue-600">Queens Collection <X size={12}/></div>}
          <div className="soft-scrollbar h-[600px] overflow-y-auto py-2">
            {filtered.map((c,i)=><button key={i} onClick={()=>setActive(c)} className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 ${active===c?'bg-blue-50/70':''} ${collapsedList?'justify-center px-2':''}`}>
              <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl text-white ${c.color}`}>{c.initial}<span className={`absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold ${collapsedList?'block':'hidden'}`}>{c.count}</span></span>
              {!collapsedList && <><span className="min-w-0 flex-1"><span className="block truncate text-[11px] text-slate-400">♟ Queens Collection</span><span className="block truncate text-sm font-semibold">{c.name}</span><span className="block truncate text-sm font-medium">↓ {c.msg}</span></span><span className="self-start text-right"><span className="block text-[11px] text-slate-400">{c.time}</span><span className="mt-3 inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#1495e7] px-1 text-[10px] text-white">{c.count}</span></span></>}
            </button>)}
          </div>
        </section>
        <section className={`relative min-w-0 flex-1 bg-white ${!active?'hidden sm:block':''}`}>
          {active ? <><div className="flex h-[86px] items-center gap-3 border-b border-slate-200 px-5"><button onClick={()=>setActive(null)} className="sm:hidden"><ChevronLeft/></button><span className={`grid h-12 w-12 place-items-center rounded-full text-white ${active.color}`}>{active.initial}</span><div><h3 className="font-semibold">{active.name}</h3><p className="text-xs text-emerald-500">online</p></div></div><div className="grid h-[515px] place-items-center text-sm text-slate-400">Conversation preview</div><div className="absolute inset-x-0 bottom-0 flex h-16 items-center gap-3 border-t bg-white px-4"><Smile className="text-slate-400"/><input className="h-10 min-w-0 flex-1 rounded-xl bg-slate-50 px-4" placeholder="Type a message"/><Image className="text-slate-400"/><Paperclip className="text-slate-400"/><MessageCircleMore className="text-slate-400"/></div></> : <div className="grid h-full place-items-center text-sm text-slate-500">No messages yet</div>}
        </section>
      </div>
    </div>
  </div>
}
