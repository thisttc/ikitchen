// Mock database only. Dimensions: mm; money: satang. All specifications are invented demo data.
export const categories = [
  { categoryId: 'cooking', categoryName: 'อุปกรณ์ปรุงอาหาร' },
  { categoryId: 'storage', categoryName: 'โต๊ะและตู้' },
  { categoryId: 'washing', categoryName: 'อุปกรณ์ล้าง' },
  { categoryId: 'cooling', categoryName: 'เครื่องทำความเย็น' },
  { categoryId: 'ventilation', categoryName: 'ระบบดูดควัน' },
  { categoryId: 'openings', categoryName: 'ประตู / หน้าต่าง' },
]

const none = {
  electrical: { required: false, phase: null, voltageV: null, powerKw: null, note: '' },
  plumbing: { requiresWater: false, requiresDrain: false, connections: [], note: '' },
  gas: { required: false, valveSizeInch: null, pressureType: null, inputBtuPerHour: null, pointCount: 0, installationNote: '' },
}
const product = (productId, productName, categoryId, model, widthMm, depthMm, heightMm, priceBaht, placeholderColor, extra = {}) => ({
  productId, productName, categoryId, manufacturer: 'iKitchen Demo', model,
  widthMm, depthMm, heightMm, footprintShape: 'rectangle', diameterMm: null, dimensionNote: '',
  unitPriceSatang: priceBaht === null ? null : Math.round(priceBaht * 100), unit: 'ชิ้น',
  description: 'สินค้าและสเปกสมมติสำหรับทดสอบระบบเท่านั้น', imageUrl: null, viewImages: {},
  placeholderColor, kind: 'product', defaultElevationMm: 0, ...structuredClone(none), ...extra,
})

export const products = [
  product('p01', 'เตาไฟฟ้า 2 หัว', 'cooking', 'EL-02', 600, 600, 850, 12900, '#b87e66', {
    visual: 'stove', electrical: { required: true, phase: '1', voltageV: 220, powerKw: 3.5, note: 'ค่าจำลอง ไม่ใช่ข้อกำหนดติดตั้ง' },
  }),
  product('p02', 'เตาแก๊ส 2 หัว', 'cooking', 'GS-02', 900, 700, 850, 16800, '#af8c6e', {
    visual: 'stove', gas: { required: true, valveSizeInch: 0.5, pressureType: 'แรงดันต่ำ (จำลอง)', inputBtuPerHour: 40000, pointCount: 1, installationNote: 'ต้องตรวจสอบสเปกจริงก่อนติดตั้ง' },
  }),
  product('p03', 'โต๊ะเตรียมอาหาร', 'storage', 'TB-120', 1200, 600, 850, 8900, '#b6a78e', { visual: 'table' }),
  product('p04', 'ตู้เก็บอุปกรณ์', 'storage', 'CB-080', 800, 600, 850, 12900, '#c9a66f', { visual: 'cabinet' }),
  product('p05', 'ซิงก์ล้าง 1 หลุม', 'washing', 'SK-070', 700, 600, 850, 6900, '#83a8ad', {
    visual: 'sink', plumbing: { requiresWater: true, requiresDrain: true, connections: [
      { type: 'cold', sizeInch: 0.5, pointCount: 1, installationNote: 'ตำแหน่งจุดต่อจำลอง' },
      { type: 'waste', sizeInch: 1.5, pointCount: 1, installationNote: '' },
    ], note: 'ไม่ประมาณอัตราการไหลจากขนาดอ่าง' },
  }),
  product('p06', 'เครื่องล้างจาน', 'washing', 'DW-060', 600, 600, 850, 24900, '#8fa4a0', {
    visual: 'cabinet', electrical: { required: true, phase: '1', voltageV: 220, powerKw: 2.1, note: '' },
    plumbing: { requiresWater: true, requiresDrain: true, connections: [
      { type: 'cold', sizeInch: 0.75, pointCount: 1, installationNote: '' },
      { type: 'waste', sizeInch: 1, pointCount: 1, installationNote: '' },
    ], note: '' },
  }),
  product('p07', 'ตู้เย็น 2 ประตู', 'cooling', 'RF-090', 900, 750, 1800, 32000, '#a3b1b2', {
    visual: 'cabinet', electrical: { required: true, phase: '1', voltageV: 220, powerKw: 0.45, note: 'กำลังไฟป้ายชื่อสมมติ' },
  }),
  product('p08', 'ฮูดดูดควัน', 'ventilation', 'HD-090', 900, 500, 450, 15900, '#89968c', {
    visual: 'hood', defaultElevationMm: 1800,
    electrical: { required: true, phase: '1', voltageV: 220, powerKw: 0.25, note: 'ยังไม่จำลองท่อลม' },
  }),
  product('p09', 'เครื่องอเนกประสงค์ (ข้อมูลไม่ครบ)', 'cooking', 'DEMO-X', 600, 600, 850, null, '#b5a1bb', {
    electrical: { required: true, phase: null, voltageV: null, powerKw: null, note: 'รอข้อมูลผู้ผลิต' },
    plumbing: { requiresWater: null, requiresDrain: null, connections: [], note: 'ยังไม่ระบุ' },
    gas: { required: null, valveSizeInch: null, pressureType: null, inputBtuPerHour: null, pointCount: null, installationNote: 'ยังไม่ระบุ' },
  }),
  product('p10', 'ประตูบานเดี่ยว', 'openings', 'DR-090', 900, 100, 2100, 4500, '#af835f', { kind: 'door', visual: 'door' }),
  product('p11', 'หน้าต่างบานเลื่อน', 'openings', 'WN-120', 1200, 100, 1000, 3900, '#92bac4', { kind: 'window', visual: 'window', defaultElevationMm: 1000 }),
]

export const snapshotOf = (p) => structuredClone({ ...p, categoryName: categories.find(c => c.categoryId === p.categoryId)?.categoryName ?? 'ไม่ระบุหมวด' })
export const initialLayers = [
  { layerId: 'equipment', layerName: 'อุปกรณ์', sortOrder: 2, isVisible: true },
  { layerId: 'openings', layerName: 'ประตู / หน้าต่าง', sortOrder: 1, isVisible: true },
  { layerId: 'room', layerName: 'ห้อง', sortOrder: 0, isVisible: true },
]
