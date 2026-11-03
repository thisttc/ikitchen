import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../data/demoDatabase.js'
import { makeObject, makeRoom, newDesign, project, unprojectFloor } from '../utils/scene.js'
import { boxFaces, faceMatrix, sceneFrame, UNTEXTURED_FACE_COLOR, viewportTransform } from '../utils/sceneGeometry.js'
import { parseDesignJSON } from '../utils/importDesign.js'

const design = () => ({ ...newDesign(), room: makeRoom() })
const object = () => makeObject(products[0], makeRoom(), 1500, 1600).object
test('the runtime catalog contains exactly two image-backed products', () => {
  assert.equal(products.length, 2)
  for (const p of products) {
    assert.ok(p.widthMm > 0 && p.depthMm > 0 && p.heightMm > 0); // คาดหวังชื่อรูปครบ 6 ด้าน
    assert.deepEqual(
      Object.keys(p.faceImages).sort(),
      ['back', 'bottom', 'front', 'left', 'right', 'top']
    ); assert.equal(p.visual, undefined)
  }
})
test('front and right show their photographs; other orthographic faces are plain blue', () => {
  const o = object()
  for (const view of ['front', 'right', 'back', 'left', 'top', 'bottom']) {
    const faces = boxFaces(o, view)
    assert.equal(faces.length, 1); assert.equal(faces[0].side, view); assert.equal(faces[0].fill, UNTEXTURED_FACE_COLOR)
    assert.equal(
      faces[0].imageRef,
      o.productSnapshot.faceImages[view] ?? null
    )
  }
})
test('turning the item rotates its actual front texture rather than replacing its photograph', () => {
  const o = { ...object(), rotationDeg: 90 }
  assert.equal(boxFaces(o, 'left')[0].side, 'front')
  assert.equal(boxFaces(o, 'left')[0].imageRef, o.productSnapshot.faceImages.front)
  assert.equal(boxFaces(o, 'front')[0].side, 'right')
})
test('every affine image corner lands on its projected box face while orbiting', () => {
  for (let azimuthDeg = 0; azimuthDeg < 360; azimuthDeg += 15)for (const elevationDeg of [15, 35.264, 70]) for (const rotationDeg of [0, 90, 180, 270]) {
    for (const f of boxFaces({ ...object(), rotationDeg }, 'isometric', { azimuthDeg, elevationDeg })) {
      const [a, b, c, d, e, g] = faceMatrix(f.points)
      for (const [i, u, v] of [[0, 0, 0], [1, 1, 0], [2, 1, 1], [3, 0, 1]]) {
        assert.ok(Math.abs(a * u + c * v + e - f.points[i].x) < 1e-8)
        assert.ok(Math.abs(b * u + d * v + g - f.points[i].y) < 1e-8)
      }
    }
  }
})
test('a drop stays at its physical floor coordinate at different viewport sizes and zooms', () => {
  const d = design()
  for (const view of ['top', 'isometric']) for (const azimuthDeg of [0, 45, 125, 225, 315]) for (const [width, height] of [[640, 480], [1200, 700]]) for (const zoom of [.5, 1, 2]) {
    const camera = { azimuthDeg, elevationDeg: 35 }, frame = sceneFrame(d, view, camera), t = viewportTransform(frame, width, height, zoom)
    const p = project(1800, 2400, 0, view, camera), screen = { x: p.x * t.scale + t.x, y: p.y * t.scale + t.y }
    const floor = unprojectFloor((screen.x - t.x) / t.scale, (screen.y - t.y) / t.scale, view, camera)
    assert.ok(Math.abs(floor.x - 1800) < 1e-7); assert.ok(Math.abs(floor.y - 2400) < 1e-7)
  }
})
test('save/import keeps the two face-image references and safely rejects script URLs', () => {
  const d = design(); d.objects = [object()]
  const loaded = parseDesignJSON(JSON.stringify(d))
  assert.deepEqual(loaded.objects[0].productSnapshot.faceImages, d.objects[0].productSnapshot.faceImages)
  const broken = structuredClone(d); broken.objects[0].productSnapshot.faceImages.front = 'javascript:alert(1)'
  assert.throws(() => parseDesignJSON(JSON.stringify(broken)))
})
