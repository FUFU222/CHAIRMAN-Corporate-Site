import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const scriptPath = path.join(process.cwd(), "apps-script", "contact.gs");
const scriptSource = fs.readFileSync(scriptPath, "utf8");

function loadAppsScriptContext() {
  const context = vm.createContext({
    console,
    Date,
    Error,
    JSON,
    Math,
    Number,
    RegExp,
    String,
    isFinite
  });

  vm.runInContext(scriptSource, context, { filename: "contact.gs" });
  return context;
}

function createValidPayload(overrides = {}) {
  return {
    name: "田中 透",
    email: "info@chairman.jp",
    phone: "03-1234-5678",
    category: "その他",
    message: "お問い合わせ内容を確認いただけますでしょうか。",
    source: "chairman-astro-site",
    company: "",
    jsEnabled: "1",
    submittedAt: String(Date.now() - 2_000),
    "g-recaptcha-response": "token",
    ...overrides
  };
}

function validatePayload(overrides = {}) {
  const { normalizePayload_, validatePayload_ } = loadAppsScriptContext();
  return validatePayload_(normalizePayload_(createValidPayload(overrides)));
}

test("rejects an email address that only becomes valid after truncation", () => {
  assert.equal(
    validatePayload({
      email: `${"a".repeat(249)}@a.com`
    }),
    "invalid email"
  );
});

test("rejects a message that only becomes valid after truncation", () => {
  assert.equal(
    validatePayload({
      message: "あ".repeat(2_001)
    }),
    "invalid message"
  );
});

test("rejects a category outside the allowed list", () => {
  assert.equal(
    validatePayload({
      category: "採用について"
    }),
    "invalid category"
  );
});

test("requires a reCAPTCHA token", () => {
  assert.equal(
    validatePayload({
      "g-recaptcha-response": ""
    }),
    "missing_recaptcha_token"
  );
});

test("rejects a submission that arrives too quickly", () => {
  assert.equal(
    validatePayload({
      submittedAt: String(Date.now() - 1_000)
    }),
    "invalid submission timing"
  );
});

test("rejects a submission after the allowed form age window", () => {
  assert.equal(
    validatePayload({
      submittedAt: String(Date.now() - 2 * 60 * 60 * 1_000 - 1_000)
    }),
    "invalid submission timing"
  );
});
