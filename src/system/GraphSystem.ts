import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { matchActionOnce } from '@xrengine/engine/src/networking/functions/matchActionOnce'
import { WorldNetworkAction } from '@xrengine/engine/src/networking/functions/WorldNetworkAction'
import InfiniteGridHelper from '@xrengine/engine/src/scene/classes/InfiniteGridHelper'
import { Object3DComponent } from '@xrengine/engine/src/scene/components/Object3DComponent'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { XRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { Color, Vector3, Object3D, Mesh, CircleGeometry, MeshBasicMaterial, MeshStandardMaterial, Texture, sRGBEncoding, DoubleSide } from 'three'

import ThreeForceGraph from 'three-forcegraph'
import { createCardView } from '../client/ui/CardXRUI'
import { createSpreadsheetView as createSpreadsheetXRUI } from '../client/ui/GoogleSpreadsheetXRUI'
import { ObjectFitFunctions } from '@xrengine/engine/src/xrui/functions/ObjectFitFunctions'
import { GoogleSpreadsheetData } from '../common/GoogleSpreadsheetInterface'
import { AssetLoader } from '@xrengine/engine/src/assets/classes/AssetLoader'
import { API } from '@xrengine/client-core/src/API'

type GraphData = {
  nodes: Array<{ id: string, name: string, val: number }>
  links: Array<{ source: string, target: string }>
}

const mapEmergeParticipants = (data) => {
  data.forEach((entry) => {
    if (!entry['First Name'] || entry['First Name'] === '') return
    entry.Name = entry['First Name'] + ' ' + entry['Last Name']
  })
  return data.filter((entry) => !!entry.Name)
}

const spreadsheets = {
  emerge: {
    spreadsheetId: `1_fLq16ezrnOpYGynawDVWezrFuj2bomEfnssmqA03m8`,
    sheetId: 1336202753,
    filter: mapEmergeParticipants,
    linkColumnId: 'Orgaisation/Project',
    treeClusterColumn: 'First area of interest',
    treeClusterColumnSecondary: 'Second area of interest'
  },
  dao: {
    spreadsheetId: `1_fLq16ezrnOpYGynawDVWezrFuj2bomEfnssmqA03m8`,
    sheetId: 0,
    filter: (data) => data,
    linkColumnId: 'Website'
  }
}

const nodeTypes = {
  root: "root" as const,
  category: "category" as const,
  subcategory: "subcategory" as const,
  person: "person" as const
}

const getTreeClusteringData = (data: GoogleSpreadsheetData) => {

  const treeNodes = [] as { id: string, name: string, val: number, type: typeof nodeTypes[keyof typeof nodeTypes] }[]
  treeNodes.push({
    "id": "root",
    "name": "",
    "val": 1,
    type: nodeTypes.root
  })

  const links = [] as { source: string, target: string }[]

  const categories = [] as string[]
  data.forEach((entry) => {
    if (categories.findIndex((val) => val === entry[spreadsheets.emerge.treeClusterColumn]) === -1) {
      categories.push(entry[spreadsheets.emerge.treeClusterColumn])
    }
  })

  // create cluster for each category

  categories.forEach((category) => {
    treeNodes.push({
      "id": category,
      "name": category,
      "val": 1,
      type: nodeTypes.category
    })
    links.push({
      source: category,
      target: "root"
    })

    // TODO: remove any sub categories that have no people within them

    categories.forEach((subcategory) => {
      if(subcategory === category) return
      treeNodes.push({
        "id": category + ' - ' + subcategory,
        "name": subcategory,
        "val": 1,
        type: nodeTypes.subcategory
      })
    })
  })

  // attach all people to their category

  data.forEach((rowData, rowIndex) => {
    links.push({
      source: rowData.Name,
      target: rowData[spreadsheets.emerge.treeClusterColumn]
    })
    links.push({
      source: rowData.Name,
      target: rowData[spreadsheets.emerge.treeClusterColumn] + ' - ' + rowData[spreadsheets.emerge.treeClusterColumnSecondary]
    })
  })

  const treeClusteringData = {
    nodes: data.map((rowData, rowIndex) => {
      return {
        id: rowData.Name,
        name: rowData.Name,
        val: 1,
        type: nodeTypes.person as string,
        ...rowData
      }
    }).concat(treeNodes),
    links,
  }

  return treeClusteringData
}

const scaleFactor = 0.025
const invScaleFactor = 1 / scaleFactor

/**
 * two presentation styles
 * - tree based clustering
 *   - additional node for each category
 * - basic category based relational graph
 *   - uses categories as weights
 */


const activeSpreadsheet = 'emerge'

export default async function GraphSystem(world: World) {
  // todo: move to receptor pattern
  // console.log(await GoogleSpreadsheetService.getGoogleSpreadsheet(spreadsheetId, sheetId))

  /**
   * Change this
   */
  const spreadsheet = spreadsheets[activeSpreadsheet]

  const rawData = await API.instance.client.service('conjure-google-spreadsheet').get({
    spreadsheetId: spreadsheet.spreadsheetId,
    sheetId: spreadsheet.sheetId
  })

  const data = spreadsheet.filter(rawData) as GoogleSpreadsheetData

  console.log(data)
  
  const treeClusteringData = getTreeClusteringData(data)
  console.log(treeClusteringData)

  // const relationalClusteringData = {
  //   nodes: data.map((rowData, rowIndex) => {
  //     return {
  //       id: rowIndex,
  //       name: rowData.Name,
  //       val: 1,
  //       ...rowData
  //     }
  //   }),
  //   links: [
  //     data.map((rowData, rowIndex) => {
  //       return {
  //         id: rowIndex,
  //         name: rowData.Name,
  //         val: 1,
  //         ...rowData
  //       }
  //     })
  //   ]
  // }

  const grid = new InfiniteGridHelper(1, 10, new Color(0.2, 0.2, 0.2))
  grid.layers.set(ObjectLayers.Scene)
  Engine.instance.currentWorld.scene.add(grid)

  const myGraph = new ThreeForceGraph().graphData(treeClusteringData)
  myGraph.scale.multiplyScalar(scaleFactor)
  myGraph.position.setY(1)
  Engine.instance.currentWorld.scene.add(myGraph)

  const xruis = [] as { ui: ReturnType<typeof createSpreadsheetXRUI>, node: Object3D }[]

  // forcegraph does stuff async internally with no callback......
  setTimeout(() => {
    myGraph.children.forEach((node: Mesh<any, any>) => {
      if (node.type === 'Mesh') {
        const nodeData = (node as any).__data
        console.log(nodeData)
        if (nodeData.type === nodeTypes.person) node.material.visible = false
        
        const imgPath = `https://${location.host}/projects/conjure/emerge/${nodeData.name}.jpg`
        AssetLoader.load(imgPath, ((texture) => {
          texture.encoding = sRGBEncoding
          const mesh = new Mesh(new CircleGeometry(0.25, 16), new MeshBasicMaterial({ color: new Color('white'), map: texture, side: DoubleSide }))
          mesh.scale.setScalar(invScaleFactor)
          node.add(mesh)
          node.userData.img = mesh
        }))

        if (nodeData.name) {
          const ui = createSpreadsheetXRUI(nodeData.name, nodeData[spreadsheet.linkColumnId])
          xruis.push({ ui, node })
          ui.container.then(() => {
            const xrui = getComponent(ui.entity, XRUIComponent)
            node.getWorldPosition(xrui.container.position)
            xrui.container.position.y += 0.25
          })
        }
      }
    })
    // iterate the 
    for (let i = 0; i < 60; i++) myGraph.tickFrame()
  }, 100)

  const vec3 = new Vector3()
  const uiFalloffFactor = 2

  // matchActionOnce(WorldNetworkAction.spawnAvatar.matches, (spawn) => {
  //   const eid = world.getUserAvatarEntity(spawn.$from)
  //   getComponent(eid, Object3DComponent).value.traverse((node: any) => {
  //     if(node.material)
  //       node.material.visible = false
  //   })
  // })

  // const cardUI = createCardView()

  return () => {
    // const xrui = getComponent(cardUI.entity, XRUIComponent)
    // if (xrui) {
    //   ObjectFitFunctions.attachObjectToPreferredTransform(xrui.container)
    // }
    for (const ui of xruis) {
      const xrui = getComponent(ui.ui.entity, XRUIComponent)
      if (!xrui) continue

      ui.node.getWorldPosition(vec3)
      const distanceToCamera = Engine.instance.currentWorld.camera.position.distanceTo(vec3)
      const visible = distanceToCamera < 10
      xrui.container.visible = visible

      if(!visible) continue

      xrui.container.scale.setScalar(
        Math.max(1, distanceToCamera / (3 * uiFalloffFactor))
      )
      xrui.container.rotation.setFromRotationMatrix(Engine.instance.currentWorld.camera.matrix)

      const img = ui.node.userData.img 
      if(img) {
        img.rotation.setFromRotationMatrix(Engine.instance.currentWorld.camera.matrix)
      }
    }
  }
}
