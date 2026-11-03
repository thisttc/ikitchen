import { cameraBasis, closedRoom, formatLength, ISO_SCALE, project, roomBounds } from './scene.js'

export const UNTEXTURED_FACE_COLOR = '#b9ddf4'
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
export function viewDirection(view, camera) {
  const c = cameraBasis(camera)
  return view === 'isometric' ? { x: c.sinA * c.cosE, y: c.cosA * c.cosE, z: c.sinE } : {
    top: { x: 0, y: 0, z: 1 }, bottom: { x: 0, y: 0, z: -1 }, front: { x: 0, y: 1, z: 0 },
    back: { x: 0, y: -1, z: 0 }, left: { x: -1, y: 0, z: 0 }, right: { x: 1, y: 0, z: 0 },
  }[view] ?? { x: 0, y: 0, z: 1 }
}

// Image corners: TL, TR, BR, BL. Front is local +Y; right is local +X.
export function boxFaces(object, view, camera) {
  const p = object.productSnapshot, w = p.widthMm / 2, d = p.depthMm / 2, h = p.heightMm
  const angle = object.rotationDeg * Math.PI / 180, co = Math.cos(angle), si = Math.sin(angle), eye = viewDirection(view, camera)
  const rotate = ([x, y, z]) => ({ x: x * co - y * si, y: x * si + y * co, z })
  const world = v => { const q = rotate(v); return { x: q.x + object.xMm, y: q.y + object.yMm, z: q.z + object.elevationMm } }
  const definitions = [
    ['front', [0, 1, 0], [[-w, d, h], [w, d, h], [w, d, 0], [-w, d, 0]]],
    ['right', [1, 0, 0], [[w, d, h], [w, -d, h], [w, -d, 0], [w, d, 0]]],
    ['back', [0, -1, 0], [[w, -d, h], [-w, -d, h], [-w, -d, 0], [w, -d, 0]]],
    ['left', [-1, 0, 0], [[-w, -d, h], [-w, d, h], [-w, d, 0], [-w, -d, 0]]],
    ['top', [0, 0, 1], [[-w, -d, h], [w, -d, h], [w, d, h], [-w, d, h]]],
    ['bottom', [0, 0, -1], [[-w, d, 0], [w, d, 0], [w, -d, 0], [-w, -d, 0]]],
  ]
  return definitions.flatMap(([side, n, verts]) => {
    if (dot(rotate(n), eye) <= 1e-8) return []
    const corners = verts.map(world), points = corners.map(q => project(q.x, q.y, q.z, view, camera))
    return [{
      key: object.objectId + ':' + side, objectId: object.objectId, side, points,
      depth: corners.reduce((sum, q) => sum + dot(q, eye), 0) / 4,
      imageRef: p.faceImages?.[side] ?? null, fill: UNTEXTURED_FACE_COLOR, opacity: object.transparent ? 0.4 : 1,
    }]
  })
}
export function faceMatrix(points) {
  const [a, b, , d] = points
  return [b.x - a.x, b.y - a.y, d.x - a.x, d.y - a.y, a.x, a.y]
}
export function sceneFrame(design, view, camera = design.isometricCamera) {
  const b = closedRoom(design.room) ? roomBounds(design.room) : { x: -500, y: -500, width: 7000, depth: 6000 }
  if (view === 'isometric') {
    const radius = Math.hypot(b.width / 2, b.depth / 2) + 250
    const center = project(b.x + b.width / 2, b.y + b.depth / 2, design.room.heightMm / 2, view, camera)
    const width = 2 * (radius * ISO_SCALE + 650), height = 2 * (Math.hypot(radius, design.room.heightMm / 2) * ISO_SCALE + 650)
    return { x: center.x - width / 2, y: center.y - height / 2, width, height, gridBounds: b }
  }
  const corners = [0, design.room.heightMm].flatMap(z => [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.depth], [b.x, b.y + b.depth]].map(([x, y]) => project(x, y, z, view, camera)))
  const x = Math.min(...corners.map(p => p.x)) - 650, y = Math.min(...corners.map(p => p.y)) - 650
  return { x, y, width: Math.max(...corners.map(p => p.x)) + 650 - x, height: Math.max(...corners.map(p => p.y)) + 650 - y, gridBounds: b }
}
export function viewportTransform(frame, width, height, zoom = 1) {
  const scale = Math.min(width / frame.width, height / frame.height) * zoom
  return { scale, x: (width - frame.width * scale) / 2 - frame.x * scale, y: (height - frame.height * scale) / 2 - frame.y * scale }
}
export function sceneGeometry(design, view, camera = design.isometricCamera, options = {}) {
  const room = design.room, b = roomBounds(room), frame = sceneFrame(design, view, camera)
  const visible = id => design.layers.find(l => l.layerId === id)?.isVisible !== false
  const map = (x, y, z = 0) => project(x, y, z, view, camera)
  const flat = ps => ps.flatMap(p => [p.x, p.y])
  const floor = closedRoom(room) ? flat([[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.depth], [b.x, b.y + b.depth]].map(([x, y]) => map(x, y))) : null
  const grid = []
  if (options.grid !== false && ['top', 'isometric'].includes(view)) {
    const g = frame.gridBounds
    for (let x = g.x; x <= g.x + g.width; x += 500)grid.push(flat([map(x, g.y), map(x, g.y + g.depth)]))
    for (let y = g.y; y <= g.y + g.depth; y += 500)grid.push(flat([map(g.x, y), map(g.x + g.width, y)]))
  }
  const faces = design.objects.filter(o => visible(o.layerId)).flatMap(o => boxFaces(o, view, camera))
  if (visible('room')) for (const wall of room.walls.filter(w => w.isVisible !== false)) {
    const horizontal = wall.startYMm === wall.endYMm, len = Math.hypot(wall.endXMm - wall.startXMm, wall.endYMm - wall.startYMm)
    const cuts = room.openings.filter(o => o.wallId === wall.wallId)
    const xs = [...new Set([0, len, ...cuts.flatMap(o => [o.offsetMm, o.offsetMm + o.widthMm])])].sort((a, b) => a - b)
    const zs = [...new Set([0, room.heightMm, ...cuts.flatMap(o => [o.sillHeightMm, o.sillHeightMm + o.heightMm])])].sort((a, b) => a - b)
    for (let i = 0; i < xs.length - 1; i++)for (let j = 0; j < zs.length - 1; j++) {
      const mid = (xs[i] + xs[i + 1]) / 2, zmid = (zs[j] + zs[j + 1]) / 2
      if (cuts.some(o => mid > o.offsetMm && mid < o.offsetMm + o.widthMm && zmid > o.sillHeightMm && zmid < o.sillHeightMm + o.heightMm)) continue
      const offset = (xs[i] + xs[i + 1]) / 2 / len
      const block = { objectId: `wall:${wall.wallId}:${i}:${j}`, xMm: wall.startXMm + (wall.endXMm - wall.startXMm) * offset, yMm: wall.startYMm + (wall.endYMm - wall.startYMm) * offset, elevationMm: zs[j], rotationDeg: 0, productSnapshot: { widthMm: horizontal ? xs[i + 1] - xs[i] : wall.thicknessMm, depthMm: horizontal ? wall.thicknessMm : xs[i + 1] - xs[i], heightMm: zs[j + 1] - zs[j] } }
      faces.push(...boxFaces(block, view, camera).map(f => ({ ...f, objectId: null, fill: '#a6ad98', opacity: ['top', 'bottom'].includes(view) ? 0.8 : 0.22 })))
    }
  }
  faces.sort((a, b) => a.depth - b.depth)
  const labels = []
  const label = (x, y, value) => { const p = map(x, y); labels.push({ x: p.x, y: p.y, text: value }) }
  if (closedRoom(room) && options.showDimensions !== false) { label(b.x + b.width / 2, b.y + b.depth + 350, formatLength(b.width, design.displayUnit)); label(b.x - 450, b.y + b.depth / 2, formatLength(b.depth, design.displayUnit)) }
  if (options.wallDimensions) for (const w of room.walls) label((w.startXMm + w.endXMm) / 2 + 100, (w.startYMm + w.endYMm) / 2 - 150, formatLength(Math.hypot(w.endXMm - w.startXMm, w.endYMm - w.startYMm), design.displayUnit))
  return { floor, grid, faces, labels, fontSize: Math.max(frame.width, frame.height) / 65 }
}
