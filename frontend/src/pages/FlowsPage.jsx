import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Copy,
  FileText,
  GripVertical,
  Image,
  List,
  Plus,
  Save,
  Send,
  Trash2,
  Type,
  Workflow,
} from "lucide-react";
import {
  createFlow,
  deleteFlow,
  getFlow,
  listFlows,
  publishFlow,
  saveFlowStructure,
  updateFlow,
} from "../api/flows";
import { apiErrorMessage } from "../api/client";
import { Card, PageTitle, btnOutline, btnPrimary, inputCls, Modal } from "../components/UiKit";
import { EmptyState, SearchBox } from "../features/more/components/MoreShared";

const COMPONENT_TYPES = [
  { key: "text_heading", label: "Heading", icon: Type },
  { key: "text_body", label: "Body Text", icon: FileText },
  { key: "short", label: "Short Answer", icon: Type },
  { key: "paragraph", label: "Paragraph", icon: FileText },
  { key: "single", label: "Single Choice", icon: List },
  { key: "multiple", label: "Multiple Choice", icon: List },
  { key: "dropdown", label: "Dropdown", icon: List },
  { key: "date", label: "Date", icon: FileText },
  { key: "opt_in", label: "Opt-in", icon: FileText },
  { key: "button", label: "Footer Button", icon: Send },
];

function slugKey(title, index) {
  return String(title || `SCREEN_${index}`)
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .slice(0, 64) || `SCREEN_${index}`;
}

function FlowPreview({ screen }) {
  return (
    <div className="mx-auto w-[265px] overflow-hidden rounded-[28px] border-[8px] border-slate-700 bg-[#efeae2] shadow-xl">
      <div className="flex h-12 items-center gap-2 bg-[#1e3a5f] px-4 text-xs font-semibold text-white">
        <ChevronLeft size={17} />
        <span>{screen?.title || "Form"}</span>
      </div>
      <div className="min-h-[410px] p-3">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-xs font-bold text-slate-800">{screen?.title || "Form"}</p>
          <div className="mt-3 space-y-3">
            {(screen?.components || []).map((f) => (
              <div key={f.id || f.label}>
                {f.component_type === "text_heading" ? (
                  <p className="text-sm font-bold">{f.label}</p>
                ) : f.component_type === "text_body" ? (
                  <p className="text-xs text-slate-600">{f.config?.text || f.label}</p>
                ) : f.component_type === "button" ? (
                  <button type="button" className="mt-2 h-8 w-full rounded-md bg-[#24aa82] text-[10px] font-semibold text-white">
                    {f.config?.label || f.label || "Continue"}
                  </button>
                ) : (
                  <>
                    <p className="mb-1 text-[10px] font-medium text-slate-600">{f.label}</p>
                    <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowBuilder({ flowId, onBack }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("draft");
  const [metaFlowId, setMetaFlowId] = useState(null);
  const [screens, setScreens] = useState([]);
  const [activeScreenId, setActiveScreenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const screen = screens.find((s) => s.id === activeScreenId) || screens[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getFlow(flowId);
        if (cancelled) return;
        setName(data.flow.name);
        setStatus(data.flow.status);
        setMetaFlowId(data.flow.meta_flow_id);
        const loaded = (data.screens || []).map((s) => ({
          ...s,
          components: s.components || [],
        }));
        setScreens(loaded);
        setActiveScreenId(loaded[0]?.id || null);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load flow"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flowId]);

  const updateScreen = (patch) => {
    setScreens((arr) => arr.map((s) => (s.id === screen.id ? { ...s, ...patch } : s)));
  };

  const addComponent = (type) => {
    const component = {
      id: `temp_${Date.now()}`,
      component_type: type,
      label: COMPONENT_TYPES.find((t) => t.key === type)?.label || "Field",
      config: type === "single" || type === "multiple" || type === "dropdown"
        ? { options: [{ id: "opt_1", title: "Option 1" }, { id: "opt_2", title: "Option 2" }], required: true }
        : { required: true },
      component_order: screen.components.length,
    };
    updateScreen({ components: [...screen.components, component] });
  };

  const updateComponent = (componentId, patch) => {
    updateScreen({
      components: screen.components.map((c) => (c.id === componentId ? { ...c, ...patch } : c)),
    });
  };

  const removeComponent = (componentId) => {
    updateScreen({ components: screen.components.filter((c) => c.id !== componentId) });
  };

  const moveScreen = (index, direction) => {
    const next = [...screens].sort((a, b) => a.screen_order - b.screen_order);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setScreens(next.map((s, i) => ({ ...s, screen_order: i })));
  };

  const addScreen = () => {
    const order = screens.length;
    const newScreen = {
      id: `temp_screen_${Date.now()}`,
      screen_key: slugKey(`Screen ${order + 1}`, order),
      title: `Screen ${order + 1}`,
      screen_order: order,
      components: [],
    };
    setScreens((arr) => [...arr, newScreen]);
    setActiveScreenId(newScreen.id);
  };

  const buildPayload = () => ({
    screens: [...screens]
      .sort((a, b) => a.screen_order - b.screen_order)
      .map((s, screenIndex) => ({
        id: s.id,
        screen_key: s.screen_key || slugKey(s.title, screenIndex),
        title: s.title,
        screen_order: screenIndex,
        components: s.components.map((c, componentIndex) => ({
          id: c.id,
          component_type: c.component_type,
          label: c.label,
          config: c.config || {},
          component_order: componentIndex,
        })),
      })),
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await updateFlow(flowId, { name });
      const saved = await saveFlowStructure(flowId, buildPayload());
      const reloaded = await getFlow(flowId);
      setName(reloaded.flow.name);
      setStatus(reloaded.flow.status);
      setMetaFlowId(reloaded.flow.meta_flow_id);
      setScreens(saved.screens || reloaded.screens);
      setActiveScreenId((saved.screens || reloaded.screens)[0]?.id || null);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save flow"));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError("");
      await handleSave();
      const result = await publishFlow(flowId);
      setStatus(result.flow.status);
      setMetaFlowId(result.flow.meta_flow_id);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to publish flow"));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading flow…</div>;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="Flow Builder"
        crumb={`Flows • ${name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button className={btnOutline} onClick={onBack}><ChevronLeft size={17} /> Back</button>
            <button className={btnOutline} onClick={handleSave} disabled={saving}>
              <Save size={17} /> {saving ? "Saving…" : "Save"}
            </button>
            <button className={btnPrimary} onClick={handlePublish} disabled={publishing || status === "published"}>
              <Send size={17} /> {publishing ? "Publishing…" : status === "published" ? "Published" : "Publish to Meta"}
            </button>
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      {metaFlowId && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Meta Flow ID: <strong>{metaFlowId}</strong> — use this flow in a chatbot Flow node.
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_330px]">
        <Card className="h-fit p-4">
          <h3 className="text-sm font-bold text-slate-800">Screens</h3>
          <div className="mt-3 space-y-2">
            {[...screens].sort((a, b) => a.screen_order - b.screen_order).map((s, index) => (
              <div key={s.id} className={`rounded-lg border px-2 py-2 ${s.id === screen?.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                <button onClick={() => setActiveScreenId(s.id)} className="flex w-full items-center justify-between text-sm text-slate-700">
                  <span className="truncate">{s.title}</span>
                  <span className="text-xs">{s.components?.length || 0}</span>
                </button>
                <div className="mt-2 flex gap-1">
                  <button type="button" onClick={() => moveScreen(index, -1)} className="rounded p-1 text-slate-400 hover:bg-white"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveScreen(index, 1)} className="rounded p-1 text-slate-400 hover:bg-white"><ArrowDown size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addScreen} className={`${btnPrimary} mt-3 w-full`}><Plus size={16} /> Add Screen</button>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <label className="text-sm font-semibold">Flow Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} mt-2`} />
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_190px]">
            <div>
              <label className="text-sm font-semibold">Screen key</label>
              <input value={screen?.screen_key || ""} onChange={(e) => updateScreen({ screen_key: e.target.value })} className={`${inputCls} mt-2 font-mono text-xs`} />
              <label className="mt-4 block text-sm font-semibold">Screen title</label>
              <input value={screen?.title || ""} onChange={(e) => updateScreen({ title: e.target.value })} className={`${inputCls} mt-2`} />
              <div className="mt-5 space-y-3">
                {screen?.components?.map((f, index) => (
                  <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <GripVertical size={17} className="text-slate-300" />
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">{index + 1}</span>
                      <select className="rounded-lg border border-slate-200 px-2 py-2 text-sm" value={f.component_type} onChange={(e) => updateComponent(f.id, { component_type: e.target.value })}>
                        {COMPONENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                      <button onClick={() => removeComponent(f.id)} className="ml-auto rounded-md p-2 text-rose-400 hover:bg-rose-50"><Trash2 size={16} /></button>
                    </div>
                    <input value={f.label} onChange={(e) => updateComponent(f.id, { label: e.target.value })} className={`${inputCls} mt-3`} placeholder="Label" />
                    {f.component_type === "text_body" && (
                      <textarea value={f.config?.text || ""} onChange={(e) => updateComponent(f.id, { config: { ...f.config, text: e.target.value } })} className={`${inputCls} mt-3 min-h-20`} />
                    )}
                    {(f.component_type === "single" || f.component_type === "multiple" || f.component_type === "dropdown") && (
                      <textarea
                        value={(f.config?.options || []).map((o) => o.title).join("\n")}
                        onChange={(e) => updateComponent(f.id, {
                          config: {
                            ...f.config,
                            options: e.target.value.split("\n").filter(Boolean).map((line, i) => ({
                              id: `opt_${i + 1}`,
                              title: line.trim(),
                            })),
                          },
                        })}
                        className={`${inputCls} mt-3 min-h-20`}
                        placeholder="One option per line"
                      />
                    )}
                    {f.component_type === "button" && (
                      <input value={f.config?.label || f.label} onChange={(e) => updateComponent(f.id, { config: { ...f.config, label: e.target.value }, label: e.target.value })} className={`${inputCls} mt-3`} placeholder="Button label" />
                    )}
                    {!["text_heading", "text_body", "button"].includes(f.component_type) && (
                      <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <input type="checkbox" checked={f.config?.required !== false} onChange={(e) => updateComponent(f.id, { config: { ...f.config, required: e.target.checked } })} />
                        Required
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Components</h4>
              <div className="space-y-2">
                {COMPONENT_TYPES.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => addComponent(key)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                    <Icon size={16} />{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="xl:sticky xl:top-24 xl:h-fit">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Preview</h3>
              <span className="text-xs text-slate-400">WhatsApp</span>
            </div>
            <FlowPreview screen={screen} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FlowsPage() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setFlows(await listFlows());
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load flows"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => flows.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [flows, query],
  );

  const handleCreate = async () => {
    try {
      setCreating(true);
      const data = await createFlow({ name: "New WhatsApp Flow" });
      setEditingId(data.flow.id);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to create flow"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFlow(confirmDelete.id);
      setFlows((arr) => arr.filter((f) => f.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete flow"));
    }
  };

  if (editingId) {
    return <FlowBuilder flowId={editingId} onBack={() => { setEditingId(null); load(); }} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="WhatsApp Flows"
        crumb="Flows"
        action={
          <button onClick={handleCreate} disabled={creating} className={btnPrimary}>
            <Plus size={18} /> {creating ? "Creating…" : "Create Flow"}
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <Card className="overflow-hidden">
        <div className="border-b p-4"><SearchBox value={query} onChange={setQuery} placeholder="Search Flows..." className="max-w-md" /></div>
        <div className="grid grid-cols-[1.6fr_.7fr_.8fr_.5fr] bg-[#f3f8fa] px-6 py-4 text-sm text-slate-600">
          <span>Flow Name</span>
          <span>Status</span>
          <span>Meta Flow ID</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading flows…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Workflow} title="No Flows" description="Create a WhatsApp Flow to use in chatbot conversations." />
        ) : (
          <div className="divide-y">
            {filtered.map((f) => (
              <div key={f.id} className="grid grid-cols-[1.6fr_.7fr_.8fr_.5fr] items-center px-6 py-4">
                <button className="text-left font-semibold text-slate-800 hover:text-blue-600" onClick={() => setEditingId(f.id)}>{f.name}</button>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${f.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                  {f.status === "published" ? "Published" : "Draft"}
                </span>
                <span className="truncate font-mono text-xs text-slate-500">{f.meta_flow_id || "—"}</span>
                <div className="flex justify-end gap-1">
                  <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => setEditingId(f.id)}><Copy size={17} /></button>
                  <button className="rounded-lg p-2 text-rose-400 hover:bg-rose-50" onClick={() => setConfirmDelete(f)}><Trash2 size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete Flow"
        max="max-w-md"
        footer={
          <>
            <button className={btnOutline} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to delete this flow?</p>
      </Modal>
    </div>
  );
}
