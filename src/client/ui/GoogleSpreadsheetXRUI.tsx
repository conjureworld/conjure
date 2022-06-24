import { createState, useState } from '@speigg/hookstate'
import React from 'react'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@xrengine/engine/src/xrui/functions/useXRUIState'
import { nodeTypes } from '../../system/GraphSystem'

const randomColour = () => Math.floor(Math.random()*16777215).toString(16);

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

type StateType = {
  id: string
  link: string
  type: typeof nodeTypes[keyof typeof nodeTypes]
}

export function createSpreadsheetView(data: StateType) {
  return createXRUI(GoogleSpreadsheetView, createNametagState(data))
}

function createNametagState(data: StateType) {
  return createState(data)
}

type SpreadsheetNameState = ReturnType<typeof createNametagState>

const GoogleSpreadsheetView = () => {
  const spreadsheetState = useXRUIState() as SpreadsheetNameState
  const [hover, setHover] = React.useState<boolean>()

  const backgroundColour = () => {
    switch(spreadsheetState.type.value) {
      case 'subcategory': return randomColour()
      case 'category': return randomColour()
      case 'person': return 'black'
      default: "black"
    }
  }

  return <>
    {/* <div style={styles.spreadsheetName as {}} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)} > */}
    <div
      xr-layer="true"
      style={styles.spreadsheetName as {}} onPointerEnter={console.log} onPointerLeave={console.log}
    >
      {spreadsheetState.id.value}
      {hover && <p xr-layer="true" style={{ padding: '0px', backgroundColor: backgroundColour() }}>{spreadsheetState.link.value}</p>}
    </div>
  </>
}
