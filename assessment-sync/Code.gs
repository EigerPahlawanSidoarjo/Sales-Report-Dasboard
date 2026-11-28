/**
 * EIGER 2077 - Self Assessment cloud sync endpoint
 * Paste into the bound Apps Script project of the shared Google Spreadsheet.
 * Sheet: AssessmentData
 *
 * Deploy as Web App, execute as the spreadsheet owner, access:
 * "Anyone with a Google account" (recommended where available).
 */
const ASSESSMENT_SHEET_NAME = 'AssessmentData';
const ASSESSMENT_HEADERS = ['ID', 'Record JSON', 'Synced At'];

function assessmentSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Script harus dibuat dari Extensions > Apps Script pada spreadsheet tujuan.');
  let sheet = ss.getSheetByName(ASSESSMENT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ASSESSMENT_SHEET_NAME);
    sheet.getRange(1, 1, 1, ASSESSMENT_HEADERS.length).setValues([ASSESSMENT_HEADERS]);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ASSESSMENT_HEADERS.length).setValues([ASSESSMENT_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function assessmentId_(record) {
  return record.id || [record.name || '', record.period || '', record.week || '', record.submittedAt || ''].join('|');
}

function jsonp_(callback, payload) {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  if (callback && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sheet = assessmentSheet_();
    const lastRow = sheet.getLastRow();
    const records = [];
    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      values.forEach(row => {
        if (!row[1]) return;
        try {
          const record = JSON.parse(row[1]);
          record.id = assessmentId_(record);
          records.push(record);
        } catch (parseError) {
          // Skip a damaged row; keep the rest of the records readable.
        }
      });
    }
    return jsonp_(e && e.parameter ? e.parameter.callback : '', { ok: true, records: records });
  } catch (err) {
    return jsonp_(e && e.parameter ? e.parameter.callback : '', { ok: false, error: String(err.message || err), records: [] });
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    const payload = JSON.parse(raw || '{}');
    if (payload.action !== 'append' || !Array.isArray(payload.records)) {
      throw new Error('Request tidak valid.');
    }
    const sheet = assessmentSheet_();
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const existingIds = new Set();
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(row => existingIds.add(String(row[0])));
      }
      const newRows = [];
      payload.records.forEach(record => {
        if (!record || !record.name || !record.answers || !record.submittedAt) return;
        const id = String(assessmentId_(record));
        if (existingIds.has(id)) return;
        record.id = id;
        newRows.push([id, JSON.stringify(record), new Date()]);
        existingIds.add(id);
      });
      if (newRows.length) {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 3).setValues(newRows);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, added: newRows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
