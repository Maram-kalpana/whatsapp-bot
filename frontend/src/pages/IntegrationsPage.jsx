import { useMemo, useState } from 'react'
import { Braces, ChevronLeft, Copy, ExternalLink, FileSpreadsheet, Globe2, Plus, Save, Search, Webhook, Workflow } from 'lucide-react'
import { Card, PageTitle, btnOutline, btnPrimary, inputCls } from '../components/UiKit'

const apps = [
  ['Google Sheets', 'Connect WhatsApp leads and responses directly to Google Sheets.', FileSpreadsheet, 'Available'],
  ['Zoho CRM', 'Sync leads, customers and conversations with Zoho CRM.', Workflow, 'Available'],
  ['Custom Webhooks', 'Push WhatsApp events to your own API endpoints in real time.', Webhook, 'Configure'],
  ['WooCommerce', 'Connect products and orders from your WooCommerce store.', Globe2, 'Available'],
  ['Zoho Books', 'Send customer and payment information to Zoho Books.', Braces, 'Available'],
  ['Zoho Invoice', 'Create invoice workflows from WhatsApp interactions.', Braces, 'Available'],
]

function WebhookEditor({ onBack }) {
  const [name, setName] = useState('Incoming Message Webhook')
  const [description, setDescription] = useState('Receive incoming WhatsApp message events.')
  const [url, setUrl] = useState('https://api.example.com/webhooks/whatsapp')
  const [method, setMethod] = useState('POST')
  const [saved, setSaved] = useState(false)
  const payload = `// Request preview\n${method} ${url}\nContent-Type: application/json\n\n{\n  "event": "message.received",\n  "contact": "{{phone}}",\n  "message": "{{message}}"\n}`
  return <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
    <PageTitle title="Integration" crumb="Integrations • Custom Webhooks" action={<button onClick={onBack} className={btnOutline}><ChevronLeft size={17} /> Back</button>} />
    <div className="grid gap-5 xl:grid-cols-[480px_minmax(0,1fr)]">
      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-bold">Webhook details</h3><p className="mt-1 text-sm text-slate-500">Configure where message events should be delivered.</p>
        <div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-semibold">Script Name</span><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label><label className="block"><span className="mb-1.5 block text-sm font-semibold">Description</span><textarea className={`${inputCls} min-h-24 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} /></label><label className="block"><span className="mb-1.5 block text-sm font-semibold">Webhook URL</span><div className="grid grid-cols-[105px_1fr] gap-2"><select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}><option>POST</option><option>GET</option><option>PUT</option></select><input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} /></div></label><label className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><span><b className="text-sm">Active</b><span className="block text-xs text-slate-500">Send live events to this endpoint.</span></span><input type="checkbox" defaultChecked className="h-5 w-5" /></label><button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }} className={`${btnPrimary} w-full`}><Save size={17} /> {saved ? 'Saved' : 'Save Webhook'}</button></div>
      </Card>
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b px-5 py-4"><div><h3 className="font-bold">Code Preview</h3><p className="text-xs text-slate-500">Example request sent to your endpoint.</p></div><button onClick={() => navigator.clipboard?.writeText(payload)} className={btnOutline}><Copy size={16} /> Copy</button></div><div className="grid grid-cols-[44px_1fr] bg-[#f8fafc] font-mono text-xs leading-6"><div className="select-none border-r bg-slate-50 p-4 text-right text-slate-300">{Array.from({ length: 16 }, (_, i) => <div key={i}>{i + 1}</div>)}</div><pre className="overflow-x-auto p-4 text-slate-600">{payload}</pre></div></Card>
    </div>
  </div>
}

export default function IntegrationsPage() {
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState(false)
  const filtered = useMemo(() => apps.filter((a) => `${a[0]} ${a[1]}`.toLowerCase().includes(query.toLowerCase())), [query])
  if (custom) return <WebhookEditor onBack={() => setCustom(false)} />
  return <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
    <PageTitle title="Integrations" />
    <div className="relative mb-5 max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Integrations..." /></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(([name, desc, Icon, action]) => <Card key={name} className="group p-5 transition hover:-translate-y-1 hover:shadow-lg"><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50"><Icon size={25} className="text-blue-600" /></div><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{action}</span></div><h3 className="mt-5 text-base font-bold">{name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{desc}</p><button onClick={() => name === 'Custom Webhooks' ? setCustom(true) : null} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">{name === 'Custom Webhooks' ? 'Configure' : 'Connect'} <ExternalLink size={15} /></button></Card>)}
      <Card className="grid min-h-[210px] place-items-center p-5 text-center"><div><p className="text-sm font-semibold">Couldn't find the App you're looking for?</p><button className={`${btnPrimary} mt-4`}><Plus size={16} /> Request apps</button></div></Card>
    </div>
  </div>
}
