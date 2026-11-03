import { useEffect, useMemo, useState } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage, Line, Text } from 'react-konva'
import { loadProductBitmap } from '../../data/productImages.js'
import { faceMatrix, sceneGeometry } from '../../utils/sceneGeometry.js'

export function faceImageTransform(face) {
  return new Konva.Transform(faceMatrix(face.points)).decompose()
}

function Face({ face, bitmap, selected }) {
  const points=face.points.flatMap(p=>[p.x,p.y])
  return <Group name="product-face" objectId={face.objectId} faceName={face.side} opacity={face.opacity} listening={!!face.objectId}>
    <Line points={points} closed fill={face.fill}/>
    {bitmap&&<KonvaImage name="product-bitmap" image={bitmap} width={1} height={1} {...faceImageTransform(face)} listening={false}/>}
    <Line points={points} closed stroke={selected?'#456336':face.objectId?'#617d91':'#64735a'} strokeWidth={selected?2.5:1} strokeScaleEnabled={false} listening={false}/>
  </Group>
}

export default function KonvaScene({design,view,camera,selectedId,showDimensions,wallDimensions,onImageError}) {
  const geometry=useMemo(()=>sceneGeometry(design,view,camera,{showDimensions,wallDimensions}),[design,view,camera,showDimensions,wallDimensions])
  const refs=[...new Set(geometry.faces.map(f=>f.imageRef).filter(Boolean))],signature=JSON.stringify(refs)
  const [bitmaps,setBitmaps]=useState({})
  useEffect(()=>{
    let cancelled=false
    const keys=JSON.parse(signature)
    Promise.allSettled(keys.map(ref=>loadProductBitmap(ref).then(image=>[ref,image]))).then(results=>{
      if(cancelled)return
      setBitmaps(old=>({...old,...Object.fromEntries(results.filter(r=>r.status==='fulfilled').map(r=>r.value))}))
      if(results.some(r=>r.status==='rejected'))onImageError?.('โหลดรูปสินค้าไม่สำเร็จ ตรวจไฟล์ภาพหรือที่อยู่รูป แล้วเปลี่ยนมุมเพื่อลองใหม่')
    })
    return ()=>{cancelled=true}
  },[signature,onImageError])
  return <Group name="scene-drawing">
    {geometry.floor&&<Line name="room-floor" points={geometry.floor} closed fill="#ede8dc" stroke="#c3bdac" strokeWidth={1.5} strokeScaleEnabled={false} listening={false}/>}
    {geometry.grid.map((points,i)=><Line key={'grid'+i} points={points} stroke="#9a9f90" strokeWidth={.6} opacity={.24} strokeScaleEnabled={false} listening={false}/>)}
    {geometry.faces.map(face=><Face key={face.key} face={face} bitmap={bitmaps[face.imageRef]} selected={!!face.objectId&&face.objectId===selectedId}/>)}
    {geometry.labels.map((label,i)=><Text key={'label'+i} {...label} x={label.x-700} width={1400} y={label.y-geometry.fontSize/2} align="center" fontSize={geometry.fontSize} fontFamily="Sarabun, sans-serif" fill="#828c76" listening={false}/>)}
  </Group>
}

// The PDF path also draws real Konva nodes, using the same faces and matrices.
export function createSceneGroup(design,view,camera,bitmaps,options={}) {
  const geometry=sceneGeometry(design,view,camera,options),group=new Konva.Group()
  if(geometry.floor)group.add(new Konva.Line({points:geometry.floor,closed:true,fill:'#ede8dc',stroke:'#c3bdac',strokeWidth:1.5,strokeScaleEnabled:false}))
  for(const points of geometry.grid)group.add(new Konva.Line({points,stroke:'#9a9f90',strokeWidth:.6,opacity:.24,strokeScaleEnabled:false}))
  for(const face of geometry.faces){
    const g=new Konva.Group({opacity:face.opacity}),points=face.points.flatMap(p=>[p.x,p.y])
    g.add(new Konva.Line({points,closed:true,fill:face.fill}))
    if(bitmaps[face.imageRef])g.add(new Konva.Image({image:bitmaps[face.imageRef],width:1,height:1,...faceImageTransform(face)}))
    g.add(new Konva.Line({points,closed:true,stroke:face.objectId?'#617d91':'#64735a',strokeWidth:1,strokeScaleEnabled:false}))
    group.add(g)
  }
  for(const label of geometry.labels)group.add(new Konva.Text({...label,x:label.x-700,width:1400,y:label.y-geometry.fontSize/2,align:'center',fontSize:geometry.fontSize,fontFamily:'Sarabun, sans-serif',fill:'#828c76'}))
  return group
}
