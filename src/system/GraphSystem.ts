import { client } from '@xrengine/client-core/src/feathers'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import InfiniteGridHelper from '@xrengine/engine/src/scene/classes/InfiniteGridHelper'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { Color } from 'three'

import ThreeForceGraph from 'three-forcegraph'
import { GoogleSpreadsheetService } from '../client/GoogleSpreadsheetService'
import { GoogleSpreadsheetData } from '../common/GoogleSpreadsheetInterface'

const myData = {
  "nodes": [
    {
      "id": "id1",
      "name": "name1",
      "val": 1
    },
    {
      "id": "id2",
      "name": "name2",
      "val": 2
    },
    {
      "id": "id3",
      "name": "name3",
      "val": 1
    },
    {
      "id": "id4",
      "name": "name4",
      "val": 2
    },
    {
      "id": "id5",
      "name": "name5",
      "val": 1
    },
    {
      "id": "id6",
      "name": "name6",
      "val": 1.5
    },
  ],
  "links": [
    {
      "source": "id1",
      "target": "id2"
    },
    {
      "source": "id2",
      "target": "id3"
    },
    {
      "source": "id1",
      "target": "id3"
    },
    {
      "source": "id3",
      "target": "id4"
    },
    {
      "source": "id1",
      "target": "id4"
    },
    {
      "source": "id3",
      "target": "id5"
    },
    {
      "source": "id2",
      "target": "id6"
    },
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
        val: 1//rowData.Website
      }
    }),
    links: []
  }

  const grid = new InfiniteGridHelper(1, 10, new Color(0.2, 0.2, 0.2))
  grid.layers.set(ObjectLayers.Scene)
  Engine.instance.currentWorld.scene.add(grid)

  const myGraph = new ThreeForceGraph().graphData(daoMapData)
  myGraph.scale.multiplyScalar(0.025)
  myGraph.position.setY(1)
  Engine.instance.currentWorld.scene.add(myGraph)
  console.log(myGraph)

  return () => {
    myGraph.tickFrame()
  }
}
