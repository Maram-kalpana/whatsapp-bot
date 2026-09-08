import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Filter, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteCampaign, listCampaigns } from "../api/campaigns";
import { apiErrorMessage } from "../api/client";
import { useCampaignSocket } from "../hooks/useCampaignSocket";

function statusLabel(row) {
  if (row.status === "completed") return "Completed";
  if (row.status === "failed") return "Failed";
  if (row.schedule_type === "scheduled" && row.scheduled_at && new Date(row.scheduled_at) > new Date() && !row.sent_count) {
    return "Scheduled";
  }
  return "Sending";
}

function statusClass(label) {
  if (label === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-600";
  if (label === "Failed") return "border-red-200 bg-red-50 text-red-600";
  if (label === "Scheduled") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-600";
}

function fmtWhen(value) {
  if (!value) return { date: "—", time: "" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

export default function BroadcastPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Broadcasts");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const campaigns = await listCampaigns({ type: "broadcast", q: search || undefined });
      setRows(campaigns);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load broadcasts"));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const onSocket = useCallback((payload) => {
    if (!payload?.campaignId) return;
    setRows((prev) =>
      prev.map((r) => (r.id === payload.campaignId ? { ...r, ...payload, id: r.id } : r)),
    );
    load();
  }, [load]);

  useCampaignSocket(onSocket);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const label = statusLabel(r);
      if (statusFilter === "Completed") return label === "Completed";
      if (statusFilter === "Scheduled") return label === "Scheduled";
      if (statusFilter === "Failed") return label === "Failed";
      return true;
    });
  }, [rows, statusFilter]);

  const exportCsv = () => {
    const headers = ["Name", "Status", "Template", "Recipients", "Sent", "Delivered", "Read", "Failed"];
    const body = filtered.map((r) =>
      [r.name, statusLabel(r), r.template?.name || "", r.recipient_count, r.sent_count, r.delivered_count, r.read_count, r.failed_count].join(","),
    );
    const blob = new Blob([[headers.join(","), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "broadcasts.csv";
    a.click();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this broadcast and cancel pending sends?")) return;
    await deleteCampaign(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-7">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Broadcast Report</h1>
          <div className="mt-2 flex items-center gap-2 text-[15px] text-slate-500">
            <span className="font-medium text-slate-700">WhatsApp</span><span>•</span><span>Broadcast Report</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/campaign/broadcast/create")}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,.22)] transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Plus size={20} /> Create Broadcast
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.04)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
          <button className="flex h-11 min-w-[220px] items-center gap-3 rounded-xl border border-slate-200 px-4 text-slate-600">
            <CalendarDays size={19} className="text-slate-400" /> All dates
          </button>
          <label className="flex h-11 w-full max-w-[390px] items-center gap-2 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={19} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Broadcast..." className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400" />
          </label>
          <div className="relative">
            <button onClick={() => setFilterOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-50">
              <Filter size={19} />
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-12 z-20 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {["All Broadcasts", "Completed", "Scheduled", "Failed"].map((x) => (
                  <button key={x} onClick={() => { setStatusFilter(x); setFilterOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600">
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportCsv} className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 font-medium text-slate-700 hover:bg-slate-50">
            <Download size={18} /> Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead>
              <tr className="bg-slate-50/90 text-sm font-semibold text-slate-600">
                <th className="px-6 py-5">Broadcast Name</th>
                <th className="px-5 py-5">Scheduled</th>
                <th className="px-5 py-5">Template</th>
                <th className="px-5 py-5 text-center">Recipients</th>
                <th className="px-5 py-5">Sent / Delivered / Read</th>
                <th className="px-5 py-5">Failed</th>
                <th className="px-5 py-5">Status</th>
                <th className="w-16 px-5 py-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && filtered.map((row) => {
                const when = fmtWhen(row.scheduled_at);
                const label = statusLabel(row);
                return (
                  <tr key={row.id} className="group hover:bg-blue-50/25">
                    <td className="px-6 py-5 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-5 py-5">
                      <p className="font-semibold text-slate-800">{when.date}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{when.time}</p>
                    </td>
                    <td className="px-5 py-5 text-slate-600">{row.template?.name || "—"}</td>
                    <td className="px-5 py-5 text-center font-medium text-slate-800">{row.recipient_count}</td>
                    <td className="px-5 py-5 text-sm text-slate-700">{row.sent_count} / {row.delivered_count} / {row.read_count}</td>
                    <td className="px-5 py-5 text-sm text-slate-700">{row.failed_count}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex rounded-lg border px-3 py-1.5 text-sm font-semibold ${statusClass(label)}`}>{label}</span>
                    </td>
                    <td className="px-5 py-5">
                      <button onClick={() => remove(row.id)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && <p className="px-6 py-10 text-sm text-slate-500">Loading broadcasts…</p>}
        {!loading && !filtered.length && <p className="px-6 py-10 text-sm text-slate-500">No broadcasts yet. Create one to send a template to your contacts.</p>}
        <div className="flex items-center justify-end gap-4 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>1-{filtered.length} of {filtered.length}</span>
          <button className="text-slate-300"><ChevronLeft size={18} /></button>
          <button className="text-slate-500"><ChevronRight size={18} /></button>
        </div>
      </section>
    </div>
  );
}
