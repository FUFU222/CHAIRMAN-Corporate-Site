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

function readBuiltStyles(relativeHtmlPath) {
  const dom = new JSDOM(readBuiltHtml(relativeHtmlPath));
  const { document } = dom.window;
  const styleHrefs = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((node) => node.getAttribute("href"))
    .filter((href) => href && href.startsWith("/_astro/"));

  return styleHrefs
    .map((href) => fs.readFileSync(path.join(distDir, href.replace(/^\//, "")), "utf8"))
    .join("\n");
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

  assert.ok(document.body.textContent.includes("公開中の記事はまだありません。"));
  assert.equal(document.querySelector("[data-archive-item]"), null);
});

test("home build omits the representative note section and footer link", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const dom = new JSDOM(readBuiltHtml("index.html"));
  const { document } = dom.window;
  const bodyText = document.body.textContent || "";

  assert.equal(document.querySelector("#representative-note"), null);
  assert.equal(bodyText.includes("代表の備忘録"), false);
  assert.equal(bodyText.includes("代表のnote"), false);
});

test("home build clips horizontal overflow on mobile", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const styles = readBuiltStyles("index.html");

  assert.match(styles, /body\{[^}]*overflow-x:hidden;[^}]*overflow-x:clip/);
});

test("sns-marketing build removes the framing copy while keeping archive items", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog",
    MICROCMS_FIXTURE_PATH: microcmsFixturePath
  });

  const dom = new JSDOM(readBuiltHtml(path.join("sns-marketing", "index.html")));
  const { document } = dom.window;
  const bodyText = document.body.textContent || "";
  const removedCopy = [
    "CHAIRMANがmicroCMSで公開してきた記事のうち、SNS運用、発信設計、動画まわりの内容を中心に整理しています。",
    "必要なテーマから過去の記事を辿れるよう、一覧で静かにまとめたページです。",
    "TOPICS",
    "テーマから記事を辿れるようにしています。",
    "カテゴリに出てくる論点を先に見せて、必要なテーマから読める構成にしています。",
    "件の公開記事を掲載しています。",
    "ARTICLES",
    "公開中の記事",
    "既存のmicroCMS記事を、SNSノウハウとして一覧化しています。"
  ];

  removedCopy.forEach((copy) => {
    assert.equal(bodyText.includes(copy), false, `Expected removed copy to be absent: ${copy}`);
  });
  assert.ok(document.querySelectorAll("[data-archive-item]").length > 0);
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
