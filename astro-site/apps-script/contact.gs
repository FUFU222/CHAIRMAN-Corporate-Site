const CONTACT_SUBJECT_PREFIX = "[CHAIRMAN Contact]";
const RESPONSE_MESSAGE_TYPE = "chairman-contact-submit";
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

  if (sheetId) {
    appendToSheet_(sheetId, sheetName, payload);
  }

  if (notifyTo) {
    sendNotification_(notifyTo, payload);
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

function sendNotification_(notifyTo, payload) {
  const subject = CONTACT_SUBJECT_PREFIX + " " + payload.category;
  const body = [
    "CHAIRMANサイトからお問い合わせがありました。",
    "",
    "お名前: " + payload.name,
    "メールアドレス: " + payload.email,
    "電話番号: " + payload.phone,
    "問い合わせ種別: " + payload.category,
    "送信元: " + payload.source,
    "",
    payload.message
  ].join("\n");

  MailApp.sendEmail(notifyTo, subject, body, {
    replyTo: payload.email
  });
}

function normalizeSingleLine_(value, maxLength) {
  let normalized = String(value || "");
  if (typeof normalized.normalize === "function") {
    normalized = normalized.normalize("NFKC");
  }

  normalized = normalized.replace(/[\u0000-\u001F\u007F]/g, " ").trim().replace(/\s+/g, " ");
  return normalized.slice(0, maxLength);
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
  return normalized.slice(0, MESSAGE_MAX_LENGTH);
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
