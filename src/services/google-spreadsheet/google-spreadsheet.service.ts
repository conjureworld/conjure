import { Params } from '@feathersjs/feathers/lib'
import { Application } from '@xrengine/server-core/declarations'
import hooks from './google-spreadsheet.hooks'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { GoogleSpreadsheetInterface } from '../../common/GoogleSpreadsheetInterface'

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'conjure-google-spreadsheet': {
      get: ReturnType<typeof googleSpreadsheetQuery>
      patch: ReturnType<typeof googleSpreadsheetPatch>
    }
  }
}

const googleSpreadsheetQuery = (app: Application) => async (data: GoogleSpreadsheetInterface, params?: Params) => {
  const doc = new GoogleSpreadsheet(data.spreadsheetId)
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!
  })
  await doc.loadInfo()
  return doc.sheetsById[data.sheetId]
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
