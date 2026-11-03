import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraDepth, DEFAULT_ISOMETRIC_CAMERA, makeObject, makeRoom, newDesign, normalizeCamera, project, unprojectFloor } from '../utils/scene.js'
import { parseDesignJSON } from '../utils/importDesign.js'
import { summarizeBoq } from '../utils/boq.js'
import { products } from './fixtures/legacyProducts.js'

test('default camera preserves the original isometric projection', () => {
  const p = project(1500, 2300, 850, 'isometric')
  assert.ok(Math.abs(p.x - (1500 - 2300) * Math.sqrt(3) / 2) < 1e-8)
  assert.ok(Math.abs(p.y - ((1500 + 2300) / 2 - 850)) < 1e-8)
})
test('orbit wraps 360 degrees and clamps tilt so floor inverse never becomes singular', () => {
  assert.deepEqual(normalizeCamera({ azimuthDeg: -45, elevationDeg: 0 }), { azimuthDeg: 315, elevationDeg: 15 })
  assert.deepEqual(normalizeCamera({ azimuthDeg: 765, elevationDeg: 90 }), { azimuthDeg: 45, elevationDeg: 70 })
  assert.deepEqual(normalizeCamera({ azimuthDeg: NaN, elevationDeg: 'bad' }), DEFAULT_ISOMETRIC_CAMERA)
  assert.deepEqual(normalizeCamera(null), DEFAULT_ISOMETRIC_CAMERA)
})
test('screen-to-floor coordinates stay correct at every orbit direction and tilt', () => {
  for (let a = 0; a < 360; a += 10) for (const e of [15, 25, 35.264, 50, 70]) {
    const camera = { azimuthDeg: a, elevationDeg: e }
    for (const [x, y] of [[0, 0], [-1500, 2100], [4200, 3600], [15000, 15000]]) {
      const p = project(x, y, 0, 'isometric', camera), q = unprojectFloor(p.x, p.y, 'isometric', camera)
      assert.ok(Math.abs(q.x - x) < 1e-8); assert.ok(Math.abs(q.y - y) < 1e-8)
    }
  }
})
test('opposite camera direction reverses front/back depth order', () => {
  const near45 = cameraDepth(3000, 3000, 0, { azimuthDeg: 45, elevationDeg: 35 })
  const far45 = cameraDepth(1000, 1000, 0, { azimuthDeg: 45, elevationDeg: 35 })
  const near225 = cameraDepth(3000, 3000, 0, { azimuthDeg: 225, elevationDeg: 35 })
  const far225 = cameraDepth(1000, 1000, 0, { azimuthDeg: 225, elevationDeg: 35 })
  assert.ok(near45 > far45); assert.ok(near225 < far225)
})
test('orbit does not move/rotate products, edit walls or change BOQ', () => {
  const d = { ...newDesign(), room: makeRoom() }
  d.objects = [makeObject(products[0], d.room, 1300, 1600).object]
  const before = JSON.stringify(d), total = summarizeBoq(d.objects).knownTotalSatang
  for (let a = 0; a < 720; a += 45) {
    project(d.objects[0].xMm, d.objects[0].yMm, 850, 'isometric', { azimuthDeg: a, elevationDeg: 45 })
    assert.equal(summarizeBoq(d.objects).knownTotalSatang, total)
  }
  assert.equal(JSON.stringify(d), before)
})
test('JSON restores orbit, defaults for older files, and safely normalizes invalid camera values', () => {
  const d = newDesign(); d.isometricCamera = { azimuthDeg: 225, elevationDeg: 50 }
  assert.deepEqual(parseDesignJSON(JSON.stringify(d)).isometricCamera, d.isometricCamera)
  delete d.isometricCamera
  assert.deepEqual(parseDesignJSON(JSON.stringify(d)).isometricCamera, DEFAULT_ISOMETRIC_CAMERA)
  d.isometricCamera = { azimuthDeg: -90, elevationDeg: 300 }
  assert.deepEqual(parseDesignJSON(JSON.stringify(d)).isometricCamera, { azimuthDeg: 270, elevationDeg: 70 })
})
