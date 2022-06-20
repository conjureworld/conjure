import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { addActionReceptor, defineAction, defineState, dispatchAction, getState, registerState, useState } from '@xrengine/hyperflux'
import type { GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import { client } from '@xrengine/client-core/src/feathers'

export const GOOGLESPREADSHEET_PAGE_LIMIT = 100

export const AdminGoogleSpreadsheetState = defineState({
  name: 'AdminGoogleSpreadsheetState',
  initial: () => ({} as { [spreadsheetId: string]: GoogleSpreadsheetWorksheet })
})

export const registerAdminGoogleSpreadsheetServiceActions = () => {

  registerState(AdminGoogleSpreadsheetState)

  // Register receptor
  addActionReceptor(function AdminGoogleSpreadsheetServiceReceptor(action) {
    getState(AdminGoogleSpreadsheetState).batch((s) => {
      matches(action)
      .when(GoogleSpreadsheetAction.googleSpreadsheetQueryAction.matches, (action) => {
        return s.merge({
          [action.spreadsheetId]: action.data
        })
      })
    })
  })
}

// temporary
registerAdminGoogleSpreadsheetServiceActions()

export const accessGoogleSpreadsheetState = () => getState(AdminGoogleSpreadsheetState)

export const useGoogleSpreadsheetState = () => useState(accessGoogleSpreadsheetState())

//Service
export const GoogleSpreadsheetService = {
  getGoogleSpreadsheet: async (spreadsheetId: string, sheetId: number) => {
    const googlespreadsheets = await client.service('conjure-google-spreadsheet').get({
      spreadsheetId, sheetId
    })
    dispatchAction(GoogleSpreadsheetAction.googleSpreadsheetQueryAction({ sheetId, spreadsheetId, data: googlespreadsheets }))
  }
}

export class GoogleSpreadsheetAction {
  static googleSpreadsheetQueryAction = defineAction({
    store: 'ENGINE',
    type: 'GoogleSpreadsheet.GOOGLESPREADSHEETS_RETRIEVED',
    sheetId: matches.number,
    spreadsheetId: matches.string,
    data: matches.object as Validator<unknown, any>
  })
}