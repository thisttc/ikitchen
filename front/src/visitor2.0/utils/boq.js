export const waterTypes = { cold: 'น้ำเย็น', hot: 'น้ำร้อน', waste: 'น้ำทิ้ง', trench: 'รางระบายน้ำ' }
export const money = (satang) => satang == null ? 'ไม่ระบุ' : (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const statusText = (v) => v === true ? 'ใช้' : v === false ? 'ไม่ใช้' : 'ไม่ระบุ'
export function dataWarnings(p) {
  const issues = [], e = p.electrical ?? {}, w = p.plumbing ?? {}, g = p.gas ?? {}
  if (p.unitPriceSatang == null) issues.push('ราคาไม่ระบุ')
  if (e.required == null || (e.required && [e.phase, e.voltageV, e.powerKw].some(v => v == null))) issues.push('สเปกไฟฟ้าไม่ครบ')
  if (w.requiresWater == null || w.requiresDrain == null || (w.connections ?? []).some(c => c.sizeInch == null || c.pointCount == null)
    || (w.requiresWater && !(w.connections ?? []).some(c => ['cold', 'hot'].includes(c.type)))
    || (w.requiresDrain && !(w.connections ?? []).some(c => ['waste', 'trench'].includes(c.type)))) issues.push('สเปกน้ำไม่ครบ')
  if (g.required == null || (g.required && [g.valveSizeInch, g.pressureType, g.inputBtuPerHour, g.pointCount].some(v => v == null))) issues.push('สเปกแก๊สไม่ครบ')
  return issues
}
function stable(v) {
  if (Array.isArray(v)) return v.map(stable)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])]))
  return v
}
export function createBoqRows(objects) {
  const rows = new Map()
  for (const obj of objects) {
    const p = obj.productSnapshot
    const key = JSON.stringify(stable({ productId: p.productId, categoryName: p.categoryName, model: p.model, manufacturer: p.manufacturer,
      productName: p.productName, widthMm: p.widthMm, depthMm: p.depthMm, heightMm: p.heightMm, dimensionNote: p.dimensionNote,
      unitPriceSatang: p.unitPriceSatang, unit: p.unit, electrical: p.electrical, plumbing: p.plumbing, gas: p.gas }))
    if (!rows.has(key)) rows.set(key, { ...structuredClone(p), quantity: 0, objectIds: [], warnings: dataWarnings(p) })
    const row = rows.get(key)
    row.quantity++; row.objectIds.push(obj.objectId)
  }
  return [...rows.values()].map(r => ({ ...r, totalSatang: r.unitPriceSatang == null ? null : r.quantity * r.unitPriceSatang }))
    .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '', 'th') || a.model.localeCompare(b.model))
}
export function summarizeBoq(objects) {
  const rows = createBoqRows(objects), electrical = {}, water = {}, gas = {}
  for (const r of rows) {
    const e = r.electrical ?? {}, p = r.plumbing ?? {}, g = r.gas ?? {}
    if (e.required && e.powerKw != null) {
      const key = `${e.phase ?? 'ไม่ระบุ'} เฟส / ${e.voltageV ?? 'ไม่ระบุ'} V`
      electrical[key] = (electrical[key] ?? 0) + e.powerKw * r.quantity
    }
    for (const c of p.connections ?? []) {
      if (c.pointCount == null) continue
      const key = `${waterTypes[c.type] ?? c.type} / ${c.sizeInch ?? 'ไม่ระบุ'} นิ้ว`
      water[key] = (water[key] ?? 0) + c.pointCount * r.quantity
    }
    if (g.required && g.inputBtuPerHour != null) {
      const key = g.pressureType ?? 'ไม่ระบุแรงดัน'
      gas[key] = (gas[key] ?? 0) + g.inputBtuPerHour * r.quantity
    }
  }
  return { rows, count: objects.length, knownTotalSatang: rows.reduce((s, r) => s + (r.totalSatang ?? 0), 0),
    missingPriceCount: rows.filter(r => r.unitPriceSatang == null).reduce((s, r) => s + r.quantity, 0),
    incompleteCount: rows.filter(r => r.warnings.length).reduce((s, r) => s + r.quantity, 0), electrical, water, gas }
}
