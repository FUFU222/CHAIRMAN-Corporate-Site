import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const contactFormModuleUrl = pathToFileURL(
  path.join(process.cwd(), "src", "scripts", "contact-form.js")
).href;

function createContactDom({ endpoint = "", recaptchaSiteKey = "" } = {}) {
  const captchaMarkup = recaptchaSiteKey
    ? `<div data-recaptcha data-sitekey="${recaptchaSiteKey}" aria-label="reCAPTCHA"></div>`
    : `<p class="contact-form__captcha-note">reCAPTCHA の設定後にボット対策が有効になります。</p>`;

  const dom = new JSDOM(
    `<!doctype html>
    <html>
      <body>
        <form data-contact-form data-endpoint="${endpoint}">
          <input name="name" type="text" />
          <input name="email" type="email" />
          <input name="phone" type="tel" />
          <select name="category">
            <option value="">選択してください</option>
            <option value="その他">その他</option>
          </select>
          <textarea name="message"></textarea>
          <input name="company" type="text" />
          <input name="jsEnabled" type="hidden" value="0" />
          <input name="submittedAt" type="hidden" value="" />
          <input name="g-recaptcha-response" type="hidden" value="" data-recaptcha-response />
          ${captchaMarkup}
          <button type="submit" data-contact-submit>
            <span data-contact-submit-label>送信する</span>
          </button>
        </form>
        <p data-contact-status aria-live="polite">入力内容を確認のうえ送信してください。</p>
        <dialog data-contact-result-dialog aria-labelledby="contact-result-title">
          <div data-contact-result-panel data-state="idle">
            <button type="button" data-contact-result-close>閉じる</button>
            <p data-contact-result-eyebrow>CONTACT</p>
            <h3 id="contact-result-title" data-contact-result-title>お問い合わせ内容をご確認ください</h3>
            <p data-contact-result-message>入力内容を確認のうえ送信してください。</p>
            <p data-contact-result-assist hidden>info@chairman.jp</p>
            <button type="button" data-contact-result-confirm>フォームに戻る</button>
          </div>
        </dialog>
      </body>
    </html>`,
    {
      url: "https://chairman-official.com/contact/"
    }
  );

  patchDialog(dom.window);
  return dom;
}

function patchDialog(window) {
  const proto = window.HTMLDialogElement?.prototype;

  if (!proto) {
    return;
  }

  if (typeof proto.showModal !== "function") {
    proto.showModal = function showModal() {
      this.open = true;
    };
  }

  if (typeof proto.close !== "function") {
    proto.close = function close() {
      this.open = false;
      this.dispatchEvent(new window.Event("close"));
    };
  }
}

function installBrowserGlobals(window) {
  const keys = ["window", "document", "HTMLElement", "HTMLDialogElement"];
  const previous = new Map();

  keys.forEach((key) => {
    previous.set(key, globalThis[key]);
    globalThis[key] = window[key];
  });

  return () => {
    keys.forEach((key) => {
      const value = previous.get(key);
      if (typeof value === "undefined") {
        delete globalThis[key];
        return;
      }

      globalThis[key] = value;
    });
  };
}

async function importContactFormModule() {
  return import(`${contactFormModuleUrl}?t=${Date.now()}-${Math.random()}`);
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

function fillValidForm(document) {
  document.querySelector('[name="name"]').value = "田中 透";
  document.querySelector('[name="email"]').value = "info@chairman.jp";
  document.querySelector('[name="phone"]').value = "03-1234-5678";
  document.querySelector('[name="category"]').value = "その他";
  document.querySelector('[name="message"]').value = "お問い合わせ内容を確認いただけますでしょうか。";
  document.querySelector('[name="company"]').value = "";
}

test("exports an initializer for DOM-based contact form behavior", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const restore = installBrowserGlobals(dom.window);

  try {
    const module = await importContactFormModule();
    assert.equal(typeof module.initializeContactForm, "function");
  } finally {
    restore();
    dom.window.close();
  }
});

test("initialization primes hidden contact form fields", async () => {
  const { initializeContactForm } = await importContactFormModule();
  const dom = createContactDom();

  try {
    initializeContactForm({
      document: dom.window.document,
      window: dom.window
    });

    const jsEnabledInput = dom.window.document.querySelector('[name="jsEnabled"]');
    const submittedAtInput = dom.window.document.querySelector('[name="submittedAt"]');

    assert.equal(jsEnabledInput.value, "1");
    assert.notEqual(submittedAtInput.value, "");
  } finally {
    dom.window.close();
  }
});

test("demo submission opens the success dialog and resets the form state", async () => {
  const { initializeContactForm } = await importContactFormModule();
  const dom = createContactDom();
  let scheduledCallback = null;

  dom.window.setTimeout = (callback) => {
    scheduledCallback = callback;
    return 1;
  };
  dom.window.clearTimeout = () => {};

  try {
    initializeContactForm({
      document: dom.window.document,
      window: dom.window
    });

    fillValidForm(dom.window.document);
    dom.window.document.querySelector('[name="submittedAt"]').value = String(Date.now() - 2_000);

    const form = dom.window.document.querySelector("[data-contact-form]");
    const status = dom.window.document.querySelector("[data-contact-status]");
    const dialog = dom.window.document.querySelector("[data-contact-result-dialog]");
    const panel = dom.window.document.querySelector("[data-contact-result-panel]");
    const submitButton = dom.window.document.querySelector("[data-contact-submit]");
    const submitEvent = new dom.window.Event("submit", { bubbles: true, cancelable: true });

    form.dispatchEvent(submitEvent);

    assert.equal(submitEvent.defaultPrevented, true);
    assert.equal(status.dataset.state, "submitting");
    assert.equal(submitButton.disabled, true);
    assert.equal(typeof scheduledCallback, "function");

    scheduledCallback();

    assert.equal(status.dataset.state, "success");
    assert.equal(panel.dataset.state, "success");
    assert.equal(dialog.open, true);
    assert.equal(submitButton.disabled, false);
    assert.equal(dom.window.document.querySelector('[name="name"]').value, "");
    assert.equal(dom.window.document.querySelector('[name="jsEnabled"]').value, "1");
    assert.notEqual(dom.window.document.querySelector('[name="submittedAt"]').value, "");
  } finally {
    dom.window.close();
  }
});

test("accepted submission messages from allowed origins complete the live endpoint flow", async () => {
  const { initializeContactForm } = await importContactFormModule();
  const dom = createContactDom({
    endpoint: "https://script.google.com/macros/s/example/exec",
    recaptchaSiteKey: "site-key"
  });
  const grecaptcha = {
    render() {
      return 42;
    },
    getResponse() {
      return "token-123";
    },
    resetCalls: [],
    reset(widgetId) {
      this.resetCalls.push(widgetId);
    }
  };

  dom.window.grecaptcha = grecaptcha;
  dom.window.setTimeout = () => 1;
  dom.window.clearTimeout = () => {};

  try {
    initializeContactForm({
      document: dom.window.document,
      window: dom.window
    });
    await flushMicrotasks();

    fillValidForm(dom.window.document);
    dom.window.document.querySelector('[name="submittedAt"]').value = String(Date.now() - 2_000);

    const form = dom.window.document.querySelector("[data-contact-form]");
    const status = dom.window.document.querySelector("[data-contact-status]");
    const dialog = dom.window.document.querySelector("[data-contact-result-dialog]");
    const panel = dom.window.document.querySelector("[data-contact-result-panel]");
    const submitButton = dom.window.document.querySelector("[data-contact-submit]");
    const submitEvent = new dom.window.Event("submit", { bubbles: true, cancelable: true });

    form.dispatchEvent(submitEvent);

    assert.equal(submitEvent.defaultPrevented, false);
    assert.equal(submitButton.disabled, true);
    assert.equal(status.dataset.state, "submitting");

    dom.window.dispatchEvent(
      new dom.window.MessageEvent("message", {
        origin: "https://script.google.com",
        data: {
          type: "chairman-contact-submit",
          ok: true,
          message: "accepted"
        }
      })
    );

    assert.equal(status.dataset.state, "success");
    assert.equal(panel.dataset.state, "success");
    assert.equal(dialog.open, true);
    assert.equal(submitButton.disabled, false);
    assert.equal(dom.window.document.querySelector('[name="name"]').value, "");
    assert.equal(dom.window.document.querySelector('[name="g-recaptcha-response"]').value, "");
    assert.deepEqual(grecaptcha.resetCalls, [42]);
  } finally {
    dom.window.close();
  }
});

test("slow submission keeps waiting and still accepts a later success message", async () => {
  const { initializeContactForm } = await importContactFormModule();
  const dom = createContactDom({
    endpoint: "https://script.google.com/macros/s/example/exec",
    recaptchaSiteKey: "site-key"
  });
  const grecaptcha = {
    render() {
      return 42;
    },
    getResponse() {
      return "token-123";
    },
    resetCalls: [],
    reset(widgetId) {
      this.resetCalls.push(widgetId);
    }
  };
  const scheduledCallbacks = [];

  dom.window.grecaptcha = grecaptcha;
  dom.window.setTimeout = (callback) => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };
  dom.window.clearTimeout = () => {};

  try {
    initializeContactForm({
      document: dom.window.document,
      window: dom.window
    });
    await flushMicrotasks();

    fillValidForm(dom.window.document);
    dom.window.document.querySelector('[name="submittedAt"]').value = String(Date.now() - 2_000);

    const form = dom.window.document.querySelector("[data-contact-form]");
    const status = dom.window.document.querySelector("[data-contact-status]");
    const dialog = dom.window.document.querySelector("[data-contact-result-dialog]");
    const panel = dom.window.document.querySelector("[data-contact-result-panel]");
    const title = dom.window.document.querySelector("[data-contact-result-title]");
    const submitButton = dom.window.document.querySelector("[data-contact-submit]");
    const submitEvent = new dom.window.Event("submit", { bubbles: true, cancelable: true });

    form.dispatchEvent(submitEvent);

    assert.equal(submitEvent.defaultPrevented, false);
    assert.equal(submitButton.disabled, true);
    assert.equal(status.dataset.state, "submitting");
    assert.equal(scheduledCallbacks.length >= 2, true);

    scheduledCallbacks[0]();

    assert.equal(status.dataset.state, "submitting");
    assert.equal(panel.dataset.state, "submitting");
    assert.equal(dialog.open, true);
    assert.equal(submitButton.disabled, true);
    assert.equal(title.textContent, "送信処理に時間がかかっています");

    dom.window.dispatchEvent(
      new dom.window.MessageEvent("message", {
        origin: "https://script.google.com",
        data: {
          type: "chairman-contact-submit",
          ok: true,
          message: "accepted"
        }
      })
    );

    assert.equal(status.dataset.state, "success");
    assert.equal(panel.dataset.state, "success");
    assert.equal(submitButton.disabled, false);
    assert.deepEqual(grecaptcha.resetCalls, [42]);
  } finally {
    dom.window.close();
  }
});
