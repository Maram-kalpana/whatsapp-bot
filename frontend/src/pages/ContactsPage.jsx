import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2, Download, Pencil, Plus, Search, Trash2, Upload, X,
} from 'lucide-react'
import { createContact, deleteContact, listContacts, updateContact } from '../api/contacts'
import { apiErrorMessage } from '../api/client'
import { Modal, Field, inputCls, btnOutline, btnPrimary, PageTitle, Card } from '../components/UiKit'

function mapContact(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone_number,
    email: c.email || '-',
    status: 'Active',
  }
}

function ContactModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name: '', phone: '', email: '', status: 'Active' })
  const set = (key, value) => setForm((s) => ({ ...s, [key]: value }))
  return (
    <Modal open onClose={onClose} title={item ? 'Edit Contact' : 'Create Contact'} max="max-w-lg"
      footer={<><button className={btnOutline} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={!form.name || !form.phone} onClick={() => onSave(form)}>Save Contact</button></>}>
      <div className="space-y-4">
        <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Enter contact name" /></Field>
        <Field label="Phone Number"><input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="919876543210" /></Field>
        <Field label="Email"><input className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
        <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}><option>Active</option><option>Inactive</option></select></Field>
      </div>
    </Modal>
  )
}

function ImportContactsPopup({ open, onClose, onImported }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const chooseFile = (picked) => {
    if (!picked) return
    const ext = picked.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xls', 'xlsx'].includes(ext)) return
    setFile(picked)
  }

  const downloadSample = () => {
    const csv = 'Name,Phone Number,Email\nVidya,919876543210,vidya@example.com\nTejaswi,919876543211,tejaswi@example.com\n'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'contact-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importNow = () => {
    if (!file) return
    setBusy(true)
    setTimeout(() => {
      onImported([
        { id: Date.now(), name: 'Imported Customer', phone: '919876540001', email: 'customer@example.com', status: 'Active' },
        { id: Date.now() + 1, name: 'Imported Lead', phone: '919876540002', email: 'lead@example.com', status: 'Active' },
      ])
      setBusy(false)
      setFile(null)
      onClose()
    }, 650)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0d1b2a]/70 p-4 backdrop-blur-[1px]" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-[670px] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,.32)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-500"><Upload size={20} /></div>
            <h2 className="text-[20px] font-bold text-slate-800 sm:text-[22px]">Import Contacts</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100"><X size={21} /></button>
        </div>

        <div className="px-6 py-5 sm:px-7">
          <p className="max-w-[590px] text-[14px] leading-6 text-slate-500 sm:text-[15px]">Upload an Excel or CSV file to import contacts. Please ensure the file format matches the sample sheet.</p>

          <button onClick={downloadSample} className="mt-6 flex h-[56px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white text-[15px] font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50/40">
            <Download size={20} /> Download Sample Sheet
          </button>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]) }}
            className={`mt-7 flex min-h-[166px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-blue-500 bg-[#f7fbff] hover:bg-blue-50/70'}`}
          >
            <Upload size={38} strokeWidth={1.8} className="mb-3 text-slate-500" />
            <p className="text-[16px] font-medium text-slate-800">Click to select or drag and drop</p>
            <p className="mt-2 text-[13px] text-slate-500">Supported formats: .xlsx, .xls, .csv</p>
            {file && <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-600 shadow-sm"><CheckCircle2 size={15} /><span className="truncate">{file.name}</span></div>}
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5 sm:px-7">
          <button onClick={onClose} className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <button disabled={!file || busy} onClick={importNow} className="h-12 min-w-[112px] rounded-xl bg-[#1596f5] px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#087fd5] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{busy ? 'Importing...' : 'Import'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await listContacts({ pageSize: 100, q: query || undefined })
      setContacts(data.items.map(mapContact))
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => contacts.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase())), [contacts, query])

  const save = async (form) => {
    try {
      const body = { name: form.name, phone_number: form.phone, email: form.email === '-' ? '' : form.email }
      if (modal?.id) {
        await updateContact(modal.id, body)
      } else {
        await createContact(body)
      }
      setModal(null)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  const remove = async (id) => {
    try {
      await deleteContact(id)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }
  const addImported = (rows) => { setContacts((list) => [...rows, ...list]); setToast('Contacts imported successfully!'); setTimeout(() => setToast(''), 2400) }
  const exportCsv = () => {
    const rows = [['Name', 'Phone Number', 'Email', 'Status'], ...contacts.map((c) => [c.name, c.phone, c.email, c.status])]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
    <PageTitle title="Contacts" action={<button onClick={() => setModal({})} className={btnPrimary}><Plus size={18} /> Create Contact</button>} />
    {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className={`${inputCls} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Contacts..." /></div>
        <div className="flex gap-2"><button onClick={() => setImportOpen(true)} className={btnOutline}><Upload size={17} /> Import</button><button onClick={exportCsv} className={btnOutline}><Download size={17} /> Export</button></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#f4f9fb] text-sm text-slate-600"><tr><th className="px-6 py-4 font-medium">Name ↑</th><th className="px-6 py-4 font-medium">Phone Number</th><th className="px-6 py-4 font-medium">Email</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Loading…</td></tr> : filtered.map((c) => <tr key={c.id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full border border-blue-300 bg-blue-50 text-sm font-semibold text-blue-600">{c.name[0]}</div><span className="font-medium text-slate-800">{c.name}</span></div></td><td className="px-6 py-4 text-sm text-slate-600">{c.phone}</td><td className="px-6 py-4 text-sm text-slate-600">{c.email}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => setModal(c)} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50"><Pencil size={17} /></button><button onClick={() => remove(c.id)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-50"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>
      <div className="flex justify-end gap-5 border-t px-5 py-3 text-sm text-slate-500"><span>Rows per page: 10</span><span>1-{filtered.length} of {filtered.length}</span><span>‹ &nbsp; ›</span></div>
    </Card>
    {modal !== null && <ContactModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={save} />}
    <ImportContactsPopup open={importOpen} onClose={() => setImportOpen(false)} onImported={addImported} />
    {toast && <div className="fixed right-5 top-5 z-[140] flex items-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-semibold shadow-2xl"><CheckCircle2 className="text-emerald-500" size={20} />{toast}</div>}
  </div>
}
