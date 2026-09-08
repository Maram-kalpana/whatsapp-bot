import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTemplates } from "../api/templates";
import { apiErrorMessage } from "../api/client";
import TemplateCard from "../features/templates/components/TemplateCard";
import TemplateFilters from "../features/templates/components/TemplateFilters";

function mapTemplate(row) {
  const category = String(row.category || "marketing");
  const headerType = String(row.header_type || "none").toLowerCase();
  return {
    id: row.id,
    name: row.name,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    type: row.type,
    body: row.body,
    status: row.status,
    media: headerType === "image" || headerType === "video" ? "Image" : "Text",
    icon: category === "utility" ? "bell" : "megaphone",
  };
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", media: "" });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setTemplates((await listTemplates()).map(mapTemplate));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) &&
          (!filters.category || t.category === filters.category) &&
          (!filters.media || t.media === filters.media),
      ),
    [templates, search, filters],
  );

  const sync = async () => {
    setSyncing(true);
    await load();
    setSyncing(false);
  };

  return (
    <div className="px-5 py-7 sm:px-7 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1450px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-.2px] text-[#101827]">WhatsApp Templates</h1>
            <p className="mt-2 text-[14px] text-[#8b99a2]">
              <span className="text-[#27313a]">WhatsApp</span>
              <span className="px-2">•</span>Templates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={sync}
              className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#dfe5e9] bg-white px-4 text-sm font-semibold text-[#45515b] hover:bg-slate-50"
            >
              <RefreshCw size={17} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Refresh"}
            </button>
            <button
              onClick={() => navigate("/templates/create")}
              className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#128fee] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c80da]"
            >
              <Plus size={18} />
              Create Template
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <div className="mt-6">
          <TemplateFilters search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} />
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-500">Loading templates…</p>
        ) : filtered.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h3 className="font-semibold">No templates found</h3>
            <p className="mt-2 text-sm text-slate-500">Create a template or adjust your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
