import { createState, useState } from '@speigg/hookstate'
import React from 'react'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@xrengine/engine/src/xrui/functions/useXRUIState'
import { nodeTypes } from '../../system/GraphSystem'

const randomColour = () => Math.floor(Math.random() * 16777215).toString(16);

const styles = {
  spreadsheetName: {
    fontSize: '40px',
    backgroundColor: '#000000dd',
    color: 'white',
    fontFamily: "'Roboto', sans-serif",
    border: '10px solid white',
    borderRadius: '50px',
    padding: '20px',
    margin: '60px',
    boxShadow: '#fff2 0 0 30px',
    textAlign: 'center'
  }
}

type StateType = {
  id: string
  links: string
  project: string
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

  return (
    <div
      xr-layer="true"
      style={{ ...styles.spreadsheetName as any }} onPointerEnter={console.log} onPointerLeave={console.log}
    >
      {spreadsheetState.id.value}
      {spreadsheetState.project.value && <p style={{ padding: '0px', fontSize: '20px' }}>
        {spreadsheetState.project.value}
        <br />
        {spreadsheetState.links.value.split(',').map((link) => { return <><a style={{ color: '#00D8FF' }} href={link} target="_blank" rel="noopener noreferrer">{link}</a><br /></> })}
      </p>}
    </div>
  )
}
