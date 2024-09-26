/* eslint-disable */
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .createAddonMenu()
    .addItem("Show sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  var html =
    HtmlService.createHtmlOutputFromFile("Page").setTitle("Subtitle tools");
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .showSidebar(html);
}

function getCurrentSheetData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var range = sheet.getDataRange();
  var result = {
    row: range.getRow(),
    column: range.getColumn(),
    values: range.getValues(),
  };
  return result;
}

function updateCell(row, column, fromValue, toValue) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var range = sheet.getRange(row, column);
  var currentValue = range.getValue();
  if (currentValue == fromValue) {
    range.setValue(toValue);
    range.activate();
    Logger.log("Value updated from " + fromValue + " to " + toValue);
    return { ok: true };
  } else {
    Logger.log(
      "Value not updated. Current value (" +
        currentValue +
        ") does not match " +
        fromValue
    );
    SpreadsheetApp.getUi().alert(
      `Unable to update ${range.getA1Notation()} from "${fromValue}" to "${toValue}" as the current value is "${currentValue}" which is not expected.`
    );
    return { ok: false, message: `Mismatch` };
  }
}

function spliceSheet(row, oldValues, newValues) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var numColumns = sheet.getLastColumn();
  var numRows;
  if (Array.isArray(oldValues)) {
    numRows = oldValues.length;
  } else {
    numRows = oldValues;
  }

  var range = sheet.getRange(row, 1, numRows, numColumns);
  if (Array.isArray(oldValues)) {
    const normalize = (a) =>
      a.map((row) => row.filter((v) => v).join("\t")).join("\n");
    var currentValues = range.getValues();
    if (normalize(range.getValues()) !== normalize(oldValues)) {
      Logger.log("Mismatch.");
      return false;
    }
  }

  // Remove old rows if necessary
  if (newValues.length < numRows) {
    sheet.deleteRows(row + newValues.length, numRows - newValues.length);
  }

  // Insert new rows if necessary
  if (newValues.length > numRows) {
    sheet.insertRowsAfter(row + numRows - 1, newValues.length - numRows);
  }

  // Set new values
  var newRange = sheet.getRange(row, 1, newValues.length, numColumns);
  newRange.setValues(
    newValues.map((row) =>
      Array.from({ length: numColumns }, (_, i) =>
        row[i] != null ? row[i] : ""
      )
    )
  );

  Logger.log("Rows updated successfully.");
  return true;
}

function selectCell(row, column) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  sheet.getRange(row, column).activate();
}

function insertTime(t) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var row = sheet.getCurrentCell().getRow();
  sheet.getRange(row, 1).setValue(t);
  sheet.setCurrentCell(sheet.getRange(row + 1, 1));
}

function createTime(rowNumber, timeValue) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  sheet.insertRowBefore(rowNumber);
  sheet.getRange(rowNumber, 1).setValue(timeValue);
  sheet.getRange(rowNumber, 1).activate();
  return true;
}

function testUpdateSheet() {
  // updateSheet(2, 1, 'x', 'nyan')
  // updateSheet(3, 1, 'x', 'nyan')
  // spliceSheet(4, [['a','f'],['b']], [['meow1'],['meow2'],['meow3']])
  spliceSheet(4, [["meow1"], ["meow2"], ["meow3"]], [["x"]]);
}
