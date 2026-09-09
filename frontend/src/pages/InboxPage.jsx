import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Search,
  UserRound,
  CircleDot,
  Tag,
  MailPlus,
  X,
  Image,
  Smile,
  Paperclip,
  Send,
} from "lucide-react";
import { getInboxMessages, listConversations, markInboxRead, openInbox, sendInboxMessage } from "../api/inbox";
import { listContacts } from "../api/contacts";
import { apiErrorMessage } from "../api/client";
import { btnOutline, btnPrimary, Field, inputCls, Modal } from "../components/UiKit";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { io } from "socket.io-client";

const AVATAR = ["bg-red-500", "bg-orange-500", "bg-fuchsia-600", "bg-blue-500", "bg-pink-600", "bg-red-800"];

function avatarColor(name) {
  const n = String(name || "C")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR[n % AVATAR.length];
}

function previewText(message) {
  if (!message) return "No messages yet";
  const c = message.content || {};
  if (c.text) return c.text;
  if (c.template) return `Template: ${c.template}`;
  if (c.caption) return c.caption;
  if (message.type && message.type !== "text") return message.type;
  return "New message";
}

function fmtTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

let inboxSocket = null;

function useInboxSocket(onMessage) {
  const token = useAuthStore((s) => s.accessToken);
  const businessId = useUiStore((s) => s.activeBusinessId);

  useEffect(() => {
    if (!token || !businessId || !onMessage) return undefined;
    if (!inboxSocket) {
      inboxSocket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000", {
        auth: { token },
        withCredentials: true,
      });
    } else if (!inboxSocket.connected) {
      inboxSocket.auth = { token };
      inboxSocket.connect();
    }
    const socket = inboxSocket;
    const join = () => socket.emit("join-business", businessId);
    socket.on("connect", join);
    if (socket.connected) join();
    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("connect", join);
    };
  }, [token, businessId, onMessage]);
}

function CreateInboxModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("existing");
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone_number: "" });

  useEffect(() => {
    const t = setTimeout(() => {
      listContacts({ q: query || undefined, pageSize: 40 })
        .then((data) => setContacts(data.items || []))
        .catch(() => setContacts([]));
    }, query ? 200 : 0);
    return () => clearTimeout(t);
  }, [query]);

  const openExisting = async (contact) => {
    setBusy(true);
    setError("");
    try {
      const conversation = await openInbox({ contact_id: contact.id });
      onCreated(conversation);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not open inbox"));
    } finally {
      setBusy(false);
    }
  };

  const createNew = async () => {
    if (!form.name.trim() || !form.phone_number.trim()) return;
    setBusy(true);
    setError("");
    try {
      const conversation = await openInbox({
        name: form.name.trim(),
        phone_number: form.phone_number.trim(),
      });
      onCreated(conversation);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create inbox"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create WhatsApp Inbox"
      max="max-w-lg"
      footer={
        <>
          <button type="button" className={btnOutline} onClick={onClose}>
            Cancel
          </button>
          {tab === "new" && (
            <button type="button" className={btnPrimary} disabled={busy || !form.name.trim() || !form.phone_number.trim()} onClick={createNew}>
              {busy ? "Opening…" : "Open conversation"}
            </button>
          )}
        </>
      }
    >
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab("existing")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === "existing" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          Existing contact
        </button>
        <button type="button" onClick={() => setTab("new")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === "new" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          New contact
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {tab === "existing" ? (
        <div>
          <label className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full outline-none" placeholder="Search contacts…" />
          </label>
          <div className="soft-scrollbar max-h-72 space-y-1 overflow-y-auto">
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => openExisting(c)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-blue-50"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white ${avatarColor(c.name)}`}>
                  {(c.name || "C")[0]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.name}</span>
                  <span className="block truncate text-xs text-slate-500">{c.phone_number}</span>
                </span>
              </button>
            ))}
            {!contacts.length && <p className="py-8 text-center text-sm text-slate-500">No contacts found. Create one on the New contact tab.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
          </Field>
          <Field label="WhatsApp number">
            <input className={inputCls} value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="919876543210" />
          </Field>
        </div>
      )}
    </Modal>
  );
}

export default function InboxPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [popover, setPopover] = useState(null);
  const [collapsedList, setCollapsedList] = useState(false);
  const [rows, setRows] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const loadList = useCallback(async (q) => {
    try {
      const conversations = await listConversations({ q: q || undefined });
      setRows(conversations);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load inbox"));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadList(search), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [loadList, search]);

  const openThread = useCallback(async (id) => {
    setActiveId(id);
    try {
      const data = await getInboxMessages(id);
      setThread(data.messages || []);
      markInboxRead(id).catch(() => {});
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, unread_count: 0 } : r)));
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load messages"));
    }
  }, []);

  const onSocket = useCallback(
    (payload) => {
      if (!payload) return;
      loadList(search);
      if (payload.conversationId === activeId) {
        setThread((prev) => {
          if (payload.message && prev.some((m) => m.id === payload.message.id)) return prev;
          return payload.message ? [...prev, payload.message] : prev;
        });
      }
    },
    [activeId, loadList, search],
  );
  useInboxSocket(onSocket);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, activeId]);

  const active = useMemo(() => rows.find((r) => r.id === activeId) || null, [rows, activeId]);

  const send = async () => {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const message = await sendInboxMessage(activeId, { text: draft.trim() });
      setThread((prev) => [...prev, message]);
      setDraft("");
      loadList(search);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send message"));
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file) => {
    if (!activeId || !file) return;
    setSending(true);
    try {
      const message = await sendInboxMessage(activeId, { file, caption: draft.trim() || undefined });
      setThread((prev) => [...prev, message]);
      setDraft("");
      loadList(search);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send media"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">WhatsApp</span> &nbsp;•&nbsp; Inbox
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#0795eb] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100"
          >
            <MailPlus size={17} />
            Create WhatsApp Inbox
          </button>
        </div>
        {error && <p className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <section className={`relative shrink-0 border-r border-slate-200 transition-all duration-300 ${collapsedList ? "w-[86px]" : "w-full sm:w-[380px]"} ${active && !collapsedList ? "hidden sm:block" : ""}`}>
            <div className={`flex h-[72px] items-center gap-5 border-b border-slate-100 ${collapsedList ? "justify-center px-2" : "px-6"}`}>
              <button type="button" onClick={() => setCollapsedList((v) => !v)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                <ChevronLeft size={21} className={`transition ${collapsedList ? "rotate-180" : ""}`} />
              </button>
              {!collapsedList && (
                <>
                  <button type="button" onClick={() => setSearchOpen((v) => !v)} className={`grid h-9 w-9 place-items-center rounded-full ${searchOpen ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-100"}`}>
                    <Search size={20} />
                  </button>
                  <button type="button" onClick={() => setPopover(popover === "agent" ? null : "agent")} className="relative grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                    <UserRound size={20} />
                  </button>
                  <button type="button" onClick={() => setPopover(popover === "status" ? null : "status")} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                    <CircleDot size={20} />
                  </button>
                  <button type="button" onClick={() => setPopover(popover === "tag" ? null : "tag")} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                    <Tag size={20} />
                  </button>
                </>
              )}
            </div>
            {!collapsedList && searchOpen && (
              <div className="px-5 py-3">
                <label className="flex h-11 items-center gap-2 rounded-xl border-2 border-blue-500 px-3">
                  <Search size={17} className="text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus className="min-w-0 flex-1 text-sm outline-none" placeholder="Search conversations..." />
                </label>
              </div>
            )}
            {!collapsedList && popover && (
              <div className="absolute left-[110px] top-[62px] z-30 w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{popover === "agent" ? "Agents" : popover === "status" ? "Status" : "Tags"}</h3>
                  <button type="button" onClick={() => setPopover(null)}>
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-500">Filters apply on the live conversation list.</p>
              </div>
            )}
            <div className="soft-scrollbar h-[600px] overflow-y-auto py-2">
              {rows.map((c) => {
                const name = c.contact?.name || "Unknown";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openThread(c.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 ${activeId === c.id ? "bg-blue-50/70" : ""} ${collapsedList ? "justify-center px-2" : ""}`}
                  >
                    <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl text-white ${avatarColor(name)}`}>
                      {name[0]}
                      {c.unread_count > 0 && (
                        <span className={`absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold ${collapsedList ? "block" : "hidden"}`}>
                          {c.unread_count}
                        </span>
                      )}
                    </span>
                    {!collapsedList && (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{name}</span>
                          <span className="block truncate text-sm text-slate-500">{previewText(c.last_message)}</span>
                        </span>
                        <span className="self-start text-right">
                          <span className="block text-[11px] text-slate-400">{fmtTime(c.last_message_at)}</span>
                          {c.unread_count > 0 && (
                            <span className="mt-3 inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#1495e7] px-1 text-[10px] text-white">{c.unread_count}</span>
                          )}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
              {!rows.length && <p className="px-6 py-10 text-sm text-slate-500">No conversations yet. Create a WhatsApp inbox to start chatting.</p>}
            </div>
          </section>
          <section className={`relative min-w-0 flex-1 bg-white ${!active ? "hidden sm:block" : ""}`}>
            {active ? (
              <>
                <div className="flex h-[86px] items-center gap-3 border-b border-slate-200 px-5">
                  <button type="button" onClick={() => setActiveId(null)} className="sm:hidden">
                    <ChevronLeft />
                  </button>
                  <span className={`grid h-12 w-12 place-items-center rounded-full text-white ${avatarColor(active.contact?.name)}`}>
                    {(active.contact?.name || "?")[0]}
                  </span>
                  <div>
                    <h3 className="font-semibold">{active.contact?.name}</h3>
                    <p className="text-xs text-slate-500">{active.contact?.phone_number}</p>
                  </div>
                </div>
                <div className="soft-scrollbar h-[515px] space-y-3 overflow-y-auto bg-slate-50 px-5 py-4">
                  {thread.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.direction === "outbound" ? "bg-blue-600 text-white" : "bg-white text-slate-800"}`}>
                        {previewText(m)}
                        <p className={`mt-1 text-[10px] ${m.direction === "outbound" ? "text-blue-100" : "text-slate-400"}`}>
                          {fmtTime(m.created_at)} {m.status ? `• ${m.status}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-16 items-center gap-3 border-t bg-white px-4">
                  <Smile className="text-slate-400" />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="h-10 min-w-0 flex-1 rounded-xl bg-slate-50 px-4 outline-none"
                    placeholder="Type a message"
                  />
                  <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf" onChange={(e) => sendFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-slate-400">
                    <Image size={20} />
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-slate-400">
                    <Paperclip size={20} />
                  </button>
                  <button type="button" disabled={sending || !draft.trim()} onClick={send} className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white disabled:opacity-40">
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-500">Select a conversation or create a WhatsApp inbox</div>
            )}
          </section>
        </div>
      </div>
      {createOpen && (
        <CreateInboxModal
          onClose={() => setCreateOpen(false)}
          onCreated={(conversation) => {
            setCreateOpen(false);
            setRows((prev) => [conversation, ...prev.filter((r) => r.id !== conversation.id)]);
            openThread(conversation.id);
          }}
        />
      )}
    </div>
  );
}
