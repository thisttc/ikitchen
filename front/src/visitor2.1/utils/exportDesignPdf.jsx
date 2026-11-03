import { renderToStaticMarkup } from 'react-dom/server'
import { SceneSvg } from '../components/editor/SceneDrawing.jsx'
import { closedRoom, formatLength, normalizeCamera, roomBounds, toInputUnit, units } from './scene.js'
import { summarizeBoq } from './boq.js'
import reportFontUrl from '../assets/fonts/NotoSansThai-Regular.ttf?url'

const W = 1240, H = 1754, M = 76, FONT = 'iKitchenReport'
let fontReady
async function loadFont() {
  fontReady ??= (async () => { const font = new FontFace(FONT, 'url("' + reportFontUrl + '")'); await font.load(); document.fonts.add(font) })().catch(e => { fontReady = null; throw e })
  return fontReady
}
function canvas() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c }
function lines(ctx, value, width) {
  const out = []; let line = ''
  for (const ch of String(value ?? '')) {
    if (ch === '\n') { out.push(line); line = ''; continue }
    if (line && ctx.measureText(line + ch).width > width) { out.push(line); line = ch } else line += ch
  }
  out.push(line); return out
}
function write(ctx, text, x, y, width, size = 22, color = '#35412e') {
  ctx.fillStyle = color; ctx.font = size + 'px "' + FONT + '"'; ctx.textBaseline = 'top'
  const rows = lines(ctx, text, width), gap = Math.ceil(size * 1.6)
  rows.forEach((row, i) => ctx.fillText(row, x, y + i * gap)); return rows.length * gap
}
async function sceneImage(design, view) {
  const source = renderToStaticMarkup(<SceneSvg design={design} view={view} />)
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))
  try { return await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('อ่านภาพห้องไม่สำเร็จ')); image.src = url }) }
  finally { URL.revokeObjectURL(url) }
}

// Canvas text uses the bundled Thai font and browser shaping, avoiding missing Thai marks in PDF.
// Text becomes rasterized; this report is for visual review, not an editable/searchable CAD document.
export async function buildDesignPdf(design) {
  if (!closedRoom(design.room)) throw new Error('สร้างห้องให้ครบก่อนส่งออก PDF')
  await loadFont()
  const [{ jsPDF }, top, iso] = await Promise.all([import('jspdf'), sceneImage(design, 'top'), sceneImage(design, 'isometric')])
  const date = new Date().toLocaleString('th-TH'), summary = summarizeBoq(design.objects), b = roomBounds(design.room)
  const pages = []
  function page(title) {
    const c = canvas(), ctx = c.getContext('2d')
    if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas')
    ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#4f6147'; ctx.fillRect(0, 0, W, 16)
    write(ctx, 'iKitchen / สรุปงานออกแบบ', M, 55, W - 2 * M, 27)
    const titleHeight = write(ctx, design.designName.trim() || 'ครัวของฉัน', M, 116, W - 2 * M, 35)
    const y = 116 + titleHeight + 16
    write(ctx, title, M, y, W - 2 * M, 24, '#748367')
    pages.push(c); return { c, ctx, y: y + 58 }
  }
  const first = page('แบบห้อง / มุมบนและ Isometric'), ctx = first.ctx
  let y = first.y
  y += write(ctx, 'ห้อง: ' + formatLength(b.width, design.displayUnit) + ' × ' + formatLength(b.depth, design.displayUnit) + ' | สูง ' + formatLength(design.room.heightMm, design.displayUnit) + ' | วัตถุ ' + summary.count + ' ชิ้น', M, y, W - 2 * M, 23) + 12
  const camera = normalizeCamera(design.isometricCamera)
  for (const [image, label] of [[top, 'มุมบน / TOP'], [iso, 'มุม Isometric / ทิศ ' + Math.round(camera.azimuthDeg) + '° / มุมก้ม ' + Math.round(camera.elevationDeg) + '°']]) {
    y += write(ctx, label, M, y, W - 2 * M, 23) + 8
    const areaH = 455, areaW = W - 2 * M
    ctx.fillStyle = '#faf8f2'; ctx.fillRect(M, y, areaW, areaH)
    const scale = Math.min(areaW / image.width, areaH / image.height)
    ctx.drawImage(image, M + (areaW - image.width * scale) / 2, y + (areaH - image.height * scale) / 2, image.width * scale, image.height * scale)
    y += areaH + 20
  }
  const shownWalls = design.layers.find(l => l.layerId === 'room')?.isVisible === false ? 0 : design.room.walls.filter(w => w.isVisible !== false).length
  y += write(ctx, 'ภาพใช้สถานะการแสดงผลปัจจุบัน: ผนัง ' + shownWalls + '/' + design.room.walls.length + ' ด้าน', M, y, W - 2 * M, 21, '#738168')
  write(ctx, 'รายการสินค้านับทุกชิ้น รวม Layer ที่ซ่อน / ภาพไม่ใช่แบบก่อสร้างตามมาตราส่วน', M, y + 8, W - 2 * M, 20, '#738168')

  let table = page('รายการอุปกรณ์และช่องเปิด / แยกหมวดหมู่และรุ่น'), ty = table.y
  const widths = [76, 340, 258, 250, 164], xs = [M]
  widths.slice(0, -1).forEach(w => xs.push(xs.at(-1) + w))
  function tableHeader() {
    table.ctx.fillStyle = '#4f6147'; table.ctx.fillRect(M, ty, W - 2 * M, 76)
    ;['ลำดับ', 'รายการ / รุ่น', 'ผู้ผลิต', 'กว้าง × ลึก × สูง\n(' + units[design.displayUnit].short + ')', 'จำนวน'].forEach((label, i) => write(table.ctx, label, xs[i] + 10, ty + 8, widths[i] - 18, 20, '#fffefa'))
    ty += 76
  }
  function nextTablePage() { table = page('รายการอุปกรณ์และช่องเปิด / ต่อ'); ty = table.y; tableHeader() }
  tableHeader()
  let lastCategory = null
  if (!summary.rows.length) { write(table.ctx, 'ยังไม่มีสินค้าในห้อง', M + 12, ty + 24, W - 2 * M, 23); ty += 90 }
  summary.rows.forEach((r, i) => {
    const cells = [String(i + 1), r.productName + '\n' + r.model, r.manufacturer, [r.widthMm, r.depthMm, r.heightMm].map(v => toInputUnit(v, design.displayUnit)).join(' × '), r.quantity + ' ' + r.unit]
    table.ctx.font = '20px "' + FONT + '"'
    const rh = Math.max(...cells.map((v, j) => lines(table.ctx, v, widths[j] - 20).length)) * 32 + 18
    const categoryHeight = lines(table.ctx, r.categoryName, W - 2 * M - 24).length * 36 + 12
    const categoryChanged = lastCategory !== r.categoryName
    if (ty + rh + (categoryChanged ? categoryHeight : 0) > H - 230) { nextTablePage(); lastCategory = null }
    if (lastCategory !== r.categoryName) {
      table.ctx.fillStyle = '#e9eee1'; table.ctx.fillRect(M, ty, W - 2 * M, categoryHeight)
      write(table.ctx, r.categoryName, M + 12, ty + 6, W - 2 * M - 24, 22); ty += categoryHeight; lastCategory = r.categoryName
    }
    cells.forEach((v, j) => write(table.ctx, v, xs[j] + 10, ty + 8, widths[j] - 20, 20))
    ty += rh; table.ctx.strokeStyle = '#dce2d3'; table.ctx.beginPath(); table.ctx.moveTo(M, ty); table.ctx.lineTo(W - M, ty); table.ctx.stroke()
  })
  if (ty > H - 240) nextTablePage()
  write(table.ctx, 'รวม ' + summary.count + ' ชิ้น / ' + summary.rows.length + ' รายการตามรุ่นและสเปก\nข้อมูลสินค้าและแบบเป็นข้อมูลจำลอง ไม่ใช่เอกสารรับรองงานติดตั้ง\nราคาและสเปกไฟ-น้ำ-แก๊ส ดูเพิ่มเติมในไฟล์ BOQ Excel', M, ty + 20, W - 2 * M, 20, '#738168')

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  pages.forEach((c, i) => {
    const ctx = c.getContext('2d')
    ctx.strokeStyle = '#dce2d3'; ctx.beginPath(); ctx.moveTo(M, H - 104); ctx.lineTo(W - M, H - 104); ctx.stroke()
    write(ctx, date, M, H - 82, 850, 18, '#849078')
    write(ctx, 'หน้า ' + (i + 1) + ' / ' + pages.length, W - M - 150, H - 82, 160, 18, '#849078')
    if (i) doc.addPage()
    doc.addImage(c.toDataURL('image/jpeg', .94), 'JPEG', 0, 0, 210, 297)
  })
  doc.setProperties({ title: design.designName.trim() || 'iKitchen design', subject: 'Room layout and product summary', creator: 'iKitchen' })
  return doc
}

export async function downloadDesignPdf(design) {
  const doc = await buildDesignPdf(design)
  doc.save('iKitchen-design-' + new Date().toISOString().slice(0, 10) + '.pdf')
}
