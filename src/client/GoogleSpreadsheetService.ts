import { Paginated } from '@feathersjs/feathers'
import { useState } from '@speigg/hookstate'

import { matches, Validator } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { addActionReceptor, defineAction, defineState, dispatchAction, getState, registerState } from '@xrengine/hyperflux'
import type { GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import { GoogleSpreadsheetInterface } from '../common/GoogleSpreadsheetInterface'
import { client } from '@xrengine/client-core/src/feathers'

export const GOOGLESPREADSHEET_PAGE_LIMIT = 100

export const AdminGoogleSpreadsheetState = defineState({
  store: 'ENGINE',
  name: 'AdminGoogleSpreadsheetState',
  initial: () => ({} as { [spreadsheetId: string]: GoogleSpreadsheetWorksheet })
})

export const registerAdminGoogleSpreadsheetServiceActions = () => {

  registerState(Engine.instance.store, AdminGoogleSpreadsheetState)

  // Register receptor
  addActionReceptor(Engine.instance.store, function AdminGoogleSpreadsheetServiceReceptor(action) {
    getState(Engine.instance.store, AdminGoogleSpreadsheetState).batch((s) => {
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

export const accessGoogleSpreadsheetState = () => getState(Engine.instance.store, AdminGoogleSpreadsheetState)

export const useGoogleSpreadsheetState = () => useState(accessGoogleSpreadsheetState())

//Service
export const GoogleSpreadsheetService = {
  getGoogleSpreadsheet: async (spreadsheetId: string, sheetId: string) => {
    const googlespreadsheets = await client.service('conjure-google-spreadsheet').get({
      spreadsheetId, sheetId
    })
    dispatchAction(Engine.instance.store, GoogleSpreadsheetAction.googleSpreadsheetQueryAction({ sheetId, spreadsheetId, data: googlespreadsheets }))
  }
}

export class GoogleSpreadsheetAction {
  static googleSpreadsheetQueryAction = defineAction({
    store: 'ENGINE',
    type: 'GoogleSpreadsheet.GOOGLESPREADSHEETS_RETRIEVED',
    sheetId: matches.string,
    spreadsheetId: matches.string,
    data: matches.object as Validator<unknown, GoogleSpreadsheetWorksheet>
  })
}