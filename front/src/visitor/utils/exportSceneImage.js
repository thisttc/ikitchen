import Konva from 'konva'
import { createSceneGroup } from '../components/editor/KonvaScene.jsx'
import { loadProductBitmap } from '../data/productImages.js'
import { sceneFrame, sceneGeometry, viewportTransform } from './sceneGeometry.js'

export async function exportSceneCanvas(design,view,{width=1600,height=1100}={}) {
  const camera=design.isometricCamera
  const options={grid:false,showDimensions:false}
  const geometry=sceneGeometry(design,view,camera,options)
  const refs=[...new Set(geometry.faces.map(f=>f.imageRef).filter(Boolean))]
  const bitmaps=Object.fromEntries(await Promise.all(refs.map(async ref=>[ref,await loadProductBitmap(ref)])))
  const stage=new Konva.Stage({container:document.createElement('div'),width,height})
  try{
    const layer=new Konva.Layer(),frame=sceneFrame(design,view,camera),t=viewportTransform(frame,width,height)
    layer.add(new Konva.Rect({width,height,fill:'#faf8f2'}))
    const group=createSceneGroup(design,view,camera,bitmaps,options)
    group.position({x:t.x,y:t.y});group.scale({x:t.scale,y:t.scale});layer.add(group)
    stage.add(layer);layer.draw()
    return stage.toCanvas({pixelRatio:1})
  }finally{stage.destroy()}
}
