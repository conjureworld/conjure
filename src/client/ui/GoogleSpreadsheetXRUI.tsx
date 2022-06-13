import { createState, useState } from '@speigg/hookstate'
import React from 'react'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@xrengine/engine/src/xrui/functions/useXRUIState'


const styles = {
  spreadsheetName: {
    fontSize: '60px',
    backgroundColor: '#000000dd',
    color: 'white',
    fontFamily: "'Roboto', sans-serif",
    border: '10px solid white',
    borderRadius: '50px',
    padding: '20px',
    margin: '60px',
    boxShadow: '#fff2 0 0 30px',
    width: '400px',
    textAlign: 'center'
  }
}

type SpreadsheetState = {
  id: string,
  website: string
}

export function createSpreadsheetView(id: string, website: string) {
  return createXRUI(GoogleSpreadsheetView, createNametagState(id, website))
}

function createNametagState(id: string, website: string) {
  return createState({
    id,
    website
  })
}

type SpreadsheetNameState = ReturnType<typeof createNametagState>

const GoogleSpreadsheetView = () => {
  const spreadsheetState = useXRUIState() as SpreadsheetNameState
  const [hover, setHover] = React.useState<boolean>()

  return <>
    {/* <div style={styles.spreadsheetName as {}} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} > */}
    <div
      xr-layer="true"
      style={styles.spreadsheetName as {}} onPointerEnter={console.log} onPointerLeave={console.log}
    >
      {spreadsheetState.id.value}
      {hover && <p xr-layer="true" style={{ padding: '0px' }}>{spreadsheetState.website.value}</p>}
    </div>
  </>
}
