import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { ensureRecaptchaScript } from "../src/lib/recaptcha-loader.js";

test("replaces a failed reCAPTCHA script before retrying the same source", async () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "https://chairman-official.com/contact/"
  });
  const { document, Event } = dom.window;
  const src = "https://www.google.com/recaptcha/api.js?render=explicit";

  const failedScript = document.createElement("script");
  failedScript.src = src;
  failedScript.dataset.chairmanRecaptchaState = "error";
  document.head.appendChild(failedScript);

  const promise = ensureRecaptchaScript({
    document,
    window: dom.window,
    src,
    timeoutMs: 20,
    pollMs: 5
  });

  const replacement = document.querySelector(`script[src="${src}"]`);
  assert.ok(replacement, "Expected a managed script element to exist");
  assert.notEqual(replacement, failedScript);
  assert.equal(document.querySelectorAll(`script[src="${src}"]`).length, 1);

  dom.window.grecaptcha = {
    render() {
      return 1;
    }
  };
  replacement.dispatchEvent(new Event("load"));

  const api = await promise;
  assert.equal(typeof api.render, "function");
});
