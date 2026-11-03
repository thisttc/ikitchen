import { closedRoom, emptyRoom, fitObject, newDesign, normalizeCamera, openingConflict, openingObject, syncDesign, units, views } from './scene.js'

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const fail = message => { throw new Error(message) }
const text = (v, label, max = 160) => typeof v === 'string' && v.trim() && v.length <= max ? v : fail(`${label} ไม่ถูกต้อง`)
const num = (v, label, min, max, integer = false) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v)) ? v : fail(`${label} ไม่ถูกต้อง`)
const nullable = (v, label, min = 0, max = 1000000000) => v == null ? null : num(v, label, min, max)
const bool = (v, label, fallback) => v === undefined && fallback !== undefined ? fallback : typeof v === 'boolean' ? v : fail(`${label} ต้องเป็นสถานะเปิด/ปิด`)
const tri = (v, label) => v == null ? null : bool(v, label)
const note = v => v == null ? '' : typeof v === 'string' && v.length <= 2000 ? v : fail('หมายเหตุไม่ถูกต้อง')
const imagePath = v => {
  if (v == null) return null
  if (typeof v !== 'string' || v.length > 2048) fail('ที่อยู่ภาพไม่ถูกต้อง')
  try { if (!['http:', 'https:'].includes(new URL(v, 'https://ikitchen.invalid/').protocol)) fail('ที่อยู่ภาพไม่รองรับ') } catch { fail('ที่อยู่ภาพไม่ถูกต้อง') }
  return v
}

function snapshot(raw, productId) {
  if (!plain(raw)) fail('ไม่พบข้อมูลสินค้าในวัตถุ')
  const e = raw.electrical ?? {}, p = raw.plumbing ?? {}, g = raw.gas ?? {}
  if (![e, p, g].every(plain)) fail('สเปกสินค้าไม่ถูกต้อง')
  if (raw.productId !== undefined && raw.productId !== productId) fail('รหัสสินค้าไม่ตรงกับข้อมูลที่บันทึก')
  const kind = raw.kind ?? 'product'
  if (!['product', 'door', 'window'].includes(kind)) fail('ประเภทวัตถุไม่รองรับ')
  if (raw.footprintShape !== 'rectangle') fail('รุ่นนี้รองรับวัตถุฐานสี่เหลี่ยมเท่านั้น')
  const connections = p.connections ?? []
  if (!Array.isArray(connections) || connections.length > 20) fail('จุดต่อประปาไม่ถูกต้อง')
  const color = typeof raw.placeholderColor === 'string' && /^#[0-9a-f]{6}$/i.test(raw.placeholderColor) ? raw.placeholderColor : '#a4b39b'
  const price = raw.unitPriceSatang == null ? null : num(raw.unitPriceSatang, 'ราคา', 0, 100000000000, true)
  // Whitelist fields: never spread untrusted JSON into application objects or render arbitrary SVG/HTML.
  return { productId, productName: text(raw.productName, 'ชื่อสินค้า'), categoryId: text(raw.categoryId, 'หมวดสินค้า'), categoryName: text(raw.categoryName, 'ชื่อหมวดสินค้า'),
    manufacturer: text(raw.manufacturer, 'ผู้ผลิต'), model: text(raw.model, 'รุ่น'), kind, footprintShape: 'rectangle', diameterMm: null,
    widthMm: num(raw.widthMm, 'กว้างสินค้า', 1, 15000, true), depthMm: num(raw.depthMm, 'ลึกสินค้า', 1, 15000, true), heightMm: num(raw.heightMm, 'สูงสินค้า', 1, 6000, true),
    unitPriceSatang: price, unit: text(raw.unit, 'หน่วยนับ', 40), dimensionNote: note(raw.dimensionNote), description: note(raw.description),
    placeholderColor: color, imageUrl: imagePath(raw.imageUrl), viewImages: Object.fromEntries(views.filter(([id]) => raw.viewImages?.[id] != null).map(([id]) => [id, imagePath(raw.viewImages[id])])), visual: ['stove', 'sink', 'cabinet', 'table', 'hood', 'door', 'window'].includes(raw.visual) ? raw.visual : 'cabinet',
    electrical: { required: tri(e.required, 'การใช้ไฟ'), phase: e.phase == null ? null : String(num(Number(e.phase), 'เฟส', 1, 3, true)), voltageV: nullable(e.voltageV, 'แรงดันไฟ'), powerKw: nullable(e.powerKw, 'กำลังไฟ'), note: note(e.note) },
    plumbing: { requiresWater: tri(p.requiresWater, 'น้ำเข้า'), requiresDrain: tri(p.requiresDrain, 'น้ำทิ้ง'), connections: connections.map(c => {
      if (!plain(c) || !['cold', 'hot', 'waste', 'trench'].includes(c.type)) fail('ชนิดจุดต่อน้ำไม่รองรับ')
      return { type: c.type, sizeInch: nullable(c.sizeInch, 'ขนาดท่อ', .01, 100), pointCount: c.pointCount == null ? null : num(c.pointCount, 'จำนวนจุดน้ำ', 0, 1000, true), installationNote: note(c.installationNote) }
    }), note: note(p.note) },
    gas: { required: tri(g.required, 'การใช้แก๊ส'), valveSizeInch: nullable(g.valveSizeInch, 'ขนาดวาล์ว', .01, 100), pressureType: g.pressureType == null ? null : text(g.pressureType, 'ชนิดแรงดัน'), inputBtuPerHour: nullable(g.inputBtuPerHour, 'กำลังแก๊ส'), pointCount: g.pointCount == null ? null : num(g.pointCount, 'จุดแก๊ส', 0, 1000, true), installationNote: note(g.installationNote) },
  }
}

export function parseDesignJSON(source) {
  if (typeof source !== 'string' || new TextEncoder().encode(source).byteLength > MAX_IMPORT_BYTES) fail('ไฟล์ JSON ต้องมีขนาดไม่เกิน 5 MB')
  let raw
  try { raw = JSON.parse(source) } catch { fail('อ่าน JSON ไม่สำเร็จ กรุณาเลือกไฟล์งานออกแบบที่ถูกต้อง') }
  if (!plain(raw) || raw.schemaVersion !== 2) fail('ไม่รองรับโครงสร้างไฟล์นี้ ต้องเป็นงาน iKitchen schemaVersion 2')
  if (!plain(raw.room) || !Array.isArray(raw.room.walls) || raw.room.walls.length > 4) fail('ข้อมูลผนังห้องไม่ถูกต้อง')
  if (!Array.isArray(raw.objects) || raw.objects.length > 500 || !Array.isArray(raw.layers) || raw.layers.length > 20) fail('รายการวัตถุหรือ Layers ไม่ถูกต้อง')
  const base = newDesign(), ids = new Set()
  const id = (v, label) => { const key = text(v, label, 120); if (ids.has(key)) fail(`${label} ซ้ำ`); ids.add(key); return key }
  const room = { ...emptyRoom(), roomId: text(raw.room.roomId, 'รหัสห้อง', 120), roomName: text(raw.room.roomName ?? 'ห้องครัว', 'ชื่อห้อง'), roomShape: 'rectangle', heightMm: num(raw.room.heightMm, 'ความสูงห้อง', 2200, 6000, true), walls: raw.room.walls.map(w => {
    if (!plain(w)) fail('ผนังไม่ถูกต้อง')
    return { wallId: id(w.wallId, 'รหัสผนัง'), startXMm: num(w.startXMm, 'X ผนัง', -100000, 100000), startYMm: num(w.startYMm, 'Y ผนัง', -100000, 100000), endXMm: num(w.endXMm, 'X ผนัง', -100000, 100000), endYMm: num(w.endYMm, 'Y ผนัง', -100000, 100000), thicknessMm: num(w.thicknessMm, 'ความหนาผนัง', 50, 500, true), isVisible: bool(w.isVisible, 'แสดงผนัง', true) }
  }) }
  const wallIds = new Set(room.walls.map(w => w.wallId))
  room.walls.forEach((w, i) => {
    const len = Math.hypot(w.endXMm - w.startXMm, w.endYMm - w.startYMm)
    if (len < 1000 || len > 15000 || (w.startXMm !== w.endXMm && w.startYMm !== w.endYMm)) fail('รองรับผนังตรงตั้งฉาก ยาว 1–15 เมตร')
    if (i && (room.walls[i - 1].endXMm !== w.startXMm || room.walls[i - 1].endYMm !== w.startYMm)) fail('ผนังห้องต้องต่อเนื่องกัน')
  })
  if (room.walls.length === 4 && !closedRoom(room)) fail('ผนังห้องต้องเป็นสี่เหลี่ยมปิดครบ 4 ด้าน')
  const layerIds = new Set()
  const layers = raw.layers.map((l, i) => {
    if (!plain(l)) fail('Layer ไม่ถูกต้อง')
    const key = text(l.layerId, 'รหัส Layer', 120)
    if (layerIds.has(key)) fail('รหัส Layer ซ้ำ')
    layerIds.add(key)
    return { layerId: key, layerName: key === 'room' ? 'ผนังห้อง' : text(l.layerName, 'ชื่อ Layer'), sortOrder: num(l.sortOrder ?? i, 'ลำดับ Layer', 0, 100, true), isVisible: bool(l.isVisible, 'แสดง Layer') }
  })
  if (!['room', 'equipment', 'openings'].every(id => layerIds.has(id))) fail('ไฟล์ต้องมี Layer ผนังห้อง อุปกรณ์ และช่องเปิด')
  const objects = []
  for (const o of raw.objects) {
    if (!plain(o)) fail('ข้อมูลวัตถุไม่ถูกต้อง')
    const productId = text(o.productId, 'รหัสสินค้า', 120)
    if (!layerIds.has(o.layerId)) fail('วัตถุอ้างอิง Layer ที่ไม่พบ')
    const rotation = num(o.rotationDeg, 'มุมหมุน', 0, 270, true)
    if (rotation % 90 !== 0) fail('มุมหมุนต้องเป็น 0, 90, 180 หรือ 270 องศา')
    const object = { objectId: id(o.objectId, 'รหัสวัตถุ'), productId, layerId: o.layerId, productSnapshot: snapshot(o.productSnapshot, productId), xMm: num(o.xMm, 'X วัตถุ', -100000, 100000), yMm: num(o.yMm, 'Y วัตถุ', -100000, 100000), elevationMm: num(o.elevationMm, 'ระดับวัตถุ', 0, 6000, true), rotationDeg: rotation, transparent: bool(o.transparent, 'โปร่งใส', false) }
    if (openingObject(object)) {
      if (!wallIds.has(o.wallId)) fail('ช่องเปิดอ้างอิงผนังที่ไม่พบ')
      object.wallId = o.wallId; object.offsetMm = num(o.offsetMm, 'ระยะช่องเปิด', 0, 15000)
    }
    const fitted = fitObject(object, room)
    if (fitted.error || fitted.object.xMm !== object.xMm || fitted.object.yMm !== object.yMm) fail('วัตถุอยู่นอกขอบเขตห้องหรือมีขนาดไม่สอดคล้องกับห้อง')
    if (openingObject(object) && (fitted.object.wallId !== object.wallId || fitted.object.offsetMm !== object.offsetMm || fitted.object.rotationDeg !== rotation)) fail('ตำแหน่งช่องเปิดไม่ตรงกับผนังที่อ้างอิง')
    if (openingConflict(object, objects)) fail('ช่องเปิดในไฟล์ซ้อนกัน')
    objects.push(object)
  }
  const currentView = views.some(([id]) => id === raw.currentView) ? raw.currentView : 'top'
  const displayUnit = typeof raw.displayUnit === 'string' && Object.hasOwn(units, raw.displayUnit) ? raw.displayUnit : 'm'
  const isometricCamera = normalizeCamera(raw.isometricCamera)
  return syncDesign({ ...base, designId: text(raw.designId, 'รหัสงาน', 120), designName: text(raw.designName, 'ชื่อโครงการ', 80), room, objects, layers, currentView, displayUnit, isometricCamera,
    createdAt: typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : base.createdAt })
}
