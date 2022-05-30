import { Params } from '@feathersjs/feathers/lib'
import { Application } from '@xrengine/server-core/declarations'
import hooks from './google-spreadsheet.hooks'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { GoogleSpreadsheetData, GoogleSpreadsheetInterface } from '../../common/GoogleSpreadsheetInterface'
import { getProjectEnv } from '@xrengine/server-core/src/projects/project/project-helper'

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'conjure-google-spreadsheet': {
      get: ReturnType<typeof googleSpreadsheetQuery>
      patch: ReturnType<typeof googleSpreadsheetPatch>
    }
  }
}

const getUserAuth = async (app: Application) => {
  const projectSetting = await getProjectEnv(app, 'conjure')
  console.log(projectSetting)
  if (!projectSetting.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error('[Google Spreadsheet]: No service account email configured!')
  if (!projectSetting.GOOGLE_PRIVATE_KEY) throw new Error('[Google Spreadsheet]: No service account private key configured!')
  return {
    client_email: projectSetting.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: projectSetting.GOOGLE_PRIVATE_KEY
  }
}

const getApiAuth = async (app: Application) => {
  const projectSetting = await getProjectEnv(app, 'conjure')
  if (!projectSetting.GOOGLE_API_KEY) throw new Error('[Google Spreadsheet]: No api key configured!')
  return projectSetting.GOOGLE_API_KEY
}

/**
 * Assumes each column begins with a title
 * @param app
 * @returns 
 */
const googleSpreadsheetQuery = (app: Application) => async (data: GoogleSpreadsheetInterface, params?: Params): Promise<GoogleSpreadsheetData> => {
  const doc = new GoogleSpreadsheet(data.spreadsheetId)
  try {
    await doc.useApiKey(await getApiAuth(app))
    await doc.loadInfo()
  } catch (e) {
    console.error(e)
    return null!
  }
  
  const sheet = doc.sheetsById[data.sheetId]
  await sheet.loadCells()

  const result = [] as any
  console.log(sheet.rowCount, sheet.columnCount)

  for(let rowIndex = 0; rowIndex < sheet.rowCount; rowIndex++) {
    const row = {} as any
    for(let columnIndex = 0; columnIndex < sheet.columnCount; columnIndex++) {
      console.log(rowIndex, columnIndex, sheet.getCell(rowIndex, columnIndex).value)
      row[String(sheet.getCell(0, columnIndex).value)] = sheet.getCell(rowIndex, columnIndex).value
    }
    console.log(row)
    result.push(row)
  }
  console.log(result)

  return result
} 

const googleSpreadsheetPatch = (app: Application) => async (data: GoogleSpreadsheetInterface, params?: Params) => {

}

export default (app: Application): void => {
  app.use('conjure-google-spreadsheet', {
    get: googleSpreadsheetQuery(app),
    patch: googleSpreadsheetPatch(app)
  })

  app.service('conjure-google-spreadsheet').hooks(hooks)
}
