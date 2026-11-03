import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../data/demoDatabase.js'
import { closedRoom, fromInputUnit, makeObject, makeRoom, newDesign, resizeDesignRoom, roomBounds, syncDesign, toInputUnit } from '../utils/scene.js'
import { parseDesignJSON } from '../utils/importDesign.js'
import { summarizeBoq } from '../utils/boq.js'

const sample = () => ({ ...newDesign(), room: makeRoom() })
const add = (d, id, x, y) => { const r = makeObject(products.find(p => p.productId === id), d.room, x, y); assert.ok(r.object, r.error); d.objects.push(r.object); return r.object }
test('new workspace is empty, including walls and openings', () => {
  const d = newDesign(); assert.equal(d.room.walls.length, 0); assert.equal(d.objects.length, 0); assert.equal(closedRoom(d.room), false)
  assert.equal(d.layers.find(l => l.layerId === 'room').layerName, 'ผนังห้อง')
})
test('cm, m and inch round-trip to integer mm without changing geometry', () => {
  for (const u of ['cm', 'm', 'inch']) for (const mm of [50, 120, 1000, 2700, 4200, 15000]) assert.equal(fromInputUnit(toInputUnit(mm, u), u), mm)
  assert.equal(fromInputUnit(420, 'cm'), 4200); assert.equal(fromInputUnit(4.2, 'm'), 4200); assert.equal(fromInputUnit(100, 'inch'), 2540)
})
test('resize preserves IDs, specifications, quantities, hidden walls and opening references', () => {
  const d = sample(); const table = add(d, 'p03', 2000, 2000), door = add(d, 'p10', 2000, 0)
  d.room.walls[1].isVisible = false
  const result = resizeDesignRoom(d, { width: 5000, depth: 4000, height: 3000, thickness: 150 })
  assert.ok(result.design, result.error); const next = result.design
  assert.deepEqual(roomBounds(next.room), { x: 0, y: 0, width: 5000, depth: 4000 })
  assert.deepEqual(next.room.walls.map(w => w.wallId), d.room.walls.map(w => w.wallId)); assert.equal(next.room.walls[1].isVisible, false)
  assert.deepEqual(next.objects[0].productSnapshot, table.productSnapshot); assert.equal(next.objects[0].objectId, table.objectId)
  assert.equal(next.objects[1].wallId, door.wallId); assert.equal(next.room.openings.length, 1)
  assert.equal(summarizeBoq(next.objects).knownTotalSatang, summarizeBoq(d.objects).knownTotalSatang)
})
test('shrinking clamps furniture inside, rejects undersized room atomically', () => {
  const d = sample(); add(d, 'p03', 3500, 3000); const before = JSON.stringify(d)
  const r = resizeDesignRoom(d, { width: 2500, depth: 2500, height: 2700, thickness: 120 })
  assert.ok(r.design); assert.equal(r.movedCount, 1); assert.equal(r.design.objects[0].xMm, 1840); assert.equal(r.design.objects[0].yMm, 2140)
  assert.ok(resizeDesignRoom(d, { width: 1000, depth: 1000, height: 2700, thickness: 120 }).error)
  assert.equal(JSON.stringify(d), before)
})
test('resizing rejects high objects, narrow openings and conflicting openings', () => {
  const high = sample(); const hood = add(high, 'p08', 1200, 1200); hood.elevationMm = 2100
  assert.ok(resizeDesignRoom(high, { width: 4200, depth: 3600, height: 2200, thickness: 120 }).error)
  const narrow = sample(); add(narrow, 'p11', 2000, 0)
  assert.ok(resizeDesignRoom(narrow, { width: 1000, depth: 3600, height: 2700, thickness: 120 }).error)
  const overlap = sample(); add(overlap, 'p10', 2000, 0); add(overlap, 'p10', 3300, 0)
  assert.ok(resizeDesignRoom(overlap, { width: 2500, depth: 3600, height: 2700, thickness: 120 }).error)
})
test('JSON round-trip restores scene, unit, view, per-wall visibility and same BOQ grouping', () => {
  const d = sample(); add(d, 'p01', 1500, 1600); add(d, 'p11', 0, 1800); d.room.walls[2].isVisible = false; d.layers[0].isVisible = false
  d.currentView = 'isometric'; d.displayUnit = 'cm'
  const next = parseDesignJSON(JSON.stringify(syncDesign(d)))
  assert.equal(next.displayUnit, 'cm'); assert.equal(next.currentView, 'isometric'); assert.equal(next.room.walls[2].isVisible, false)
  assert.equal(next.objects.length, 2); assert.equal(next.room.openings.length, 1)
  next.objects.push(makeObject(products[0], next.room, 2500, 2500).object)
  assert.equal(summarizeBoq(next.objects).rows.length, 2); assert.equal(summarizeBoq(next.objects).count, 3)
})
test('old schema 2 imports when walls have no visibility flag', () => {
  const d = sample(); d.room.walls.forEach(w => delete w.isVisible)
  const next = parseDesignJSON(JSON.stringify(d)); assert.ok(next.room.walls.every(w => w.isVisible === true))
  assert.equal(parseDesignJSON(JSON.stringify(newDesign())).room.walls.length, 0)
})
test('bad import never changes original: malformed, IDs, dimensions, wall reference, outside room', () => {
  const original = sample(); add(original, 'p03', 1600, 1600)
  const before = JSON.stringify(original)
  for (const alter of [d => { d.schemaVersion = 99 }, d => d.objects.push(structuredClone(d.objects[0])), d => { d.objects[0].productSnapshot.widthMm = -2 }, d => { d.objects[0].xMm = 99999 }, d => { d.room.walls[1].endXMm += 30 }, d => { d.layers = [] }]) {
    const bad = structuredClone(original); alter(bad); assert.throws(() => parseDesignJSON(JSON.stringify(bad)))
  }
  const opening = sample(); add(opening, 'p10', 2000, 0); opening.objects[0].wallId = 'missing'; assert.throws(() => parseDesignJSON(JSON.stringify(opening)))
  assert.throws(() => parseDesignJSON('{ bad json')); assert.throws(() => parseDesignJSON('x'.repeat(5 * 1024 * 1024 + 1)))
  assert.equal(JSON.stringify(original), before)
})
test('untrusted names and prototype-like units remain text and cannot change object prototypes', () => {
  const d = sample(); add(d, 'p02', 1200, 1200); d.displayUnit = '__proto__'; d.designName = '<script>alert(1)</script>'
  d.objects[0].productSnapshot.gas.pressureType = '__proto__'
  const next = parseDesignJSON(JSON.stringify(d)); assert.equal(next.displayUnit, 'm'); assert.equal(next.designName, d.designName)
  assert.equal(summarizeBoq(next.objects).gas.__proto__, 40000); assert.equal({}.polluted, undefined)
})
