import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Copy,
  Download,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getCatalogSettings,
  listProducts,
  syncCatalogToMeta,
  toggleProductActive,
  updateCatalogSettings,
  updateProduct,
} from "../api/catalog";
import {
  createOrder,
  createOrderCheckout,
  getOrder,
  listOrders,
  updateOrderStatus,
  verifyOrderPayment,
} from "../api/orders";
import {
  getRazorpaySettings,
  loadRazorpayScript,
  razorpayWebhookUrl,
  saveRazorpaySettings,
} from "../api/payments";
import { listContacts } from "../api/contacts";
import { apiErrorMessage, assetUrl } from "../api/client";
import { Card, PageTitle, Field, inputCls, btnPrimary, btnOutline, Modal } from "../components/UiKit";
import { EmptyState } from "../features/more/components/MoreShared";
import { useUiStore } from "../store/uiStore";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function statusCls(status) {
  const map = {
    paid: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-700",
    shipped: "bg-blue-50 text-blue-600",
    cancelled: "bg-rose-50 text-rose-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

function presetRange(key) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (key === "Today") start.setHours(0, 0, 0, 0);
  else if (key === "Yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
  } else if (key === "This Month") start.setDate(1);
  else if (key === "Last Month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (key === "All Time") return { from: null, to: null };
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

const emptyProduct = { name: "", description: "", price: "", sku: "", category: "", is_active: true };

export function CatalogSettingPage() {
  const [settings, setSettings] = useState({ meta_catalog_id: "", synced_products: 0 });
  const [catalogId, setCatalogId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const s = await getCatalogSettings();
      setSettings(s);
      setCatalogId(s.meta_catalog_id || "");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const s = await updateCatalogSettings({ meta_catalog_id: catalogId || null });
      setSettings(s);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    try {
      setSyncing(true);
      setError("");
      const result = await syncCatalogToMeta();
      setSyncResult(result);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Catalog Setting" crumb="E-Commerce • Catalog Setting" />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <Card className="overflow-hidden">
        <div className="border-b px-6 py-5">
          <h3 className="font-bold">WhatsApp Catalog</h3>
          <p className="mt-1 text-sm text-slate-500">
            Connect a Meta commerce catalog and sync your products for WhatsApp catalogue messages.
          </p>
        </div>
        <div className="space-y-5 p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              <Field label="Meta Catalog ID" hint="From Meta Commerce Manager, or leave blank to auto-create on sync">
                <input className={inputCls} value={catalogId} onChange={(e) => setCatalogId(e.target.value)} placeholder="e.g. 123456789012345" />
              </Field>
              <p className="text-sm text-slate-600">
                Synced products: <strong>{settings.synced_products ?? 0}</strong>
                {settings.meta_catalog_id && (
                  <> · Catalog ID: <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">{settings.meta_catalog_id}</code></>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={save} disabled={saving} className={btnOutline}>{saving ? "Saving…" : "Save Catalog ID"}</button>
                <button onClick={sync} disabled={syncing} className={btnPrimary}>
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing…" : "Sync to Meta Catalog"}
                </button>
              </div>
              {syncResult && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Synced {syncResult.synced} product(s){syncResult.failed ? `, ${syncResult.failed} failed` : ""}.
                  {syncResult.meta_catalog_id && <> Meta catalog: <strong>{syncResult.meta_catalog_id}</strong></>}
                </p>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export function CatalogManagementPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setProducts(await listProducts({ q: query || undefined }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, sku: p.sku, category: p.category, is_active: p.is_active });
    setImageFile(null);
    setOpen(true);
  };

  const submit = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description || "");
      fd.append("price", String(form.price));
      fd.append("sku", form.sku || "");
      fd.append("category", form.category || "");
      fd.append("is_active", String(form.is_active));
      if (imageFile) fd.append("image", imageFile);
      if (editing) await updateProduct(editing.id, fd);
      else await createProduct(fd);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="Catalog Management"
        crumb="E-Commerce • Catalog Management"
        action={<button onClick={openCreate} className={btnPrimary}><Plus size={18} /> Add Product</button>}
      />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." />
          </div>
          <button onClick={load} className={btnOutline}><RefreshCw size={17} /> Refresh</button>
        </div>
        {loading ? (
          <div className="p-8 text-sm text-slate-500">Loading products…</div>
        ) : filtered.length ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="grid h-36 place-items-center bg-slate-50">
                  {p.image_url ? (
                    <img src={assetUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="text-slate-300" size={42} />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{p.name}</h3>
                    <label className="shrink-0">
                      <input
                        type="checkbox"
                        checked={p.is_active}
                        onChange={async () => {
                          await toggleProductActive(p.id, !p.is_active);
                          load();
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{fmtMoney(p.price)} · {p.sku || "No SKU"}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.category || "Uncategorized"}</p>
                  {p.meta_product_id && (
                    <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">Synced</span>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-sm font-medium text-blue-600">Edit</button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this product?")) {
                          await deleteProduct(p.id);
                          load();
                        }
                      }}
                      className="text-sm text-rose-500"
                    >
                      <Trash2 size={14} className="inline" /> Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title="No Products Available" description="Add products to manage your WhatsApp catalog." />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
        max="max-w-lg"
        footer={
          <>
            <button className={btnOutline} onClick={() => setOpen(false)}>Cancel</button>
            <button className={btnPrimary} disabled={!form.name || !form.price || saving} onClick={submit}>
              {saving ? "Saving…" : editing ? "Update" : "Add Product"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Product Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><textarea className={`${inputCls} min-h-20`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Price (INR)"><input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="SKU"><input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Category"><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Image"><input type="file" accept="image/*" className={inputCls} onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>
      </Modal>
    </div>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setOrders(await listOrders({ from: from || undefined, to: to || undefined, q: query || undefined }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [from, to]);

  const openDetail = async (id) => {
    try {
      setDetail(await getOrder(id));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const createTestOrder = async () => {
    try {
      setCreating(true);
      const contacts = await listContacts({ pageSize: 1 });
      const contact = contacts.items?.[0];
      if (!contact) {
        setError("Add at least one contact before creating a test order.");
        return;
      }
      const products = await listProducts({ active: "true" });
      if (!products.length) {
        setError("Add at least one active product first.");
        return;
      }
      const p = products[0];
      const order = await createOrder({
        contact_id: contact.id,
        items: [{ product_id: p.id, name: p.name, price: p.price, sku: p.sku, quantity: 1 }],
        payment_provider: "razorpay",
      });
      await load();
      setDetail(order);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const payOrder = async (order) => {
    try {
      setPaying(true);
      setError("");
      const checkout = await createOrderCheckout(order.id);
      const Razorpay = await loadRazorpayScript();
      const rzp = new Razorpay({
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "heights",
        description: `Order #${order.id}`,
        order_id: checkout.razorpay_order_id,
        handler: async (response) => {
          try {
            const updated = await verifyOrderPayment(order.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setDetail(updated);
            await load();
          } catch (err) {
            setError(apiErrorMessage(err, "Payment verification failed"));
          }
        },
      });
      rzp.open();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not start Razorpay checkout"));
    } finally {
      setPaying(false);
    }
  };

  const applyPreset = (key) => {
    const range = presetRange(key);
    setFrom(range.from || "");
    setTo(range.to || "");
    setDateOpen(false);
  };

  const dateLabel = from && to ? `${fmtDate(from)} → ${fmtDate(to)}` : from ? `From ${fmtDate(from)}` : to ? `Until ${fmtDate(to)}` : "All dates";

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle
        title="Orders"
        crumb="E-Commerce • Orders"
        action={
          <button onClick={createTestOrder} disabled={creating} className={btnPrimary}>
            {creating ? "Creating…" : "Create Test Order"}
          </button>
        }
      />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
          <button onClick={() => setDateOpen(true)} className={`${btnOutline} justify-start lg:min-w-[270px]`}>
            <Calendar size={17} /> {dateLabel}
          </button>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputCls} pl-10`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search orders..."
            />
          </div>
          <button onClick={load} className={btnOutline}><Download size={17} /> Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#f3f8fa] text-sm text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-sm text-slate-500">Loading orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-sm text-slate-500">No orders found.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr className="border-t border-slate-100" key={o.id}>
                    <td className="px-6 py-4">{fmtDate(o.created_at)}</td>
                    <td className="font-semibold">#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>
                      <select
                        value={o.status}
                        onChange={async (e) => {
                          await updateOrderStatus(o.id, e.target.value);
                          load();
                        }}
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize ${statusCls(o.status)}`}
                      >
                        {["pending", "paid", "shipped", "cancelled"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>{fmtMoney(o.total_amount)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => openDetail(o.id)} className="text-sm font-medium text-blue-600">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={dateOpen} onClose={() => setDateOpen(false)} title="Select Date Range" max="max-w-3xl" footer={<button className={btnPrimary} onClick={() => setDateOpen(false)}>Close</button>}>
        <div className="grid gap-5 md:grid-cols-[150px_1fr]">
          <div className="space-y-1 text-sm">
            {["Today", "Yesterday", "This Week", "This Month", "Last Month", "All Time"].map((x) => (
              <button key={x} onClick={() => applyPreset(x)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50">{x}</button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Order #${detail?.id}`}
        max="max-w-2xl"
        footer={
          detail?.status === "pending" ? (
            <button onClick={() => payOrder(detail)} disabled={paying} className={btnPrimary}>
              {paying ? "Opening…" : "Pay with Razorpay (Test)"}
            </button>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-slate-500">Customer:</span> {detail.customer_name}</p>
              <p><span className="text-slate-500">Phone:</span> {detail.customer_phone}</p>
              <p><span className="text-slate-500">Status:</span> <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusCls(detail.status)}`}>{detail.status}</span></p>
              <p><span className="text-slate-500">Total:</span> {fmtMoney(detail.total_amount)}</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Line items</h4>
              <div className="divide-y rounded-xl border">
                {(detail.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">SKU: {item.sku || "—"} · Qty: {item.quantity || 1}</p>
                    </div>
                    <p>{fmtMoney(Number(item.price) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function PaymentSetupPage() {
  const businessId = useUiStore((s) => s.activeBusinessId);
  const [setting, setSetting] = useState({ configured: false, key_id: "" });
  const [form, setForm] = useState({ key_id: "", key_secret: "", webhook_secret: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await getRazorpaySettings();
        setSetting(s);
        setForm((f) => ({ ...f, key_id: s.key_id || "" }));
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const s = await saveRazorpaySettings(form);
      setSetting(s);
      setForm((f) => ({ ...f, key_secret: "", webhook_secret: "" }));
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl = businessId ? razorpayWebhookUrl(businessId) : "";

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Payments Configuration" crumb="E-Commerce • Payment Setup" />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      {saved && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Razorpay settings saved. Keys are encrypted at rest.</p>}
      <Card className="max-w-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShoppingBag size={22} /></div>
          <div>
            <h3 className="font-bold">Razorpay</h3>
            <p className="text-sm text-slate-500">{setting.configured ? "Configured" : "Not configured"} · Use test keys from Razorpay Dashboard</p>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            <Field label="Key ID"><input className={inputCls} value={form.key_id} onChange={(e) => setForm({ ...form, key_id: e.target.value })} placeholder="rzp_test_..." /></Field>
            <Field label="Key Secret" hint="Stored encrypted — leave blank to keep existing secret"><input type="password" className={inputCls} value={form.key_secret} onChange={(e) => setForm({ ...form, key_secret: e.target.value })} placeholder={setting.configured ? "••••••••" : "Enter secret"} /></Field>
            <Field label="Webhook Secret (optional)"><input type="password" className={inputCls} value={form.webhook_secret} onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })} /></Field>
            {webhookUrl && (
              <Field label="Webhook URL" hint="Add this in Razorpay Dashboard → Webhooks">
                <div className="flex gap-2">
                  <input readOnly className={`${inputCls} font-mono text-xs`} value={webhookUrl} />
                  <button type="button" className={btnOutline} onClick={() => navigator.clipboard?.writeText(webhookUrl)}><Copy size={15} /></button>
                </div>
              </Field>
            )}
            <button onClick={save} disabled={saving || !form.key_id} className={btnPrimary}>{saving ? "Saving…" : "Save Configuration"}</button>
          </div>
        )}
      </Card>
    </div>
  );
}
