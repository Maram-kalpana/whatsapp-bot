import { Megaphone, ShieldCheck, Wrench } from 'lucide-react'
import { setupOptions } from '../data/templateData'
import PhonePreview from './PhonePreview'

const categories = [
  ['Marketing', Megaphone], ['Utility', Wrench], ['Authentication', ShieldCheck],
]

export default function TemplateSetupStep({ category, setCategory, type, setType, onContinue, onCancel }) {
  const options = setupOptions[category]
  const selected = options.find(o=>o.key===type) || options[0]
  const rightButtons = type==='Flows'?[{text:'View Flow'}]:type==='Order Details'?[{text:'Review and Pay'}]:type==='Catalogue'?[{text:'View catalog'}]:[]
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[10px] border border-[#e2e7ea] bg-white p-5 sm:p-7">
        <h2 className="text-[20px] font-semibold text-[#18212a]">Set up your template</h2>
        <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[#5d6870]">Choose the category that best describes your message template. Then select the type of message you want to send. <span className="text-[#1a85d6]">Learn more about categories.</span></p>
        <div className="mt-4 flex flex-wrap gap-2">{categories.map(([label,Icon])=>{
          const active=category===label
          return <button key={label} onClick={()=>{setCategory(label);setType(setupOptions[label][0].key)}} className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium ${active ? label==='Utility'?'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700':'border-[#a9d8f7] bg-[#eef8ff] text-[#188bdc]' : 'border-[#dce2e6] bg-[#f8fafb] text-[#3e4a52]'}`}><Icon size={15}/>{label}</button>
        })}</div>
        <div className="mt-5 space-y-2">{options.map(option=>{
          const active=type===option.key
          return <button key={option.key} onClick={()=>setType(option.key)} className={`flex w-full items-start gap-4 rounded-[9px] border px-5 py-4 text-left ${active?'border-[#acd9f5] bg-[#eef9ff]':'border-[#e4e8eb] bg-white hover:bg-slate-50'}`}>
            <span className={`mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 ${active?'border-[#168ee8]':'border-[#c8d0d5]'}`}>{active&&<span className="h-2 w-2 rounded-full bg-[#168ee8]"/>}</span>
            <span><span className="block text-[15px] font-medium text-[#202931]">{option.title}</span><span className="mt-1 block text-[13px] leading-5 text-[#66737b]">{option.description}</span></span>
          </button>
        })}</div>
        <div className="mt-5 flex gap-3"><button onClick={onCancel} className="h-10 rounded-[8px] border border-[#dce2e6] px-5 text-sm font-semibold text-[#313b42]">Cancel</button><button onClick={onContinue} className="h-10 rounded-[8px] bg-[#246fd1] px-6 text-sm font-semibold text-white">Continue</button></div>
      </section>
      <aside className="space-y-4"><PhonePreview category={category} type={type} name={selected.title} body={selected.description} buttons={rightButtons}/><div className="rounded-[10px] border border-[#e0e5e8] bg-white p-5"><h3 className="text-sm font-semibold text-[#243039]">This Template Is Good For</h3><p className="mt-2 text-[13px] leading-5 text-[#65717a]">{selected.goodFor}</p><h3 className="mt-4 text-sm font-semibold text-[#243039]">Template Areas You Can Customize</h3><p className="mt-2 text-[13px] leading-5 text-[#65717a]">{selected.customizable}</p></div></aside>
    </div>
  )
}
