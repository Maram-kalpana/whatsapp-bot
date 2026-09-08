import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Magnet, Plus, Trash2 } from "lucide-react";
import {
  createLeadMagnet,
  deleteLeadMagnet,
  listLeadMagnets,
  publicCaptureUrl,
} from "../api/leadMagnets";
import { apiErrorMessage } from "../api/client";
import { btnOutline, btnPrimary, Card, Modal, PageTitle } from "../components/UiKit";
import { EmptyState } from "../features/more/components/MoreShared";

export default function LeadMagnetsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setItems(await listLeadMagnets());
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load lead magnets"));
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
      const magnet = await createLeadMagnet({
        name: "New Lead Magnet",
        form_fields: [
          { id: "name", type: "text", label: "Full Name", required: true },
          { id: "email", type: "email", label: "Email", required: true },
        ],
        thank_you_message: "Thank you! We'll be in touch soon.",
      });
      navigate(`/lead-magnets/${magnet.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to create lead magnet"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLeadMagnet(confirmDelete.id);
      setItems((arr) => arr.filter((x) => x.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete lead magnet"));
    }
  };

  const copyLink = async (slug) => {
    const url = publicCaptureUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="Lead Magnets"
        crumb="WhatsApp • Lead Magnets"
        action={
          <button onClick={handleCreate} disabled={creating} className={btnPrimary}>
            <Plus size={18} /> {creating ? "Creating…" : "Create Lead Magnet"}
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_.8fr_.6fr] bg-[#f3f8fa] px-6 py-4 text-sm font-medium text-slate-600">
          <span>Name</span>
          <span>Public Link</span>
          <span>Fields</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Magnet} title="No Lead Magnets" description="Create a capture form to collect leads from your website." />
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.4fr_1fr_.8fr_.6fr] items-center px-6 py-4">
                <button
                  onClick={() => navigate(`/lead-magnets/${item.id}`)}
                  className="text-left font-semibold text-slate-800 hover:text-blue-600"
                >
                  {item.name}
                </button>
                <button
                  onClick={() => copyLink(item.public_slug)}
                  className="inline-flex items-center gap-1 truncate text-left text-xs text-blue-600 hover:underline"
                >
                  <Copy size={14} /> /capture/{item.public_slug}
                </button>
                <span className="text-sm text-slate-600">{(item.form_fields || []).length} fields</span>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => navigate(`/lead-magnets/${item.id}`)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item)}
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
        title="Delete Lead Magnet"
        max="max-w-md"
        footer={
          <>
            <button className={btnOutline} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Delete <strong>{confirmDelete?.name}</strong>?</p>
      </Modal>
    </div>
  );
}
