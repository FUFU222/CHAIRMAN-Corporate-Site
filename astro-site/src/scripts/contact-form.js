const RECAPTCHA_API_SRCS = [
  "https://www.google.com/recaptcha/api.js?render=explicit",
  "https://www.recaptcha.net/recaptcha/api.js?render=explicit"
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9()+.\- ]{6,32}$/;
const SUSPICIOUS_MARKUP_PATTERN = /<[^>]+>|javascript:|data:text\/html|on[a-z]+\s*=|<script/i;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001F\u007F]/g;
const MULTILINE_CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MIN_FORM_FILL_MS = 1500;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;
const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 254;
const PHONE_MAX_LENGTH = 32;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const RECAPTCHA_READY_TIMEOUT_MS = 7000;
const RECAPTCHA_READY_POLL_MS = 120;
const SUBMISSION_SOFT_TIMEOUT_MS = 15000;
const SUBMISSION_HARD_TIMEOUT_MS = 60000;

function getRecaptchaApi(windowObject) {
  return windowObject.grecaptcha && typeof windowObject.grecaptcha.render === "function"
    ? windowObject.grecaptcha
    : null;
}

function safeNormalize(value, form = "NFKC") {
  return typeof value.normalize === "function" ? value.normalize(form) : value;
}

function normalizeSingleLine(value) {
  return safeNormalize(String(value || ""))
    .replace(CONTROL_CHARS_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeEmail(value) {
  return normalizeSingleLine(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeSingleLine(value);
}

function normalizeMessage(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(MULTILINE_CONTROL_CHARS_PATTERN, "")
    .trim();
}

function hasSuspiciousMarkup(value) {
  return SUSPICIOUS_MARKUP_PATTERN.test(value);
}

function setFieldError(field, message) {
  field.setCustomValidity(message);
}

function clearFieldError(field) {
  field.setCustomValidity("");
}

function waitForRecaptchaReady({
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

function loadManagedRecaptchaScript({
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

function ensureRecaptchaScript(documentRef, windowRef, src) {
  return loadManagedRecaptchaScript({
    document: documentRef,
    window: windowRef,
    src,
    timeoutMs: RECAPTCHA_READY_TIMEOUT_MS,
    pollMs: RECAPTCHA_READY_POLL_MS
  });
}

function loadRecaptchaApi(windowRef, documentRef) {
  const readyApi = windowRef.grecaptcha && typeof windowRef.grecaptcha.render === "function"
    ? windowRef.grecaptcha
    : null;
  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  if (windowRef.__chairmanRecaptchaPromise) {
    return windowRef.__chairmanRecaptchaPromise;
  }

  windowRef.__chairmanRecaptchaPromise = RECAPTCHA_API_SRCS.reduce((promise, src) => {
    return promise.catch(() => ensureRecaptchaScript(documentRef, windowRef, src));
  }, Promise.reject(new Error("reCAPTCHA not attempted")));

  return windowRef.__chairmanRecaptchaPromise.catch((error) => {
    windowRef.__chairmanRecaptchaPromise = null;
    throw error;
  });
}

export function initializeContactForm(options = {}) {
  const documentRef = options.document ?? (typeof document === "undefined" ? null : document);
  const windowRef = options.window ?? (typeof window === "undefined" ? null : window);

  if (!documentRef || !windowRef) {
    return false;
  }

  const HTMLElementCtor = typeof windowRef.HTMLElement === "function" ? windowRef.HTMLElement : null;
  const HTMLDialogElementCtor =
    typeof windowRef.HTMLDialogElement === "function" ? windowRef.HTMLDialogElement : null;
  const form = documentRef.querySelector("[data-contact-form]");
  const statusMessage = documentRef.querySelector("[data-contact-status]");
  const submit = documentRef.querySelector("[data-contact-submit]");
  const submitLabel = documentRef.querySelector("[data-contact-submit-label]");
  const recaptchaContainer = documentRef.querySelector("[data-recaptcha]");
  const resultDialog = documentRef.querySelector("[data-contact-result-dialog]");
  const resultPanel = documentRef.querySelector("[data-contact-result-panel]");
  const resultEyebrow = documentRef.querySelector("[data-contact-result-eyebrow]");
  const resultTitle = documentRef.querySelector("[data-contact-result-title]");
  const resultMessage = documentRef.querySelector("[data-contact-result-message]");
  const resultAssist = documentRef.querySelector("[data-contact-result-assist]");
  const resultClose = documentRef.querySelector("[data-contact-result-close]");

  if (
    !form ||
    !statusMessage ||
    !submit ||
    !submitLabel ||
    !HTMLDialogElementCtor ||
    !(resultDialog instanceof HTMLDialogElementCtor) ||
    !resultPanel ||
    !resultEyebrow ||
    !resultTitle ||
    !resultMessage
  ) {
    return false;
  }

  let hasSubmitted = false;
  let recaptchaWidgetId = null;
  let submissionSoftTimeoutId = null;
  let submissionHardTimeoutId = null;
  let activeTrigger = null;
  const endpoint = form.dataset.endpoint || "";
  const nameInput = form.elements.namedItem("name");
  const emailInput = form.elements.namedItem("email");
  const phoneInput = form.elements.namedItem("phone");
  const categoryInput = form.elements.namedItem("category");
  const messageInput = form.elements.namedItem("message");
  const companyInput = form.elements.namedItem("company");
  const jsEnabledInput = form.elements.namedItem("jsEnabled");
  const submittedAtInput = form.elements.namedItem("submittedAt");
  const recaptchaResponseInput = form.elements.namedItem("g-recaptcha-response");
  const recaptchaSiteKey = recaptchaContainer?.dataset.sitekey || "";
  const allowedCategories = new Set(
    Array.from(categoryInput?.options || [])
      .map((option) => option.value)
      .filter(Boolean)
  );
  const endpointOrigin = (() => {
    if (!endpoint) {
      return "";
    }

    try {
      return new windowRef.URL(endpoint, windowRef.location.href).origin;
    } catch (error) {
      return "";
    }
  })();

  const setDialogLockState = (locked) => {
    const scrollbarWidth = Math.max(0, windowRef.innerWidth - documentRef.documentElement.clientWidth);
    documentRef.documentElement.style.setProperty("--scroll-lock-offset", locked ? `${scrollbarWidth}px` : "0px");
    documentRef.body.classList.toggle("is-dialog-open", locked);
  };

  const closeResultDialog = () => {
    if (resultDialog.open) {
      resultDialog.close();
    }
  };

  const openResultDialog = ({ eyebrow, title, message, state, assist = false }) => {
    resultPanel.dataset.state = state;
    resultEyebrow.textContent = eyebrow;
    resultTitle.textContent = title;
    resultMessage.textContent = message;

    if (resultAssist) {
      resultAssist.hidden = !assist;
    }

    activeTrigger = submit;
    setDialogLockState(true);

    if (resultDialog.open) {
      return;
    }

    resultDialog.showModal();
  };

  const setStatus = (message, state, options = {}) => {
    const {
      label = "",
      assist = false,
      modal = false,
      eyebrow = "CONTACT"
    } = options;

    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
    submitLabel.textContent = state === "submitting" ? "送信中..." : "送信する";

    if (modal) {
      openResultDialog({
        eyebrow,
        title: label,
        message,
        state,
        assist
      });
    }
  };

  const clearSubmissionTimeout = () => {
    if (submissionSoftTimeoutId) {
      windowRef.clearTimeout(submissionSoftTimeoutId);
      submissionSoftTimeoutId = null;
    }

    if (submissionHardTimeoutId) {
      windowRef.clearTimeout(submissionHardTimeoutId);
      submissionHardTimeoutId = null;
    }
  };

  const resetSubmissionWindow = () => {
    if (submittedAtInput) {
      submittedAtInput.value = String(Date.now());
    }
  };

  const clearRecaptchaResponse = () => {
    if (recaptchaResponseInput) {
      recaptchaResponseInput.value = "";
    }
  };

  const resetRecaptcha = () => {
    clearRecaptchaResponse();
    if (windowRef.grecaptcha && recaptchaWidgetId !== null) {
      windowRef.grecaptcha.reset(recaptchaWidgetId);
    }
  };

  const mountRecaptcha = () => {
    if (!recaptchaContainer || !recaptchaSiteKey || recaptchaWidgetId !== null) {
      return;
    }

    loadRecaptchaApi(windowRef, documentRef)
      .then((grecaptcha) => {
        if (!grecaptcha || typeof grecaptcha.render !== "function" || recaptchaWidgetId !== null) {
          return;
        }

        recaptchaWidgetId = grecaptcha.render(recaptchaContainer, {
          sitekey: recaptchaSiteKey,
          callback(token) {
            if (recaptchaResponseInput) {
              recaptchaResponseInput.value = token;
            }
            setStatus("入力内容を確認のうえ送信してください。", "idle", {
              label: "ご案内"
            });
          },
          "expired-callback": () => {
            clearRecaptchaResponse();
            setStatus("確認の有効期限が切れました。もう一度お試しください。", "error", {
              label: "再確認をお願いします",
              modal: true,
              eyebrow: "ATTENTION"
            });
          },
          "error-callback": () => {
            clearRecaptchaResponse();
            setStatus("確認画面の読み込みに時間がかかっています。時間をおいて再度お試しください。", "error", {
              label: "読み込みエラー",
              modal: true,
              eyebrow: "CONTACT"
            });
          }
        });
      })
      .catch(() => {
        setStatus("確認画面の読み込みに時間がかかっています。時間をおいて再度お試しください。", "error", {
          label: "読み込みエラー",
          modal: true,
          eyebrow: "CONTACT"
        });
      });
  };

  const isAllowedMessageOrigin = (origin) => {
    if (!origin) {
      return false;
    }

    if (endpointOrigin && origin === endpointOrigin) {
      return true;
      }

      try {
        const hostname = new windowRef.URL(origin).hostname;
        return (
          hostname === "script.google.com" ||
          hostname === "script.googleusercontent.com" ||
        hostname.endsWith(".googleusercontent.com")
      );
    } catch (error) {
      return false;
    }
  };

  const handleSubmissionResult = (payload) => {
    hasSubmitted = false;
    clearSubmissionTimeout();
    submit.disabled = false;

    if (payload.ok) {
      form.reset();
      jsEnabledInput && (jsEnabledInput.value = "1");
      resetSubmissionWindow();
      resetRecaptcha();
      setStatus("お問い合わせを受け付けました。通常3営業日以内に担当よりご連絡します。", "success", {
        label: "お問い合わせを受け付けました",
        modal: true,
        eyebrow: "SEND COMPLETE"
      });
      return;
    }

    resetSubmissionWindow();
    resetRecaptcha();

    const errorMessages = {
      duplicate: {
        message: "同じ内容の送信が短時間に繰り返されています。時間をおいて再度お試しください。",
        label: "送信をお待ちください",
        assist: false,
        eyebrow: "SEND ERROR"
      },
      rate_limited: {
        message: "短時間の送信が多いため、しばらく時間をおいて再度お試しください。",
        label: "時間をおいて再送してください",
        assist: false,
        eyebrow: "SEND ERROR"
      },
      busy: {
        message: "現在送信が混み合っています。しばらく時間をおいて再度お試しください。",
        label: "送信が混み合っています",
        assist: true,
        eyebrow: "SEND ERROR"
      },
      recaptcha_failed: {
        message: "送信前の確認が完了していません。もう一度チェックしてお試しください。",
        label: "再確認をお願いします",
        assist: false,
        eyebrow: "ATTENTION"
      },
      recaptcha_hostname_mismatch: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true,
        eyebrow: "CONTACT"
      },
      recaptcha_unavailable: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true,
        eyebrow: "CONTACT"
      },
      recaptcha_invalid_response: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true,
        eyebrow: "CONTACT"
      },
      recaptcha_not_configured: {
        message: "現在フォームからの送信が不安定です。お手数ですが、時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true,
        eyebrow: "CONTACT"
      },
      missing_recaptcha_token: {
        message: "送信前の確認を完了してからお試しください。",
        label: "再確認をお願いします",
        assist: false,
        eyebrow: "ATTENTION"
      }
    };

    const errorState = errorMessages[payload.message] || {
      message: "送信できませんでした。時間をおいて再度お試しいただくか、下記アドレスまで直接ご連絡ください。",
      label: "送信できませんでした",
      assist: true,
      eyebrow: "CONTACT"
    };

    setStatus(errorState.message, "error", {
      label: errorState.label,
      assist: errorState.assist,
      modal: true,
      eyebrow: errorState.eyebrow
    });
  };

  const validateForm = () => {
    setStatus("入力内容を確認のうえ送信してください。", "idle", {
      label: "ご案内"
    });

    if (!nameInput || !emailInput || !phoneInput || !categoryInput || !messageInput || !companyInput) {
      setStatus("現在フォームの送信準備が整っていません。時間をおいて再度お試しください。", "error", {
        label: "送信できませんでした",
        assist: true,
        modal: true,
        eyebrow: "CONTACT"
      });
      return false;
    }

    clearFieldError(nameInput);
    clearFieldError(emailInput);
    clearFieldError(phoneInput);
    clearFieldError(categoryInput);
    clearFieldError(messageInput);
    clearFieldError(companyInput);

    nameInput.value = normalizeSingleLine(nameInput.value);
    emailInput.value = normalizeEmail(emailInput.value);
    phoneInput.value = normalizePhone(phoneInput.value);
    messageInput.value = normalizeMessage(messageInput.value);

    if (!nameInput.value) {
      setFieldError(nameInput, "お名前を入力してください。");
    } else if (nameInput.value.length > NAME_MAX_LENGTH) {
      setFieldError(nameInput, "お名前は80文字以内で入力してください。");
    } else if (hasSuspiciousMarkup(nameInput.value)) {
      setFieldError(nameInput, "HTMLタグやスクリプトは入力できません。");
    }

    if (!emailInput.value) {
      setFieldError(emailInput, "メールアドレスを入力してください。");
    } else if (emailInput.value.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(emailInput.value)) {
      setFieldError(emailInput, "メールアドレスの形式をご確認ください。");
    }

    if (phoneInput.value) {
      if (phoneInput.value.length > PHONE_MAX_LENGTH || !PHONE_PATTERN.test(phoneInput.value)) {
        setFieldError(phoneInput, "電話番号の形式をご確認ください。");
      }
    }

    if (!allowedCategories.has(categoryInput.value)) {
      setFieldError(categoryInput, "問い合わせ種別を選択してください。");
    }

    if (!messageInput.value) {
      setFieldError(messageInput, "本文を入力してください。");
    } else if (messageInput.value.length < MESSAGE_MIN_LENGTH) {
      setFieldError(messageInput, "本文は10文字以上で入力してください。");
    } else if (messageInput.value.length > MESSAGE_MAX_LENGTH) {
      setFieldError(messageInput, "本文は2000文字以内で入力してください。");
    } else if (hasSuspiciousMarkup(messageInput.value)) {
      setFieldError(messageInput, "HTMLタグやスクリプトは入力できません。");
    }

    const submittedAt = Number(submittedAtInput?.value || "0");
    const elapsed = Date.now() - submittedAt;
    if (!submittedAt || elapsed < MIN_FORM_FILL_MS) {
      setStatus("内容を確認してから、もう一度送信してください。", "error", {
        label: "内容をご確認ください"
      });
      return false;
    }

    if (elapsed > MAX_FORM_AGE_MS) {
      resetSubmissionWindow();
      setStatus("入力に時間が空いたため、内容を確認のうえ再送信してください。", "error", {
        label: "再送信をお願いします"
      });
      return false;
    }

    const invalidField = [nameInput, emailInput, phoneInput, categoryInput, messageInput].find(
      (field) => !field.checkValidity()
    );

    if (invalidField) {
      setStatus("入力内容をご確認ください。", "error", {
        label: "内容をご確認ください"
      });
      invalidField.reportValidity();
      return false;
    }

    return true;
  };

  jsEnabledInput && (jsEnabledInput.value = "1");
  resetSubmissionWindow();
  clearRecaptchaResponse();
  mountRecaptcha();

  form.addEventListener("submit", (event) => {
    if (!validateForm()) {
      event.preventDefault();
      return;
    }

    if (endpoint) {
      if (!recaptchaContainer || !recaptchaSiteKey) {
        event.preventDefault();
        setStatus("現在フォームからの送信が不安定です。時間をおいて再度お試しください。", "error", {
          label: "送信できませんでした",
          assist: true,
          modal: true,
          eyebrow: "CONTACT"
        });
        return;
      }

      if (!windowRef.grecaptcha || recaptchaWidgetId === null) {
        event.preventDefault();
        setStatus("確認画面を読み込んでいます。数秒後に再度お試しください。", "submitting", {
          label: "読み込み中"
        });
        mountRecaptcha();
        return;
      }

      const recaptchaToken =
        (recaptchaResponseInput && recaptchaResponseInput.value) ||
        windowRef.grecaptcha.getResponse(recaptchaWidgetId);

      if (!recaptchaToken) {
        event.preventDefault();
        setStatus("送信前の確認を完了してからお試しください。", "error", {
          label: "再確認をお願いします"
        });
        return;
      }

      if (recaptchaResponseInput) {
        recaptchaResponseInput.value = recaptchaToken;
      }
    }

    if (!endpoint) {
      event.preventDefault();
      submit.disabled = true;
      setStatus("デモ送信を実行しています。", "submitting", {
        label: "デモ送信中"
      });
      windowRef.setTimeout(() => {
        form.reset();
        jsEnabledInput && (jsEnabledInput.value = "1");
        resetSubmissionWindow();
        resetRecaptcha();
        submit.disabled = false;
        setStatus("デモ送信が完了しました。現在は確認用の表示です。", "success", {
          label: "デモ送信が完了しました",
          modal: true,
          eyebrow: "DEMO"
        });
      }, 700);
      return;
    }

    hasSubmitted = true;
    submit.disabled = true;
    setStatus("内容を送信しています。数秒ほどお待ちください。", "submitting", {
      label: "送信中"
    });
    clearSubmissionTimeout();
    submissionSoftTimeoutId = windowRef.setTimeout(() => {
      if (!hasSubmitted) {
        return;
      }

      setStatus("送信処理に時間がかかっています。このまましばらくお待ちください。長時間完了しない場合は、下記アドレスまで直接ご連絡ください。", "submitting", {
        label: "送信処理に時間がかかっています",
        assist: true,
        modal: true,
        eyebrow: "CONTACT"
      });
    }, SUBMISSION_SOFT_TIMEOUT_MS);

    submissionHardTimeoutId = windowRef.setTimeout(() => {
      if (!hasSubmitted) {
        return;
      }

      hasSubmitted = false;
      submit.disabled = false;
      resetSubmissionWindow();
      resetRecaptcha();
      setStatus("送信結果の確認に時間がかかっています。お手数ですが、時間をおいて再度お試しいただくか、下記アドレスまで直接ご連絡ください。", "error", {
        label: "送信できませんでした",
        assist: true,
        modal: true,
        eyebrow: "CONTACT"
      });
    }, SUBMISSION_HARD_TIMEOUT_MS);
  });

  if (HTMLElementCtor && resultClose instanceof HTMLElementCtor) {
    resultClose.addEventListener("click", closeResultDialog);
  }

  resultDialog.addEventListener("close", () => {
    setDialogLockState(false);
    if (HTMLElementCtor && activeTrigger instanceof HTMLElementCtor) {
      activeTrigger.focus();
    }
  });

  resultDialog.addEventListener("click", (event) => {
    if (event.target === resultDialog) {
      closeResultDialog();
    }
  });

  windowRef.addEventListener("message", (event) => {
    if (!hasSubmitted || !isAllowedMessageOrigin(event.origin)) {
      return;
    }

    if (!event.data || event.data.type !== "chairman-contact-submit") {
      return;
    }

    handleSubmissionResult(event.data);
  });

  return true;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  initializeContactForm({ document, window });
}
