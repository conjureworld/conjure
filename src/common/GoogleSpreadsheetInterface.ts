export type GoogleSpreadsheetInterface = {
  spreadsheetId: string
  sheetId: number
}

export type GoogleSpreadsheetData = Array<{ [key: string]: string }>