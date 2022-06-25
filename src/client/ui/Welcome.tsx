import { createState } from '@speigg/hookstate'
import React from 'react'

import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'

const styles = `
.welcomeContainer {
  font-size: 30px;
  background-color: #000000dd;
  color: white;
  font-family: Roboto, sans-serif;
  border: 10px solid white;
  border-radius: 30px;
  padding: 20px;
  margin: 30px;
  box-shadow: #fff2 0 0 30px;
  text-align: center;
  width: 1000px;
}`

export function createWelcome() {
  return createXRUI(Welcome, createWelcomeState())
}

function createWelcomeState() {
  return createState({})
}

const Welcome = () => {

  return (
    <>
      <style>{styles}</style>
      <div className={'welcomeContainer'} xr-layer="true">
        <p>
          <b>Welcome</b> to <a target="_blank" rel="noopener noreferrer" style={{ color: '#00D8FF' }} href="https://docs.google.com/document/d/169FlpUoy7xM6ljqcN_O2OHODsr7l0g3n-Z1Aw990udU">Conjure</a>.
          This is an early version of the future of the immersive web, one which will enable real-time embodied collaborative programming and digital tool making. Conjure is built on <a target="_blank" rel="noopener noreferrer" style={{ color: '#00D8FF' }} href="https://etherealengine.org/">Ethereal Engine</a>, a free and open source web-first metaverse / spatial web engine.
          <br /><br />Conjure is a broader conversation that is still emerging, stewarded by the Liminal DAO and DAOjo, focusing on connecting cutting edge spatial computing with digital tool creation and rigorous philosophical grounding in order to aid developing a commons of sense-making, meaning-making and choice-making.
          <br /><br />This work has been influenced deeply by many of the participants & projects represented at Emerge 2022, such as the Holochain/Ceptr/MetaCurrency ecosystem, Forrest Landry's An Immanent Metaphysics, the work done in the Game B / Liminal Web / Sensemaking Web / Meta Crisis / X-Risk networks, the Center for Humane Technology, The Consilience Project, and more. So to all of those at Emerge 2022 and who couldn’t make it, thank you for your service to nature, humanity and the commons. This map has been curated from the responses we gave to our interests & projects, to act as a repository of our shared interests and projects, as well as what can be whipped up in a couple days on this platform.
          <br /><br />To learn more, please connect on <a target="_blank" rel="noopener noreferrer" style={{ color: '#00D8FF' }} href="https://twitter.com/HexaField">twitter</a>  or <a target="_blank" rel="noopener noreferrer" style={{ color: '#00D8FF' }} href="https://discord.gg/ExBxEN2">discord</a>
          <br />To learn more about Ethereal Engine and join our community of thoughtful and optimistic engineers, artists and enthusiasts, visit <a target="_blank" rel="noopener noreferrer" style={{ color: '#00D8FF' }} href="https://discord.gg/xrf">https://discord.gg/xrf</a>
        </p>
      </div>
    </>
  )
}
