import { useRef, useState } from 'react'
import { appendWall, closedRoom, DEFAULT_ISOMETRIC_CAMERA, fitObject, formatLength, isEditable, makeRoom, normalizeCamera, snap, unprojectFloor, views } from '../../utils/scene.js'
import { SceneDrawing, sceneFrame } from './SceneDrawing.jsx'

export default function SceneCanvas({ design, view, setView, camera, setCamera, tool, setTool, selectedId, select, onMove, onPlace, onRoom, onMessage, showDimensions, wallDimensions, gridSnap, wallThickness }) {
  const svgRef=useRef(null),drag=useRef(null),liveObject=useRef(null),liveDraft=useRef(null)
  const [preview,setPreview]=useState(null),[draft,setDraft]=useState(null),[zoom,setZoom]=useState(1),[over,setOver]=useState(false),[orbiting,setOrbiting]=useState(false)
  const room=design.room,closed=closedRoom(room),frame=sceneFrame(design,view,camera)
  const width=frame.width/zoom,height=frame.height/zoom
  const viewBox=[frame.x+(frame.width-width)/2,frame.y+(frame.height-height)/2,width,height].join(' ')
  function local(event) {
    const pt=svgRef.current.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY
    return pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
  }
  function world(event){const p=local(event);return unprojectFloor(p.x,p.y,view,camera)}
  function start(event,object) {
    if(event.button!==0&&event.button!==1)return
    if(object){event.stopPropagation();select(object.objectId)}else if(!event.shiftKey)select(null)
    // Orbit the camera, never translate room/object coordinates. Shift/middle drag works over objects too.
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
    event.preventDefault();svgRef.current.setPointerCapture(event.pointerId)
  }
  function move(event){
    const d=drag.current;if(!d)return
    if(d.kind==='orbit'){
      setCamera(normalizeCamera({
  azimuthDeg: d.camera.azimuthDeg - (event.clientX - d.at.x) * .4,
  elevationDeg: d.camera.elevationDeg + (event.clientY - d.at.y) * .25
}));return
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
    if(svgRef.current.hasPointerCapture(event.pointerId))svgRef.current.releasePointerCapture(event.pointerId)
    cancel()
  }
  const objects=design.objects.map(o=>o.objectId===preview?.objectId?preview:o)
  const draftWall=draft&&tool==='wall'?appendWall(room,draft.start,draft.end,wallThickness).room?.walls.at(-1):null
  const reset=()=>{setCamera({...DEFAULT_ISOMETRIC_CAMERA});setZoom(1)}
  const turn=delta=>setCamera(c=>normalizeCamera({...c,azimuthDeg:c.azimuthDeg+delta}))
  return <section className={`ik-workspace ${over?'ik-drop-over':''}`} aria-label="พื้นที่ออกแบบ">
    <div className="ik-canvas-toolbar"><div className="ik-view-tabs">{views.map(([id,name])=><button key={id} aria-pressed={view===id} onClick={()=>{if(drag.current)return;setView(id);setZoom(1)}}>{name}</button>)}</div></div>
    <div className="ik-canvas-meta"><span className="ik-pill">{isEditable(view)?'● ลากวางได้':'◉ ดูแบบ'}</span><span>{tool==='rectangle'?'ลากเพื่อกำหนดพื้นที่ห้อง':tool==='wall'?`วาดกำแพง ${room.walls.length}/4 ด้าน`:view==='isometric'?'ลากพื้นที่ว่างเพื่อหมุนรอบห้อง • ลากขึ้น/ลงเพื่อปรับมุมก้ม':'ลากสินค้าเข้าห้อง • คลิกเพื่อดูคุณสมบัติ'}</span></div>
    {view==='isometric'&&<div className="ik-orbit-controls" aria-label="ควบคุมมุมมองรอบห้อง"><button aria-label="หมุนมุมมองซ้าย" title="หมุนมุมมองซ้าย 45°" onClick={()=>turn(-45)}>↶</button><span data-testid="camera-angle">{Math.round(camera.azimuthDeg)}° · ก้ม {Math.round(camera.elevationDeg)}°</span><button aria-label="หมุนมุมมองขวา" title="หมุนมุมมองขวา 45°" onClick={()=>turn(45)}>↷</button><button onClick={reset}>รีเซ็ตมุม</button></div>}
    <svg ref={svgRef} data-testid="scene" viewBox={viewBox} className={`ik-scene ik-tool-${tool} ${view==='isometric'?'ik-orbit-view':''} ${orbiting?'is-orbiting':''}`} onPointerDown={e=>start(e)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel}
      onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect=isEditable(view)?'copy':'none';setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);if(!isEditable(view))return onMessage('วางสินค้าได้ในมุมบนและ Isometric เท่านั้น');onPlace(e.dataTransfer.getData('application/ikitchen-product'),world(e))}}>
      <title>{views.find(v=>v[0]===view)?.[1]}</title>
      <SceneDrawing design={design} view={view} camera={camera} objects={objects} selectedId={selectedId} onObjectPointerDown={start} onSelectObject={select} showDimensions={showDimensions} wallDimensions={wallDimensions}/>
      {draft&&tool==='rectangle'&&<rect x={Math.min(draft.start.x,draft.end.x)} y={Math.min(draft.start.y,draft.end.y)} width={Math.abs(draft.end.x-draft.start.x)} height={Math.abs(draft.end.y-draft.start.y)} fill="#64785a" fillOpacity=".15" stroke="#4f6147" strokeWidth="2" strokeDasharray="8 5"/>}
      {draftWall&&<line x1={draftWall.startXMm} y1={draftWall.startYMm} x2={draftWall.endXMm} y2={draftWall.endYMm} stroke="#4f6147" strokeWidth="4" vectorEffect="non-scaling-stroke" pointerEvents="none"/>}
    </svg>
    <div className="ik-canvas-bottom"><span>{closed?'พร้อมออกแบบ':room.walls.length?'ห้องยังไม่ปิด':'ยังไม่มีห้อง'} · กริด {formatLength(500,design.displayUnit)}</span><div className="ik-zoom"><button aria-label="ซูมออก" onClick={()=>setZoom(z=>Math.max(.5,z-.15))}>−</button><button onClick={()=>setZoom(1)} title="พอดีหน้าจอ">{Math.round(zoom*100)}%</button><button aria-label="ซูมเข้า" onClick={()=>setZoom(z=>Math.min(2.5,z+.15))}>+</button></div></div>
  </section>
}
