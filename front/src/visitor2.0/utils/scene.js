import { initialLayers, snapshotOf } from '../data/demoDatabase.js'

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const snap = (v, grid = 50) => Math.round(v / grid) * grid
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const views = [['top', 'มุมบน'], ['isometric', 'Isometric'], ['front', 'ด้านหน้า'], ['back', 'ด้านหลัง'], ['left', 'ด้านซ้าย'], ['right', 'ด้านขวา'], ['bottom', 'มุมล่าง']]
export const isEditable = (view) => ['top', 'isometric'].includes(view)
export const project = (x, y, z = 0, view = 'top') => {
  if (view === 'isometric') return { x: (x - y) * Math.sqrt(3) / 2, y: (x + y) / 2 - z }
  if (view === 'front') return { x, y: -z }
  if (view === 'back') return { x: -x, y: -z }
  if (view === 'left') return { x: -y, y: -z }
  if (view === 'right') return { x: y, y: -z }
  if (view === 'bottom') return { x, y: -y }
  return { x, y }
}
export const unprojectFloor = (x, y, view = 'top') => view === 'isometric'
  ? { x: y + x / Math.sqrt(3), y: y - x / Math.sqrt(3) } : { x, y }
export function makeRoom(width = 4200, depth = 3600, height = 2700, x = 0, y = 0, thickness = 120) {
  const points = [[x, y], [x + width, y], [x + width, y + depth], [x, y + depth]]
  return { roomId: uid(), roomName: 'ห้องครัว', roomShape: 'rectangle', heightMm: height, openings: [], walls: points.map((a, i) => ({
    wallId: uid(), startXMm: a[0], startYMm: a[1], endXMm: points[(i + 1) % 4][0], endYMm: points[(i + 1) % 4][1], thicknessMm: thickness,
  })) }
}
export function roomBounds(room) {
  if (!room.walls.length) return { x: 0, y: 0, width: 6000, depth: 5000 }
  const xs = room.walls.flatMap(w => [w.startXMm, w.endXMm]), ys = room.walls.flatMap(w => [w.startYMm, w.endYMm])
  const x = Math.min(...xs), y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, depth: Math.max(...ys) - y }
}
export function closedRoom(room) {
  const w = room.walls
  if (w.length !== 4) return false
  const b = roomBounds(room)
  if (b.width < 1000 || b.depth < 1000) return false
  return w.every((wall, i) => {
    const next = w[(i + 1) % 4]
    const axis = wall.startXMm === wall.endXMm ? 'v' : wall.startYMm === wall.endYMm ? 'h' : null
    const nextAxis = next.startXMm === next.endXMm ? 'v' : 'h'
    return axis && axis !== nextAxis && wall.endXMm === next.startXMm && wall.endYMm === next.startYMm
      && (wall.startXMm !== wall.endXMm || wall.startYMm !== wall.endYMm)
  })
}
export function newDesign() {
  const now = new Date().toISOString()
  return { designId: uid(), designName: 'ครัวของฉัน', schemaVersion: 2, displayUnit: 'm', room: makeRoom(), objects: [], layers: structuredClone(initialLayers), currentView: 'top', createdAt: now, updatedAt: now }
}
export function footprint(obj) {
  const p = obj.productSnapshot, turn = obj.rotationDeg % 180 !== 0
  return { width: turn ? p.depthMm : p.widthMm, depth: turn ? p.widthMm : p.depthMm }
}
export const openingObject = (obj) => ['door', 'window'].includes(obj.productSnapshot.kind)
export function fitObject(obj, room, x = obj.xMm, y = obj.yMm) {
  if (!closedRoom(room)) return { error: 'สร้างห้องสี่เหลี่ยมให้ปิดครบ 4 ด้านก่อนวางสินค้า' }
  const p = obj.productSnapshot, b = roomBounds(room)
  if (![p.widthMm, p.depthMm, p.heightMm].every(v => Number.isFinite(v) && v > 0)) return { error: 'สินค้ายังไม่มีขนาดที่ใช้วางได้' }
  if (obj.elevationMm < 0 || obj.elevationMm + p.heightMm > room.heightMm) return { error: 'วัตถุสูงเกินห้อง ลองลดระดับจากพื้นหรือเพิ่มความสูงห้อง' }
  if (openingObject(obj)) {
    const wall = [...room.walls].sort((a, c) => distanceToWall(x, y, a) - distanceToWall(x, y, c))[0]
    const horizontal = wall.startYMm === wall.endYMm
    const length = Math.hypot(wall.endXMm - wall.startXMm, wall.endYMm - wall.startYMm)
    if (p.widthMm > length) return { error: 'ช่องเปิดกว้างเกินกำแพงด้านนี้' }
    const t = clamp(((x - wall.startXMm) * (wall.endXMm - wall.startXMm) + (y - wall.startYMm) * (wall.endYMm - wall.startYMm)) / length, p.widthMm / 2, length - p.widthMm / 2)
    return { object: { ...obj, wallId: wall.wallId, offsetMm: Math.round(t - p.widthMm / 2), xMm: Math.round(wall.startXMm + (wall.endXMm - wall.startXMm) / length * t), yMm: Math.round(wall.startYMm + (wall.endYMm - wall.startYMm) / length * t), rotationDeg: horizontal ? 0 : 90 } }
  }
  const f = footprint(obj)
  // Room dimensions are measured between wall centre lines; keep furniture inside wall faces.
  const inset = Math.max(...room.walls.map(w => w.thicknessMm)) / 2
  if (f.width > b.width - 2 * inset || f.depth > b.depth - 2 * inset) return { error: 'สินค้ามีขนาดใหญ่กว่าพื้นที่ภายในห้อง' }
  return { object: { ...obj, xMm: Math.round(clamp(x, b.x + inset + f.width / 2, b.x + b.width - inset - f.width / 2)), yMm: Math.round(clamp(y, b.y + inset + f.depth / 2, b.y + b.depth - inset - f.depth / 2)) } }
}
function distanceToWall(x, y, w) {
  const dx = w.endXMm - w.startXMm, dy = w.endYMm - w.startYMm
  const t = clamp(((x - w.startXMm) * dx + (y - w.startYMm) * dy) / (dx * dx + dy * dy), 0, 1)
  return Math.hypot(x - w.startXMm - t * dx, y - w.startYMm - t * dy)
}
export function makeObject(product, room, x, y) {
  return fitObject({ objectId: uid(), productId: product.productId, xMm: x, yMm: y, rotationDeg: 0,
    elevationMm: product.defaultElevationMm ?? 0, layerId: product.kind === 'product' ? 'equipment' : 'openings', productSnapshot: snapshotOf(product) }, room, x, y)
}
export function syncDesign(design) {
  return { ...design, updatedAt: new Date().toISOString(), room: { ...design.room, openings: design.objects.filter(openingObject).map(o => ({
    openingId: o.objectId, type: o.productSnapshot.kind, wallId: o.wallId, offsetMm: o.offsetMm,
    widthMm: o.productSnapshot.widthMm, heightMm: o.productSnapshot.heightMm, sillHeightMm: o.elevationMm, openingDirection: 'unspecified',
  })) } }
}
export function openingConflict(candidate, objects) {
  return !!candidate.wallId && objects.some(o => o.objectId !== candidate.objectId && o.wallId === candidate.wallId
    && candidate.offsetMm < o.offsetMm + o.productSnapshot.widthMm && o.offsetMm < candidate.offsetMm + candidate.productSnapshot.widthMm
    && candidate.elevationMm < o.elevationMm + o.productSnapshot.heightMm && o.elevationMm < candidate.elevationMm + candidate.productSnapshot.heightMm)
}
export function objectOverlaps(objects) {
  const pairs = []
  objects.forEach((a, i) => objects.slice(i + 1).forEach(b => {
    if (openingObject(a) || openingObject(b)) return
    const fa = footprint(a), fb = footprint(b)
    const intersectsZ = a.elevationMm < b.elevationMm + b.productSnapshot.heightMm && b.elevationMm < a.elevationMm + a.productSnapshot.heightMm
    if (intersectsZ && Math.abs(a.xMm - b.xMm) < (fa.width + fb.width) / 2 && Math.abs(a.yMm - b.yMm) < (fa.depth + fb.depth) / 2) pairs.push([a.objectId, b.objectId])
  }))
  return pairs
}

export function appendWall(room, start, end, thickness = 120) {
  const walls = room.walls
  if (walls.length >= 4) return { error: 'ห้องมี 4 ด้านแล้ว' }
  const last = walls.at(-1)
  const a = last ? { x: last.endXMm, y: last.endYMm } : { x: snap(start.x), y: snap(start.y) }
  let b = { x: snap(end.x), y: snap(end.y) }
  if (walls.length === 3) b = { x: walls[0].startXMm, y: walls[0].startYMm }
  else if (walls.length === 2) {
    const firstHorizontal = walls[0].startYMm === walls[0].endYMm
    b = firstHorizontal ? { x: walls[0].startXMm, y: a.y } : { x: a.x, y: walls[0].startYMm }
  } else if (last) {
    b = last.startYMm === last.endYMm ? { x: a.x, y: b.y } : { x: b.x, y: a.y }
  } else if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) b.y = a.y
  else b.x = a.x
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  if (length < 1000 || length > 15000) return { error: 'ความยาวแต่ละด้านต้องอยู่ระหว่าง 1–15 เมตร' }
  return { room: { ...room, walls: [...walls, { wallId: uid(), startXMm: a.x, startYMm: a.y, endXMm: b.x, endYMm: b.y, thicknessMm: thickness }] } }
}
