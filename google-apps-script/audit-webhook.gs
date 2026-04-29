const SHEET_NAME = "Registo";

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const expectedSecret = PropertiesService.getScriptProperties().getProperty("AUDIT_SECRET");

  if (!expectedSecret || payload.secret !== expectedSecret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const record = payload.record || {};
  const sheet = getSheet();
  sheet.appendRow([
    record.createdAt || new Date().toISOString(),
    record.actor || "",
    record.role || "",
    record.action || "",
    record.entityType || "",
    record.entityId || "",
    record.summary || "",
  ]);

  return json({ ok: true }, 200);
}

function getSheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const spreadsheet = sheetId ? SpreadsheetApp.openById(sheetId) : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["createdAt", "actor", "role", "action", "entityType", "entityId", "summary"]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
