import { cameraBasis, cameraDepth, closedRoom, footprint, formatLength, ISO_SCALE, project, roomBounds } from '../../utils/scene.js'

const points = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ')

function Box({ x, y, width, depth, height, z = 0, color, view, camera, children, ...props }) {
  const p = (a, b, c) => project(a, b, c, view, camera)
  const base = [p(x, y, z), p(x + width, y, z), p(x + width, y + depth, z), p(x, y + depth, z)]
  const top = [p(x, y, z + height), p(x + width, y, z + height), p(x + width, y + depth, z + height), p(x, y + depth, z + height)]
  const c = cameraBasis(camera), xSide = c.sinA >= 0 ? [1, 2] : [3, 0], ySide = c.cosA >= 0 ? [2, 3] : [0, 1]
  const side = ([a, b]) => points([base[a], base[b], top[b], top[a]])
  return <g {...props}>
    {view === 'isometric' ? <>
      <polygon data-face="x" vectorEffect="non-scaling-stroke" points={side(xSide)} fill={color} />
      <polygon vectorEffect="non-scaling-stroke" points={side(xSide)} fill="#000" fillOpacity=".14" />
      <polygon data-face="y" vectorEffect="non-scaling-stroke" points={side(ySide)} fill={color} />
      <polygon vectorEffect="non-scaling-stroke" points={side(ySide)} fill="#000" fillOpacity=".05" />
      <polygon vectorEffect="non-scaling-stroke" points={points(top)} fill={color} />
    </> : ['top', 'bottom'].includes(view) ? <polygon vectorEffect="non-scaling-stroke" points={points(base)} fill={color} /> :
      <polygon vectorEffect="non-scaling-stroke" points={points([base[0], base[2], top[2], top[0]])} fill={color} />}
    {children}
  </g>
}

function Mark({ object, view, camera }) {
  const p = object.productSnapshot, f = footprint(object)
  if (!['top', 'isometric', 'bottom'].includes(view)) return null
  const map = (u, v) => {
    const theta = object.rotationDeg * Math.PI / 180, lx = (u - .5) * p.widthMm, ly = (v - .5) * p.depthMm
    return project(object.xMm + lx * Math.cos(theta) - ly * Math.sin(theta), object.yMm + lx * Math.sin(theta) + ly * Math.cos(theta), object.elevationMm + (view === 'isometric' ? p.heightMm : 0), view, camera)
  }
  const outline = (a, b, c, d) => points([map(a, b), map(c, b), map(c, d), map(a, d)])
  if (p.visual === 'stove') return <g pointerEvents="none" stroke="#514c43" strokeWidth="1.5" fill="#4d514a">
    {[.28, .72].map(u => <polygon vectorEffect="non-scaling-stroke" key={u} points={points(Array.from({ length: 16 }, (_, i) => map(u + .15 * Math.cos(i / 8 * Math.PI), .5 + .24 * Math.sin(i / 8 * Math.PI))))} />)}
  </g>
  if (p.visual === 'sink') return <g pointerEvents="none"><polygon vectorEffect="non-scaling-stroke" points={outline(.15, .17, .85, .8)} fill="#517b83" stroke="#e0f0ee" /><polygon vectorEffect="non-scaling-stroke" points={outline(.23, .25, .77, .72)} fill="#94b8be" /><path d={`M${map(.5, .08).x},${map(.5, .08).y} L${map(.5, .34).x},${map(.5, .34).y}`} stroke="#f5f6f2" strokeWidth="4" /></g>
  return <g pointerEvents="none"><polygon vectorEffect="non-scaling-stroke" points={outline(.08, .08, .92, .92)} fill="none" stroke="#fff" strokeOpacity=".45" />
    {f.width > 0 && <path d={`M${map(.3, .7).x},${map(.3, .7).y} L${map(.7, .7).x},${map(.7, .7).y}`} stroke="#514c43" strokeWidth="2" />}</g>
}

// Split each wall around its openings; room.openings is derived from scene objects.
function Wall({ wall, room, view, camera }) {
  const horizontal = wall.startYMm === wall.endYMm
  const length = Math.hypot(wall.endXMm - wall.startXMm, wall.endYMm - wall.startYMm)
  const cuts = room.openings.filter(o => o.wallId === wall.wallId)
  const xs = [...new Set([0, length, ...cuts.flatMap(o => [o.offsetMm, o.offsetMm + o.widthMm])])].sort((a, b) => a - b)
  const zs = [...new Set([0, room.heightMm, ...cuts.flatMap(o => [o.sillHeightMm, o.sillHeightMm + o.heightMm])])].sort((a, b) => a - b)
  const blocks = []
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const mid = (xs[i] + xs[i + 1]) / 2, zmid = (zs[j] + zs[j + 1]) / 2
    if (cuts.some(o => mid > o.offsetMm && mid < o.offsetMm + o.widthMm && zmid > o.sillHeightMm && zmid < o.sillHeightMm + o.heightMm)) continue
    const a = { x: wall.startXMm + (wall.endXMm - wall.startXMm) * xs[i] / length, y: wall.startYMm + (wall.endYMm - wall.startYMm) * xs[i] / length }
    const b = { x: wall.startXMm + (wall.endXMm - wall.startXMm) * xs[i + 1] / length, y: wall.startYMm + (wall.endYMm - wall.startYMm) * xs[i + 1] / length }
    blocks.push(<Box key={`${i}-${j}`} x={Math.min(a.x, b.x) - (horizontal ? 0 : wall.thicknessMm / 2)} y={Math.min(a.y, b.y) - (horizontal ? wall.thicknessMm / 2 : 0)} width={horizontal ? xs[i + 1] - xs[i] : wall.thicknessMm} depth={horizontal ? wall.thicknessMm : xs[i + 1] - xs[i]} z={zs[j]} height={zs[j + 1] - zs[j]} color="#a6ad98" view={view} camera={camera} />)
  }
  return <g className="ik-wall" data-wall-id={wall.wallId} stroke="#64735a" strokeWidth="1" opacity={['top', 'bottom'].includes(view) ? .8 : .25} pointerEvents="none">{blocks}</g>
}


export function sceneFrame(design, view, camera = design.isometricCamera) {
  const b = closedRoom(design.room) ? roomBounds(design.room) : { x: -500, y: -500, width: 7000, depth: 6000 }
  if (view === 'isometric') {
    // A fixed orbit envelope keeps scale steady; recenter on the room, never accumulate a pan offset.
    const radius = Math.hypot(b.width / 2, b.depth / 2) + 250
    const center = project(b.x + b.width / 2, b.y + b.depth / 2, design.room.heightMm / 2, view, camera)
    const width = 2 * (radius * ISO_SCALE + 650), height = 2 * (Math.hypot(radius, design.room.heightMm / 2) * ISO_SCALE + 650)
    return { x: center.x - width / 2, y: center.y - height / 2, width, height, gridBounds: b }
  }
  const corners = [0, design.room.heightMm].flatMap(z => [[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.depth],[b.x,b.y+b.depth]].map(([x,y]) => project(x,y,z,view,camera)))
  const minX=Math.min(...corners.map(p=>p.x))-650, maxX=Math.max(...corners.map(p=>p.x))+650
  const minY=Math.min(...corners.map(p=>p.y))-650, maxY=Math.max(...corners.map(p=>p.y))+650
  return { x:minX, y:minY, width:maxX-minX, height:maxY-minY, gridBounds:b }
}

export function SceneDrawing({design,view,camera=design.isometricCamera,selectedId=null,objects=design.objects,onObjectPointerDown,onSelectObject,showDimensions=true,wallDimensions=false,grid=true}) {
  const room=design.room, closed=closedRoom(room), bounds=roomBounds(room), frame=sceneFrame(design,view,camera), b=frame.gridBounds
  const map=(x,y,z=0)=>project(x,y,z,view,camera)
  const visible=id=>design.layers.find(l=>l.layerId===id)?.isVisible!==false
  const sorted=objects.filter(o=>visible(o.layerId)).sort((a,b)=>view==='isometric'?cameraDepth(a.xMm,a.yMm,a.elevationMm+a.productSnapshot.heightMm/2,camera)-cameraDepth(b.xMm,b.yMm,b.elevationMm+b.productSnapshot.heightMm/2,camera):view==='front'?a.yMm-b.yMm:view==='back'?b.yMm-a.yMm:view==='left'?b.xMm-a.xMm:view==='right'?a.xMm-b.xMm:a.elevationMm-b.elevationMm)
  const walls=room.walls.filter(w=>w.isVisible!==false).sort((a,b)=>view==='isometric'?cameraDepth((a.startXMm+a.endXMm)/2,(a.startYMm+a.endYMm)/2,0,camera)-cameraDepth((b.startXMm+b.endXMm)/2,(b.startYMm+b.endYMm)/2,0,camera):0)
  const floor=[[bounds.x,bounds.y],[bounds.x+bounds.width,bounds.y],[bounds.x+bounds.width,bounds.y+bounds.depth],[bounds.x,bounds.y+bounds.depth]].map(([x,y])=>map(x,y))
  const label=(x,y,value,key)=>{const p=map(x,y);return <text key={key} x={p.x} y={p.y} textAnchor="middle" fill="#828c76" fontFamily="Sarabun, sans-serif" fontSize={Math.max(frame.width,frame.height)/65}>{value}</text>}
  return <>
    {closed&&<polygon data-testid="room-floor" points={points(floor)} fill="#ede8dc" stroke="#c3bdac" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>}
    {grid&&['top','isometric'].includes(view)&&<g pointerEvents="none" stroke="#9a9f90" strokeWidth=".6" opacity=".24">
      {Array.from({length:Math.floor(b.width/500)+1},(_,i)=>{const a=map(b.x+i*500,b.y),c=map(b.x+i*500,b.y+b.depth);return <line key={'x'+i} x1={a.x} y1={a.y} x2={c.x} y2={c.y} vectorEffect="non-scaling-stroke"/>})}
      {Array.from({length:Math.floor(b.depth/500)+1},(_,i)=>{const a=map(b.x,b.y+i*500),c=map(b.x+b.width,b.y+i*500);return <line key={'y'+i} x1={a.x} y1={a.y} x2={c.x} y2={c.y} vectorEffect="non-scaling-stroke"/>})}
    </g>}
    {visible('room')&&walls.map(w=><Wall key={w.wallId} wall={w} room={room} view={view} camera={camera}/>)}
    {sorted.map(o=>{const f=footprint(o),p=o.productSnapshot;return <Box key={o.objectId} x={o.xMm-f.width/2} y={o.yMm-f.depth/2} width={f.width} depth={f.depth} height={p.heightMm} z={o.elevationMm} color={p.placeholderColor} view={view} camera={camera}
      stroke={selectedId===o.objectId?'#456336':'#616957'} strokeWidth={selectedId===o.objectId?2.5:1}
      className={'ik-object'+(selectedId===o.objectId?' is-selected':'')} opacity={o.transparent ? .4 : 1} role={onSelectObject?'button':undefined} tabIndex={onSelectObject?0:undefined} aria-label={p.productName+' '+p.model} data-object-id={o.objectId}
      onPointerDown={onObjectPointerDown?e=>onObjectPointerDown(e,o):undefined} onKeyDown={onSelectObject?e=>{if(e.key==='Enter')onSelectObject(o.objectId)}:undefined}>
      <title>{p.productName+' · '+p.model+' · '+p.widthMm+' × '+p.depthMm+' × '+p.heightMm+' mm'}</title><Mark object={o} view={view} camera={camera}/>
    </Box>})}
    {closed&&showDimensions&&<g pointerEvents="none">{label(bounds.x+bounds.width/2,bounds.y+bounds.depth+350,formatLength(bounds.width,design.displayUnit))}{label(bounds.x-450,bounds.y+bounds.depth/2,formatLength(bounds.depth,design.displayUnit))}</g>}
    {wallDimensions&&<g pointerEvents="none">{room.walls.map((w,i)=>label((w.startXMm+w.endXMm)/2+100,(w.startYMm+w.endYMm)/2-150,formatLength(Math.hypot(w.endXMm-w.startXMm,w.endYMm-w.startYMm),design.displayUnit),'w'+i))}</g>}
  </>
}

export function SceneSvg({design,view='top',showDimensions=false,grid=false}) {
  const f=sceneFrame(design,view)
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={[f.x,f.y,f.width,f.height].join(' ')} width="1600" height="1100"><rect x={f.x} y={f.y} width={f.width} height={f.height} fill="#faf8f2"/><SceneDrawing design={design} view={view} showDimensions={showDimensions} grid={grid}/></svg>
}
