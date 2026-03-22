const CONTACT_SUBJECT_PREFIX = "[CHAIRMAN Contact]";
const CONTACT_AUTO_REPLY_SUBJECT = "お問い合わせありがとうございます | 株式会社CHAIRMAN";
const RESPONSE_MESSAGE_TYPE = "chairman-contact-submit";
const COMPANY_NAME = "株式会社CHAIRMAN";
const SITE_URL = "https://chairman-official.com/";
const DEFAULT_REPLY_TO = "info@chairman.jp";
const BRAND_COLOR = "#8d0820";
const BRAND_COLOR_SOFT = "#f8eef1";
const SUCCESS_COLOR = "#226749";
const TEXT_COLOR = "#181214";
const MUTED_COLOR = "#6b5d61";
const LINE_COLOR = "rgba(141, 8, 32, 0.12)";
const ALLOWED_CATEGORIES = [
  "SNSマーケティングについて",
  "動画制作について",
  "イベント事業について",
  "酵素玄米などの健康食品について",
  "その他"
];
const SOURCE_NAME = "chairman-astro-site";
const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 254;
const PHONE_MAX_LENGTH = 32;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;
const MIN_FORM_FILL_MS = 1500;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_SECONDS = 300;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const GLOBAL_BURST_LIMIT = 12;
const GLOBAL_BURST_WINDOW_SECONDS = 60;
const GLOBAL_SUSTAINED_LIMIT = 40;
const GLOBAL_SUSTAINED_WINDOW_SECONDS = 600;
const EMAIL_BURST_LIMIT = 3;
const EMAIL_BURST_WINDOW_SECONDS = 600;
const EMAIL_DAILY_LIMIT = 8;
const EMAIL_DAILY_WINDOW_SECONDS = 86400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9()+\-. ]{6,32}$/;
const SUSPICIOUS_MARKUP_PATTERN = /<[^>]+>|javascript:|data:text\/html|on[a-z]+\s*=|<script/i;

function doGet() {
  return HtmlService.createHtmlOutput("CHAIRMAN contact endpoint is running.");
}

function doPost(e) {
  const payload = normalizePayload_(e && e.parameter ? e.parameter : {});
  // Honeypot. Quietly accept and do nothing.
  if (payload.company) {
    return iframeResponse_({ ok: true, message: "accepted" });
  }

  const validationError = validatePayload_(payload);
  if (validationError) {
    return iframeResponse_({ ok: false, message: validationError });
  }

  const abuseCheck = evaluateAbuseProtection_(payload);
  if (!abuseCheck.ok) {
    return iframeResponse_({ ok: false, message: abuseCheck.message });
  }

  const recaptchaCheck = verifyRecaptchaToken_(payload.recaptchaToken);
  if (!recaptchaCheck.ok) {
    return iframeResponse_({ ok: false, message: recaptchaCheck.message });
  }

  const properties = PropertiesService.getScriptProperties();
  const notifyTo = properties.getProperty("NOTIFY_TO");
  const sheetId = properties.getProperty("SHEET_ID");
  const sheetName = properties.getProperty("SHEET_NAME") || "contact";
  const replyToAddress = properties.getProperty("REPLY_TO") || notifyTo || DEFAULT_REPLY_TO;

  if (sheetId) {
    appendToSheet_(sheetId, sheetName, payload);
  }

  if (notifyTo) {
    sendNotification_(notifyTo, payload, replyToAddress);
  }

  if (payload.email) {
    sendAutoReply_(payload, replyToAddress);
  }

  return iframeResponse_({ ok: true, message: "accepted" });
}

function normalizePayload_(parameter) {
  return {
    name: normalizeSingleLine_(parameter.name, NAME_MAX_LENGTH),
    email: normalizeEmail_(parameter.email),
    phone: normalizePhone_(parameter.phone),
    category: normalizeSingleLine_(parameter.category, 64),
    message: normalizeMessage_(parameter.message),
    source: normalizeSingleLine_(parameter.source, 64),
    company: normalizeSingleLine_(parameter.company, 255),
    jsEnabled: normalizeSingleLine_(parameter.jsEnabled, 8),
    submittedAt: normalizeSingleLine_(parameter.submittedAt, 24),
    recaptchaToken: normalizeSingleLine_(parameter["g-recaptcha-response"], 4096)
  };
}

function validatePayload_(payload) {
  if (!payload.name) {
    return "name is required";
  }
  if (!payload.email) {
    return "email is required";
  }
  if (!payload.category) {
    return "category is required";
  }
  if (!payload.message) {
    return "message is required";
  }
  if (payload.source !== SOURCE_NAME) {
    return "invalid source";
  }
  if (payload.jsEnabled !== "1") {
    return "javascript flag is required";
  }
  if (!isValidSubmissionAge_(payload.submittedAt)) {
    return "invalid submission timing";
  }
  if (!payload.recaptchaToken) {
    return "missing_recaptcha_token";
  }
  if (payload.name.length > NAME_MAX_LENGTH || hasSuspiciousMarkup_(payload.name)) {
    return "invalid name";
  }
  if (!payload.email || payload.email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(payload.email)) {
    return "invalid email";
  }
  if (payload.phone && (!PHONE_PATTERN.test(payload.phone) || payload.phone.length > PHONE_MAX_LENGTH)) {
    return "invalid phone";
  }
  if (ALLOWED_CATEGORIES.indexOf(payload.category) === -1) {
    return "invalid category";
  }
  if (
    payload.message.length < MESSAGE_MIN_LENGTH ||
    payload.message.length > MESSAGE_MAX_LENGTH ||
    hasSuspiciousMarkup_(payload.message)
  ) {
    return "invalid message";
  }
  return "";
}

function appendToSheet_(sheetId, sheetName, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["timestamp", "name", "email", "phone", "category", "message", "source"]);
    }

    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      toSafeSheetValue_(payload.name),
      toSafeSheetValue_(payload.email),
      toSafeSheetValue_(payload.phone),
      toSafeSheetValue_(payload.category),
      toSafeSheetValue_(payload.message),
      toSafeSheetValue_(payload.source)
    ]);
  } finally {
    lock.releaseLock();
  }
}

function sendNotification_(notifyTo, payload, replyToAddress) {
  const subject = CONTACT_SUBJECT_PREFIX + " " + payload.category;
  const receivedAt = formatTimestamp_(new Date());
  const summaryRows = [
    { label: "お名前", value: payload.name },
    { label: "メールアドレス", value: payload.email },
    { label: "電話番号", value: payload.phone || "未入力" },
    { label: "問い合わせ種別", value: payload.category },
    { label: "受付日時", value: receivedAt }
  ];

  const body = [
    "CHAIRMANサイトからお問い合わせがありました。",
    "",
    "お名前: " + payload.name,
    "メールアドレス: " + payload.email,
    "電話番号: " + (payload.phone || "未入力"),
    "問い合わせ種別: " + payload.category,
    "受付日時: " + receivedAt,
    "",
    payload.message
  ].join("\n");

  const htmlBody = buildMailShell_({
    eyebrow: "CONTACT RECEIVED",
    title: "新しいお問い合わせを受け付けました",
    lead: "コーポレートサイトから新しいお問い合わせが届いています。返信時はお問い合わせ元メールアドレスへ返送されます。",
    tone: "default",
    summaryRows: summaryRows,
    messageLabel: "お問い合わせ本文",
    messageBody: payload.message,
    footer:
      "このメールは " +
      COMPANY_NAME +
      " の問い合わせ受付から自動送信されています。返信は " +
      escapeHtml_(payload.email) +
      " 宛に返送されます。"
  });

  MailApp.sendEmail(notifyTo, subject, body, {
    htmlBody: htmlBody,
    name: COMPANY_NAME,
    replyTo: payload.email || replyToAddress
  });
}

function sendAutoReply_(payload, replyToAddress) {
  const summaryRows = [
    { label: "お名前", value: payload.name },
    { label: "メールアドレス", value: payload.email },
    { label: "電話番号", value: payload.phone || "未入力" },
    { label: "問い合わせ種別", value: payload.category }
  ];

  const body = [
    payload.name + " 様",
    "",
    COMPANY_NAME + " へお問い合わせいただき、ありがとうございます。",
    "内容を確認のうえ、通常3営業日以内に担当よりご連絡します。",
    "お急ぎの場合は " + replyToAddress + " までご連絡ください。",
    "",
    "受け付けた内容",
    "お名前: " + payload.name,
    "メールアドレス: " + payload.email,
    "電話番号: " + (payload.phone || "未入力"),
    "問い合わせ種別: " + payload.category,
    "",
    payload.message
  ].join("\n");

  const htmlBody = buildMailShell_({
    eyebrow: "THANK YOU",
    title: "お問い合わせありがとうございます",
    lead:
      COMPANY_NAME +
      " へのお問い合わせを受け付けました。内容を確認のうえ、通常3営業日以内に担当よりご連絡します。",
    tone: "success",
    summaryRows: summaryRows,
    messageLabel: "お問い合わせ本文",
    messageBody: payload.message,
    note:
      "お急ぎの場合は <a href=\"mailto:" +
      escapeHtmlAttribute_(replyToAddress) +
      "\" style=\"color:" +
      BRAND_COLOR +
      ";text-decoration:underline;text-underline-offset:0.18em;\">" +
      escapeHtml_(replyToAddress) +
      "</a> まで直接ご連絡ください。",
    footer:
      "本メールは送信専用です。ご返信の際は " +
      escapeHtml_(replyToAddress) +
      " までご連絡ください。"
  });

  MailApp.sendEmail(payload.email, CONTACT_AUTO_REPLY_SUBJECT, body, {
    htmlBody: htmlBody,
    name: COMPANY_NAME,
    replyTo: replyToAddress
  });
}

function normalizeSingleLine_(value, maxLength) {
  let normalized = String(value || "");
  if (typeof normalized.normalize === "function") {
    normalized = normalized.normalize("NFKC");
  }

  normalized = normalized.replace(/[\u0000-\u001F\u007F]/g, " ").trim().replace(/\s+/g, " ");
  return normalized;
}

function normalizeEmail_(value) {
  return normalizeSingleLine_(value, EMAIL_MAX_LENGTH).toLowerCase();
}

function normalizePhone_(value) {
  return normalizeSingleLine_(value, PHONE_MAX_LENGTH);
}

function normalizeMessage_(value) {
  let normalized = String(value || "").replace(/\r\n?/g, "\n");
  normalized = normalized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  return normalized;
}

function formatTimestamp_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute_(value) {
  return escapeHtml_(value).replace(/\n/g, " ");
}

function escapeHtmlWithBreaks_(value) {
  return escapeHtml_(value).replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");
}

function buildMailShell_(options) {
  const tone = options.tone === "success" ? SUCCESS_COLOR : BRAND_COLOR;
  const summaryRows = options.summaryRows || [];
  const summaryHtml = summaryRows
    .map(function (row) {
      return (
        "<tr>" +
        "<td style=\"padding:11px 0;color:" +
        MUTED_COLOR +
        ";font-size:13px;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid " +
        LINE_COLOR +
        ";width:34%;vertical-align:top;\">" +
        escapeHtml_(row.label) +
        "</td>" +
        "<td style=\"padding:11px 0 11px 18px;color:" +
        TEXT_COLOR +
        ";font-size:14px;line-height:1.75;border-bottom:1px solid " +
        LINE_COLOR +
        ";\">" +
        escapeHtmlWithBreaks_(row.value) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const noteHtml = options.note
    ? "<div style=\"margin-top:22px;padding:18px 20px;border-radius:18px;background:" +
      BRAND_COLOR_SOFT +
      ";color:" +
      MUTED_COLOR +
      ";font-size:14px;line-height:1.8;\">" +
      options.note +
      "</div>"
    : "";

  const messageHtml = options.messageBody
    ? "<div style=\"margin-top:24px;\">" +
      "<p style=\"margin:0 0 10px;color:" +
      tone +
      ";font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;\">" +
      escapeHtml_(options.messageLabel || "本文") +
      "</p>" +
      "<div style=\"padding:20px 22px;border:1px solid " +
      LINE_COLOR +
      ";border-radius:18px;background:#ffffff;color:" +
      TEXT_COLOR +
      ";font-size:14px;line-height:1.9;\">" +
      escapeHtmlWithBreaks_(options.messageBody) +
      "</div>" +
      "</div>"
    : "";

  return (
    "<!doctype html><html><body style=\"margin:0;padding:0;background:#f4eff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Yu Gothic','Meiryo',sans-serif;color:" +
    TEXT_COLOR +
    ";\">" +
    "<div style=\"padding:32px 16px;\">" +
    "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"max-width:680px;margin:0 auto;border-collapse:collapse;\">" +
    "<tr><td>" +
    "<div style=\"padding:28px 30px 12px;background:" +
    tone +
    ";border-radius:28px 28px 0 0;color:#ffffff;\">" +
    "<p style=\"margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;opacity:0.88;\">" +
    escapeHtml_(options.eyebrow || "CONTACT") +
    "</p>" +
    "<p style=\"margin:0;font-size:31px;line-height:1.24;font-weight:700;\">" +
    escapeHtml_(COMPANY_NAME) +
    "</p>" +
    "</div>" +
    "</td></tr>" +
    "<tr><td>" +
    "<div style=\"padding:32px 30px;background:#ffffff;border:1px solid rgba(24,18,20,0.06);border-top:0;border-radius:0 0 28px 28px;box-shadow:0 18px 42px rgba(24,18,20,0.08);\">" +
    "<p style=\"margin:0 0 14px;color:" +
    tone +
    ";font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;\">" +
    escapeHtml_(options.eyebrow || "CONTACT") +
    "</p>" +
    "<h1 style=\"margin:0 0 16px;font-size:28px;line-height:1.4;font-weight:700;color:" +
    TEXT_COLOR +
    ";\">" +
    escapeHtml_(options.title || "") +
    "</h1>" +
    "<p style=\"margin:0;color:" +
    MUTED_COLOR +
    ";font-size:14px;line-height:1.9;\">" +
    escapeHtml_(options.lead || "") +
    "</p>" +
    "<div style=\"margin-top:28px;padding:22px 24px;border:1px solid " +
    LINE_COLOR +
    ";border-radius:20px;background:#fbf8f8;\">" +
    "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"border-collapse:collapse;\">" +
    summaryHtml +
    "</table>" +
    "</div>" +
    messageHtml +
    noteHtml +
    "<div style=\"margin-top:28px;padding-top:20px;border-top:1px solid " +
    LINE_COLOR +
    ";\">" +
    "<p style=\"margin:0 0 8px;color:" +
    TEXT_COLOR +
    ";font-size:13px;font-weight:700;\">" +
    escapeHtml_(COMPANY_NAME) +
    "</p>" +
    "<p style=\"margin:0;color:" +
    MUTED_COLOR +
    ";font-size:12px;line-height:1.8;\">" +
    escapeHtml_(options.footer || SITE_URL) +
    "</p>" +
    "</div>" +
    "</div>" +
    "</td></tr>" +
    "</table>" +
    "</div>" +
    "</body></html>"
  );
}

function hasSuspiciousMarkup_(value) {
  return SUSPICIOUS_MARKUP_PATTERN.test(value);
}

function isValidSubmissionAge_(value) {
  const submittedAt = Number(value);
  if (!submittedAt || !isFinite(submittedAt)) {
    return false;
  }

  const elapsed = Date.now() - submittedAt;
  return elapsed >= MIN_FORM_FILL_MS && elapsed <= MAX_FORM_AGE_MS;
}

function verifyRecaptchaToken_(token) {
  const properties = PropertiesService.getScriptProperties();
  const secret = normalizeSingleLine_(properties.getProperty("RECAPTCHA_SECRET_KEY"), 255);
  const allowedHostnames = parseAllowedHostnames_(properties.getProperty("RECAPTCHA_ALLOWED_HOSTNAMES"));

  if (!secret) {
    return { ok: false, message: "recaptcha_not_configured" };
  }

  const response = UrlFetchApp.fetch(RECAPTCHA_VERIFY_URL, {
    method: "post",
    payload: {
      secret: secret,
      response: token
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    return { ok: false, message: "recaptcha_unavailable" };
  }

  let body;
  try {
    body = JSON.parse(response.getContentText());
  } catch (error) {
    return { ok: false, message: "recaptcha_invalid_response" };
  }

  if (!body || body.success !== true) {
    return { ok: false, message: "recaptcha_failed" };
  }

  if (allowedHostnames.length > 0) {
    const hostname = normalizeSingleLine_(body.hostname, 255).toLowerCase();
    if (allowedHostnames.indexOf(hostname) === -1) {
      return { ok: false, message: "recaptcha_hostname_mismatch" };
    }
  }

  return { ok: true, message: "accepted" };
}

function evaluateAbuseProtection_(payload) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(250)) {
    return { ok: false, message: "busy" };
  }

  try {
    if (isDuplicateSubmission_(payload)) {
      return { ok: false, message: "duplicate" };
    }

    const emailKey = hashKey_(payload.email);
    const checks = [
      { key: "rate:global:60", limit: GLOBAL_BURST_LIMIT, windowSeconds: GLOBAL_BURST_WINDOW_SECONDS },
      { key: "rate:global:600", limit: GLOBAL_SUSTAINED_LIMIT, windowSeconds: GLOBAL_SUSTAINED_WINDOW_SECONDS },
      { key: "rate:email:" + emailKey + ":600", limit: EMAIL_BURST_LIMIT, windowSeconds: EMAIL_BURST_WINDOW_SECONDS },
      { key: "rate:email:" + emailKey + ":86400", limit: EMAIL_DAILY_LIMIT, windowSeconds: EMAIL_DAILY_WINDOW_SECONDS }
    ];

    for (let i = 0; i < checks.length; i += 1) {
      const check = checks[i];
      if (!consumeRateLimitSlot_(check.key, check.limit, check.windowSeconds)) {
        return { ok: false, message: "rate_limited" };
      }
    }

    return { ok: true, message: "accepted" };
  } finally {
    lock.releaseLock();
  }
}

function isDuplicateSubmission_(payload) {
  const cache = CacheService.getScriptCache();
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    [payload.email, payload.category, payload.message].join("|"),
    Utilities.Charset.UTF_8
  );
  const fingerprint = Utilities.base64EncodeWebSafe(digest).slice(0, 32);
  const cacheKey = "contact:" + fingerprint;

  if (cache.get(cacheKey)) {
    return true;
  }

  cache.put(cacheKey, "1", DUPLICATE_WINDOW_SECONDS);
  return false;
}

// Sliding-window style rate limit using script cache.
function consumeRateLimitSlot_(key, limit, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const current = cache.get(key);
  let timestamps = [];

  if (current) {
    try {
      timestamps = JSON.parse(current);
    } catch (error) {
      timestamps = [];
    }
  }

  timestamps = timestamps.filter(function (timestamp) {
    return typeof timestamp === "number" && timestamp >= windowStart;
  });

  if (timestamps.length >= limit) {
    return false;
  }

  timestamps.push(now);
  cache.put(key, JSON.stringify(timestamps), windowSeconds);
  return true;
}

function hashKey_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ""),
    Utilities.Charset.UTF_8
  );

  return Utilities.base64EncodeWebSafe(digest).slice(0, 24);
}

function parseAllowedHostnames_(value) {
  return String(value || "")
    .split(",")
    .map(function (item) {
      return normalizeSingleLine_(item, 255).toLowerCase();
    })
    .filter(function (item) {
      return Boolean(item);
    });
}

function iframeResponse_(payload) {
  const safePayload = JSON.stringify({
    type: RESPONSE_MESSAGE_TYPE,
    ok: Boolean(payload.ok),
    message: String(payload.message || "")
  }).replace(/</g, "\\u003c");

  return HtmlService.createHtmlOutput(
    "<!doctype html><html><head><meta charset=\"UTF-8\"></head><body><script>" +
      "(function(){var payload=" +
      safePayload +
      ";var sent=false;" +
      "function postResult(target){try{if(target&&typeof target.postMessage==='function'){target.postMessage(payload,'*');sent=true;}}catch(error){}}" +
      "postResult(window.parent);" +
      "if(window.top&&window.top!==window.parent){postResult(window.top);}" +
      "if(window.opener){postResult(window.opener);}" +
      "document.body.textContent=payload.ok?'accepted':'rejected';" +
      "if(!sent){document.body.setAttribute('data-postmessage','failed');}" +
      "})();" +
      "</script></body></html>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Prevent sheet formula execution when user input starts with an operator.
function toSafeSheetValue_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}
