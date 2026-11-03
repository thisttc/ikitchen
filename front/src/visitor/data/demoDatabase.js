import records from './products.json' with { type: 'json' }

// Only two local image fixtures. Dimensions/specs are invented for this experiment.
export const categories = [{ categoryId: 'samples', categoryName: 'สินค้าทดลอง' }]
export const products = records.map(p => ({
  ...p, manufacturer: 'ภาพตัวอย่าง', footprintShape: 'rectangle', diameterMm: null,
  dimensionNote: 'ขนาดสมมติสำหรับทดลองวางภาพ', unitPriceSatang: null, unit: 'ชิ้น',
  description: 'ใช้ไฟล์ภาพด้านหน้าและขวา ส่วนด้านอื่นเป็นสีฟ้าอ่อน',
  imageUrl: p.faceImages.front, viewImages: {}, placeholderColor: '#b9ddf4',
  kind: 'product', defaultElevationMm: 0,
  electrical: { required: null, phase: null, voltageV: null, powerKw: null, note: 'ยังไม่ระบุ' },
  plumbing: { requiresWater: null, requiresDrain: null, connections: [], note: 'ยังไม่ระบุ' },
  gas: { required: null, valveSizeInch: null, pressureType: null, inputBtuPerHour: null, pointCount: null, installationNote: 'ยังไม่ระบุ' },
}))
export const snapshotOf = p => structuredClone({ ...p, categoryName: categories.find(c => c.categoryId === p.categoryId)?.categoryName ?? 'ไม่ระบุหมวด' })
export const initialLayers = [
  { layerId: 'equipment', layerName: 'อุปกรณ์', sortOrder: 2, isVisible: true },
  { layerId: 'openings', layerName: 'ประตู / หน้าต่าง', sortOrder: 1, isVisible: true },
  { layerId: 'room', layerName: 'ผนังห้อง', sortOrder: 0, isVisible: true },
]
