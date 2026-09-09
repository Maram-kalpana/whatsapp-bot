import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
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

export default function DripCampaignPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const campaigns = await listCampaigns({ type: "drip", q: q || undefined });
      setRows(campaigns);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load drip campaigns"));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useCampaignSocket(useCallback(() => { load(); }, [load]));

  const remove = async (id) => {
    if (!window.confirm("Delete this drip campaign and cancel pending steps?")) return;
    await deleteCampaign(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-7">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Drip Campaign</h1>
          <div className="mt-2 flex items-center gap-2 text-[15px] text-slate-500">
            <span className="font-medium text-slate-700">WhatsApp</span><span>•</span><span>Drip Campaign</span>
          </div>
        </div>
        <button onClick={() => navigate("/campaign/drip/create")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
          <Plus size={20} />Create Campaign
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="min-h-[610px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.04)]">
        <div className="border-b border-slate-100 p-4">
          <label className="flex h-11 max-w-sm items-center gap-2 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
            <Search size={19} className="text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Campaigns..." className="w-full outline-none" />
          </label>
        </div>
        <div className="grid grid-cols-[1.4fr_.8fr_.9fr_.9fr_.7fr_.5fr] bg-slate-50 px-6 py-5 text-sm font-semibold text-slate-600">
          <span>Campaign Name</span>
          <span>Steps</span>
          <span>Recipients</span>
          <span>Sent / Read / Failed</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading && <p className="px-6 py-10 text-sm text-slate-500">Loading campaigns…</p>}
        {!loading && !rows.length && (
          <div className="grid min-h-[400px] place-items-center px-5">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">No Campaigns Available</h3>
              <p className="mt-2 text-sm text-slate-500">Create a multi-step sequence. Each step waits delay_minutes, then queues the next job.</p>
            </div>
          </div>
        )}
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[1.4fr_.8fr_.9fr_.9fr_.7fr_.5fr] items-center border-b border-slate-100 px-6 py-4 text-sm">
            <span className="font-semibold text-slate-900">{row.name}</span>
            <span>{row.steps?.length || 0}</span>
            <span>{row.recipient_count}</span>
            <span>{row.sent_count} / {row.read_count} / {row.failed_count}</span>
            <span className="font-semibold text-slate-700" title={row.last_error || ""}>{statusLabel(row)}</span>
            <button onClick={() => remove(row.id)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
