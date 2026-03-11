const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hero = document.querySelector("[data-hero]");

if (hero) {
  const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
  const firstImage = slides[0]?.querySelector("img");
  let currentIndex = 0;
  let intervalId = 0;

  const showSlide = (nextIndex) => {
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[nextIndex];

    currentSlide?.classList.remove("is-active");
    currentSlide?.classList.add("is-previous");
    currentSlide?.setAttribute("aria-hidden", "true");

    nextSlide?.classList.remove("is-previous");
    nextSlide?.classList.add("is-active");
    nextSlide?.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      currentSlide?.classList.remove("is-previous");
    }, 1200);

    currentIndex = nextIndex;
  };

  const startRotation = () => {
    intervalId = window.setInterval(() => {
      showSlide((currentIndex + 1) % slides.length);
    }, 5000);
  };

  const setReady = () => {
    hero.classList.add("is-ready");

    if (prefersReducedMotion || slides.length < 2) {
      return;
    }

    startRotation();
  };

  const start = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(setReady);
    });
  };

  if (prefersReducedMotion) {
    setReady();
  } else if (firstImage?.complete) {
    start();
  } else {
    firstImage?.addEventListener("load", start, { once: true });
    firstImage?.addEventListener("error", start, { once: true });
  }

  document.addEventListener("visibilitychange", () => {
    if (!intervalId || prefersReducedMotion) {
      return;
    }

    if (document.hidden) {
      window.clearInterval(intervalId);
      intervalId = 0;
      return;
    }

    startRotation();
  });
}
