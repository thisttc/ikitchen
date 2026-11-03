import { useRef, useState } from 'react'
import { appendWall, closedRoom, fitObject, footprint, isEditable, makeRoom, project, roomBounds, snap, unprojectFloor, views } from '../../utils/scene.js'

const points = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ')

function Box({ x, y, width, depth, height, z = 0, color, view, children, ...props }) {
  const p = (a, b, c) => project(a, b, c, view)
  const base = [p(x, y, z), p(x + width, y, z), p(x + width, y + depth, z), p(x, y + depth, z)]
  const top = [p(x, y, z + height), p(x + width, y, z + height), p(x + width, y + depth, z + height), p(x, y + depth, z + height)]
  return <g {...props}>
    {view === 'isometric' ? <>
      <polygon points={points([base[1], base[2], top[2], top[1]])} fill={color} />
      <polygon points={points([base[1], base[2], top[2], top[1]])} fill="#000" fillOpacity=".14" />
      <polygon points={points([base[2], base[3], top[3], top[2]])} fill={color} />
      <polygon points={points([base[2], base[3], top[3], top[2]])} fill="#000" fillOpacity=".05" />
      <polygon points={points(top)} fill={color} />
    </> : ['top', 'bottom'].includes(view) ? <polygon points={points(base)} fill={color} /> :
      <polygon points={points([base[0], base[2], top[2], top[0]])} fill={color} />}
    {children}
  </g>
}

function Mark({ object, view }) {
  const p = object.productSnapshot, f = footprint(object)
  if (!['top', 'isometric', 'bottom'].includes(view)) return null
  const map = (u, v) => {
    const theta = object.rotationDeg * Math.PI / 180, lx = (u - .5) * p.widthMm, ly = (v - .5) * p.depthMm
    return project(object.xMm + lx * Math.cos(theta) - ly * Math.sin(theta), object.yMm + lx * Math.sin(theta) + ly * Math.cos(theta), object.elevationMm + (view === 'isometric' ? p.heightMm : 0), view)
  }
  const outline = (a, b, c, d) => points([map(a, b), map(c, b), map(c, d), map(a, d)])
  if (p.visual === 'stove') return <g pointerEvents="none" stroke="#514c43" strokeWidth="1.5" fill="#4d514a">
    {[.28, .72].map(u => <polygon key={u} points={points(Array.from({ length: 16 }, (_, i) => map(u + .15 * Math.cos(i / 8 * Math.PI), .5 + .24 * Math.sin(i / 8 * Math.PI))))} />)}
  </g>
  if (p.visual === 'sink') return <g pointerEvents="none"><polygon points={outline(.15, .17, .85, .8)} fill="#517b83" stroke="#e0f0ee" /><polygon points={outline(.23, .25, .77, .72)} fill="#94b8be" /><path d={`M${map(.5, .08).x},${map(.5, .08).y} L${map(.5, .34).x},${map(.5, .34).y}`} stroke="#f5f6f2" strokeWidth="4" /></g>
  return <g pointerEvents="none"><polygon points={outline(.08, .08, .92, .92)} fill="none" stroke="#fff" strokeOpacity=".45" />
    {f.width > 0 && <path d={`M${map(.3, .7).x},${map(.3, .7).y} L${map(.7, .7).x},${map(.7, .7).y}`} stroke="#514c43" strokeWidth="2" />}</g>
}

// Split each wall around its openings; room.openings is derived from scene objects.
function Wall({ wall, room, view }) {
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
    blocks.push(<Box key={`${i}-${j}`} x={Math.min(a.x, b.x) - (horizontal ? 0 : wall.thicknessMm / 2)} y={Math.min(a.y, b.y) - (horizontal ? wall.thicknessMm / 2 : 0)} width={horizontal ? xs[i + 1] - xs[i] : wall.thicknessMm} depth={horizontal ? wall.thicknessMm : xs[i + 1] - xs[i]} z={zs[j]} height={zs[j + 1] - zs[j]} color="#a6ad98" view={view} />)
  }
  return <g className="ik-wall" opacity={['top', 'bottom'].includes(view) ? .8 : .25} pointerEvents="none">{blocks}</g>
}

export default function SceneCanvas({ design, view, setView, tool, setTool, selectedId, select, onMove, onPlace, onRoom, onMessage, showDimensions, gridSnap, wallThickness }) {
  const svgRef = useRef(null), drag = useRef(null)
  const [preview, setPreview] = useState(null), [draft, setDraft] = useState(null), [zoom, setZoom] = useState(1), [over, setOver] = useState(false)
  const room = design.room, closed = closedRoom(room), bounds = roomBounds(room)
  const b = closed ? bounds : { x: -500, y: -500, width: 7000, depth: 6000 }
  const corners = [0, room.heightMm].flatMap(z => [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.depth], [b.x, b.y + b.depth]].map(([x, y]) => project(x, y, z, view)))
  const minX = Math.min(...corners.map(p => p.x)) - 650, maxX = Math.max(...corners.map(p => p.x)) + 650
  const minY = Math.min(...corners.map(p => p.y)) - 650, maxY = Math.max(...corners.map(p => p.y)) + 650
  const width = (maxX - minX) / zoom, height = (maxY - minY) / zoom
  const viewBox = `${(minX + maxX - width) / 2} ${(minY + maxY - height) / 2} ${width} ${height}`
  function world(event) {
    const pt = svgRef.current.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY
    const local = pt.matrixTransform(svgRef.current.getScreenCTM().inverse())
    return unprojectFloor(local.x, local.y, view)
  }
  function start(event, object) {
    if (event.button !== 0) return
    if (object) { event.stopPropagation(); select(object.objectId) } else select(null)
    if (!isEditable(view)) return
    const at = world(event)
    if (object && tool === 'select') drag.current = { kind: 'object', object, at }
    else if (!object && view === 'top' && ['rectangle', 'wall'].includes(tool)) {
      drag.current = { kind: tool, at: { x: snap(at.x), y: snap(at.y) } }
      setDraft({ start: drag.current.at, end: drag.current.at })
    } else return
    event.preventDefault(); svgRef.current.setPointerCapture(event.pointerId)
  }
  function move(event) {
    if (!drag.current) return
    const d = drag.current, at = world(event)
    if (d.kind === 'object') {
      const x = d.object.xMm + at.x - d.at.x, y = d.object.yMm + at.y - d.at.y
      const result = fitObject(d.object, room, gridSnap ? snap(x) : x, gridSnap ? snap(y) : y)
      if (result.object) setPreview(result.object)
    } else setDraft({ start: d.at, end: { x: snap(at.x), y: snap(at.y) } })
  }
  function finish(event) {
    const d = drag.current
    if (!d) return
    if (d.kind === 'object') {
      if (preview) onMove(preview)
    } else if (draft) {
      if (d.kind === 'rectangle') {
        const w = Math.abs(draft.end.x - draft.start.x), h = Math.abs(draft.end.y - draft.start.y)
        if (w >= 1000 && h >= 1000 && w <= 15000 && h <= 15000) {
          onRoom(makeRoom(w, h, room.heightMm, Math.min(draft.start.x, draft.end.x), Math.min(draft.start.y, draft.end.y), wallThickness)); setTool('select')
        } else onMessage('ลากห้องขนาด 1–15 เมตรต่อด้าน')
      } else {
        const result = appendWall(room, draft.start, draft.end, wallThickness)
        if (result.error) onMessage(result.error)
        else { onRoom(result.room); if (closedRoom(result.room)) { setTool('select'); onMessage('กำแพงปิดครบ 4 ด้านแล้ว พร้อมวางสินค้า') } }
      }
    }
    drag.current = null; setPreview(null); setDraft(null)
    if (svgRef.current.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId)
  }
  const visible = id => design.layers.find(l => l.layerId === id)?.isVisible !== false
  const objects = design.objects.map(o => o.objectId === preview?.objectId ? preview : o).filter(o => visible(o.layerId))
  objects.sort((a, b) => view === 'isometric' ? a.xMm + a.yMm - b.xMm - b.yMm : view === 'front' ? a.yMm - b.yMm : view === 'back' ? b.yMm - a.yMm : view === 'left' ? b.xMm - a.xMm : view === 'right' ? a.xMm - b.xMm : a.elevationMm - b.elevationMm)
  const floor = [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y], [bounds.x + bounds.width, bounds.y + bounds.depth], [bounds.x, bounds.y + bounds.depth]].map(([x, y]) => project(x, y, 0, view))
  const label = (x, y, text) => { const p = project(x, y, 0, view); return <text x={p.x} y={p.y} textAnchor="middle" className="ik-dimension" fontSize={Math.max(width, height) / 65}>{text}</text> }
  const unit = v => design.displayUnit === 'inch' ? `${(v / 25.4).toFixed(1)} in` : `${(v / 1000).toFixed(2)} ม.`
  let draftRoom
  if (draft && tool === 'wall') draftRoom = appendWall(room, draft.start, draft.end, wallThickness).room
  return <section className={`ik-workspace ${over ? 'ik-drop-over' : ''}`} aria-label="พื้นที่ออกแบบ">
    <div className="ik-canvas-toolbar"><div className="ik-view-tabs">{views.map(([id, name]) => <button key={id} aria-pressed={view === id} onClick={() => { if (drag.current) return; setView(id); setZoom(1) }}>{name}</button>)}</div></div>
    <div className="ik-canvas-meta"><span className="ik-pill">{isEditable(view) ? '● ลากวางได้' : '◉ ดูแบบเท่านั้น'}</span><span>{tool === 'rectangle' ? 'ลากจากมุมหนึ่งไปอีกมุมเพื่อสร้างห้อง' : tool === 'wall' ? `วาดกำแพง ${room.walls.length}/4 ด้าน · ด้าน 3–4 จะช่วยปิดสี่เหลี่ยม` : 'ลากสินค้าเข้าห้อง • คลิกเพื่อแก้คุณสมบัติ'}</span></div>
    <svg ref={svgRef} data-testid="scene" viewBox={viewBox} className={`ik-scene ik-tool-${tool}`} onPointerDown={e => start(e)} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => { drag.current = null; setPreview(null); setDraft(null) }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = isEditable(view) ? 'copy' : 'none'; setOver(true) }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); if (!isEditable(view)) return onMessage('วางสินค้าได้ในมุมบนและ Isometric เท่านั้น'); onPlace(e.dataTransfer.getData('application/ikitchen-product'), world(e)) }}>
      <title>ห้องครัว {views.find(v => v[0] === view)?.[1]}</title>
      {closed && visible('room') && <polygon points={points(floor)} fill="#ede8dc" stroke="#c3bdac" strokeWidth="1.5" />}
      {['top', 'isometric'].includes(view) && <g pointerEvents="none" stroke="#9a9f90" strokeWidth=".6" opacity=".24">
        {Array.from({ length: Math.floor(b.width / 500) + 1 }, (_, i) => { const a = project(b.x + i * 500, b.y, 0, view), c = project(b.x + i * 500, b.y + b.depth, 0, view); return <line key={`x${i}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} /> })}
        {Array.from({ length: Math.floor(b.depth / 500) + 1 }, (_, i) => { const a = project(b.x, b.y + i * 500, 0, view), c = project(b.x + b.width, b.y + i * 500, 0, view); return <line key={`y${i}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} /> })}
      </g>}
      {visible('room') && room.walls.map(w => <Wall key={w.wallId} wall={w} room={room} view={view} />)}
      {objects.map(o => { const f = footprint(o), p = o.productSnapshot; return <Box key={o.objectId} x={o.xMm - f.width / 2} y={o.yMm - f.depth / 2} width={f.width} depth={f.depth} height={p.heightMm} z={o.elevationMm} color={p.placeholderColor} view={view}
        className={`ik-object ${selectedId === o.objectId ? 'is-selected' : ''}`} opacity={o.transparent ? .4 : 1} role="button" tabIndex={0} aria-label={`${p.productName} ${p.model}`} data-object-id={o.objectId} onPointerDown={e => start(e, o)} onKeyDown={e => { if (e.key === 'Enter') select(o.objectId) }}>
        <title>{p.productName} · {p.model} · {p.widthMm} × {p.depthMm} × {p.heightMm} mm</title><Mark object={o} view={view} />
      </Box> })}
      {closed && showDimensions && <g pointerEvents="none">{label(bounds.x + bounds.width / 2, bounds.y + bounds.depth + 350, unit(bounds.width))}{label(bounds.x - 450, bounds.y + bounds.depth / 2, unit(bounds.depth))}</g>}
      {draft && tool === 'rectangle' && <g pointerEvents="none"><rect x={Math.min(draft.start.x, draft.end.x)} y={Math.min(draft.start.y, draft.end.y)} width={Math.abs(draft.end.x - draft.start.x)} height={Math.abs(draft.end.y - draft.start.y)} fill="#64785a" fillOpacity=".15" stroke="#4f6147" strokeWidth="2" strokeDasharray="8 5" />{label(draft.end.x, draft.end.y - 150, `${unit(Math.abs(draft.end.x - draft.start.x))} × ${unit(Math.abs(draft.end.y - draft.start.y))}`)}</g>}
      {draftRoom && <g pointerEvents="none"><Wall wall={draftRoom.walls.at(-1)} room={draftRoom} view={view} /></g>}
    </svg>
    <div className="ik-canvas-bottom"><span>{closed ? `${unit(bounds.width)} × ${unit(bounds.depth)}` : 'ห้องยังไม่ปิด'} · กริด 0.50 ม.</span><div className="ik-zoom"><button aria-label="ซูมออก" onClick={() => setZoom(z => Math.max(.5, z - .15))}>−</button><button onClick={() => setZoom(1)} title="พอดีหน้าจอ">{Math.round(zoom * 100)}%</button><button aria-label="ซูมเข้า" onClick={() => setZoom(z => Math.min(2.5, z + .15))}>+</button></div></div>
  </section>
}
