import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Plus, Trash2 } from "lucide-react";
import {
  createChatbot,
  deleteChatbot,
  listChatbots,
  toggleChatbotActive,
} from "../api/chatbots";
import { apiErrorMessage } from "../api/client";
import { btnOutline, btnPrimary, Card, Modal, PageTitle } from "../components/UiKit";
import { EmptyState } from "../features/more/components/MoreShared";

function TriggerPills({ keywords }) {
  const items = keywords || [];
  if (!items.length) return <span className="text-xs text-slate-400">No triggers</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 3).map((kw, i) => (
        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
          {kw.value || kw.text}
        </span>
      ))}
      {items.length > 3 && (
        <span className="text-[11px] text-slate-400">+{items.length - 3} more</span>
      )}
    </div>
  );
}

export default function ChatBotPage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setBots(await listChatbots());
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load chatbots"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const bot = await createChatbot({ name: "New Chat Bot", timeout_minutes: 30, trigger_keywords: [] });
      if (!bot?.id) throw new Error("Chatbot was created but no id was returned");
      navigate(`/chat-bot/${bot.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to create chatbot"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (bot) => {
    try {
      const updated = await toggleChatbotActive(bot.id, !bot.is_active);
      setBots((arr) => arr.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update chatbot"));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteChatbot(confirmDelete.id);
      setBots((arr) => arr.filter((b) => b.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete chatbot"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="Chat Bots"
        crumb="WhatsApp • Chat Bot"
        action={
          <button onClick={handleCreate} disabled={creating} className={btnPrimary}>
            <Plus size={18} /> {creating ? "Creating…" : "Create Chat Bot"}
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_.8fr_1.2fr_.6fr_.5fr] bg-[#f3f8fa] px-6 py-4 text-sm font-medium text-slate-600">
          <span>Name</span>
          <span>Sessions</span>
          <span>Triggers</span>
          <span>Active</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading chatbots…</div>
        ) : bots.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No Chat Bots"
            description="Create your first WhatsApp chatbot to automate conversations."
          />
        ) : (
          <div className="divide-y">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="grid grid-cols-[1.4fr_.8fr_1.2fr_.6fr_.5fr] items-center px-6 py-4"
              >
                <button
                  onClick={() => navigate(`/chat-bot/${bot.id}`)}
                  className="text-left font-semibold text-slate-800 hover:text-blue-600"
                >
                  {bot.name}
                </button>
                <span className="text-sm text-slate-600">{bot.session_count ?? 0}</span>
                <TriggerPills keywords={bot.trigger_keywords} />
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(bot.is_active)}
                    onChange={() => handleToggle(bot)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-xs text-slate-500">{bot.is_active ? "On" : "Off"}</span>
                </label>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => navigate(`/chat-bot/${bot.id}`)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(bot)}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete Chat Bot"
        max="max-w-md"
        footer={
          <>
            <button className={btnOutline} onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{confirmDelete?.name}</strong>? This removes all nodes and edges.
        </p>
      </Modal>
    </div>
  );
}
