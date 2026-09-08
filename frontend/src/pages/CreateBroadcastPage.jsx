import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CloudUpload, Info, Search, X, Type, CalendarDays, Clock3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listTemplates } from "../api/templates";
import { listContactGroups } from "../api/contacts";
import { createBroadcast } from "../api/campaigns";
import { apiErrorMessage } from "../api/client";

const STEPS = ["Name", "Recipients", "Template", "Schedule"];

function DropSelect({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-[15px] text-slate-700 hover:border-blue-300">
        <span>{value}</span>
        <ChevronDown size={17} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-12 z-30 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o); setOpen(false); }} className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateModal({ templates, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => templates.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [templates, query],
  );
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[88vh] w-full max-w-[1100px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-bold text-slate-900">Select Message Template</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X /></button>
        </div>
        <div className="px-6 py-5">
          <label className="flex h-11 w-72 items-center gap-2 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search template by name" className="w-full outline-none" />
          </label>
        </div>
        <div className="soft-scrollbar max-h-[62vh] overflow-y-auto px-6 pb-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <button key={t.id} type="button" onClick={() => onSelect(t)} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                <div className="mb-3 grid h-20 place-items-center rounded-xl bg-slate-50 text-blue-500"><Type size={36} /></div>
                <span className="rounded-md border border-lime-300 bg-lime-50 px-2 py-1 text-xs font-semibold text-lime-600">{t.status}</span>
                <p className="mt-2 font-semibold text-slate-900">{t.name}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{t.body}</p>
              </button>
            ))}
          </div>
          {!visible.length && <p className="py-10 text-center text-sm text-slate-500">No approved templates yet. Create one first.</p>}
        </div>
      </div>
    </div>
  );
}

const SOURCE_OPTIONS = [
  { value: "all_contacts", label: "All contacts" },
  { value: "group", label: "A group" },
  { value: "csv_upload", label: "CSV upload" },
];

export default function CreateBroadcastPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [source, setSource] = useState(SOURCE_OPTIONS[0]);
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState(null);
  const [modal, setModal] = useState(false);
  const [scheduleType, setScheduleType] = useState("send_now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => setTemplates([]));
    listContactGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) {
      if (source.value === "group") return Boolean(groupId);
      if (source.value === "csv_upload") return Boolean(csvFile);
      return true;
    }
    if (step === 2) return Boolean(template);
    if (scheduleType === "scheduled") return Boolean(date && time);
    return true;
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("recipient_source", source.value);
      if (source.value === "group") fd.append("recipient_group_id", groupId);
      fd.append("template_id", String(template.id));
      fd.append("schedule_type", scheduleType);
      if (scheduleType === "scheduled") fd.append("scheduled_at", new Date(`${date}T${time}`).toISOString());
      if (csvFile) fd.append("csv", csvFile);
      await createBroadcast(fd);
      navigate("/campaign/broadcast");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create broadcast"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-7">
      <div className="mb-7">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">WhatsApp Create Broadcast</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-slate-500">
          <span className="font-medium text-slate-700">WhatsApp</span><span>•</span>
          <button onClick={() => navigate("/campaign/broadcast")} className="text-slate-600 hover:text-blue-600">Broadcast List</button>
          <span>•</span><span>Create Broadcast</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => i < step && setStep(i)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${i === step ? "bg-blue-600 text-white" : i < step ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.04)] sm:p-8">
          {step === 0 && (
            <div>
              <label className="mb-2.5 block font-semibold text-slate-900">Broadcast Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Enter broadcast name" />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <label className="mb-2.5 block font-semibold text-slate-900">Define Recipients</label>
              <DropSelect value={source.label} options={SOURCE_OPTIONS} onChange={setSource} className="w-full sm:w-72" />
              {source.value === "group" && (
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-4 sm:w-72">
                  <option value="">Select a group</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
              {source.value === "csv_upload" && (
                <>
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-7 font-semibold text-blue-600">
                    <CloudUpload size={20} />{csvFile?.name || "Upload CSV"}
                  </button>
                  <p className="text-xs text-slate-500">CSV needs a phone / WhatsApp number column. Contacts are created if they do not exist.</p>
                </>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="mb-2.5 block font-semibold text-slate-900">Select Template</label>
              <button type="button" onClick={() => setModal(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-fuchsia-200 bg-fuchsia-50 px-5 font-semibold text-fuchsia-700">
                {template ? template.name : "Choose Message Template"}
              </button>
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="mb-2.5 block font-semibold text-slate-900">Broadcast Schedule</label>
              <DropSelect
                value={scheduleType === "send_now" ? "Send Now" : "Schedule Broadcast"}
                options={[{ value: "send_now", label: "Send Now" }, { value: "scheduled", label: "Schedule Broadcast" }]}
                onChange={(o) => setScheduleType(o.value)}
                className="w-full sm:w-64"
              />
              {scheduleType === "scheduled" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3">
                    <CalendarDays size={18} className="text-slate-400" />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full outline-none" />
                  </label>
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3">
                    <Clock3 size={18} className="text-slate-400" />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full outline-none" />
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="mt-9 flex justify-end gap-3 border-t border-slate-100 pt-6">
            {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700">Back</button>}
            {step < 3 && <button type="button" disabled={!canNext()} onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:bg-slate-200">Next</button>}
            {step === 3 && (
              <button type="button" disabled={!canNext() || busy} onClick={submit} className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:bg-slate-200">
                {busy ? "Queuing…" : scheduleType === "send_now" ? "Send Broadcast Message" : "Schedule Broadcast"}
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-2xl bg-slate-50 p-7">
          <div className="mb-5 flex justify-center"><div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><Info size={25} /></div></div>
          <div className="mx-auto max-w-[280px] space-y-3 rounded-xl bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-slate-600"><Users size={16} /> {name || "Untitled broadcast"}</p>
            <p className="text-sm text-slate-500">Recipients: {source.label}</p>
            <p className="text-sm text-slate-500">Template: {template?.name || "Not selected"}</p>
            <p className="text-sm leading-6 text-slate-600">{template?.body || "Choose a template to preview the message body."}</p>
          </div>
        </aside>
      </div>
      {modal && <TemplateModal templates={templates} onClose={() => setModal(false)} onSelect={(t) => { setTemplate(t); setModal(false); }} />}
    </div>
  );
}
