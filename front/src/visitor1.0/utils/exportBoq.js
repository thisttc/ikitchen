const categoryOf = (item) => {
  if (item.category) return item.category
  if (item.type === 'door') return 'ประตู'
  if (item.type === 'window') return 'หน้าต่าง'
  return 'รายการอื่น ๆ'
}

const sizeOf = (item) => {
  const dimensions = item.type === 'product'
    ? [item.width, item.depth, item.height]
    : [item.width, item.height]
  const available = dimensions.filter((value) => value !== undefined)
  return available.length ? `${available.join(' × ')} m` : item.size || '-'
}

export const createBoqRows = (placedItems) => {
  const grouped = new Map()

  placedItems.forEach((item) => {
    const category = categoryOf(item)
    const key = [category, item.code || '-', item.name, sizeOf(item), item.price || 0].join('|')
    const existing = grouped.get(key)

    if (existing) {
      existing.quantity += 1
      existing.total = existing.quantity * existing.unitPrice
      return
    }

    grouped.set(key, {
      category,
      name: item.name,
      model: item.code || '-',
      size: sizeOf(item) || '-',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: Number(item.price || 0),
      total: Number(item.price || 0),
    })
  })

  return [...grouped.values()].sort((a, b) => (
    a.category.localeCompare(b.category, 'th') || a.model.localeCompare(b.model, 'th')
  ))
}

export const createBoqWorkbook = async (placedItems, room = { width: 4.2, length: 3.6, unit: 'เมตร' }) => {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'iKitchen'
  workbook.created = new Date()
  workbook.modified = new Date()

  const sheet = workbook.addWorksheet('BOQ', {
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', ySplit: 8 }],
  })

  sheet.columns = [
    { key: 'no', width: 8 },
    { key: 'category', width: 20 },
    { key: 'name', width: 30 },
    { key: 'model', width: 18 },
    { key: 'size', width: 24 },
    { key: 'quantity', width: 11 },
    { key: 'unit', width: 11 },
    { key: 'unitPrice', width: 17 },
    { key: 'total', width: 18 },
    { key: 'note', width: 23 },
  ]

  sheet.mergeCells('A1:J1')
  sheet.getCell('A1').value = 'ใบแสดงปริมาณวัสดุและราคา (Bill of Quantities)'
  sheet.getCell('A1').font = { name: 'Noto Sans Thai', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F6147' } }
  sheet.getRow(1).height = 34

  sheet.mergeCells('A2:J2')
  sheet.getCell('A2').value = 'โครงการ: iKitchen - งานออกแบบห้องครัว'
  sheet.getCell('A2').font = { name: 'Noto Sans Thai', size: 12, bold: true, color: { argb: 'FF3F4E39' } }
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  sheet.getCell('A4').value = 'ขนาดห้อง'
  sheet.mergeCells('B4:D4')
  sheet.getCell('B4').value = `${room.width.toFixed(2)} × ${room.length.toFixed(2)} ${room.unit}`
  sheet.getCell('F4').value = 'วันที่จัดทำ'
  sheet.mergeCells('G4:J4')
  sheet.getCell('G4').value = new Date().toLocaleDateString('th-TH')
  sheet.getCell('A5').value = 'จำนวนวัตถุ'
  sheet.mergeCells('B5:D5')
  sheet.getCell('B5').value = `${placedItems.length} รายการ`
  sheet.getCell('F5').value = 'สถานะราคา'
  sheet.mergeCells('G5:J5')
  sheet.getCell('G5').value = 'ราคาประมาณการ (ข้อมูลจำลอง)'

  ;['A4', 'F4', 'A5', 'F5'].forEach((address) => {
    sheet.getCell(address).font = { name: 'Noto Sans Thai', bold: true, color: { argb: 'FF4F6147' } }
  })

  const headers = ['ลำดับ', 'หมวดหมู่', 'รายการ', 'รุ่น/รหัส', 'ขนาด', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'ราคารวม', 'หมายเหตุ']
  const headerRow = sheet.getRow(8)
  headerRow.values = headers
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Noto Sans Thai', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64785A' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD5DACE' } },
      left: { style: 'thin', color: { argb: 'FFD5DACE' } },
      bottom: { style: 'thin', color: { argb: 'FFD5DACE' } },
      right: { style: 'thin', color: { argb: 'FFD5DACE' } },
    }
  })

  const boqRows = createBoqRows(placedItems)
  let currentRow = 9
  let runningNumber = 1
  const subtotalRows = []

  if (!boqRows.length) {
    sheet.mergeCells(`A${currentRow}:J${currentRow}`)
    const emptyCell = sheet.getCell(`A${currentRow}`)
    emptyCell.value = 'ยังไม่มีวัตถุในงานออกแบบ'
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
    emptyCell.font = { name: 'Noto Sans Thai', italic: true, color: { argb: 'FF8A9187' } }
    sheet.getRow(currentRow).height = 34
    currentRow += 1
  } else {
    const categories = [...new Set(boqRows.map((row) => row.category))]

    categories.forEach((category) => {
      sheet.mergeCells(`A${currentRow}:J${currentRow}`)
      const categoryCell = sheet.getCell(`A${currentRow}`)
      categoryCell.value = `หมวดหมู่: ${category}`
      categoryCell.font = { name: 'Noto Sans Thai', bold: true, color: { argb: 'FF3F4E39' } }
      categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEE3' } }
      categoryCell.alignment = { vertical: 'middle' }
      sheet.getRow(currentRow).height = 24
      currentRow += 1

      const categoryStartRow = currentRow
      boqRows.filter((row) => row.category === category).forEach((row) => {
        const excelRow = sheet.getRow(currentRow)
        excelRow.values = [runningNumber, row.category, row.name, row.model, row.size, row.quantity, row.unit, row.unitPrice, row.total, '']
        excelRow.height = 24
        excelRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Noto Sans Thai', size: 10 }
          cell.alignment = { vertical: 'middle', horizontal: [1, 6, 7, 8, 9].includes(colNumber) ? 'center' : 'left' }
          cell.border = {
            top: { style: 'hair', color: { argb: 'FFE1E5DD' } },
            left: { style: 'hair', color: { argb: 'FFE1E5DD' } },
            bottom: { style: 'hair', color: { argb: 'FFE1E5DD' } },
            right: { style: 'hair', color: { argb: 'FFE1E5DD' } },
          }
        })
        excelRow.getCell(8).numFmt = '#,##0.00'
        excelRow.getCell(9).numFmt = '#,##0.00'
        runningNumber += 1
        currentRow += 1
      })

      const categoryEndRow = currentRow - 1
      sheet.mergeCells(`A${currentRow}:H${currentRow}`)
      sheet.getCell(`A${currentRow}`).value = `รวมหมวดหมู่ ${category}`
      sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
      sheet.getCell(`I${currentRow}`).value = { formula: `SUM(I${categoryStartRow}:I${categoryEndRow})` }
      sheet.getCell(`I${currentRow}`).numFmt = '#,##0.00'
      sheet.getRow(currentRow).font = { name: 'Noto Sans Thai', bold: true, color: { argb: 'FF4F6147' } }
      sheet.getRow(currentRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7F1' } }
      subtotalRows.push(currentRow)
      currentRow += 1
    })
  }

  sheet.mergeCells(`A${currentRow + 1}:H${currentRow + 1}`)
  sheet.getCell(`A${currentRow + 1}`).value = 'รวมราคาประมาณการทั้งสิ้น'
  sheet.getCell(`A${currentRow + 1}`).alignment = { horizontal: 'right', vertical: 'middle' }
  sheet.getCell(`I${currentRow + 1}`).value = subtotalRows.length
    ? { formula: `SUM(${subtotalRows.map((row) => `I${row}`).join(',')})` }
    : 0
  sheet.getCell(`I${currentRow + 1}`).numFmt = '#,##0.00'
  sheet.getCell(`J${currentRow + 1}`).value = 'บาท'
  sheet.getRow(currentRow + 1).height = 30
  sheet.getRow(currentRow + 1).font = { name: 'Noto Sans Thai', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(currentRow + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F6147' } }

  sheet.mergeCells(`A${currentRow + 3}:J${currentRow + 3}`)
  sheet.getCell(`A${currentRow + 3}`).value = 'หมายเหตุ: เอกสารนี้เป็น BOQ จำลอง ราคายังไม่รวมค่าติดตั้ง ภาษี และค่าใช้จ่ายอื่น ๆ'
  sheet.getCell(`A${currentRow + 3}`).font = { name: 'Noto Sans Thai', size: 10, italic: true, color: { argb: 'FF777C74' } }

  return workbook
}

export const downloadBoqExcel = async (placedItems) => {
  const workbook = await createBoqWorkbook(placedItems)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)

  anchor.href = url
  anchor.download = `iKitchen_BOQ_${timestamp}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
