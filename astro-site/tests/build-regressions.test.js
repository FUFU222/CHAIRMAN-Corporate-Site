import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const microcmsFixturePath = path.join(rootDir, "tests", "fixtures", "microcms-knowhow.json");

function runBuild(extraEnv = {}) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  return execFileSync(npmCommand, ["run", "build"], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv
    },
    stdio: "pipe",
    encoding: "utf8"
  });
}

function readBuiltHtml(relativePath) {
  return fs.readFileSync(path.join(distDir, relativePath), "utf8");
}

test("CI build fails when microCMS credentials are missing", () => {
  assert.throws(
    () =>
      runBuild({
        CI: "true",
        MICROCMS_SERVICE_DOMAIN: "",
        MICROCMS_API_KEY: "",
        MICROCMS_ENDPOINT: "blog"
      }),
    /microcms/i
  );
});

test("home hero loads only the first slide eagerly", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const homeHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const heroSection = homeHtml.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0];

  assert.ok(heroSection, "Expected the built home page to contain a hero section");

  const loadingModes = [...heroSection.matchAll(/loading="(eager|lazy)"/g)].map((match) => match[1]);

  assert.deepEqual(loadingModes, ["eager", "lazy", "lazy"]);
});

test("contact build ships hidden delivery fields and fallback UI without reCAPTCHA config", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog",
    PUBLIC_CONTACT_FORM_ENDPOINT: "",
    PUBLIC_RECAPTCHA_SITE_KEY: ""
  });

  const dom = new JSDOM(readBuiltHtml(path.join("contact", "index.html")));
  const { document } = dom.window;
  const form = document.querySelector("[data-contact-form]");

  assert.ok(form, "Expected the built contact page to contain the contact form");
  assert.equal(form.getAttribute("data-endpoint"), "");
  assert.ok(form.querySelector('[name="source"][value="chairman-astro-site"]'));
  assert.ok(form.querySelector('[name="jsEnabled"][value="0"]'));
  assert.ok(form.querySelector('[name="submittedAt"]'));
  assert.ok(form.querySelector('[name="g-recaptcha-response"]'));
  assert.ok(document.querySelector("[data-contact-result-dialog]"));
  assert.ok(document.body.textContent.includes("reCAPTCHA の設定後にボット対策が有効になります。"));
  assert.equal(document.querySelector("[data-recaptcha]"), null);
});

test("contact build renders the managed reCAPTCHA container when site key is configured", () => {
  const endpoint = "https://script.google.com/macros/s/example/exec";
  const siteKey = "site-key";

  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog",
    PUBLIC_CONTACT_FORM_ENDPOINT: endpoint,
    PUBLIC_RECAPTCHA_SITE_KEY: siteKey
  });

  const dom = new JSDOM(readBuiltHtml(path.join("contact", "index.html")));
  const { document } = dom.window;
  const form = document.querySelector("[data-contact-form]");
  const recaptcha = document.querySelector("[data-recaptcha]");

  assert.ok(form, "Expected the built contact page to contain the contact form");
  assert.equal(form.getAttribute("data-endpoint"), endpoint);
  assert.ok(recaptcha, "Expected the built contact page to include the reCAPTCHA mount point");
  assert.equal(recaptcha.getAttribute("data-sitekey"), siteKey);
  assert.equal(document.body.textContent.includes("reCAPTCHA の設定後にボット対策が有効になります。"), false);
});

test("about-us build ships officer modal scaffolding", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const dom = new JSDOM(readBuiltHtml(path.join("about-us", "index.html")));
  const { document } = dom.window;

  assert.ok(document.querySelector("[data-officer-modal]"));
  assert.ok(document.querySelector("[data-officer-modal-name]"));
  assert.ok(document.querySelector("[data-officer-modal-body]"));
  assert.ok(document.querySelector("[data-officer-modal-note-link]"));
  assert.ok(document.querySelector("[data-officer-modal-close]"));
  assert.ok(document.querySelectorAll("[data-officer-modal-trigger]").length > 0);
});

test("sns-marketing build shows the empty state when microCMS articles are unavailable", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const dom = new JSDOM(readBuiltHtml(path.join("sns-marketing", "index.html")));
  const { document } = dom.window;

  assert.ok(document.body.textContent.includes("0件の公開記事を掲載しています。"));
  assert.ok(document.body.textContent.includes("公開中の記事はまだありません。"));
  assert.equal(document.querySelector("[data-archive-item]"), null);
});

test("news detail build ships article metadata, share links, and enhanced media", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const dom = new JSDOM(readBuiltHtml(path.join("news", "japan-expo-canada-partnership", "index.html")));
  const { document } = dom.window;
  const title = document.querySelector("title");
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogType = document.querySelector('meta[property="og:type"]');
  const publishedTime = document.querySelector('meta[property="article:published_time"]');
  const articleSchema = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((node) => node.textContent || "")
    .map((text) => {
      try {
        return JSON.parse(text);
      } catch (_error) {
        return null;
      }
    })
    .find((item) => item && item["@type"] === "Article");
  const heroImage = document.querySelector(".article__hero-visual img");
  const inlineFigure = document.querySelector(".rich-text__figure");
  const shareLinks = Array.from(document.querySelectorAll(".article-share__links a"));
  const copyButton = document.querySelector("[data-copy-url]");
  const authorCard = document.querySelector(".author-card--author");
  const contactCard = document.querySelector(".author-card--contact");

  assert.equal(
    title?.textContent,
    "【北米展開を加速】CHAIRMAN、Japan Expo Canada Inc.との戦略的パートナーシップ契約を締結。日本工芸・文化の北米市場独占供給ルートを構築 | 株式会社CHAIRMAN"
  );
  assert.equal(canonical?.getAttribute("href"), "https://chairman-official.com/news/japan-expo-canada-partnership/");
  assert.equal(ogType?.getAttribute("content"), "article");
  assert.equal(publishedTime?.getAttribute("content"), "2026-03-11T00:00:00.000Z");
  assert.equal(articleSchema?.headline, "【北米展開を加速】CHAIRMAN、Japan Expo Canada Inc.との戦略的パートナーシップ契約を締結。日本工芸・文化の北米市場独占供給ルートを構築");
  assert.equal(articleSchema?.mainEntityOfPage, "https://chairman-official.com/news/japan-expo-canada-partnership/");
  assert.equal(
    heroImage?.getAttribute("alt"),
    "CHAIRMAN と Japan Expo Canada Inc. のロゴを組み合わせたヘッダー画像"
  );
  assert.ok(inlineFigure?.textContent?.includes("Japan Festival CANADA の会場ステージの様子"));
  assert.equal(shareLinks.length, 3);
  assert.ok(shareLinks.every((link) => link.getAttribute("href")?.includes(encodeURIComponent("https://chairman-official.com/news/japan-expo-canada-partnership/"))));
  assert.equal(
    copyButton?.getAttribute("data-copy-url"),
    "https://chairman-official.com/news/japan-expo-canada-partnership/"
  );
  assert.ok(authorCard?.textContent?.includes("田中 透"));
  assert.ok(contactCard?.textContent?.includes("お問い合わせ"));
});

test("sns-marketing detail build ships article metadata, share links, and related knowhow content", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog",
    MICROCMS_FIXTURE_PATH: microcmsFixturePath
  });

  const dom = new JSDOM(readBuiltHtml(path.join("sns-marketing", "sns-short-video-playbook", "index.html")));
  const { document } = dom.window;
  const title = document.querySelector("title");
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogType = document.querySelector('meta[property="og:type"]');
  const publishedTime = document.querySelector('meta[property="article:published_time"]');
  const articleSchema = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((node) => node.textContent || "")
    .map((text) => {
      try {
        return JSON.parse(text);
      } catch (_error) {
        return null;
      }
    })
    .find((item) => item && item["@type"] === "Article");
  const heroImage = document.querySelector(".article__visual img");
  const shareLinks = Array.from(document.querySelectorAll(".article-share__links a"));
  const copyButton = document.querySelector("[data-copy-url]");
  const relatedSection = document.querySelector(".related-section");
  const authorCard = document.querySelector(".author-card");

  assert.equal(title?.textContent, "ショート動画運用の設計メモ | 株式会社CHAIRMAN");
  assert.equal(canonical?.getAttribute("href"), "https://chairman-official.com/sns-marketing/sns-short-video-playbook/");
  assert.equal(ogType?.getAttribute("content"), "article");
  assert.equal(publishedTime?.getAttribute("content"), "2026-03-12T00:00:00.000Z");
  assert.equal(articleSchema?.headline, "ショート動画運用の設計メモ");
  assert.equal(articleSchema?.mainEntityOfPage, "https://chairman-official.com/sns-marketing/sns-short-video-playbook/");
  assert.equal(heroImage?.getAttribute("src"), "https://images.example.com/short-video-playbook.jpg");
  assert.equal(shareLinks.length, 3);
  assert.ok(shareLinks.every((link) => link.getAttribute("href")?.includes(encodeURIComponent("https://chairman-official.com/sns-marketing/sns-short-video-playbook/"))));
  assert.equal(
    copyButton?.getAttribute("data-copy-url"),
    "https://chairman-official.com/sns-marketing/sns-short-video-playbook/"
  );
  assert.ok(relatedSection?.textContent?.includes("関連記事"));
  assert.ok(relatedSection?.textContent?.includes("キャプション設計の基本"));
  assert.equal(relatedSection?.textContent?.includes("海外展示会パートナーシップの進め方"), false);
  assert.ok(authorCard?.textContent?.includes("田中 透"));
});
