import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { ArrowLeft, Plus, Save, Trash2, X } from "lucide-react";
import {
  getChatbot,
  saveChatbotFlow,
  updateChatbot,
} from "../api/chatbots";
import { apiErrorMessage } from "../api/client";
import ChatbotFlowNode from "../components/chatbot/ChatbotFlowNode";
import NodeConfigPanel from "../components/chatbot/NodeConfigPanel";
import NodePalette from "../components/chatbot/NodePalette";
import PhonePreview from "../components/chatbot/PhonePreview";
import {
  defaultConfig,
  toApiFlow,
  toFlowEdges,
  toFlowNodes,
} from "../components/chatbot/chatbotUtils";
import { btnOutline, btnPrimary, inputCls, Modal } from "../components/UiKit";

const nodeTypes = { chatbot: ChatbotFlowNode };

export default function ChatBotBuilderPage() {
  return (
    <ReactFlowProvider>
      <ChatBotBuilderCanvas />
    </ReactFlowProvider>
  );
}

function ChatBotBuilderCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [draftKeywords, setDraftKeywords] = useState([]);
  const [draftFallback, setDraftFallback] = useState("");

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getChatbot(id);
        if (cancelled) return;
        setBot(data.chatbot);
        setDraftKeywords(data.chatbot.trigger_keywords || []);
        setDraftFallback(data.chatbot.fallback_message || "");
        setNodes(toFlowNodes(data.nodes || []));
        setEdges(toFlowEdges(data.edges || []));
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load chatbot"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType || !reactFlowInstance || !reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const newId = `temp_${Date.now()}`;
      const newNode = {
        id: newId,
        type: "chatbot",
        position,
        data: { nodeType, config: defaultConfig(nodeType) },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedId(newId);
    },
    [reactFlowInstance, setNodes],
  );

  const updateSelectedConfig = (config) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, config } } : n)),
    );
  };

  const saveMeta = async (patch) => {
    const updated = await updateChatbot(id, patch);
    setBot(updated);
    return updated;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await saveMeta({
        name: bot.name,
        timeout_minutes: bot.timeout_minutes,
        fallback_message: bot.fallback_message,
        trigger_keywords: bot.trigger_keywords,
      });
      const flow = toApiFlow(nodes, edges);
      const saved = await saveChatbotFlow(id, flow);
      setNodes(toFlowNodes(saved.nodes));
      setEdges(toFlowEdges(saved.edges));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save chatbot"));
    } finally {
      setSaving(false);
    }
  };

  const saveTriggers = async () => {
    await saveMeta({ trigger_keywords: draftKeywords });
    setTriggerOpen(false);
  };

  const saveFallback = async () => {
    await saveMeta({ fallback_message: draftFallback });
    setFallbackOpen(false);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">
        Loading chatbot builder…
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600">{error || "Chatbot not found"}</p>
        <button className={`${btnOutline} mt-4`} onClick={() => navigate("/chat-bot")}>
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col bg-slate-50">
      <div className="border-b bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/chat-bot")} className={btnOutline}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 className="text-xl font-bold">Chat-Bot Builder</h1>
              <p className="text-sm text-slate-500">Design your WhatsApp conversation flow</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedId && (
              <button onClick={deleteSelected} className={btnOutline}>
                <Trash2 size={16} /> Delete node
              </button>
            )}
            <button onClick={handleSave} disabled={saving} className={btnPrimary}>
              <Save size={16} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {error && <p className="mx-auto mt-3 max-w-[1700px] text-sm text-rose-600">{error}</p>}
      </div>

      <div className="mx-auto w-full max-w-[1700px] flex-1 p-4 sm:p-6">
        <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
          <label>
            <span className="text-xs text-slate-500">Chatbot Name</span>
            <input
              value={bot.name}
              onChange={(e) => setBot((b) => ({ ...b, name: e.target.value }))}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label>
            <span className="text-xs text-slate-500">Bot Timeout (Minutes)</span>
            <input
              type="number"
              min={1}
              value={bot.timeout_minutes}
              onChange={(e) => setBot((b) => ({ ...b, timeout_minutes: Number(e.target.value) || 30 }))}
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            onClick={() => {
              setDraftKeywords(bot.trigger_keywords || []);
              setTriggerOpen(true);
            }}
            className="self-end rounded-xl bg-fuchsia-50 px-4 py-2.5 text-sm font-semibold text-fuchsia-700"
          >
            Add / Edit Triggers
          </button>
          <button
            onClick={() => {
              setDraftFallback(bot.fallback_message || "");
              setFallbackOpen(true);
            }}
            className="self-end rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700"
          >
            Edit Fallback Message
          </button>
        </div>

        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[180px_minmax(0,1fr)_300px_280px]">
          <NodePalette />
          <div ref={reactFlowWrapper} className="relative min-h-[680px] border-r">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              fitView
            >
              <Background gap={22} size={1} color="#dbeafe" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          <div className="border-r bg-white">
            <NodeConfigPanel node={selectedNode} onChange={updateSelectedConfig} />
          </div>
          <div className="bg-slate-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Live Preview</p>
            <PhonePreview node={selectedNode} />
          </div>
        </div>
      </div>

      <Modal
        open={triggerOpen}
        onClose={() => setTriggerOpen(false)}
        title="Chat Bot Triggers"
        max="max-w-lg"
        footer={
          <>
            <button className={btnOutline} onClick={() => setTriggerOpen(false)}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={saveTriggers}>
              Save triggers
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {draftKeywords.map((kw, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
              <select
                value={kw.type || "text"}
                onChange={(e) =>
                  setDraftKeywords((arr) =>
                    arr.map((k, i) => (i === index ? { ...k, type: e.target.value } : k)),
                  )
                }
                className={inputCls}
              >
                <option value="text">Text</option>
                <option value="contains">Contains</option>
                <option value="regex">Regex</option>
              </select>
              <input
                value={kw.value || ""}
                onChange={(e) =>
                  setDraftKeywords((arr) =>
                    arr.map((k, i) => (i === index ? { ...k, value: e.target.value } : k)),
                  )
                }
                className={inputCls}
                placeholder="Trigger phrase"
              />
              <button
                type="button"
                onClick={() => setDraftKeywords((arr) => arr.filter((_, i) => i !== index))}
                className="text-rose-500"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDraftKeywords((arr) => [...arr, { type: "text", value: "" }])}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
          >
            <Plus size={15} /> Add Trigger
          </button>
        </div>
      </Modal>

      <Modal
        open={fallbackOpen}
        onClose={() => setFallbackOpen(false)}
        title="Fallback Message"
        max="max-w-lg"
        footer={
          <>
            <button className={btnOutline} onClick={() => setFallbackOpen(false)}>
              Cancel
            </button>
            <button className={btnPrimary} onClick={saveFallback}>
              Save
            </button>
          </>
        }
      >
        <textarea
          className={`${inputCls} min-h-32`}
          value={draftFallback}
          onChange={(e) => setDraftFallback(e.target.value)}
          placeholder="Message sent when the bot cannot match a reply"
        />
      </Modal>
    </div>
  );
}
