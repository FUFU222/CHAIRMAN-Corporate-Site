const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuPanel = document.querySelector("[data-menu-panel]");
const menuOverlay = document.querySelector("[data-menu-overlay]");

function closeMenu() {
  if (!menuToggle || !menuPanel || !menuOverlay) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  menuPanel.classList.remove("is-open");
  menuOverlay.hidden = true;
  document.body.classList.remove("is-nav-open");
}

if (menuToggle && menuPanel && menuOverlay) {
  menuToggle.addEventListener("click", () => {
    const nextExpanded = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(nextExpanded));
    menuPanel.classList.toggle("is-open", nextExpanded);
    menuOverlay.hidden = !nextExpanded;
    document.body.classList.toggle("is-nav-open", nextExpanded);
  });

  menuOverlay.addEventListener("click", closeMenu);
  menuPanel.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
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
