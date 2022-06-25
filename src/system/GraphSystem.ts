import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { getComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
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
import { addActionReceptor, createActionQueue } from '@xrengine/hyperflux'
import { AvatarComponent } from '@xrengine/engine/src/avatar/components/AvatarComponent'
import { switchCameraMode } from '@xrengine/engine/src/avatar/functions/switchCameraMode'
import { CameraMode } from '@xrengine/engine/src/camera/types/CameraMode'
import { FollowCameraComponent } from '@xrengine/engine/src/camera/components/FollowCameraComponent'
import { setTargetCameraRotation } from '@xrengine/engine/src/avatar/AvatarInputSchema'
import { InputComponent } from '@xrengine/engine/src/input/components/InputComponent'
import { BaseInput } from '@xrengine/engine/src/input/enums/BaseInput'
import { matches } from '@xrengine/engine/src/common/functions/MatchesUtils'
import { EngineActions, EngineState, getEngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { createObjectPool } from '@xrengine/engine/src/common/functions/ObjectPool'
import json from './data.json'

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

export const nodeTypes = {
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

  const links = [] as { source: string, target: string, val?: string }[]

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
      if (subcategory === category) return
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

  data.forEach((rowData, rowIndex) => {
    treeNodes.push({
      id: rowData.Name,
      name: rowData.Name,
      val: 1,
      type: nodeTypes.person,
      ...rowData
    })
  })

  const toRemove = [] as any[]

  treeNodes.forEach((node) => {
    let hasLink = false
    links.forEach((link) => {
      if(link.source === node.id || link.target === node.id) hasLink = true
    })
    if(!hasLink) toRemove.push(node)
  })

  toRemove.forEach((node) =>{
    treeNodes.splice(treeNodes.indexOf(node), 1)
  })

  const treeClusteringData = {
    nodes: treeNodes,
    links,
  }

  return treeClusteringData
}

const scaleFactor = 0.05
const invScaleFactor = 1 / scaleFactor

/**
 * two presentation styles
 * - tree based clustering
 *   - additional node for each category
 * - basic category based relational graph
 *   - uses categories as weights
 */


const updateCameraSettings = () => {
  setTimeout(() => {
    const world = Engine.instance.currentWorld
    console.log('avatar spawn')
    const followComponent = getComponent(world.localClientEntity, FollowCameraComponent)
    followComponent.distance = 0.01
    followComponent.maxPhi = 60
    followComponent.minPhi = -30
    followComponent.zoomLevel = 0.01
    // setTargetCameraRotation(world.localClientEntity, 0, followComponent.theta)
    switchCameraMode(world.localClientEntity, { cameraMode: CameraMode.FirstPerson }, true)
    getComponent(world.localClientEntity, InputComponent).schema.behaviorMap.delete(BaseInput.CAMERA_SCROLL)
}, 500)
}

const activeSpreadsheet = 'emerge'

export default async function GraphSystem(world: World) {

  // todo: move to receptor pattern
  // console.log(await GoogleSpreadsheetService.getGoogleSpreadsheet(spreadsheetId, sheetId))

  /**
   * Change this
   */
  const spreadsheet = spreadsheets[activeSpreadsheet]

  // const rawData = await API.instance.client.service('conjure-google-spreadsheet').get({
  //   spreadsheetId: spreadsheet.spreadsheetId,
  //   sheetId: spreadsheet.sheetId
  // })

  // console.log({rawData})

  // const data = spreadsheet.filter(rawData) as GoogleSpreadsheetData

  const data = json as any

  console.log(data)

  const treeClusteringData = getTreeClusteringData(data)
  // console.log(treeClusteringData)

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

  const myGraph = new ThreeForceGraph()
    .graphData(treeClusteringData)
    .linkOpacity(1)
    .numDimensions(2)

  myGraph.scale.multiplyScalar(scaleFactor)
  myGraph.position.setY(1)
  Engine.instance.currentWorld.scene.add(myGraph)

  const nodes = [] as Mesh<any, any>[]

  const xruiObjectPool = createObjectPool(() => {
    const ui = createSpreadsheetXRUI({ id: '', type: '' as any, project: '', links: '' })
    ui.container.then(() => {
      const xrui = getComponent(ui.entity, XRUIComponent)
      xrui.container.traverse((obj: Mesh<any, any>) => {
        if (obj.material) obj.material.depthTest = false
      })
    })
    return ui
  })
  xruiObjectPool.grow(30)
  await Promise.all(xruiObjectPool.objPool.map((xrui) => xrui.container))

  let closestNodes = [] as Array<Mesh<any, any>>
  let displayedNodes = [] as Array<Mesh<any, any>>

  // [] as { ui: ReturnType<typeof createSpreadsheetXRUI>, node: Object3D }[]

  // forcegraph does stuff async internally with no callback......
  setTimeout(() => {
    // iterate the 
    for (let i = 0; i < 60; i++) myGraph.tickFrame()
    myGraph.children.forEach((node: Mesh<any, any>) => {
      if (node.type === 'Mesh') {
        nodes.push(node)
        const nodeData = (node as any).__data
        node.userData = {
          ...node.userData,
          ...nodeData
        }
        // node.position.z = node.position.y
        // node.position.y = 0
        // console.log(nodeData)
        if (nodeData.type === nodeTypes.person) node.material.visible = false

        const imgPath = `https://${location.host}/projects/conjure/emerge/${nodeData['First Name']} ${nodeData['Last Name']}.jpg`
        AssetLoader.load(imgPath, ((texture) => {
          texture.encoding = sRGBEncoding
          const mesh = new Mesh(new CircleGeometry(0.125, 16), new MeshBasicMaterial({ color: new Color('white'), map: texture, side: DoubleSide }))
          // mesh.scale.setScalar(invScaleFactor)
          Engine.instance.currentWorld.scene.add(mesh)
          node.getWorldPosition(mesh.position)

          node.userData.img = mesh
        }))

        if (nodeData.name) {
          // const ui = createSpreadsheetXRUI({ id: nodeData.name, type: nodeData.type, project: nodeData.Project, links: nodeData.Links ?? '' })
          // xruis.push({ ui, node })
        }
      }
      if (node.type === 'Line') {
        // node.scale.z = node.scale.y
      }
    })
    myGraph.rotateX(Math.PI / 2)
    // myGraph.refresh()
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

  if (!getEngineState().joinedWorld.value)
    matchActionOnce(EngineActions.joinedWorld.matches, () => {
      updateCameraSettings()
    })
  else
    updateCameraSettings()

  let counter = 0
  return () => {
    // const xrui = getComponent(cardUI.entity, XRUIComponent)
    // if (xrui) {
    //   ObjectFitFunctions.attachObjectToPreferredTransform(xrui.container)
    // }
    counter++
    if (counter === 20) {
      counter = 0
      for (const node of nodes) {
        node.getWorldPosition(vec3)
        const distanceToCamera = Engine.instance.currentWorld.camera.position.distanceTo(vec3)
        node.userData.distance = distanceToCamera
      }
      nodes.sort((a, b) => a.userData.distance - b.userData.distance)
      const removeList = [] as Mesh<any, any>[]
      closestNodes = nodes.slice(0, 30)
      // update 
      for (const node of displayedNodes) {
        if (!closestNodes.find((n) => n === node)) {
          removeList.push(node)
        }
      }
      for (const node of removeList) {
        displayedNodes.splice(displayedNodes.indexOf(node), 1)
        xruiObjectPool.recycle(node.userData.xrui)
        delete node.userData.xrui
      }
      for (const node of closestNodes) {
        if (!node.userData.xrui) {
          const xrui = xruiObjectPool.use()
          node.userData.xrui = xrui
          const nodeData = (node as any).__data
          xrui.state.set({ id: nodeData.name, type: nodeData.type, project: nodeData.Project, links: nodeData.Links ?? '' })
          displayedNodes.push(node)
        }
      }
    }

    for (const node of closestNodes) {
      const distanceToCamera = node.userData.distance
      const visible = distanceToCamera < 8

      if (visible) {
        const img = node.userData.img
        if (img) img.rotation.setFromRotationMatrix(Engine.instance.currentWorld.camera.matrix)
      }

      if (!node.userData.xrui) continue

      const xrui = getComponent(node.userData.xrui.entity, XRUIComponent)
      if (!xrui) continue

      xrui.container.scale.setScalar(
        Math.max(1, distanceToCamera / (3 * uiFalloffFactor)) * (node.userData.type === 'person' ? 0.8 : 0.5)
      )
      xrui.container.rotation.setFromRotationMatrix(Engine.instance.currentWorld.camera.matrix)

      node.getWorldPosition(xrui.container.position)
      node.userData.type === 'person' && (xrui.container.position.y += 0.25)
    }
  }
}
