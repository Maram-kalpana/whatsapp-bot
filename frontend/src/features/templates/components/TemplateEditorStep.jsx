import { Bold, Code2, GripVertical, Italic, Plus, Strikethrough, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listSyncedProducts } from '../../../api/catalog'
import { languages } from '../data/templateData'
import PhonePreview from './PhonePreview'

const uid=()=>globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
const makeButton=(type='Custom')=>({id:uid(),type,text:type==='Visit Website'?'Visit Website':type==='Call Phone Number'?'Call now':type==='Complete Flow'?'View Flow':'',url:'',phone:'',flow:'Promotion'})
const makeCard=()=>({id:uid(),body:'',mediaName:'',buttons:[makeButton('Visit Website')]})

export default function TemplateEditorStep({ form, setForm, category, type, onBack, onSubmit, submitting=false }) {
  const [languageOpen,setLanguageOpen]=useState(false)
  const [buttonMenu,setButtonMenu]=useState(false)
  const [cards,setCards]=useState(type==='Carousel'?[makeCard(),makeCard(),makeCard()]:[])
  const [activeCard,setActiveCard]=useState(0)
  const [syncedProducts,setSyncedProducts]=useState([])
  useEffect(()=>{ if(type==='Catalogue') listSyncedProducts().then(setSyncedProducts).catch(()=>setSyncedProducts([])) },[type])
  const linkedIds=form.linkedProductIds||[]
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  const canSubmit=useMemo(()=>form.name.trim() && (form.body.trim() || type==='Carousel'),[form.name,form.body,type])

  const addButton=(kind='Custom')=>{ if(form.buttons.length>=10) return; update('buttons',[...form.buttons,makeButton(kind)]); setButtonMenu(false) }
  const updateButton=(id,key,value)=>update('buttons',form.buttons.map(b=>b.id===id?{...b,[key]:value}:b))
  const removeButton=id=>update('buttons',form.buttons.filter(b=>b.id!==id))

  const currentCard=cards[activeCard]
  const updateCard=(key,value)=>setCards(prev=>prev.map((c,i)=>i===activeCard?{...c,[key]:value}:c))
  const addCard=()=>{if(cards.length<10){setCards([...cards,makeCard()]);setActiveCard(cards.length)}}
  const removeCard=index=>{if(cards.length<=1)return; const next=cards.filter((_,i)=>i!==index);setCards(next);setActiveCard(Math.max(0,Math.min(activeCard,next.length-1)))}

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="space-y-5">
        <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
          <h2 className="text-[19px] font-semibold text-[#1c252c]">Template Name and Language</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
            <label><span className="mb-2 block text-[14px] font-medium text-[#27323a]">Name your template</span><div className="relative"><input maxLength={512} value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Name your message template" className="h-11 w-full rounded-[8px] border border-[#dce3e7] px-4 pr-16 text-sm outline-none focus:border-[#208fe4] focus:ring-2 focus:ring-blue-50"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6f7c84]">{form.name.length}/512</span></div></label>
            <div className="relative"><span className="mb-2 block text-[14px] font-medium text-[#27323a]">Select language</span><button onClick={()=>setLanguageOpen(v=>!v)} className="flex h-11 w-full items-center justify-between rounded-[8px] border border-[#dce3e7] bg-white px-4 text-sm outline-none focus:border-blue-400"><span>{form.language}</span><span>⌄</span></button>{languageOpen&&<div className="absolute z-40 mt-1 max-h-[310px] w-full overflow-auto rounded-[8px] border border-[#dce3e7] bg-white py-1 shadow-xl">{languages.map(lang=><button key={lang} onClick={()=>{update('language',lang);setLanguageOpen(false)}} className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-[#f3f6f7] ${form.language===lang?'font-semibold text-[#176fca]':''}`}>{lang}</button>)}</div>}</div>
          </div>
        </section>

        {type!=='Carousel' && <>
          <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2"><h2 className="text-[19px] font-semibold">Header</h2><span className="rounded-full bg-[#eef8fb] px-2 py-0.5 text-xs font-medium">Optional</span></div>
            <p className="mt-1 text-[13px] text-[#5e6b73]">Add a title or choose which type of media you'll use for this header.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]"><select value={form.headerType} onChange={e=>update('headerType',e.target.value)} className="h-11 rounded-[8px] border border-[#dce3e7] bg-white px-3 text-sm"><option>Text</option><option>Image</option><option>Video</option><option>Document</option><option>None</option></select>{form.headerType==='Text'?<div className="relative"><input maxLength={60} value={form.header} onChange={e=>update('header',e.target.value)} placeholder="Enter header text" className="h-11 w-full rounded-[8px] border border-[#dce3e7] px-4 pr-14 text-sm outline-none focus:border-[#208fe4]"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#77838a]">{form.header.length}/60</span></div>:form.headerType!=='None'?<label className="flex h-11 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-[#a9d7f3] bg-[#f1f9ff] text-sm font-semibold text-[#1389de]"><input type="file" className="hidden" onChange={e=>update('header',e.target.files?.[0]?.name||'')}/><Plus size={16} className="mr-2"/>Upload {form.headerType}</label>:<div/>}</div>
            <div className="mt-2 text-right"><button onClick={()=>update('header',`${form.header} {{1}}`.trim())} className="text-[13px] font-semibold text-[#176fc8]">＋ Add Variable</button></div>
          </section>

          <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
            <h2 className="text-[19px] font-semibold">Body</h2>
            <div className="relative mt-3"><textarea maxLength={1024} rows={7} value={form.body} onChange={e=>update('body',e.target.value)} placeholder="Enter the text for your message in the language that you've selected." className="w-full resize-none rounded-[8px] border border-[#dce3e7] p-4 text-sm leading-6 outline-none focus:border-[#208fe4] focus:ring-2 focus:ring-blue-50"/></div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-[#56646d]">Characters: {form.body.length}/1024</span><div className="flex items-center gap-1 text-[#126fc8]"><button onClick={()=>update('body',form.body+' *bold*')} className="p-2"><Bold size={18}/></button><button onClick={()=>update('body',form.body+' _italic_')} className="p-2"><Italic size={18}/></button><button onClick={()=>update('body',form.body+' ~strike~')} className="p-2"><Strikethrough size={18}/></button><button onClick={()=>update('body',form.body+' ```code```')} className="p-2"><Code2 size={18}/></button><button onClick={()=>update('body',`${form.body} {{1}}`.trim())} className="inline-flex items-center gap-1 p-2 text-[13px] font-semibold"><Plus size={17}/>Add Variable</button></div></div>
          </section>

          {type==='Catalogue' && (
            <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
              <h2 className="text-[19px] font-semibold">Catalog Products</h2>
              <p className="mt-1 text-[13px] text-[#5e6b73]">Select synced products to reference in this catalogue template.</p>
              {syncedProducts.length ? (
                <div className="mt-4 space-y-2">
                  {syncedProducts.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#dce3e7] px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={linkedIds.includes(p.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...linkedIds, p.id]
                            : linkedIds.filter((id) => id !== p.id)
                          update('linkedProductIds', next)
                        }}
                      />
                      <span className="text-sm"><b>{p.name}</b> · ₹{p.price}{p.sku ? ` · ${p.sku}` : ''}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-700">No synced products yet. Add products in Catalog Management and sync to Meta first.</p>
              )}
            </section>
          )}

          <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><h2 className="text-[19px] font-semibold">Footer</h2><span className="rounded-full bg-[#eef8fb] px-2 py-0.5 text-xs font-medium">Optional</span></div><div className="relative mt-4"><input maxLength={60} value={form.footer} onChange={e=>update('footer',e.target.value)} placeholder="Add a short line of text to the bottom of your message template." className="h-11 w-full rounded-[8px] border border-[#dce3e7] px-4 pr-14 text-sm outline-none focus:border-[#208fe4]"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#77838a]">{form.footer.length}/60</span></div></section>

          {type!=='Catalogue' && (
          <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2"><h2 className="text-[19px] font-semibold">Buttons</h2><span className="rounded-full bg-[#eef8fb] px-2 py-0.5 text-xs font-medium">Optional</span></div>
            <p className="mt-1 max-w-4xl text-[13px] leading-5 text-[#5e6b73]">Create buttons that let customers respond to your message or take action. you can add up to ten buttons. if you add more then three buttons, they they will appear in a list.</p>
            <div className="relative mt-4 inline-block"><button disabled={form.buttons.length>=10} onClick={()=>setButtonMenu(v=>!v)} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#216ed4] px-5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={18}/>Add a button</button>{buttonMenu&&<div className="absolute left-0 top-11 z-40 w-[240px] rounded-[9px] border border-[#dfe4e7] bg-white py-1 shadow-xl">{['Custom','Visit Website','Call Phone Number','Complete Flow'].map(kind=><button key={kind} onClick={()=>addButton(kind)} className="block w-full px-4 py-3 text-left text-sm hover:bg-[#f3f6f7]">{kind}</button>)}</div>}</div>
            {!!form.buttons.length && <div className="mt-5 rounded-xl border border-[#aeb8be] p-4"><h3 className="mb-3 flex items-center gap-2 text-[16px] font-semibold"><span className="text-[#2275ce]">↕</span>Call to action</h3><div className="space-y-3">{form.buttons.map(button=><div key={button.id} className="grid items-center gap-3 rounded-xl border border-[#dfe4e7] bg-white p-3 shadow-sm lg:grid-cols-[20px_170px_minmax(0,1fr)_auto]"><GripVertical size={18} className="text-[#6d7980]"/><select value={button.type} onChange={e=>updateButton(button.id,'type',e.target.value)} className="h-10 rounded-[8px] border border-[#dce3e7] px-3 text-sm"><option>Custom</option><option>Visit Website</option><option>Call Phone Number</option><option>Complete Flow</option></select><div className="grid gap-2 md:grid-cols-2"><div className="relative"><input maxLength={25} value={button.text} onChange={e=>updateButton(button.id,'text',e.target.value)} placeholder="Button text" className="h-10 w-full rounded-[8px] border border-[#dce3e7] px-3 pr-12 text-sm"/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{button.text.length}/25</span></div>{button.type==='Visit Website'&&<input value={button.url} onChange={e=>updateButton(button.id,'url',e.target.value)} placeholder="https://website.com" className="h-10 rounded-[8px] border border-[#dce3e7] px-3 text-sm"/>}{button.type==='Call Phone Number'&&<input value={button.phone} onChange={e=>updateButton(button.id,'phone',e.target.value)} placeholder="+91 9876543210" className="h-10 rounded-[8px] border border-[#dce3e7] px-3 text-sm"/>}{button.type==='Complete Flow'&&<select value={button.flow} onChange={e=>updateButton(button.id,'flow',e.target.value)} className="h-10 rounded-[8px] border border-[#dce3e7] px-3 text-sm"><option>Promotion</option><option>Registration</option><option>Feedback</option></select>}</div><button onClick={()=>removeButton(button.id)} className="grid h-9 w-9 place-items-center rounded-lg text-[#64717a] hover:bg-red-50 hover:text-red-500"><Trash2 size={18}/></button></div>)}</div></div>}
          </section>
          )}
        </>}

        {type==='Carousel' && <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><h2 className="text-[19px] font-semibold">Carousel</h2><span className="text-sm text-[#56646d]">{cards.length}/10 cards</span></div>
          <div className="mt-4 flex flex-wrap items-end gap-2 border-b border-[#e5eaed]">{cards.map((card,i)=><button key={card.id} onClick={()=>setActiveCard(i)} className={`flex h-11 items-center gap-2 border-b-2 px-3 text-sm ${i===activeCard?'border-[#2475d0] bg-[#eef7ff] text-[#176fc8]':'border-transparent text-[#56646d]'}`}>Card {i+1}{cards.length>1&&<span onClick={e=>{e.stopPropagation();removeCard(i)}}>×</span>}</button>)}<button onClick={addCard} className="ml-auto mb-2 text-sm font-semibold text-[#176fc8]">＋ Add Card</button></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2"><div><h3 className="text-[16px] font-semibold">Carousel Header</h3><select className="mt-3 h-11 w-full rounded-[8px] border border-[#dce3e7] px-3 text-sm"><option>Image</option><option>Video</option></select><label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-[8px] bg-[#2170d4] px-4 text-sm font-semibold text-white"><input type="file" className="hidden" onChange={e=>updateCard('mediaName',e.target.files?.[0]?.name||'')}/>☁ Upload image</label>{currentCard?.mediaName&&<span className="ml-2 text-sm italic text-green-600">Image uploaded</span>}</div><div><h3 className="text-[16px] font-semibold">Carousel Body</h3><textarea rows={4} value={currentCard?.body||''} onChange={e=>updateCard('body',e.target.value)} placeholder="Enter the text for your message" className="mt-3 w-full rounded-[8px] border border-[#dce3e7] p-3 text-sm outline-none focus:border-blue-400"/><div className="mt-1 text-right text-[#176fc8]"><Bold size={16} className="inline mx-2"/><Italic size={16} className="inline mx-2"/><Strikethrough size={16} className="inline mx-2"/><Code2 size={16} className="inline mx-2"/></div></div></div>
          <div className="mt-6 border-t border-[#e5eaed] pt-5"><h3 className="text-[16px] font-semibold">Carousel Button</h3><p className="mt-1 text-[13px] text-[#65717a]">Create buttons that let customers respond to your message or take action.</p></div>
        </section>}

        <div className="flex flex-wrap gap-3 pb-8"><button onClick={onBack} className="h-10 rounded-[8px] border border-[#dce2e6] px-5 text-sm font-semibold text-[#374149]">Cancel</button><button className="h-10 rounded-[8px] border border-[#dce2e6] bg-[#f6f8f9] px-5 text-sm font-semibold text-[#8b969d]">Add Sample</button><button disabled={!canSubmit||submitting} onClick={onSubmit} className="h-10 rounded-[8px] bg-[#216ed4] px-6 text-sm font-semibold text-white disabled:bg-[#ccd4d9]">{submitting?'Submitting…':'Submit'}</button></div>
      </div>
      <aside><PhonePreview name={form.name} header={form.header} body={form.body} footer={form.footer} buttons={form.buttons} type={type} category={category} carouselCards={cards}/></aside>
    </div>
  )
}
