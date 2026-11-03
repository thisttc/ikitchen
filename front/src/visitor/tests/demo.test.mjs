import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from './fixtures/legacyProducts.js'
import { appendWall, closedRoom, fitObject, footprint, makeObject, makeRoom, newDesign, project, roomBounds, syncDesign, unprojectFloor } from '../utils/scene.js'
const sampleDesign = () => ({ ...newDesign(), room: makeRoom() })

import { summarizeBoq } from '../utils/boq.js'
import { buildBoqWorkbook } from '../utils/exportDesignBoq.js'

test('top/isometric project and inverse preserve real mm coordinates', () => {
  for (const view of ['top', 'isometric']) for (const [x, y] of [[0, 0], [1200, 3400], [-100, 200], [15000, 12500]]) {
    const p = project(x, y, 0, view), q = unprojectFloor(p.x, p.y, view)
    assert.ok(Math.abs(x - q.x) < 1e-8); assert.ok(Math.abs(y - q.y) < 1e-8)
  }
})
test('rectangle floor requires a connected closed loop of four perpendicular walls', () => {
  const room = makeRoom(); assert.equal(closedRoom(room), true)
  assert.equal(closedRoom({ ...room, walls: room.walls.slice(0, 3) }), false)
  const broken = structuredClone(room); broken.walls[2].endXMm += 200
  assert.equal(closedRoom(broken), false)
})
test('wall-by-wall drawing snaps 90 degrees and closes a rectangle', () => {
  let room = { ...makeRoom(), walls: [] }
  for (const [start, end] of [[{x:0,y:0},{x:4200,y:10}], [{x:4200,y:0},{x:4100,y:3600}], [{x:4200,y:3600},{x:100,y:3600}], [{x:0,y:3600},{x:0,y:0}]]) {
    const result = appendWall(room, start, end); assert.ok(result.room, result.error); room = result.room
  }
  assert.equal(closedRoom(room), true); assert.deepEqual(roomBounds(room), { x: 0, y: 0, width: 4200, depth: 3600 })
  assert.ok(appendWall(room, {x:0,y:0}, {x:10,y:0}).error)
})
test('distinct object IDs, bounds, quarter-turn footprint and height rejection', () => {
  const room = makeRoom(), p = products.find(p => p.productId === 'p03')
  const a = makeObject(p, room, -500, 9999).object, b = makeObject(p, room, 1500, 1500).object
  assert.notEqual(a.objectId, b.objectId); assert.equal(a.xMm, 660); assert.equal(a.yMm, 3240)
  assert.deepEqual(footprint({ ...a, rotationDeg: 90 }), { width: 600, depth: 1200 })
  assert.ok(fitObject({ ...a, elevationMm: 2500 }, room).error)
  assert.ok(makeObject(p, { ...room, walls: [] }, 0, 0).error)
})
test('openings snap to a wall and synchronize into room.openings', () => {
  const d = sampleDesign(), p = products.find(p => p.kind === 'window')
  const o = makeObject(p, d.room, 10, 1800).object
  assert.equal(o.rotationDeg, 90); assert.equal(o.xMm, 0); assert.ok(o.wallId)
  const next = syncDesign({ ...d, objects: [o] })
  assert.equal(next.room.openings[0].sillHeightMm, 1000)
  assert.equal(syncDesign({ ...next, objects: [] }).room.openings.length, 0)
})
test('BOQ counts instances, ignores view/rotation/visibility, separates edited specs', () => {
  const d = sampleDesign(), p = products[0]
  const a = makeObject(p, d.room, 1000, 1000).object, b = makeObject(p, d.room, 2000, 2000).object
  b.rotationDeg = 90
  const s = summarizeBoq([a, b]); assert.equal(s.rows.length, 1); assert.equal(s.count, 2)
  assert.equal(s.knownTotalSatang, 2580000); assert.equal(s.electrical['1 เฟส / 220 V'], 7)
  b.productSnapshot.widthMm = 650; assert.equal(summarizeBoq([a, b]).rows.length, 2)
  assert.equal(summarizeBoq([a]).knownTotalSatang, 1290000)
  const hidden = { ...d, objects: [a, b], layers: d.layers.map(l => ({ ...l, isVisible: false })) }
  assert.equal(summarizeBoq(hidden.objects).count, 2)
})
test('unknown price and utilities are not silently treated as complete zero values', () => {
  const d = sampleDesign(), p = products.find(p => p.productId === 'p09'), o = makeObject(p, d.room, 1000, 1000).object
  const s = summarizeBoq([o]); assert.equal(s.missingPriceCount, 1); assert.equal(s.incompleteCount, 1); assert.equal(s.rows[0].totalSatang, null)
  assert.equal(s.rows[0].warnings.length, 4)
})
test('water connections aggregate by type and pipe size, gas by pressure type', () => {
  const d = sampleDesign(), objs = ['p05', 'p05', 'p06', 'p02'].map(id => makeObject(products.find(p => p.productId === id), d.room, 1500, 1500).object)
  const s = summarizeBoq(objs)
  assert.equal(s.water['น้ำเย็น / 0.5 นิ้ว'], 2); assert.equal(s.water['น้ำเย็น / 0.75 นิ้ว'], 1); assert.equal(s.water['น้ำทิ้ง / 1.5 นิ้ว'], 2)
  assert.equal(s.gas['แรงดันต่ำ (จำลอง)'], 40000)
})
test('Excel has two sheets, correct cached totals, formulas, and unknown price markers', async () => {
  const d = sampleDesign(); d.designName = '=not a formula'
  d.objects = ['p01', 'p01', 'p05', 'p09'].map(id => makeObject(products.find(p => p.productId === id), d.room, 1500, 1500).object)
  const wb = await buildBoqWorkbook(d), data = await wb.xlsx.writeBuffer()
  assert.ok(data.byteLength > 5000)
  const { default: ExcelJS } = await import('exceljs'); const loaded = new ExcelJS.Workbook(); await loaded.xlsx.load(data)
  assert.equal(loaded.worksheets.length, 2)
  const sheet = loaded.getWorksheet('BOQ'), final = sheet.getCell(`L${sheet.rowCount}`)
  assert.equal(final.result, 32700); assert.ok(final.formula)
  let missing = false; sheet.eachRow(r => { if (r.getCell(5).value === 'DEMO-X') { assert.equal(r.getCell(12).value, 'ไม่ระบุ'); missing = true } })
  assert.equal(missing, true)
  assert.ok(loaded.getWorksheet('ไฟ-น้ำ-แก๊ส').rowCount > 12)
})
test('empty BOQ still exports a valid workbook with zero known total', async () => {
  const wb = await buildBoqWorkbook(newDesign()), s = wb.getWorksheet('BOQ')
  assert.equal(s.getCell(`L${s.rowCount}`).result, 0)
})
