/* eslint-disable no-console */
const base = "http://localhost:4000/api";
const root = "http://localhost:4000";
const email = "qa_audit_1788766582653@example.com";
const pass = "TestPass123!";
const bizId = 4;

async function auth() {
  const r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`login failed: ${JSON.stringify(data)}`);
  return {
    Authorization: `Bearer ${data.accessToken}`,
    "X-Business-Id": String(bizId),
    "Content-Type": "application/json",
  };
}

async function run() {
  const h = await auth();
  const results = [];

  const check = (phase, name, ok, detail = "") => {
    results.push({ phase, name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} [${phase}] ${name}${detail ? ` — ${detail}` : ""}`);
  };

  // Phase 2 retest
  let r = await fetch(`${base}/contacts/2`, { method: "PATCH", headers: h, body: JSON.stringify({ name: "Alice Updated", tags: ["vip"] }) });
  check("P2", "contact partial update", r.status === 200, String(r.status));

  r = await fetch(`${base}/templates`, { method: "POST", headers: h, body: JSON.stringify({ name: `qa_tpl_${Date.now()}`, category: "marketing", body: "Hello {{1}}", language: "en_US" }) });
  const tpl = await r.json();
  check("P2", "template create (draft on meta fail)", r.status === 201, tpl.template?.status || tpl.error);

  // Template status webhook simulation
  const tplName = tpl.template?.name;
  if (tplName) {
    const wh = await fetch(`${root}/webhooks/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object: "whatsapp_business_account",
        entry: [{ changes: [{ field: "message_template_status_update", value: { message_template_name: tplName, event: "APPROVED" } }] }],
      }),
    });
    check("P2", "template status webhook", wh.status === 200);
    r = await fetch(`${base}/templates`, { headers: h });
    const list = await r.json();
    const updated = list.templates?.find((t) => t.name === tplName);
    check("P2", "template status updated", updated?.status === "approved", updated?.status);
  }

  // Phase 3 - webhook verify
  r = await fetch(`${root}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=dev-verify-token&hub.challenge=qa123`);
  check("P3", "webhook GET verify", r.status === 200 && (await r.text()) === "qa123");

  r = await fetch(`${base}/inbox`, { headers: h });
  check("P3", "inbox list", r.status === 200, `conversations=${(await r.json()).conversations?.length ?? "?"}`);

  // Phase 4 - campaigns
  r = await fetch(`${base}/campaigns`, { headers: h });
  check("P4", "campaigns list", r.status === 200);

  // Phase 5 - chatbots
  r = await fetch(`${base}/chatbots`, { headers: h });
  check("P5", "chatbots list", r.status === 200);

  // Phase 6
  r = await fetch(`${base}/lead-magnets`, { headers: h });
  check("P6", "lead magnets list", r.status === 200);
  r = await fetch(`${base}/flows`, { headers: h });
  check("P6", "flows list", r.status === 200);

  // Phase 7
  r = await fetch(`${base}/catalog/products`, { headers: h });
  check("P7", "products list", r.status === 200);
  r = await fetch(`${base}/orders`, { headers: h });
  check("P7", "orders list", r.status === 200);

  // Phase 8
  r = await fetch(`${base}/dashboard/summary`, { headers: h });
  const dash = await r.json();
  check("P8", "dashboard summary", r.status === 200 && dash.summary?.wallet_balance !== undefined, `wallet=${dash.summary?.wallet_balance}`);

  r = await fetch(`${base}/payments/wallet/transactions`, { headers: h });
  check("P8", "wallet transactions", r.status === 200);

  // Cross-tenant
  const reg = await fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Other User", email: `other_${Date.now()}@example.com`, password: pass }) });
  const other = await reg.json();
  r = await fetch(`${base}/contacts`, { headers: { Authorization: `Bearer ${other.accessToken}`, "X-Business-Id": String(bizId) } });
  check("X", "cross-tenant blocked", r.status === 403);

  const failed = results.filter((x) => !x.ok);
  console.log("\n=== SUMMARY ===");
  console.log(`Passed: ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.log("Failures:", failed);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
