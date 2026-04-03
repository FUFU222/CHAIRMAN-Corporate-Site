const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuOverlay = document.querySelector("[data-menu-overlay]");
const menuCloseButtons = document.querySelectorAll("[data-menu-close]");

function closeMenu() {
  if (!menuToggle || !menuPanel || !menuOverlay) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "メニューを開く");
  menuPanel.classList.remove("is-open");
  menuOverlay.hidden = true;
  document.body.classList.remove("is-nav-open");
}

if (menuToggle && menuPanel && menuOverlay) {
  menuToggle.addEventListener("click", () => {
    const nextExpanded = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(nextExpanded));
    menuToggle.setAttribute("aria-label", nextExpanded ? "メニューを閉じる" : "メニューを開く");
    menuPanel.classList.toggle("is-open", nextExpanded);
    menuOverlay.hidden = !nextExpanded;
    document.body.classList.toggle("is-nav-open", nextExpanded);
  });

  menuOverlay.addEventListener("click", closeMenu);
  menuCloseButtons.forEach((button) => button.addEventListener("click", closeMenu));
  menuPanel.addEventListener("click", (event) => {
    if (event.target === menuPanel) {
      closeMenu();
    }
  });
  menuPanel.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });
}

if (header) {
  let lastY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      if (window.innerWidth > 820) {
        header.classList.remove("is-hidden");
        return;
      }

      const currentY = window.scrollY;
      if (currentY < 32 || currentY < lastY) {
        header.classList.remove("is-hidden");
      } else if (currentY - lastY > 10) {
        header.classList.add("is-hidden");
      }
      lastY = currentY;
    },
    { passive: true }
  );
}

function normalizeAccessibleText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function segmentGraphemes(value) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }

  return Array.from(value);
}

function splitHeroText(element, baseDelayMs, stepMs) {
  const text = element.textContent || "";
  const label = normalizeAccessibleText(text);
  if (!label) {
    return baseDelayMs;
  }

  const characters = segmentGraphemes(text);
  element.textContent = "";
  element.style.setProperty("--hero-base-delay", `${baseDelayMs}ms`);

  characters.forEach((character, index) => {
    const mask = document.createElement("span");
    const span = document.createElement("span");
    mask.className = "hero__char-mask";
    mask.setAttribute("aria-hidden", "true");
    mask.style.setProperty("--hero-char-index", String(index));
    span.className = "hero__char";
    span.textContent = character === " " ? "\u00A0" : character;
    mask.append(span);
    element.append(mask);
  });

  element.classList.add("is-split-ready");

  const visibleCharacterCount = characters.filter((character) => normalizeAccessibleText(character)).length;
  return baseDelayMs + visibleCharacterCount * stepMs + 220;
}

function initHeroTextAnimation() {
  const hero = document.querySelector("[data-hero]");
  const heroTitle = document.querySelector("[data-hero-title]");
  if (!hero || !heroTitle || prefersReducedMotion) {
    return;
  }

  const titleLabel = normalizeAccessibleText(heroTitle.textContent || "");
  if (titleLabel) {
    heroTitle.setAttribute("aria-label", titleLabel);
  }

  let nextDelayMs = 240;
  const titleLines = heroTitle.querySelectorAll(".hero__title-line");

  if (titleLines.length > 0) {
    heroTitle.classList.add("is-split-ready");
    titleLines.forEach((line) => {
      nextDelayMs = splitHeroText(line, nextDelayMs, 48);
    });
  } else {
    nextDelayMs = splitHeroText(heroTitle, nextDelayMs, 48);
  }

  const heroSignature = document.querySelector("[data-hero-signature]");
  if (!heroSignature) {
    return;
  }

  const signatureLabel = normalizeAccessibleText(heroSignature.textContent || "");
  if (signatureLabel) {
    heroSignature.setAttribute("aria-label", signatureLabel);
  }

  splitHeroText(heroSignature, nextDelayMs + 180, 42);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("is-loaded");
    });
  });
}

initHeroTextAnimation();

const revealItems = document.querySelectorAll("[data-reveal]");
if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  revealItems.forEach((item) => item.classList.add("is-awaiting-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-awaiting-reveal");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -32px 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
