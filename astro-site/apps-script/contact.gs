const CONTACT_SUBJECT_PREFIX = "[CHAIRMAN Contact]";

function doGet() {
  return HtmlService.createHtmlOutput("CHAIRMAN contact endpoint is running.");
}

function doPost(e) {
  const payload = normalizePayload_(e && e.parameter ? e.parameter : {});
  const validationError = validatePayload_(payload);
  if (validationError) {
    return jsonResponse_({ ok: false, message: validationError });
  }

  // Honeypot. Quietly accept and do nothing.
  if (payload.company) {
    return jsonResponse_({ ok: true, message: "accepted" });
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

  return jsonResponse_({ ok: true, message: "accepted" });
}

function normalizePayload_(parameter) {
  return {
    name: String(parameter.name || "").trim(),
    email: String(parameter.email || "").trim(),
    phone: String(parameter.phone || "").trim(),
    category: String(parameter.category || "").trim(),
    message: String(parameter.message || "").trim(),
    source: String(parameter.source || "").trim(),
    company: String(parameter.company || "").trim()
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
  return "";
}

function appendToSheet_(sheetId, sheetName, payload) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "name", "email", "phone", "category", "message", "source"]);
  }

  sheet.appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    payload.name,
    payload.email,
    payload.phone,
    payload.category,
    payload.message,
    payload.source
  ]);
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

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
