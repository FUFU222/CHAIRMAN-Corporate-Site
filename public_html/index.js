// テキストのカウントアップ+バーの設定
const splashRoot = document.getElementById("splash");
const splashText = document.getElementById("splash_text");
const splashSeenKey = "chairman_splash_seen";

function isInternalReferrer() {
  if (!document.referrer) {
    return false;
  }
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch (_error) {
    return false;
  }
}

function shouldPlaySplash() {
  let seen = false;
  try {
    seen = sessionStorage.getItem(splashSeenKey) === "1";
  } catch (_error) {
    seen = false;
  }
  if (seen) {
    return false;
  }
  return !isInternalReferrer();
}

function markSplashSeen() {
  try {
    sessionStorage.setItem(splashSeenKey, "1");
  } catch (_error) {
    // sessionStorage が使えない環境でも処理継続
  }
}

if (
  shouldPlaySplash() &&
  splashText &&
  typeof ProgressBar !== "undefined" &&
  typeof ProgressBar.Line === "function"
) {
  if (splashRoot) {
    splashRoot.classList.add("splash-active");
  }
  markSplashSeen();
  var bar = new ProgressBar.Line(splashText, {
    //id名を指定
    easing: "easeInOut",
    duration: 1000,
    strokeWidth: 0.4,
    color: "#555",
    trailWidth: 0.9,
    trailColor: "#bbb",
    text: {
      //テキストの形状を直接指定
      style: {
        //天地中央に配置
        position: "absolute",
        left: "50%",
        top: "50%",
        padding: "0",
        margin: "-30px 0 0 0", //バーより上に配置
        transform: "translate(-50%,-50%)",
        "font-size": "1rem",
        color: "#fff",
      },
      autoStyleContainer: false, //自動付与のスタイルを切る
    },
    step: function (state, bar) {
      bar.setText(Math.round(bar.value() * 100) + " %"); //テキストの数値
    },
  });

  //アニメーションスタート
  bar.animate(1.0, function () {
    //1.0=100%描画
    fadeOutElement(splashText, 120); //フェイドアウトでローディングテキストを削除
    addClassToAll(".loader_cover-up", "coveranime"); //カバーが上に上がるクラス追加
    addClassToAll(".loader_cover-down", "coveranime"); //カバーが下に下がるクラス追加
    fadeOutElement(splashRoot, 320); //#splashエリアをフェードアウト
  });
} else if (splashRoot) {
  splashRoot.classList.remove("splash-active");
  markSplashSeen();
  splashRoot.style.display = "none";
}

function addClassToAll(selector, className) {
  document.querySelectorAll(selector).forEach((element) => {
    element.classList.add(className);
  });
}

function fadeOutElement(element, duration) {
  if (!element) {
    return;
  }
  element.style.transition = `opacity ${duration}ms ease`;
  element.style.opacity = "0";
  window.setTimeout(() => {
    element.style.display = "none";
  }, duration);
}

//スクロールに応じたヘッダーの表示
document.addEventListener("DOMContentLoaded", function () {
  var header = document.getElementById("header");
  var lastScrollTop = 0;
  var scrollThreshold = 5;
  var glassThreshold = 16;

  if (!header) {
    return;
  }

  function updateHeaderMaterial(scrollTop) {
    header.classList.toggle("is-scrolled", scrollTop > glassThreshold);
  }

  window.addEventListener(
    "scroll",
    function () {
      var currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;

      updateHeaderMaterial(currentScroll);

      if (header.classList.contains("menu-open")) {
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        return;
      }

      if (Math.abs(currentScroll - lastScrollTop) > scrollThreshold) {
        if (currentScroll > lastScrollTop) {
          // 下にスクロールした時、ヘッダーを非表示にする
          header.style.top = "-170px";
        } else {
          // 上にスクロールした時、ヘッダーを表示する
          header.style.top = "0px";
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // ネガティブな値を避ける
      }
    },
    false
  );

  updateHeaderMaterial(window.pageYOffset || document.documentElement.scrollTop);
});
//--------------------- fade-in,titleSlideなどのアニメーション設定-----------------------
document.addEventListener("DOMContentLoaded", function () {
  const fadeInTargets = document.querySelectorAll(
    ".title-description, .record-description-wrapper, .member-position, .member-name h3, .member-description dt, .member-description dd p"
  );
  const slideTargets = document.querySelectorAll(
    ".title h2, .japanese-title h4"
  );

  fadeInTargets.forEach((target) => {
    target.classList.add("fade-in");
  });

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("is-visible");
            fadeObserver.unobserve(entry.target);
          }, 300);
        }
      });
    },
    {
      rootMargin: "-50px 0px 50px 0px",
      threshold: [0.05, 0.5, 1],
    }
  );

  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const titleColor = window.getComputedStyle(entry.target).color;
          entry.target.style.setProperty("--title-original-color", titleColor);
          entry.target.classList.add("bgextend", "bgLRextend");
          slideObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  fadeInTargets.forEach((target) => fadeObserver.observe(target));
  slideTargets.forEach((target) => slideObserver.observe(target));
});

// メニューボタン
document.addEventListener("DOMContentLoaded", function () {
  const openBtn       = document.querySelector(".openbtn7");
  const overlay       = document.getElementById("menu-overlay");
  const menuContainer = document.querySelector(".header-menu-container");
  const menuItems     = document.querySelectorAll(".header-menu li a");
  const header        = document.getElementById("header");
  const supportsInert = "inert" in HTMLElement.prototype;
  const inertTargets  = Array.from(document.body.children).filter((element) => {
    if (element === header || element === overlay) {
      return false;
    }
    return element.tagName !== "SCRIPT";
  });
  let isMenuOpen = false;
  let lastFocusedElement = null;

  if (!openBtn || !overlay || !menuContainer) {
    return;
  }

  // ハンバーガーボタンで開閉
  openBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (isMenuOpen) {
      closeMenu();
      return;
    }
    const moveFocusToFirstItem = e.detail === 0;
    openMenu({ moveFocusToFirstItem });
  });

  // オーバーレイ押下で閉じる
  overlay.addEventListener("click", closeMenu);

  // メニュー項目押下で閉じる
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      closeMenu({ restoreFocus: false });
    });
  });

  function openMenu(options = {}) {
    const moveFocusToFirstItem = options.moveFocusToFirstItem !== false;

    lastFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : openBtn;

    isMenuOpen = true;
    setMenuState(true);
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", handleDocumentKeydown);

    if (moveFocusToFirstItem) {
      const focusable = getMenuFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        openBtn.focus();
      }
    }
  }

  function closeMenu(options = {}) {
    const restoreFocus = options.restoreFocus !== false;

    if (!isMenuOpen) {
      return;
    }

    isMenuOpen = false;
    document.removeEventListener("click", handleDocumentClick, true);
    document.removeEventListener("keydown", handleDocumentKeydown);

    setMenuState(false);

    if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function setMenuState(isOpen) {
    openBtn.classList.toggle("active", isOpen);
    openBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    openBtn.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");

    menuContainer.classList.toggle("show-menu", isOpen);
    menuContainer.setAttribute("aria-hidden", isOpen ? "false" : "true");

    overlay.classList.toggle("show", isOpen);

    if (header) {
      header.classList.toggle("menu-open", isOpen);
      if (isOpen) {
        header.style.top = "0px";
      }
    }

    document.body.classList.toggle("menu-open", isOpen);

    if (supportsInert) {
      inertTargets.forEach((element) => {
        element.inert = isOpen;
      });
    }
  }

  function handleDocumentClick(e) {
    if (!isMenuOpen) {
      return;
    }

    const clickedElement = e.target instanceof Element ? e.target : null;
    const clickedMenuLink = clickedElement?.closest(".header-menu li a");

    // Keep menu open while activating a menu link (link handler will close it).
    if (clickedMenuLink) {
      return;
    }

    if (e.target instanceof Node && openBtn.contains(e.target)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  }

  function handleDocumentKeydown(e) {
    if (!isMenuOpen) {
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === "Tab") {
      trapFocusWithinMenu(e);
    }
  }

  function trapFocusWithinMenu(e) {
    const focusable = getMenuFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      openBtn.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      if (activeElement === first || activeElement === menuContainer) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function getMenuFocusableElements() {
    return Array.from(
      menuContainer.querySelectorAll(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )
    ).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      return element.offsetParent !== null;
    });
  }
});

// Livapon marquee (background text loop)
document.addEventListener("DOMContentLoaded", function () {
  const marquees = document.querySelectorAll("[data-marquee]");
  if (!marquees.length) {
    return;
  }

  requestAnimationFrame(() => {
    marquees.forEach((marquee) => {
      if (marquee.dataset.marqueeReady === "true") {
        return;
      }
      const track = marquee.querySelector(".livapon-marquee-track");
      if (!track) {
        return;
      }

      const base = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < marquee.offsetWidth * 2 && guard < 20) {
        track.insertAdjacentHTML("beforeend", base);
        guard += 1;
      }

      track.insertAdjacentHTML("beforeend", track.innerHTML);
      marquee.dataset.marqueeReady = "true";
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const dialog = document.getElementById("officer-detail-modal");
  const triggers = document.querySelectorAll("[data-officer-modal-trigger]");

  if (
    typeof HTMLDialogElement === "undefined" ||
    !(dialog instanceof HTMLDialogElement) ||
    triggers.length === 0
  ) {
    return;
  }

  const name = dialog.querySelector("[data-officer-modal-name]");
  const role = dialog.querySelector("[data-officer-modal-role]");
  const roleDetail = dialog.querySelector("[data-officer-modal-role-detail]");
  const body = dialog.querySelector("[data-officer-modal-body]");
  const actions = dialog.querySelector("[data-officer-modal-actions]");
  const noteLink = dialog.querySelector("[data-officer-modal-note-link]");
  const noteStatus = dialog.querySelector("[data-officer-modal-note-status]");
  const image = dialog.querySelector("[data-officer-modal-image]");
  const closeButton = dialog.querySelector("[data-officer-modal-close]");
  let activeTrigger = null;
  let imageRequestId = 0;

  function setDialogLockState(locked) {
    var scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty("--scroll-lock-offset", locked ? scrollbarWidth + "px" : "0px");
    document.body.classList.toggle("modal-open", locked);
  }

  async function syncModalImage(triggerImage, officerName) {
    if (
      !(image instanceof HTMLImageElement) ||
      !(triggerImage instanceof HTMLImageElement)
    ) {
      return false;
    }

    var nextSrc = triggerImage.currentSrc || triggerImage.src;
    var nextClassName = triggerImage.className;
    var nextAlt = triggerImage.alt || officerName || "";
    var requestId = ++imageRequestId;

    image.className = nextClassName;
    image.alt = nextAlt;
    image.classList.remove("is-ready");

    if (!nextSrc) {
      image.removeAttribute("src");
      return true;
    }

    if (image.currentSrc === nextSrc && image.complete) {
      image.classList.add("is-ready");
      return true;
    }

    var preload = new Image();
    preload.src = nextSrc;

    try {
      if (typeof preload.decode === "function") {
        await preload.decode();
      } else if (!preload.complete) {
        await new Promise(function (resolve) {
          preload.onload = resolve;
          preload.onerror = resolve;
        });
      }
    } catch (_error) {
      // decode に失敗しても同じ画像をそのまま描画する
    }

    if (requestId !== imageRequestId) {
      return false;
    }

    image.className = nextClassName;
    image.src = nextSrc;
    image.alt = nextAlt;

    try {
      if (typeof image.decode === "function") {
        await image.decode();
      }
    } catch (_error) {
      // 表示は継続
    }

    if (requestId !== imageRequestId) {
      return false;
    }

    image.classList.add("is-ready");
    return true;
  }

  async function applyOfficerContent(trigger) {
    const card = trigger.closest(".team-minimal-item-officer");
    const copy = card?.querySelector(".team-minimal-detail-copy");
    const triggerImage = trigger.querySelector(".team-minimal-image img");

    if (
      !(card instanceof HTMLElement) ||
      !(copy instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(role instanceof HTMLElement) ||
      !(roleDetail instanceof HTMLElement) ||
      !(body instanceof HTMLElement) ||
      !(actions instanceof HTMLElement) ||
      !(noteLink instanceof HTMLAnchorElement) ||
      !(noteStatus instanceof HTMLElement) ||
      !(image instanceof HTMLImageElement) ||
      !(triggerImage instanceof HTMLImageElement)
    ) {
      return false;
    }

    name.textContent = card.dataset.officerName || "";
    role.textContent = card.dataset.officerRole || "";
    roleDetail.textContent = card.dataset.officerRoleDetail || "";
    roleDetail.hidden = !roleDetail.textContent;
    body.innerHTML = copy.innerHTML;

    const imageReady = await syncModalImage(triggerImage, card.dataset.officerName || "");
    if (!imageReady) {
      return false;
    }

    const officerNoteUrl = card.dataset.officerNoteUrl || "";
    const officerNoteLabel = card.dataset.officerNoteLabel || "note";
    const officerNoteStatus = card.dataset.officerNoteStatus || "";

    actions.hidden = !officerNoteUrl && !officerNoteStatus;
    actions.style.display = officerNoteUrl || officerNoteStatus ? "flex" : "none";

    if (officerNoteUrl) {
      noteLink.href = officerNoteUrl;
      noteLink.setAttribute("aria-label", officerNoteLabel);
      noteLink.setAttribute("title", officerNoteLabel);
      noteLink.hidden = false;
      noteLink.style.display = "inline-flex";
      noteStatus.hidden = true;
      noteStatus.style.display = "none";
      noteStatus.textContent = "";
    } else {
      noteLink.hidden = true;
      noteLink.style.display = "none";
      noteLink.removeAttribute("href");
      noteLink.removeAttribute("aria-label");
      noteLink.removeAttribute("title");
      noteStatus.hidden = !officerNoteStatus;
      noteStatus.style.display = officerNoteStatus ? "" : "none";
      noteStatus.textContent = officerNoteStatus;
    }

    return true;
  }

  async function openDialog(trigger) {
    if (!(await applyOfficerContent(trigger))) {
      return;
    }
    activeTrigger = trigger;
    setDialogLockState(true);
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog() {
    if (dialog.open) {
      dialog.close();
    }
  }

  triggers.forEach((trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return;
    }
    trigger.addEventListener("click", function () {
      void openDialog(trigger);
    });
  });

  if (closeButton instanceof HTMLElement) {
    closeButton.addEventListener("click", closeDialog);
  }

  dialog.addEventListener("close", function () {
    setDialogLockState(false);
    if (activeTrigger instanceof HTMLElement) {
      activeTrigger.focus();
    }
  });

  dialog.addEventListener("click", function (event) {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeDialog();
    }
  });
});
