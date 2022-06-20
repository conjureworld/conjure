import { createState, useState } from '@speigg/hookstate'
import React from 'react'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { useXRUIState } from '@xrengine/engine/src/xrui/functions/useXRUIState'

const styles = {
  card: {
    fontSize: '16px',
    backgroundColor: '#000000dd',
    color: 'white',
    fontFamily: "'Roboto', sans-serif",
    fontStyle: "italic",
    border: '10px solid white',
    borderRadius: '50px',
    padding: '20px',
    margin: '60px',
    boxShadow: '#fff2 0 0 30px',
    width: '400px',
    // textAlign: 'justify'
  }
}

export function createCardView() {
  return createXRUI(WebCardView, createUIState())
}

function createUIState() {
  return createState({})
}

const text = `
There are some networks of note in the ‘meta-crisis’,<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Liminal Web,<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Regenerative Finance network,<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Open Source Software network,<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the Holochain network,<br />
each are addressing various parts of the puzzle of shifting technology, economics and culture towards better outcomes. This is your space to explore…
`

const WebCardView = () => {
  const state = useXRUIState() as ReturnType<typeof createUIState>
  return <>
    <div
      xr-layer="true"
      style={styles.card as {}}
    >
      <p dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  </>
}
