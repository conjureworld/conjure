import { client } from '@xrengine/client-core/src/feathers'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import InfiniteGridHelper from '@xrengine/engine/src/scene/classes/InfiniteGridHelper'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { XRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { Color, Vector3, Object3D } from 'three'

import ThreeForceGraph from 'three-forcegraph'
import { createSpreadsheetView as createSpreadsheetXRUI } from '../client/ui/GoogleSpreadsheetXRUI'

const myData = {
  "nodes": [
    {
      "id": "id1",
      "name": "name1",
      "val": 1
    }
  ],
  "links": [
    {
      "source": "id1",
      "target": "id2"
    }
  ]
}

const spreadsheetId = `1_fLq16ezrnOpYGynawDVWezrFuj2bomEfnssmqA03m8`
const sheetId = 0

export default async function GraphSystem(world: World) {
  // todo: move to receptor pattern
  // console.log(await GoogleSpreadsheetService.getGoogleSpreadsheet(spreadsheetId, sheetId))

  const googlespreadsheets = await client.service('conjure-google-spreadsheet').get({
    spreadsheetId, sheetId
  })

  console.log(googlespreadsheets)

  const daoMapData = {
    nodes: googlespreadsheets.map((rowData, rowIndex) => {
      return {
        id: rowIndex,
        name: rowData.Name,
        val: 1,
        ...rowData
      }
    }).slice(0, 1),
    links: []
  }

  const grid = new InfiniteGridHelper(1, 10, new Color(0.2, 0.2, 0.2))
  grid.layers.set(ObjectLayers.Scene)
  Engine.instance.currentWorld.scene.add(grid)

  const myGraph = new ThreeForceGraph().graphData(daoMapData)
  myGraph.scale.multiplyScalar(0.025)
  myGraph.position.setY(1)
  Engine.instance.currentWorld.scene.add(myGraph)

  const xruis = [] as { ui: ReturnType<typeof createSpreadsheetXRUI>, node: Object3D }[]

  // forcegraph does stuff async internally with no callback......
  setTimeout(() => {
    myGraph.children.forEach((node: any) => {
      if(node.__data.name)
        xruis.push({ ui: createSpreadsheetXRUI(node.__data.name, node.__data.Website), node })
    })
  }, 100)

  const vec3 = new Vector3()
  const uiFalloffFactor = 2

  return () => {
    for(const ui of xruis) {
      const xrui = getComponent(ui.ui.entity, XRUIComponent)
      if (!xrui) continue

      ui.node.getWorldPosition(vec3)
      
      xrui.container.scale.setScalar(
        Math.max(1, Engine.instance.currentWorld.camera.position.distanceTo(vec3) / (3 * uiFalloffFactor))
      )
      xrui.container.position.copy(vec3)
      xrui.container.position.y += 0.25
      xrui.container.rotation.setFromRotationMatrix(Engine.instance.currentWorld.camera.matrix)
    }
    myGraph.tickFrame()
  }
}
