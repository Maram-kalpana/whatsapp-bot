import { useEffect, useRef, useState } from "react";
import { CloudUpload, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listTemplates } from "../api/templates";
import { listContactGroups } from "../api/contacts";
import { createDrip } from "../api/campaigns";
import { apiErrorMessage } from "../api/client";

const STEPS = ["Name", "Recipients", "Sequence", "Schedule"];

export default function CreateDripPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [source, setSource] = useState("all_contacts");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [dripSteps, setDripSteps] = useState([{ delay_minutes: 0, template_id: "" }]);
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
      if (source === "group") return Boolean(groupId);
      if (source === "csv_upload") return Boolean(csvFile);
      return true;
    }
    if (step === 2) return dripSteps.every((s) => s.template_id !== "" && Number(s.delay_minutes) >= 0);
    if (scheduleType === "scheduled") return Boolean(date && time);
    return true;
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("recipient_source", source);
      if (source === "group") fd.append("recipient_group_id", groupId);
      fd.append("schedule_type", scheduleType);
      if (scheduleType === "scheduled") fd.append("scheduled_at", new Date(`${date}T${time}`).toISOString());
      fd.append("steps", JSON.stringify(dripSteps.map((s) => ({ delay_minutes: Number(s.delay_minutes) || 0, template_id: Number(s.template_id) }))));
      if (csvFile) fd.append("csv", csvFile);
      await createDrip(fd);
      navigate("/campaign/drip");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create drip campaign"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-7 lg:px-7">
      <div className="mb-7">
        <h1 className="text-[24px] font-bold text-slate-900">Create Drip Campaign</h1>
        <p className="mt-2 text-sm text-slate-500">WhatsApp • Multi-step sequence with delay_minutes between each send</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <span key={label} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${i === step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {step === 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Campaign Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500" placeholder="Welcome sequence" />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-semibold">Recipients</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="h-11 w-full max-w-sm rounded-xl border border-slate-200 px-4">
              <option value="all_contacts">All contacts</option>
              <option value="group">A group</option>
              <option value="csv_upload">CSV upload</option>
            </select>
            {source === "group" && (
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-11 w-full max-w-sm rounded-xl border border-slate-200 px-4">
                <option value="">Select a group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            {source === "csv_upload" && (
              <>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-5 font-semibold text-blue-600">
                  <CloudUpload size={18} />{csvFile?.name || "Upload CSV"}
                </button>
              </>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Step 1 delay is wait after the start time. Later delays wait after the previous message is sent.</p>
            {dripSteps.map((s, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[120px_1fr_auto]">
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-slate-500">Delay (min)</span>
                  <input type="number" min="0" value={s.delay_minutes} onChange={(e) => setDripSteps((prev) => prev.map((x, idx) => idx === i ? { ...x, delay_minutes: e.target.value } : x))} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-slate-500">Template</span>
                  <select value={s.template_id} onChange={(e) => setDripSteps((prev) => prev.map((x, idx) => idx === i ? { ...x, template_id: e.target.value } : x))} className="h-11 w-full rounded-xl border border-slate-200 px-3">
                    <option value="">Select template</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                  </select>
                </label>
                {dripSteps.length > 1 && (
                  <button type="button" onClick={() => setDripSteps((prev) => prev.filter((_, idx) => idx !== i))} className="mt-6 grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setDripSteps((prev) => [...prev, { delay_minutes: 60, template_id: "" }])} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold">
              <Plus size={16} /> Add step
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="h-11 w-full max-w-sm rounded-xl border border-slate-200 px-4">
              <option value="send_now">Start now</option>
              <option value="scheduled">Scheduled datetime</option>
            </select>
            {scheduleType === "scheduled" && (
              <div className="flex max-w-md gap-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 flex-1 rounded-xl border border-slate-200 px-3" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 flex-1 rounded-xl border border-slate-200 px-3" />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <button type="button" onClick={() => navigate("/campaign/drip")} className="h-11 rounded-xl border border-slate-200 px-5 font-semibold">Cancel</button>
          {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="h-11 rounded-xl border border-slate-200 px-5 font-semibold">Back</button>}
          {step < 3 && <button type="button" disabled={!canNext()} onClick={() => setStep((s) => s + 1)} className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:bg-slate-200">Next</button>}
          {step === 3 && <button type="button" disabled={!canNext() || busy} onClick={submit} className="h-11 rounded-xl bg-blue-600 px-6 font-semibold text-white disabled:bg-slate-200">{busy ? "Queuing…" : "Create campaign"}</button>}
        </div>
      </section>
    </div>
  );
}
