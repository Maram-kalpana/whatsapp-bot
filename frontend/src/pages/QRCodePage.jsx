import { useEffect, useMemo, useState } from "react";
import { Download, QrCode, RefreshCw } from "lucide-react";
import { listWhatsappNumbers } from "../api/whatsappNumbers";

function digitsPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function waLink({ phone, message }) {
  const to = digitsPhone(phone);
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${to}${text ? `?text=${text}` : ""}`;
}

function qrMatrix(seed) {
  return Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder = (ox, oy) =>
      x >= ox &&
      x < ox + 7 &&
      y >= oy &&
      y < oy + 7 &&
      (x === ox || x === ox + 6 || y === oy || y === oy + 6 || (x >= ox + 2 && x <= ox + 4 && y >= oy + 2 && y <= oy + 4));
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true;
    const n = (i * 17 + seed.length * 13 + (seed.charCodeAt(i % Math.max(1, seed.length)) || 7)) % 11;
    return n < 5;
  });
}

function FakeQR({ seed }) {
  const cells = useMemo(() => qrMatrix(seed), [seed]);
  return (
    <div className="grid aspect-square w-full grid-cols-[repeat(21,1fr)] bg-white p-3 shadow-inner">
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-slate-950" : "bg-white"} />
      ))}
    </div>
  );
}

function downloadQrPng(seed, filename) {
  const cells = qrMatrix(seed);
  const cell = 12;
  const pad = 24;
  const size = 21 * cell + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#0f172a";
  cells.forEach((on, i) => {
    if (!on) return;
    const x = (i % 21) * cell + pad;
    const y = Math.floor(i / 21) * cell + pad;
    ctx.fillRect(x, y, cell, cell);
  });
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

export default function QRCodePage() {
  const [form, setForm] = useState({ name: "", message: "", phone: "" });
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));
  const seed = `${form.name}|${form.message}|${form.phone}`;
  const link = waLink(form);

  useEffect(() => {
    listWhatsappNumbers()
      .then((rows) => {
        const first = rows?.[0];
        if (first?.phone_number) setForm((f) => ({ ...f, phone: f.phone || first.phone_number }));
      })
      .catch(() => {});
  }, []);

  const generate = () => {
    setError("");
    if (!digitsPhone(form.phone)) {
      setError("Enter a WhatsApp number first.");
      return;
    }
    setGenerated(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Create QR Code</h1>
        <p className="mt-1 text-sm text-slate-500">
          WhatsApp <span className="mx-1">•</span> QR Code <span className="mx-1">•</span> Create QR Code
        </p>
      </div>
      {error && <p className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="mb-6 flex gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
          <QrCode size={25} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Create your WhatsApp QR Code</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fill in the details below to generate a WhatsApp QR that opens a chat with your pre-filled message.
          </p>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium">Link Name</span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Feedback Form"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium">Pre-filled Message</span>
              <input
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Enter the message that will appear when QR is scanned."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium">WhatsApp Number</span>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="919876543210"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={() => {
                setForm({ name: "", message: "", phone: form.phone });
                setGenerated(false);
                setError("");
              }}
              className="rounded-xl border px-5 py-2.5 font-medium"
            >
              Cancel
            </button>
            <button type="button" onClick={generate} className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white">
              Generate QR Code
            </button>
          </div>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="mb-4 text-sm font-semibold text-slate-600">QR Preview</p>
          {generated ? (
            <>
              <FakeQR seed={seed} />
              <p className="mt-4 text-center font-semibold">{form.name || "WhatsApp QR Code"}</p>
              <p className="mt-1 text-center text-xs text-slate-500">{form.phone}</p>
              <a href={link} target="_blank" rel="noreferrer" className="mt-2 block truncate text-center text-xs text-blue-600 hover:underline">
                {link}
              </a>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={generate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-medium"
                >
                  <RefreshCw size={16} /> Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => downloadQrPng(seed, `${form.name || "whatsapp-qr"}.png`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-400">
              <div>
                <QrCode size={48} className="mx-auto mb-3" />
                <p className="text-sm">Your QR code will appear here</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
