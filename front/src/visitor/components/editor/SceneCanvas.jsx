import { useEffect, useRef, useState } from 'react'
import { Group, Layer, Line, Stage } from 'react-konva'
import { appendWall, closedRoom, DEFAULT_ISOMETRIC_CAMERA, fitObject, formatLength, isEditable, makeRoom, normalizeCamera, snap, unprojectFloor, views } from '../../utils/scene.js'
import { sceneFrame, viewportTransform } from '../../utils/sceneGeometry.js'
import KonvaScene from './KonvaScene.jsx'

export default function SceneCanvas({design,view,setView,camera,setCamera,tool,setTool,selectedId,select,onMove,onPlace,onRoom,onMessage,showDimensions,wallDimensions,gridSnap,wallThickness}) {
  const hostRef=useRef(null),stageRef=useRef(null),drag=useRef(null),liveObject=useRef(null),liveDraft=useRef(null)
  const [size,setSize]=useState({width:800,height:600}),[preview,setPreview]=useState(null),[draft,setDraft]=useState(null),[zoom,setZoom]=useState(1),[over,setOver]=useState(false),[orbiting,setOrbiting]=useState(false)
  useEffect(()=>{
    const host=hostRef.current
    const measure=()=>{const r=host.getBoundingClientRect();if(r.width>0&&r.height>0)setSize({width:r.width,height:r.height})}
    measure()
    const observer=new ResizeObserver(measure);observer.observe(host)
    return ()=>observer.disconnect()
  },[])
  const room=design.room,closed=closedRoom(room),frame=sceneFrame(design,view,camera)
  const transform=viewportTransform(frame,size.width,size.height,zoom)
  function local(event){
    const r=hostRef.current.getBoundingClientRect()
    const x=(event.clientX-r.left)*size.width/r.width,y=(event.clientY-r.top)*size.height/r.height
    return {x:(x-transform.x)/transform.scale,y:(y-transform.y)/transform.scale}
  }
  function world(event){const p=local(event);return unprojectFloor(p.x,p.y,view,camera)}
  function start(event){
    if(event.button!==0&&event.button!==1)return
    const stage=stageRef.current;stage.setPointersPositions(event)
    const hit=stage.getIntersection(stage.getPointerPosition()),group=hit?.findAncestor('.product-face',true)
    const object=design.objects.find(o=>o.objectId===group?.getAttr('objectId'))
    if(object)select(object.objectId);else if(!event.shiftKey)select(null)
    if(view==='isometric'&&(!object||event.shiftKey||event.button===1)){
      drag.current={kind:'orbit',at:{x:event.clientX,y:event.clientY},camera:normalizeCamera(camera)};setOrbiting(true)
    }else{
      if(event.button!==0||!isEditable(view))return
      const at=world(event)
      if(object&&tool==='select')drag.current={kind:'object',object,at}
      else if(!object&&view==='top'&&['rectangle','wall'].includes(tool)){
        drag.current={kind:tool,at:{x:snap(at.x),y:snap(at.y)}}
        liveDraft.current={start:drag.current.at,end:drag.current.at};setDraft(liveDraft.current)
      }else return
    }
    event.preventDefault();hostRef.current.setPointerCapture(event.pointerId)
  }
  function move(event){
    const d=drag.current;if(!d)return
    if(d.kind==='orbit'){
      // Inverted mouse direction requested by the user.
      setCamera(normalizeCamera({azimuthDeg:d.camera.azimuthDeg-(event.clientX-d.at.x)*.4,elevationDeg:d.camera.elevationDeg+(event.clientY-d.at.y)*.25}));return
    }
    const at=world(event)
    if(d.kind==='object'){
      const x=d.object.xMm+at.x-d.at.x,y=d.object.yMm+at.y-d.at.y
      const result=fitObject(d.object,room,gridSnap?snap(x):x,gridSnap?snap(y):y)
      if(result.object){liveObject.current=result.object;setPreview(result.object)}
    }else{liveDraft.current={start:d.at,end:{x:snap(at.x),y:snap(at.y)}};setDraft(liveDraft.current)}
  }
  function cancel(){drag.current=null;liveObject.current=null;liveDraft.current=null;setPreview(null);setDraft(null);setOrbiting(false)}
  function finish(event){
    const d=drag.current;if(!d)return
    if(d.kind==='object'&&liveObject.current)onMove(liveObject.current)
    else if(['rectangle','wall'].includes(d.kind)&&liveDraft.current){
      const next=liveDraft.current
      if(d.kind==='rectangle'){
        const w=Math.abs(next.end.x-next.start.x),h=Math.abs(next.end.y-next.start.y)
        if(w>=1000&&h>=1000&&w<=15000&&h<=15000){onRoom(makeRoom(w,h,room.heightMm,Math.min(next.start.x,next.end.x),Math.min(next.start.y,next.end.y),wallThickness));setTool('select')}
        else onMessage('ลากห้องขนาด 1–15 เมตรต่อด้าน')
      }else{
        const result=appendWall(room,next.start,next.end,wallThickness)
        if(result.error)onMessage(result.error)
        else{onRoom(result.room);if(closedRoom(result.room)){setTool('select');onMessage('กำแพงปิดครบแล้ว พร้อมวางสินค้า')}}
      }
    }
    cancel()
    if(hostRef.current.hasPointerCapture(event.pointerId))hostRef.current.releasePointerCapture(event.pointerId)
  }
  const objects=design.objects.map(o=>o.objectId===preview?.objectId?preview:o)
  const draftWall=draft&&tool==='wall'?appendWall(room,draft.start,draft.end,wallThickness).room?.walls.at(-1):null
  const reset=()=>{setCamera({...DEFAULT_ISOMETRIC_CAMERA});setZoom(1)}
  const turn=delta=>setCamera(c=>normalizeCamera({...c,azimuthDeg:c.azimuthDeg+delta}))
  return <section className={`ik-workspace ${over?'ik-drop-over':''}`} aria-label="พื้นที่ออกแบบ">
    <div className="ik-canvas-toolbar"><div className="ik-view-tabs">{views.map(([id,name])=><button key={id} aria-pressed={view===id} onClick={()=>{if(drag.current)return;setView(id);setZoom(1)}}>{name}</button>)}</div></div>
    {view==='isometric'&&<div className="ik-orbit-controls" aria-label="ควบคุมมุมมองรอบห้อง"><button aria-label="หมุนมุมมองซ้าย" title="หมุนมุมมองซ้าย 45°" onClick={()=>turn(-45)}>↶</button><span data-testid="camera-angle">{Math.round(camera.azimuthDeg)}° · ก้ม {Math.round(camera.elevationDeg)}°</span><button aria-label="หมุนมุมมองขวา" title="หมุนมุมมองขวา 45°" onClick={()=>turn(45)}>↷</button><button onClick={reset}>รีเซ็ตมุม</button></div>}
    <div ref={hostRef} data-testid="scene" data-renderer="react-konva" role="application" aria-label="Canvas ออกแบบห้องครัว" className={`ik-scene ik-konva-host ik-tool-${tool} ${orbiting?'is-orbiting':''}`}
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect=isEditable(view)?'copy':'none';setOver(true)}} onDragLeave={()=>setOver(false)}
      onDrop={e=>{e.preventDefault();setOver(false);if(!isEditable(view))return onMessage('วางสินค้าได้ในมุมบนและ Isometric เท่านั้น');onPlace(e.dataTransfer.getData('application/ikitchen-product'),world(e))}}>
      <Stage ref={stageRef} width={size.width} height={size.height}>
        <Layer><Group x={transform.x} y={transform.y} scaleX={transform.scale} scaleY={transform.scale}>
          <KonvaScene design={{...design,objects}} view={view} camera={camera} selectedId={selectedId} showDimensions={showDimensions} wallDimensions={wallDimensions} onImageError={onMessage}/>
          {draft&&tool==='rectangle'&&<Line points={[draft.start.x,draft.start.y,draft.end.x,draft.start.y,draft.end.x,draft.end.y,draft.start.x,draft.end.y]} closed fill="#64785a" opacity={.3} stroke="#4f6147" strokeWidth={2} strokeScaleEnabled={false} listening={false}/>}
          {draftWall&&<Line points={[draftWall.startXMm,draftWall.startYMm,draftWall.endXMm,draftWall.endYMm]} stroke="#4f6147" strokeWidth={4} strokeScaleEnabled={false} listening={false}/>}
        </Group></Layer>
      </Stage>
    </div>
    <div className="ik-canvas-bottom"><span>{closed?'พร้อมออกแบบ':room.walls.length?'ห้องยังไม่ปิด':'ยังไม่มีห้อง'} · กริด {formatLength(500,design.displayUnit)}</span><div className="ik-zoom"><button aria-label="ซูมออก" onClick={()=>setZoom(z=>Math.max(.5,z-.15))}>−</button><button onClick={()=>setZoom(1)} title="พอดีหน้าจอ">{Math.round(zoom*100)}%</button><button aria-label="ซูมเข้า" onClick={()=>setZoom(z=>Math.min(2.5,z+.15))}>+</button></div></div>
  </section>
}
