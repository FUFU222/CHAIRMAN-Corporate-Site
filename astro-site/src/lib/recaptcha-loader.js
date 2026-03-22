export function getRecaptchaApi(windowObject) {
  return windowObject.grecaptcha && typeof windowObject.grecaptcha.render === "function"
    ? windowObject.grecaptcha
    : null;
}

export function waitForRecaptchaReady({
  window,
  timeoutMs = 7000,
  pollMs = 120
}) {
  const readyApi = getRecaptchaApi(window);
  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      const api = getRecaptchaApi(window);
      if (api) {
        resolve(api);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("reCAPTCHA timed out"));
        return;
      }

      window.setTimeout(check, pollMs);
    };

    check();
  });
}

function appendRecaptchaScript({
  document,
  window,
  src,
  timeoutMs,
  pollMs
}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.chairmanRecaptchaState = "loading";

    script.addEventListener(
      "load",
      () => {
        script.dataset.chairmanRecaptchaState = "loaded";
        waitForRecaptchaReady({ window, timeoutMs, pollMs })
          .then(resolve)
          .catch((error) => {
            script.dataset.chairmanRecaptchaState = "error";
            reject(error);
          });
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        script.dataset.chairmanRecaptchaState = "error";
        reject(new Error("reCAPTCHA failed to load"));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

export function ensureRecaptchaScript({
  document,
  window,
  src,
  timeoutMs = 7000,
  pollMs = 120
}) {
  const readyApi = getRecaptchaApi(window);
  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  const existingScript = document.querySelector(`script[src="${src}"]`);
  if (existingScript) {
    if (existingScript.dataset.chairmanRecaptchaState === "error") {
      existingScript.remove();
    } else {
      return waitForRecaptchaReady({ window, timeoutMs, pollMs }).catch(() => {
        existingScript.dataset.chairmanRecaptchaState = "error";
        existingScript.remove();
        return appendRecaptchaScript({ document, window, src, timeoutMs, pollMs });
      });
    }
  }

  return appendRecaptchaScript({ document, window, src, timeoutMs, pollMs });
}
