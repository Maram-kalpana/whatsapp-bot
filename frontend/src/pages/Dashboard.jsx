import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardSummary } from "../api/dashboard";
import {
  createWalletTopup,
  loadRazorpayScript,
  verifyWalletTopup,
} from "../api/payments";
import { listBusinesses } from "../api/businesses";
import { apiErrorMessage, assetUrl } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useBusiness } from "../hooks/useBusiness";
import { Modal, Field, inputCls, btnPrimary, btnOutline } from "../components/UiKit";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100";

function fmtMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtShortDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function QualityGauge({ quality }) {
  const pct = quality?.pct ?? 0;
  const color = quality?.color ?? "#10b981";
  const dash = (pct / 100) * 126;
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium text-slate-700">Quality Score</p>
      <div className="relative mt-4 h-[96px] w-[170px]">
        <svg viewBox="0 0 170 96" className="h-full w-full">
          <path d="M15 80 A70 70 0 0 1 155 80" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M15 80 A70 70 0 0 1 155 80"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} 200`}
          />
        </svg>
        <div className="absolute inset-x-0 top-10 text-center">
          <p className="text-sm font-semibold">{quality?.label || "—"}</p>
        </div>
      </div>
      <p className="-mt-1 text-xs font-medium text-slate-600">{quality?.label} Quality</p>
    </div>
  );
}

function LimitsChart({ dailyLimits }) {
  const data = (dailyLimits?.tiers || []).map((t) => ({
    name: t.label,
    cap: t.cap ?? (dailyLimits?.sent_today || 0),
    active: t.active,
    fill: t.active ? "#2563eb" : "#e2e8f0",
  }));

  return (
    <div className="flex h-full flex-col">
      <p className="text-center text-sm font-medium">Limits Per Day</p>
      <p className="mt-1 text-center text-xs text-slate-500">
        Sent today: {dailyLimits?.sent_today ?? 0}
        {dailyLimits?.cap ? ` / ${dailyLimits.cap}` : " (unlimited tier)"}
      </p>
      <div className="mt-2 min-h-[120px] flex-1">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => [v, "Tier cap"]} />
            <Bar dataKey="cap" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.active ? "#2563eb" : "#e2e8f0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BroadcastDonut({ broadcast }) {
  const slices = useMemo(() => {
    if (!broadcast) return [];
    const sent = broadcast.sent || 0;
    const delivered = broadcast.delivered || 0;
    const failed = broadcast.failed || 0;
    const pending = Math.max(0, (broadcast.total || 0) - sent - failed);
    return [
      { name: "Delivered", value: delivered, color: "#10b981" },
      { name: "Sent", value: Math.max(0, sent - delivered), color: "#3b82f6" },
      { name: "Failed", value: failed, color: "#ef4444" },
      { name: "Pending", value: pending, color: "#e2e8f0" },
    ].filter((s) => s.value > 0);
  }, [broadcast]);

  const total = broadcast?.total || 0;
  const pct = total ? Math.round(((broadcast?.delivered || 0) / total) * 100) : 0;

  if (!broadcast) {
    return (
      <section className={`${card} p-5`}>
        <h3 className="text-lg font-bold">Broadcast</h3>
        <p className="mt-8 text-center text-sm text-slate-500">No broadcasts yet</p>
      </section>
    );
  }

  return (
    <section className={`${card} p-5`}>
      <div className="grid gap-5 xl:grid-cols-[1fr_210px]">
        <div>
          <h3 className="text-lg font-bold">Broadcast</h3>
          <p className="mt-1 text-sm">{broadcast.name}</p>
          <p className="text-xs text-slate-400">{broadcast.status}</p>
          <Link to="/campaign/broadcast" className="mt-3 inline-block text-xs font-semibold text-blue-600">
            View all broadcasts →
          </Link>
        </div>
        <div className="relative mx-auto h-36 w-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={2}>
                {slices.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[10px] text-slate-500">Delivered</p>
              <p className="text-sm font-bold">{pct}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        {slices.map((s) => (
          <span key={s.name} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}: {s.value}
          </span>
        ))}
      </div>
    </section>
  );
}

function TrendChart({ title, total, data, color }) {
  const chartData = (data || []).map((d) => ({
    ...d,
    label: fmtShortDate(d.date),
  }));

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-2xl font-bold">{total ?? 0}</p>
      <div className="mt-2 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AddFundsModal({ open, onClose, onSuccess }) {
  const [amount, setAmount] = useState("500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    try {
      setBusy(true);
      setError("");
      const credit = Number(amount);
      if (!credit || credit < 1) {
        setError("Enter at least ₹1");
        return;
      }
      const checkout = await createWalletTopup(credit);
      const Razorpay = await loadRazorpayScript();
      const rzp = new Razorpay({
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "heights",
        description: "Wallet top-up",
        order_id: checkout.razorpay_order_id,
        handler: async (response) => {
          try {
            const result = await verifyWalletTopup({
              amount: credit,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const businesses = await listBusinesses();
            useAuthStore.getState().setBusinesses(businesses);
            onSuccess(result.wallet_balance);
            onClose();
          } catch (err) {
            setError(apiErrorMessage(err, "Payment verification failed"));
          }
        },
      });
      rzp.open();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not start checkout"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Funds"
      max="max-w-md"
      footer={
        <>
          <button className={btnOutline} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} disabled={busy} onClick={pay}>
            {busy ? "Processing…" : "Pay with Razorpay"}
          </button>
        </>
      }
    >
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      <Field label="Amount (INR)">
        <input
          className={inputCls}
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
        />
      </Field>
      <p className="mt-2 text-xs text-slate-500">Funds are credited to your wallet after successful payment.</p>
    </Modal>
  );
}

export default function Dashboard() {
  const { activeBusiness } = useBusiness();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fundsOpen, setFundsOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSummary(await getDashboardSummary());
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, activeBusiness?.id]);

  const name = summary?.business?.name || activeBusiness?.name || "your business";
  const initials = name.slice(0, 2).toUpperCase();
  const wallet = summary?.wallet_balance ?? activeBusiness?.wallet_balance ?? 0;

  const trialEnds = summary?.trial_ends_at ? new Date(summary.trial_ends_at) : null;
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const trialProgress = trialEnds
    ? Math.min(100, Math.max(0, 100 - (trialDaysLeft / 30) * 100))
    : 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="dashboard-grid p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl">🌤️</span>
          <h1 className="text-base font-bold">
            {greeting}, <span className="font-normal">{name}!</span>
          </h1>
        </div>

        {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

        <div className="grid gap-4 xl:grid-cols-[1.2fr_1.6fr_1.2fr]">
          <section className="relative min-h-[185px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#1195f5] to-[#087fe1] p-6 text-white shadow-lg shadow-blue-100">
            <p className="text-xl">Wallet Balance</p>
            <p className="mt-1 text-3xl font-bold">{loading ? "…" : fmtMoney(wallet)}</p>
            <button
              onClick={() => setFundsOpen(true)}
              className="mt-8 rounded-lg border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Add Funds
            </button>
            <div className="absolute -bottom-4 right-1 text-[112px] drop-shadow-xl">🧑‍💼</div>
          </section>

          <section className={`${card} grid min-h-[185px] grid-cols-2 divide-x divide-slate-100 p-5`}>
            <QualityGauge quality={summary?.quality} />
            <LimitsChart dailyLimits={summary?.daily_limits} />
          </section>

          <section className={`${card} relative overflow-hidden p-5`}>
            <div className="flex items-center gap-4">
              {summary?.business?.logo_url || activeBusiness?.logo_url ? (
                <img
                  src={assetUrl(summary?.business?.logo_url || activeBusiness?.logo_url)}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full border border-red-200 text-[10px] font-bold text-red-500">
                  {initials}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="font-semibold text-blue-600">
                  {summary?.business?.industry || activeBusiness?.industry || "WhatsApp Business"}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link to="/account/settings" className="rounded-md bg-black px-4 py-1.5 text-xs text-white">
                    View Profile
                  </Link>
                  <span className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-semibold capitalize text-emerald-600">
                    ● {summary?.plan || activeBusiness?.plan || "trial"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.9fr_1fr]">
          <section className={`${card} min-h-[320px] overflow-hidden`}>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-bold">Focus Area</h3>
              <Link to="/campaign/broadcast" className="text-xs font-semibold text-blue-600">
                View campaigns
              </Link>
            </div>
            <div className="grid grid-cols-[1.8fr_.7fr_.7fr_.6fr] bg-slate-50 px-5 py-3 text-xs font-semibold">
              <span>Title</span>
              <span>Recipients</span>
              <span>Delivered</span>
              <span className="text-right">Amount</span>
            </div>
            {loading ? (
              <p className="px-5 py-8 text-sm text-slate-500">Loading campaigns…</p>
            ) : summary?.recent_campaigns?.length ? (
              summary.recent_campaigns.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1.8fr_.7fr_.7fr_.6fr] items-center border-t px-5 py-4 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-fuchsia-50">
                      {c.type === "drip" ? "💧" : "📢"}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span>{c.recipients}</span>
                  <span>{c.delivered}</span>
                  <span className="text-right font-semibold">{fmtMoney(c.amount)}</span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-sm text-slate-500">No campaigns yet</p>
            )}
          </section>

          <div className="space-y-4">
            <BroadcastDonut broadcast={summary?.latest_broadcast} />
            <div className="grid gap-3">
              <TrendChart
                title="Leads (30 days)"
                total={summary?.totals?.leads}
                data={summary?.leads_trend}
                color="#8b5cf6"
              />
              <TrendChart
                title="Contacts (30 days)"
                total={summary?.totals?.contacts}
                data={summary?.contacts_trend}
                color="#f59e0b"
              />
            </div>
          </div>

          <div className="space-y-4">
            <section className={`${card} p-5`}>
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold capitalize">{summary?.plan || "trial"} Plan</h3>
                  <p className="text-xs text-slate-500">
                    {trialEnds ? `Valid till ${fmtDate(trialEnds)}` : "Trial period active"}
                  </p>
                </div>
                <Link to="/account/billing" className="h-8 rounded-md border border-blue-500 px-3 text-xs leading-8 text-blue-600">
                  Upgrade / Renew
                </Link>
              </div>
              <div className="mt-7 h-1 rounded-full bg-slate-100">
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${trialProgress}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                <span>Today</span>
                <span>
                  {trialDaysLeft} days left
                  <br />
                  {summary?.plan || "trial"}
                </span>
              </div>
            </section>

            <section className={`${card} p-5`}>
              <h3 className="font-semibold">Usage</h3>
              <p className="mt-2 text-sm text-slate-600">
                Message cost: {fmtMoney(summary?.message_cost ?? 1)} per send
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sends are blocked when wallet balance would go negative.
              </p>
              <Link to="/payments/history" className="mt-4 inline-block text-xs font-semibold text-blue-600">
                View payment history →
              </Link>
            </section>
          </div>
        </div>
      </div>

      <AddFundsModal
        open={fundsOpen}
        onClose={() => setFundsOpen(false)}
        onSuccess={(balance) => {
          setSummary((s) => (s ? { ...s, wallet_balance: balance } : s));
          load();
        }}
      />
    </div>
  );
}
