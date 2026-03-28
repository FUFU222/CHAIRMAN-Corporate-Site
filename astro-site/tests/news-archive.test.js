import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const newsArchiveModuleUrl = pathToFileURL(
  path.join(process.cwd(), "src", "scripts", "news-archive.js")
).href;

function createNewsArchiveDom() {
  return new JSDOM(
    `<!doctype html>
    <html>
      <body>
        <section data-news-archive data-page-size="2" data-load-more-threshold="3">
          <div class="news-archive__filters">
            <button class="is-active" type="button" data-filter="all">すべて</button>
            <button type="button" data-filter="alpha">Alpha</button>
            <button type="button" data-filter="beta">Beta</button>
          </div>
          <div class="news-archive__list">
            <article data-archive-item data-categories="alpha" data-index="0">A1</article>
            <article data-archive-item data-categories="beta" data-index="1">B1</article>
            <article data-archive-item data-categories="alpha,beta" data-index="2">AB1</article>
            <article data-archive-item data-categories="gamma" data-index="3">G1</article>
          </div>
          <button type="button" data-load-more>さらに表示</button>
        </section>
      </body>
    </html>`,
    {
      url: "https://chairman-official.com/sns-marketing/"
    }
  );
}

function installBrowserGlobals(window) {
  const keys = ["window", "document", "HTMLElement"];
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

async function importNewsArchiveModule() {
  return import(`${newsArchiveModuleUrl}?t=${Date.now()}-${Math.random()}`);
}

function visibleStates(items) {
  return items.map((item) => item.hidden);
}

test("exports an initializer for news archive interactions", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const restore = installBrowserGlobals(dom.window);

  try {
    const module = await importNewsArchiveModule();
    assert.equal(typeof module.initializeNewsArchive, "function");
  } finally {
    restore();
    dom.window.close();
  }
});

test("initialization applies page size and filter state to archive items", async () => {
  const { initializeNewsArchive } = await importNewsArchiveModule();
  const dom = createNewsArchiveDom();

  try {
    initializeNewsArchive({
      document: dom.window.document
    });

    const items = Array.from(dom.window.document.querySelectorAll("[data-archive-item]"));
    const buttons = Array.from(dom.window.document.querySelectorAll("[data-filter]"));
    const loadMore = dom.window.document.querySelector("[data-load-more]");

    assert.deepEqual(visibleStates(items), [false, false, true, true]);
    assert.equal(loadMore.hidden, false);
    assert.equal(buttons[0].classList.contains("is-active"), true);
  } finally {
    dom.window.close();
  }
});

test("filtering and load more update visible archive items", async () => {
  const { initializeNewsArchive } = await importNewsArchiveModule();
  const dom = createNewsArchiveDom();

  try {
    initializeNewsArchive({
      document: dom.window.document
    });

    const items = Array.from(dom.window.document.querySelectorAll("[data-archive-item]"));
    const buttons = Array.from(dom.window.document.querySelectorAll("[data-filter]"));
    const loadMore = dom.window.document.querySelector("[data-load-more]");

    buttons[2].click();
    assert.deepEqual(visibleStates(items), [true, false, false, true]);
    assert.equal(loadMore.hidden, true);
    assert.equal(buttons[2].classList.contains("is-active"), true);
    assert.equal(buttons[0].classList.contains("is-active"), false);

    buttons[0].click();
    assert.deepEqual(visibleStates(items), [false, false, true, true]);
    assert.equal(loadMore.hidden, false);

    loadMore.click();
    assert.deepEqual(visibleStates(items), [false, false, false, false]);
    assert.equal(loadMore.hidden, true);
  } finally {
    dom.window.close();
  }
});
