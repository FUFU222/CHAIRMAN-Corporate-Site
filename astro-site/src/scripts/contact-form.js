const form = document.querySelector("[data-contact-form]");
const statusMessage = document.querySelector("[data-contact-status]");
const submit = document.querySelector("[data-contact-submit]");
const recaptchaContainer = document.querySelector("[data-recaptcha]");

const RECAPTCHA_API_SRC = "https://www.google.com/recaptcha/api.js?render=explicit";
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

function loadRecaptchaApi() {
  if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
    return Promise.resolve(window.grecaptcha);
  }

  if (window.__chairmanRecaptchaPromise) {
    return window.__chairmanRecaptchaPromise;
  }

  window.__chairmanRecaptchaPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RECAPTCHA_API_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.grecaptcha), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RECAPTCHA_API_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });

  return window.__chairmanRecaptchaPromise;
}

if (form && statusMessage && submit) {
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

  const setStatus = (message, state) => {
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
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
            setStatus("入力内容を確認のうえ送信してください。", "idle");
          },
          "expired-callback": () => {
            clearRecaptchaResponse();
            setStatus("reCAPTCHA の有効期限が切れました。もう一度チェックしてください。", "error");
          },
          "error-callback": () => {
            clearRecaptchaResponse();
            setStatus("reCAPTCHA の読み込みに失敗しました。時間をおいて再度お試しください。", "error");
          }
        });
      })
      .catch(() => {
        setStatus("reCAPTCHA の読み込みに失敗しました。時間をおいて再度お試しください。", "error");
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
      setStatus("送信を受け付けました。内容を確認のうえ担当よりご連絡します。", "success");
      return;
    }

    resetSubmissionWindow();
    resetRecaptcha();

    const errorMessages = {
      duplicate: "同じ内容の送信が短時間に繰り返されています。時間をおいて再度お試しください。",
      rate_limited: "短時間の送信が多すぎます。しばらく時間をおいて再度お試しください。",
      busy: "現在送信が混み合っています。しばらく時間をおいて再度お試しください。",
      recaptcha_failed: "reCAPTCHA の確認に失敗しました。もう一度チェックして送信してください。",
      recaptcha_hostname_mismatch: "reCAPTCHA の検証元が一致しません。設定をご確認ください。",
      recaptcha_unavailable: "reCAPTCHA 検証サービスへ接続できませんでした。時間をおいて再度お試しください。",
      recaptcha_invalid_response: "reCAPTCHA の検証結果を確認できませんでした。時間をおいて再度お試しください。",
      recaptcha_not_configured: "サーバー側の reCAPTCHA 設定が未完了です。設定をご確認ください。",
      missing_recaptcha_token: "reCAPTCHA を完了してから送信してください。"
    };

    setStatus(errorMessages[payload.message] || "送信に失敗しました。入力内容を確認して再度お試しください。", "error");
  };

  const validateForm = () => {
    setStatus("入力内容を確認のうえ送信してください。", "idle");

    if (!nameInput || !emailInput || !phoneInput || !categoryInput || !messageInput || !companyInput) {
      setStatus("フォーム設定に不備があります。時間をおいて再度お試しください。", "error");
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
      setStatus("送信までの時間が短すぎます。内容を確認してからもう一度お試しください。", "error");
      return false;
    }

    if (elapsed > MAX_FORM_AGE_MS) {
      resetSubmissionWindow();
      setStatus("フォームの有効期限が切れました。入力内容を確認して再送信してください。", "error");
      return false;
    }

    const invalidField = [nameInput, emailInput, phoneInput, categoryInput, messageInput].find(
      (field) => !field.checkValidity()
    );

    if (invalidField) {
      setStatus("入力内容をご確認ください。", "error");
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
        setStatus("reCAPTCHA の設定が未完了です。設定後に再度お試しください。", "error");
        return;
      }

      if (!window.grecaptcha || recaptchaWidgetId === null) {
        event.preventDefault();
        setStatus("reCAPTCHA を読み込んでいます。数秒後に再度お試しください。", "error");
        mountRecaptcha();
        return;
      }

      const recaptchaToken =
        (recaptchaResponseInput && recaptchaResponseInput.value) ||
        window.grecaptcha.getResponse(recaptchaWidgetId);

      if (!recaptchaToken) {
        event.preventDefault();
        setStatus("reCAPTCHA を完了してから送信してください。", "error");
        return;
      }

      if (recaptchaResponseInput) {
        recaptchaResponseInput.value = recaptchaToken;
      }
    }

    if (!endpoint) {
      event.preventDefault();
      submit.disabled = true;
      setStatus("デモ送信を実行しています。", "submitting");
      window.setTimeout(() => {
        form.reset();
        jsEnabledInput && (jsEnabledInput.value = "1");
        resetSubmissionWindow();
        resetRecaptcha();
        submit.disabled = false;
        setStatus("デモ送信が完了しました。Apps Script URL を設定すると本送信に切り替わります。", "success");
      }, 700);
      return;
    }

    hasSubmitted = true;
    submit.disabled = true;
    setStatus("送信中です。しばらくお待ちください。", "submitting");
    clearSubmissionTimeout();
    submissionTimeoutId = window.setTimeout(() => {
      if (!hasSubmitted) {
        return;
      }

      hasSubmitted = false;
      submit.disabled = false;
      resetSubmissionWindow();
      resetRecaptcha();
      setStatus("送信結果を確認できませんでした。Apps Script を最新コードで再デプロイしたうえで、もう一度お試しください。", "error");
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
