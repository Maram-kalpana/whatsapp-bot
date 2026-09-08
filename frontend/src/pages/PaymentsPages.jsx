import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CreditCard, IndianRupee } from "lucide-react";
import { listWalletTransactions } from "../api/payments";
import { getWebhookLogs } from "../api/dashboard";
import { apiErrorMessage } from "../api/client";
import { Card, PageTitle, btnPrimary } from "../components/UiKit";
import { useBusiness } from "../hooks/useBusiness";

function fmtMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reasonLabel(reason) {
  const map = {
    message_send: "Message send",
    template_fee: "Template fee",
    plan_upgrade: "Plan upgrade",
    order_payment: "Order payment",
    wallet_topup: "Wallet top-up",
  };
  return map[reason] || reason;
}

export function PaymentsHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listWalletTransactions()
      .then(setTransactions)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const topups = transactions.filter((t) => t.type === "topup");
  const totalTopup = topups.reduce((s, t) => s + t.amount, 0);
  const totalDeduction = transactions
    .filter((t) => t.type === "deduction")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Payments History" crumb="Payments • History" />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Top-ups</p>
              <b className="text-2xl">{topups.length}</b>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee />
            </div>
            <div>
              <p className="text-sm text-slate-500">Credits</p>
              <b className="text-2xl">{fmtMoney(totalTopup)}</b>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <IndianRupee />
            </div>
            <div>
              <p className="text-sm text-slate-500">Deductions</p>
              <b className="text-2xl">{fmtMoney(totalDeduction)}</b>
            </div>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th>Type</th>
                <th>Reason</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : transactions.length ? (
                transactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-6 py-4">{fmtDate(t.created_at)}</td>
                    <td className="capitalize">{t.type}</td>
                    <td>{reasonLabel(t.reason)}</td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${t.type === "topup" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {t.type === "topup" ? "+" : "-"}
                      {fmtMoney(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <CreditCard className="mx-auto text-slate-300" size={56} />
                    <h3 className="mt-4 font-bold">No transactions yet</h3>
                    <p className="mt-1 text-sm text-slate-500">Wallet top-ups and message deductions appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function PaymentsSetupPage() {
  return <Navigate to="/e-commerce/payment-setup" replace />;
}

export function AccountBillingPage() {
  const { activeBusiness } = useBusiness();
  const wallet = Number(activeBusiness?.wallet_balance || 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Billing" crumb="Account • Billing" />
      <Card className="max-w-2xl p-6">
        <h2 className="text-lg font-bold">Wallet & Plan</h2>
        <p className="mt-2 text-sm text-slate-500">Manage your wallet balance and subscription plan.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-500">Wallet balance</p>
            <p className="text-2xl font-bold">{fmtMoney(wallet)}</p>
            <Link to="/" className="mt-2 inline-block text-sm font-semibold text-blue-600">
              Add funds on Home →
            </Link>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-slate-500">Current plan</p>
            <p className="text-2xl font-bold capitalize">{activeBusiness?.plan || "trial"}</p>
          </div>
        </div>
        <Link to="/payments/history" className={`${btnPrimary} mt-6 inline-flex`}>
          View transaction history
        </Link>
      </Card>
    </div>
  );
}

export function AccountApiLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWebhookLogs()
      .then(setLogs)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="API Logs" crumb="Account • API Logs" />
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4">Received</th>
                <th>Event</th>
                <th className="px-6 py-4">Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-t align-top">
                    <td className="px-6 py-4 whitespace-nowrap">{fmtDate(log.received_at)}</td>
                    <td className="py-4">{log.event_type}</td>
                    <td className="max-w-md truncate px-6 py-4 font-mono text-xs text-slate-600">
                      {JSON.stringify(log.payload).slice(0, 120)}…
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-500">
                    No webhook logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AccountMessageAnalyticsPage() {
  return <Navigate to="/campaign/broadcast" replace />;
}

export function AccountWebhooksPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Webhooks" crumb="Account • Webhooks" />
      <Card className="max-w-2xl p-6">
        <h2 className="text-lg font-bold">Webhook endpoints</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          WhatsApp and Razorpay webhooks are configured automatically. View incoming events in{" "}
          <Link to="/account/api-logs" className="font-semibold text-blue-600">
            API Logs
          </Link>
          .
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-xs break-all">
          POST /webhooks/whatsapp
        </div>
      </Card>
    </div>
  );
}

export function AccountMetaDirectPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Meta Direct APIs" crumb="Account • Meta Direct APIs" />
      <Card className="max-w-2xl p-6">
        <p className="text-sm text-slate-600">
          Connect your WhatsApp Business Account in{" "}
          <Link to="/account/setup" className="font-semibold text-blue-600">
            Account Setup
          </Link>{" "}
          to use Meta Graph API for messaging, templates, and catalog sync.
        </p>
      </Card>
    </div>
  );
}

export function AccountFoundationPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <PageTitle title="Foundation" crumb="Account • Foundation" />
      <Card className="max-w-2xl p-6">
        <h2 className="text-lg font-bold">Workspace foundation</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>
            ✓{" "}
            <Link to="/account/setup" className="text-blue-600">
              Connect WhatsApp number
            </Link>
          </li>
          <li>
            ✓{" "}
            <Link to="/templates" className="text-blue-600">
              Create message templates
            </Link>
          </li>
          <li>
            ✓{" "}
            <Link to="/contacts" className="text-blue-600">
              Import contacts
            </Link>
          </li>
          <li>
            ✓{" "}
            <Link to="/e-commerce/payment-setup" className="text-blue-600">
              Configure payments
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
