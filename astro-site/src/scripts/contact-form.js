const form = document.querySelector("[data-contact-form]");
const statusMessage = document.querySelector("[data-contact-status]");
const submit = document.querySelector("[data-contact-submit]");
const recaptchaContainer = document.querySelector("[data-recaptcha]");
const feedback = document.querySelector("[data-contact-feedback]");
const feedbackLabel = document.querySelector("[data-contact-feedback-label]");
const assistMessage = document.querySelector("[data-contact-assist]");

const RECAPTCHA_API_SRCS = [
  "https://www.google.com/recaptcha/api.js?render=explicit",
  "https://www.recaptcha.net/recaptcha/api.js?render=explicit"
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9()+\-. ]{6,32}$/;
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

function getRecaptchaApi() {
  return window.grecaptcha && typeof window.grecaptcha.render === "function" ? window.grecaptcha : null;
}

function waitForRecaptchaReady(timeoutMs = RECAPTCHA_READY_TIMEOUT_MS) {
  const readyApi = getRecaptchaApi();
  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      const api = getRecaptchaApi();
      if (api) {
        resolve(api);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("reCAPTCHA timed out"));
        return;
      }

      window.setTimeout(check, RECAPTCHA_READY_POLL_MS);
    };

    check();
  });
}

function ensureRecaptchaScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      waitForRecaptchaReady()
        .then(resolve)
        .catch(() => {
          existingScript.addEventListener("load", () => {
            waitForRecaptchaReady().then(resolve).catch(reject);
          }, { once: true });
          existingScript.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load")), { once: true });
        });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      waitForRecaptchaReady().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });
}

function loadRecaptchaApi() {
  const readyApi = getRecaptchaApi();
  if (readyApi) {
    return Promise.resolve(readyApi);
  }

  if (window.__chairmanRecaptchaPromise) {
    return window.__chairmanRecaptchaPromise;
  }

  window.__chairmanRecaptchaPromise = RECAPTCHA_API_SRCS.reduce((promise, src) => {
    return promise.catch(() => ensureRecaptchaScript(src));
  }, Promise.reject(new Error("reCAPTCHA not attempted")));

  return window.__chairmanRecaptchaPromise.catch((error) => {
    window.__chairmanRecaptchaPromise = null;
    throw error;
  });
}

if (form && statusMessage && submit && feedback && feedbackLabel) {
  let hasSubmitted = false;
  let recaptchaWidgetId = null;
  let submissionTimeoutId = null;
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
      return new URL(endpoint, window.location.href).origin;
    } catch (error) {
      return "";
    }
  })();

  const setStatus = (message, state, options = {}) => {
    const { label = "", assist = false } = options;
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
    feedback.dataset.state = state;
    feedbackLabel.textContent = label;

    if (assistMessage) {
      assistMessage.hidden = !assist;
    }
  };

  const clearSubmissionTimeout = () => {
    if (submissionTimeoutId) {
      window.clearTimeout(submissionTimeoutId);
      submissionTimeoutId = null;
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
    if (window.grecaptcha && recaptchaWidgetId !== null) {
      window.grecaptcha.reset(recaptchaWidgetId);
    }
  };

  const mountRecaptcha = () => {
    if (!recaptchaContainer || !recaptchaSiteKey || recaptchaWidgetId !== null) {
      return;
    }

    loadRecaptchaApi()
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
              label: "再確認をお願いします"
            });
          },
          "error-callback": () => {
            clearRecaptchaResponse();
            setStatus("確認画面の読み込みに時間がかかっています。時間をおいて再度お試しください。", "error", {
              label: "読み込みエラー"
            });
          }
        });
      })
      .catch(() => {
        setStatus("確認画面の読み込みに時間がかかっています。時間をおいて再度お試しください。", "error", {
          label: "読み込みエラー"
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
      const hostname = new URL(origin).hostname;
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
        label: "送信完了"
      });
      return;
    }

    resetSubmissionWindow();
    resetRecaptcha();

    const errorMessages = {
      duplicate: {
        message: "同じ内容の送信が短時間に繰り返されています。時間をおいて再度お試しください。",
        label: "送信をお待ちください",
        assist: false
      },
      rate_limited: {
        message: "短時間の送信が多いため、しばらく時間をおいて再度お試しください。",
        label: "時間をおいて再送してください",
        assist: false
      },
      busy: {
        message: "現在送信が混み合っています。しばらく時間をおいて再度お試しください。",
        label: "送信が混み合っています",
        assist: true
      },
      recaptcha_failed: {
        message: "送信前の確認が完了していません。もう一度チェックしてお試しください。",
        label: "再確認をお願いします",
        assist: false
      },
      recaptcha_hostname_mismatch: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true
      },
      recaptcha_unavailable: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true
      },
      recaptcha_invalid_response: {
        message: "現在フォームからの送信が不安定です。時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true
      },
      recaptcha_not_configured: {
        message: "現在フォームからの送信が不安定です。お手数ですが、時間をおいて再度お試しください。",
        label: "送信できませんでした",
        assist: true
      },
      missing_recaptcha_token: {
        message: "送信前の確認を完了してからお試しください。",
        label: "再確認をお願いします",
        assist: false
      }
    };

    const errorState = errorMessages[payload.message] || {
      message: "送信できませんでした。時間をおいて再度お試しいただくか、下記アドレスまで直接ご連絡ください。",
      label: "送信できませんでした",
      assist: true
    };

    setStatus(errorState.message, "error", {
      label: errorState.label,
      assist: errorState.assist
    });
  };

  const validateForm = () => {
    setStatus("入力内容を確認のうえ送信してください。", "idle", {
      label: "ご案内"
    });

    if (!nameInput || !emailInput || !phoneInput || !categoryInput || !messageInput || !companyInput) {
      setStatus("現在フォームの送信準備が整っていません。時間をおいて再度お試しください。", "error", {
        label: "送信できませんでした",
        assist: true
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
          assist: true
        });
        return;
      }

      if (!window.grecaptcha || recaptchaWidgetId === null) {
        event.preventDefault();
        setStatus("確認画面を読み込んでいます。数秒後に再度お試しください。", "submitting", {
          label: "読み込み中"
        });
        mountRecaptcha();
        return;
      }

      const recaptchaToken =
        (recaptchaResponseInput && recaptchaResponseInput.value) ||
        window.grecaptcha.getResponse(recaptchaWidgetId);

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
      window.setTimeout(() => {
        form.reset();
        jsEnabledInput && (jsEnabledInput.value = "1");
        resetSubmissionWindow();
        resetRecaptcha();
        submit.disabled = false;
        setStatus("デモ送信が完了しました。現在は確認用の表示です。", "success", {
          label: "デモ送信完了"
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
    submissionTimeoutId = window.setTimeout(() => {
      if (!hasSubmitted) {
        return;
      }

      hasSubmitted = false;
      submit.disabled = false;
      resetSubmissionWindow();
      resetRecaptcha();
      setStatus("送信結果の確認に時間がかかっています。お手数ですが、時間をおいて再度お試しいただくか、下記アドレスまで直接ご連絡ください。", "error", {
        label: "送信できませんでした",
        assist: true
      });
    }, 15000);
  });

  window.addEventListener("message", (event) => {
    if (!hasSubmitted || !isAllowedMessageOrigin(event.origin)) {
      return;
    }

    if (!event.data || event.data.type !== "chairman-contact-submit") {
      return;
    }

    handleSubmissionResult(event.data);
  });
}
