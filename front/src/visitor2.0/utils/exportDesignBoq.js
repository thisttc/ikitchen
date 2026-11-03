import { summarizeBoq, statusText, waterTypes } from './boq.js'
import { closedRoom, roomBounds } from './scene.js'
const value = (v) => v == null ? 'ไม่ระบุ' : v

export async function buildBoqWorkbook(design) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.calcProperties.fullCalcOnLoad = true
  workbook.creator = 'iKitchen Demo'; workbook.created = new Date()
  const summary = summarizeBoq(design.objects), b = roomBounds(design.room)
  const boq = workbook.addWorksheet('BOQ', { views: [{ state: 'frozen', ySplit: 6 }] })
  const systems = workbook.addWorksheet('ไฟ-น้ำ-แก๊ส', { views: [{ state: 'frozen', ySplit: 6 }] })
  function setup(sheet, widths, title) {
    sheet.columns = widths.map(width => ({ width }))
    for (let r = 1; r <= 5; r++) sheet.mergeCells(r, 1, r, widths.length)
    sheet.getCell('A1').value = title
    sheet.getRow(1).height = 32
    sheet.getRow(1).font = { name: 'Sarabun', size: 17, bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F6147' } }
    sheet.getCell('A2').value = `โครงการ: ${design.designName} | วันที่: ${new Date().toLocaleString('th-TH')}`
    sheet.getCell('A3').value = closedRoom(design.room) ? `ห้อง ${b.width / 1000} × ${b.depth / 1000} × ${design.room.heightMm / 1000} ม. (แนวศูนย์กลางกำแพง) | วัตถุ ${summary.count} ชิ้น รวม Layer ที่ซ่อน` : `ห้องยังไม่ปิดครบ 4 ด้าน | วัตถุ ${summary.count} ชิ้น`
    sheet.getCell('A4').value = 'เอกสารจำลอง ไม่ใช่ใบเสนอราคา / แบบติดตั้งจริง • ไม่รวมภาษี ค่าขนส่ง ค่าแรง และงานระบบ'
    sheet.getCell('A5').value = `ข้อมูลไม่ครบ ${summary.incompleteCount} ชิ้น • ไม่ระบุราคา ${summary.missingPriceCount} ชิ้น • ยอดรวมเฉพาะค่าที่ระบุ ไม่ใช่ความต้องการใช้งานพร้อมกัน`
    sheet.getRow(5).font = { name: 'Sarabun', color: { argb: 'FF9F651F' } }
    sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:6' }
    sheet.headerFooter.oddFooter = '&LiKitchen Demo&Rหน้า &P / &N'
  }
  setup(boq, [7, 22, 28, 20, 17, 14, 14, 14, 10, 12, 19, 20, 34], 'บัญชีรายการและปริมาณอุปกรณ์ — BOQ จำลอง')
  boq.addRow(['ลำดับ', 'หมวดหมู่', 'รายการ', 'ผู้ผลิต', 'รุ่น', 'กว้าง mm', 'ลึก mm', 'สูง mm', 'จำนวน', 'หน่วย', 'ราคา/หน่วย บาท', 'รวม บาท', 'หมายเหตุ'])
  const totals = [], categories = [...new Set(summary.rows.map(r => r.categoryName))]
  let no = 1
  for (const category of categories) {
    const band = boq.addRow([category])
    boq.mergeCells(band.number, 1, band.number, 13)
    band.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EBDF' } }; band.font = { name: 'Sarabun', bold: true }
    const start = boq.rowCount + 1
    for (const r of summary.rows.filter(row => row.categoryName === category)) {
      const line = boq.addRow([no++, r.categoryName, r.productName, r.manufacturer, r.model, value(r.widthMm), value(r.depthMm), value(r.heightMm), r.quantity, r.unit,
        r.unitPriceSatang == null ? 'ไม่ระบุ' : r.unitPriceSatang / 100, null, [...r.warnings, r.dimensionNote].filter(Boolean).join(' / ')])
      line.getCell(12).value = r.totalSatang == null ? 'ไม่ระบุ' : { formula: `ROUND(I${line.number}*K${line.number},2)`, result: r.totalSatang / 100 }
    }
    const end = boq.rowCount, known = summary.rows.filter(r => r.categoryName === category).reduce((s, r) => s + (r.totalSatang ?? 0), 0)
    const subtotal = boq.addRow([null, 'รวมหมวด (เฉพาะราคาที่ระบุ)'])
    boq.mergeCells(subtotal.number, 2, subtotal.number, 11)
    subtotal.getCell(12).value = { formula: `SUM(L${start}:L${end})`, result: known / 100 }
    subtotal.font = { name: 'Sarabun', bold: true }; totals.push(subtotal.number)
  }
  const total = boq.addRow([null, 'รวมทั้งหมดเฉพาะราคาที่ระบุ'])
  boq.mergeCells(total.number, 2, total.number, 11)
  total.getCell(12).value = { formula: totals.length ? totals.map(r => `L${r}`).join('+') : '0', result: summary.knownTotalSatang / 100 }
  total.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EBDF' } }; total.font = { name: 'Sarabun', bold: true }
  boq.getColumn(11).numFmt = '#,##0.00'; boq.getColumn(12).numFmt = '#,##0.00'
  setup(systems, [20, 26, 17, 10, 13, 20, 13, 15, 17, 15, 15, 17, 18, 36, 45], 'ข้อมูลประกอบงานระบบ — ไฟฟ้า / น้ำ / แก๊ส (จำลอง)')
  systems.addRow(['หมวดสินค้า', 'รายการ', 'รุ่น', 'จำนวน', 'ระบบ', 'การใช้งาน', 'เฟส', 'แรงดัน V', 'กำลัง/ชิ้น kW', 'รวม kW', 'ขนาดท่อ นิ้ว', 'จุด/ชิ้น', 'จุดรวม', 'ชนิด / BTU ต่อชั่วโมง', 'หมายเหตุ'])
  for (const r of summary.rows) {
    const e = r.electrical ?? {}, p = r.plumbing ?? {}, g = r.gas ?? {}, base = [r.categoryName, r.productName, r.model, r.quantity]
    systems.addRow([...base, 'ไฟฟ้า', statusText(e.required), e.required === false ? '—' : value(e.phase), e.required === false ? '—' : value(e.voltageV), e.required === false ? '—' : value(e.powerKw), e.required === false ? '—' : e.powerKw == null ? 'ไม่ระบุ' : e.powerKw * r.quantity, '—', '—', '—', '—', e.note])
    const conns = p.connections ?? []
    if (!conns.length) systems.addRow([...base, 'น้ำ', `น้ำ: ${statusText(p.requiresWater)} / ทิ้ง: ${statusText(p.requiresDrain)}`, '—', '—', '—', '—', '—', '—', '—', '—', [p.note, ...r.warnings.filter(w => w.includes('น้ำ'))].filter(Boolean).join(' / ')])
    for (const c of conns) systems.addRow([...base, 'น้ำ', 'ใช้', '—', '—', '—', '—', value(c.sizeInch), value(c.pointCount), c.pointCount == null ? 'ไม่ระบุ' : c.pointCount * r.quantity, waterTypes[c.type] ?? c.type, [c.installationNote, p.note].filter(Boolean).join(' / ')])
    systems.addRow([...base, 'แก๊ส', statusText(g.required), '—', '—', '—', '—', g.required === false ? '—' : value(g.valveSizeInch), g.required === false ? '—' : value(g.pointCount), g.required === false ? '—' : g.pointCount == null ? 'ไม่ระบุ' : g.pointCount * r.quantity,
      g.required === false ? '—' : `${value(g.pressureType)} / ${value(g.inputBtuPerHour)} BTU/h ต่อชิ้น`, g.installationNote])
  }
  systems.addRow([]); systems.addRow(['รวมระบบ (เฉพาะค่าที่ระบุ)'])
  for (const [k, v] of Object.entries(summary.electrical)) systems.addRow(['ไฟฟ้า', k, `${Number(v.toFixed(3))} kW`])
  for (const [k, v] of Object.entries(summary.water)) systems.addRow(['น้ำ', k, `${v} จุด`])
  for (const [k, v] of Object.entries(summary.gas)) systems.addRow(['แก๊ส', k, `${v} BTU/h`])
  const gasConnections = {}
  for (const r of summary.rows) {
    const g = r.gas ?? {}
    if (!g.required || g.pointCount == null) continue
    const key = `${g.pressureType ?? 'ไม่ระบุแรงดัน'} / วาล์ว ${g.valveSizeInch ?? 'ไม่ระบุ'} นิ้ว`
    gasConnections[key] = (gasConnections[key] ?? 0) + g.pointCount * r.quantity
  }
  for (const [k, v] of Object.entries(gasConnections)) systems.addRow(['จุดต่อแก๊ส', k, `${v} จุด`])
  systems.addRow(['ข้อจำกัด', 'ไม่ใช้ค่านี้เลือกเบรกเกอร์ สายไฟ ท่อ หรือวาล์ว ต้องตรวจสอบข้อมูลจริงและให้ผู้เชี่ยวชาญออกแบบงานระบบ'])
  for (const sheet of [boq, systems]) {
    sheet.getRow(6).font = { name: 'Sarabun', bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64785A' } }; sheet.getRow(6).height = 36
    sheet.eachRow((row, index) => {
      if (index > 6) row.height = 44
      row.eachCell(cell => { cell.font = { name: 'Sarabun', size: 11, ...cell.font }; cell.alignment = { vertical: 'middle', wrapText: true }
        if (index >= 6) cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } }
      })
    })
  }
  return workbook
}
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function downloadBoqExcel(design) {
  const book = await buildBoqWorkbook(design), buffer = await book.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `iKitchen-BOQ-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
