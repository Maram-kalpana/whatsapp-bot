const env = require("../config/env");
const { HttpError } = require("../utils/httpError");

function graphBase() {
  return `https://graph.facebook.com/${env.metaGraphApiVersion}`;
}

function accessToken() {
  return process.env.META_ACCESS_TOKEN || env.metaAccessToken || "";
}

async function graphRequest(method, path, { query, json, form } = {}) {
  const token = accessToken();
  if (!token) {
    throw new HttpError(400, "META_ACCESS_TOKEN is not set. Add it to .env to talk to the WhatsApp Cloud API.");
  }
  const url = new URL(`${graphBase()}/${String(path).replace(/^\//, "")}`);
  url.searchParams.set("access_token", token);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  const headers = {};
  let body;
  if (form) {
    body = form;
  } else if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(url, { method, headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Meta API ${res.status}`;
    const err = new HttpError(res.status === 400 ? 400 : 502, msg);
    err.meta = data;
    throw err;
  }
  return data;
}

function graphGet(path, query) {
  return graphRequest("GET", path, { query });
}

function graphPost(path, json) {
  return graphRequest("POST", path, { json });
}

function graphPostForm(path, form) {
  return graphRequest("POST", path, { form });
}

const LANG_CODES = {
  English: "en_US",
  Hindi: "hi",
  Spanish: "es",
  French: "fr",
  German: "de",
  Portuguese: "pt_BR",
  Arabic: "ar",
  Indonesian: "id",
  Italian: "it",
  Japanese: "ja",
  Korean: "ko",
  Tamil: "ta",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Urdu: "ur",
  Chinese: "zh_CN",
};

function languageCode(label) {
  if (!label) return "en_US";
  if (/^[a-z]{2}(_[A-Z]{2})?$/.test(label)) return label;
  return LANG_CODES[label] || "en_US";
}

function extractVars(text) {
  const found = [...String(text || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return [...new Set(found)].sort((a, b) => a - b);
}

function sanitizeTemplateName(name) {
  return String(name || "template")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 512);
}

function dailyLimitValue(tier) {
  const map = { 250: 250, "1k": 1000, "10k": 10000, "100k": 100000, unlimited: Number.MAX_SAFE_INTEGER };
  return map[tier] || 250;
}

module.exports = {
  graphGet,
  graphPost,
  graphPostForm,
  languageCode,
  extractVars,
  sanitizeTemplateName,
  dailyLimitValue,
  accessToken,
};
