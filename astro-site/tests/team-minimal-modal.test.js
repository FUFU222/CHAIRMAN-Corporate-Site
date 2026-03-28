import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const teamModalModuleUrl = pathToFileURL(
  path.join(process.cwd(), "src", "scripts", "team-minimal-modal.js")
).href;

function createTeamModalDom() {
  const dom = new JSDOM(
    `<!doctype html>
    <html>
      <body>
        <article
          class="team-minimal-item team-minimal-item-officer"
          data-officer-name="三倉 信人"
          data-officer-role="CSO"
          data-officer-role-detail="最高戦略責任者"
          data-officer-note-url="https://note.com/n_mikura"
          data-officer-note-label="三倉信人のnoteを読む"
        >
          <button type="button" class="team-minimal-button" data-officer-modal-trigger>
            <span class="team-minimal-image">
              <img class="team-minimal-photo-cso" src="/images/mikura.webp" alt="三倉 信人" />
            </span>
          </button>
          <div class="team-minimal-detail-copy" hidden>
            <p>ソフトバンクグループで営業、社長室、新規事業開発を経験後に独立。</p>
            <p>事業戦略と組織づくりを支援しています。</p>
          </div>
        </article>

        <article
          class="team-minimal-item team-minimal-item-officer"
          data-officer-name="田中 透"
          data-officer-role="CEO"
          data-officer-role-detail="代表取締役"
          data-officer-note-status="準備中"
        >
          <button type="button" class="team-minimal-button" data-officer-modal-trigger>
            <span class="team-minimal-image">
              <img src="/images/tanaka.webp" alt="田中 透" />
            </span>
          </button>
          <div class="team-minimal-detail-copy" hidden>
            <p>地方行政での実務経験を土台に、価値を市場へ届けるプロジェクトを推進。</p>
          </div>
        </article>

        <dialog data-officer-modal aria-labelledby="officer-detail-name">
          <div class="officer-detail-panel">
            <div class="officer-detail-photo">
              <img src="" alt="" data-officer-modal-image />
            </div>
            <button type="button" data-officer-modal-close>閉じる</button>
            <p data-officer-modal-role></p>
            <p data-officer-modal-role-detail hidden></p>
            <h3 id="officer-detail-name" data-officer-modal-name></h3>
            <div data-officer-modal-body></div>
            <div data-officer-modal-actions hidden>
              <a data-officer-modal-note-link href="#" hidden></a>
              <p data-officer-modal-note-status hidden></p>
            </div>
          </div>
        </dialog>
      </body>
    </html>`,
    {
      pretendToBeVisual: true,
      url: "https://chairman-official.com/about-us/"
    }
  );

  patchDialog(dom.window);
  patchImages(dom.window);
  return dom;
}

function patchDialog(window) {
  const proto = window.HTMLDialogElement?.prototype;

  if (!proto) {
    return;
  }

  proto.showModal = function showModal() {
    this.open = true;
  };

  proto.close = function close() {
    this.open = false;
    this.dispatchEvent(new window.Event("close"));
  };
}

function patchImages(window) {
  const imageProto = window.HTMLImageElement?.prototype;

  if (imageProto && typeof imageProto.decode !== "function") {
    imageProto.decode = function decode() {
      return Promise.resolve();
    };
  }

  if (imageProto && !Object.getOwnPropertyDescriptor(imageProto, "currentSrc")) {
    Object.defineProperty(imageProto, "currentSrc", {
      configurable: true,
      get() {
        return this.src;
      }
    });
  }

  class MockImage {
    constructor() {
      this._src = "";
      this.complete = true;
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      this._src = String(value || "");
      this.complete = true;

      if (typeof this.onload === "function") {
        queueMicrotask(() => this.onload());
      }
    }

    get src() {
      return this._src;
    }

    get currentSrc() {
      return this._src;
    }

    decode() {
      return Promise.resolve();
    }
  }

  window.Image = MockImage;
}

function installBrowserGlobals(window) {
  const keys = ["window", "document", "HTMLElement", "HTMLDialogElement", "HTMLImageElement", "Image"];
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

async function importTeamModalModule() {
  return import(`${teamModalModuleUrl}?t=${Date.now()}-${Math.random()}`);
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test("exports an initializer for the about-us officer modal behavior", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const restore = installBrowserGlobals(dom.window);

  try {
    const module = await importTeamModalModule();
    assert.equal(typeof module.initializeTeamMinimalModal, "function");
  } finally {
    restore();
    dom.window.close();
  }
});

test("clicking an officer trigger opens the dialog with copied content and note link", async () => {
  const { initializeTeamMinimalModal } = await importTeamModalModule();
  const dom = createTeamModalDom();

  try {
    initializeTeamMinimalModal({
      document: dom.window.document,
      window: dom.window
    });

    const firstTrigger = dom.window.document.querySelectorAll("[data-officer-modal-trigger]")[0];
    firstTrigger.focus();
    firstTrigger.click();
    await flushMicrotasks();

    const dialog = dom.window.document.querySelector("[data-officer-modal]");
    const modalName = dom.window.document.querySelector("[data-officer-modal-name]");
    const modalRole = dom.window.document.querySelector("[data-officer-modal-role]");
    const modalRoleDetail = dom.window.document.querySelector("[data-officer-modal-role-detail]");
    const modalBody = dom.window.document.querySelector("[data-officer-modal-body]");
    const noteLink = dom.window.document.querySelector("[data-officer-modal-note-link]");
    const noteStatus = dom.window.document.querySelector("[data-officer-modal-note-status]");
    const modalImage = dom.window.document.querySelector("[data-officer-modal-image]");

    assert.equal(dialog.open, true);
    assert.equal(dom.window.document.body.classList.contains("is-dialog-open"), true);
    assert.equal(modalName.textContent, "三倉 信人");
    assert.equal(modalRole.textContent, "CSO");
    assert.equal(modalRoleDetail.textContent, "最高戦略責任者");
    assert.equal(modalRoleDetail.hidden, false);
    assert.match(modalBody.innerHTML, /ソフトバンクグループ/);
    assert.equal(noteLink.hidden, false);
    assert.equal(noteLink.getAttribute("aria-label"), "三倉信人のnoteを読む");
    assert.equal(noteLink.href, "https://note.com/n_mikura");
    assert.equal(noteStatus.hidden, true);
    assert.equal(modalImage.alt, "三倉 信人");
    assert.match(modalImage.src, /\/images\/mikura\.webp$/);
    assert.equal(modalImage.classList.contains("is-ready"), true);
  } finally {
    dom.window.close();
  }
});

test("officers without a note link show status text and closing restores focus", async () => {
  const { initializeTeamMinimalModal } = await importTeamModalModule();
  const dom = createTeamModalDom();

  try {
    initializeTeamMinimalModal({
      document: dom.window.document,
      window: dom.window
    });

    const secondTrigger = dom.window.document.querySelectorAll("[data-officer-modal-trigger]")[1];
    const closeButton = dom.window.document.querySelector("[data-officer-modal-close]");
    const dialog = dom.window.document.querySelector("[data-officer-modal]");
    const noteLink = dom.window.document.querySelector("[data-officer-modal-note-link]");
    const noteStatus = dom.window.document.querySelector("[data-officer-modal-note-status]");

    secondTrigger.focus();
    secondTrigger.click();
    await flushMicrotasks();

    assert.equal(dialog.open, true);
    assert.equal(noteLink.hidden, true);
    assert.equal(noteStatus.hidden, false);
    assert.equal(noteStatus.textContent, "準備中");

    closeButton.click();

    assert.equal(dialog.open, false);
    assert.equal(dom.window.document.body.classList.contains("is-dialog-open"), false);
    assert.equal(dom.window.document.activeElement, secondTrigger);
  } finally {
    dom.window.close();
  }
});
