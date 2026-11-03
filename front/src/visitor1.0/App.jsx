import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import './App.css'
import CanvasArea from './components/layout/CanvasArea'
import Header from './components/layout/Header'
import RightPanel from './components/layout/RightPanel'
import Sidebar from './components/layout/Sidebar'
import ToolPanel from './components/layout/ToolPanel'
import { initialLayers } from './data/mockData'
import { createBoqRows, downloadBoqExcel } from './utils/exportBoq'

const App = () => {
  const [activeMenu, setActiveMenu] = useState('room')
  const [activeRightTab, setActiveRightTab] = useState('properties')
  const [activeView, setActiveView] = useState('isometric')
  const [unit, setUnit] = useState('meter')
  const [selectedObject, setSelectedObject] = useState(null)
  const [placedItems, setPlacedItems] = useState([])
  const [layers, setLayers] = useState(initialLayers)
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [dimensionSettings, setDimensionSettings] = useState({ visible: true, wallLength: true, wallAngle: true })

  const totalPrice = useMemo(() => placedItems.reduce((sum, item) => sum + (item.price || 0), 0), [placedItems])

  const addItem = (item) => {
    const newItem = {
      ...item,
      instanceId: `${item.id}-${Date.now()}`,
      width: item.width ?? (item.type === 'product' ? 0.5 : 0.9),
      depth: item.depth ?? 0.5,
      height: item.height ?? (item.type === 'product' ? 0.5 : 2.1),
      rotation: 0,
      transparent: false,
    }
    setHistory((current) => [...current, placedItems])
    setPlacedItems((current) => [...current, newItem])
    setRedoStack([])
    setSelectedObject(newItem)
    setActiveRightTab('properties')
  }

  const deleteSelected = () => {
    if (!selectedObject?.instanceId) {
      setSelectedObject(null)
      return
    }
    setHistory((current) => [...current, placedItems])
    setPlacedItems((current) => current.filter((item) => item.instanceId !== selectedObject.instanceId))
    setSelectedObject(null)
  }

  const undo = () => {
    if (!history.length) return
    const previous = history[history.length - 1]
    setRedoStack((current) => [placedItems, ...current])
    setPlacedItems(previous)
    setHistory((current) => current.slice(0, -1))
    setSelectedObject(null)
  }

  const redo = () => {
    if (!redoStack.length) return
    const next = redoStack[0]
    setHistory((current) => [...current, placedItems])
    setPlacedItems(next)
    setRedoStack((current) => current.slice(1))
  }

  const updateSelectedObject = (nextObject) => {
    setSelectedObject(nextObject)
    if (nextObject.instanceId) {
      setPlacedItems((current) => current.map((item) => item.instanceId === nextObject.instanceId ? nextObject : item))
    }
  }

  const showSummary = async () => {
    const boqRows = createBoqRows(placedItems)
    const categorySummary = boqRows.reduce((summary, row) => {
      if (!summary[row.category]) summary[row.category] = { quantity: 0, total: 0 }
      summary[row.category].quantity += row.quantity
      summary[row.category].total += row.total
      return summary
    }, {})

    const categoryRows = Object.entries(categorySummary).map(([category, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eceee9;text-align:left">${category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eceee9;text-align:center">${value.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eceee9;text-align:right">฿${value.total.toLocaleString()}</td>
      </tr>
    `).join('')

    const result = await Swal.fire({
      title: 'สรุปงานออกแบบ',
      width: 720,
      html: `
        <div style="font-family:Sarabun,sans-serif;text-align:left;color:#444a40">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 18px">
            <div style="padding:14px;border-radius:12px;background:#f4f7f1"><small style="color:#7b8277">ขนาดห้อง</small><div style="font-size:18px;font-weight:700">4.20 × 3.60 ม.</div></div>
            <div style="padding:14px;border-radius:12px;background:#f4f7f1"><small style="color:#7b8277">วัตถุที่วาง</small><div style="font-size:18px;font-weight:700">${placedItems.length} รายการ</div></div>
            <div style="padding:14px;border-radius:12px;background:#f4f7f1"><small style="color:#7b8277">ราคารวม</small><div style="font-size:18px;font-weight:700;color:#4f6147">฿${totalPrice.toLocaleString()}</div></div>
          </div>
          <div style="font-weight:700;margin-bottom:8px">สรุปตามหมวดหมู่</div>
          ${boqRows.length ? `
            <table style="width:100%;border-collapse:collapse;border:1px solid #e4e7e0;border-radius:12px;overflow:hidden">
              <thead><tr style="background:#64785a;color:white"><th style="padding:10px 12px;text-align:left">หมวดหมู่</th><th style="padding:10px 12px">จำนวน</th><th style="padding:10px 12px;text-align:right">รวมราคา</th></tr></thead>
              <tbody>${categoryRows}</tbody>
            </table>
          ` : '<div style="padding:24px;border:1px dashed #cfd5ca;border-radius:12px;text-align:center;color:#888f85">ยังไม่มีวัตถุในงานออกแบบ</div>'}
          <p style="margin:14px 0 0;font-size:12px;color:#8a9086">ไฟล์ Excel จะแยกหมวดหมู่ รุ่น ขนาด จำนวน ราคาต่อหน่วย และราคารวม พร้อมยอดรวมแต่ละหมวด</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ดาวน์โหลดแบบ Excel',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#4f6147',
      cancelButtonColor: '#8a9086',
      reverseButtons: true,
      focusCancel: true,
    })

    if (result.isConfirmed) {
      await downloadBoqExcel(placedItems)
      Swal.fire({
        icon: 'success',
        title: 'ดาวน์โหลด BOQ แล้ว',
        text: 'ไฟล์ Excel ถูกสร้างจากรายการที่วางในงานออกแบบปัจจุบัน',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f6147',
      })
    }
  }

  const showExport = () => Swal.fire({
    icon: 'success',
    title: 'พร้อมส่งออก',
    text: 'ตัวอย่าง UX/UI: เลือกรูปแบบไฟล์ PDF, PNG หรือ Excel ได้ในขั้นพัฒนาฟังก์ชันจริง',
    confirmButtonText: 'เข้าใจแล้ว',
    confirmButtonColor: '#4f6147',
  })

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas font-sans">
      <Header canUndo={history.length > 0} canRedo={redoStack.length > 0} onUndo={undo} onRedo={redo} onSummary={showSummary} onExport={showExport} />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeMenu={activeMenu} onChange={setActiveMenu} />
        <ToolPanel
          activeMenu={activeMenu}
          unit={unit}
          onUnitChange={setUnit}
          onAddItem={addItem}
          dimensionSettings={dimensionSettings}
          onDimensionChange={(key, value) => setDimensionSettings((current) => ({ ...current, [key]: value }))}
        />
        <CanvasArea
          activeView={activeView}
          onViewChange={setActiveView}
          selectedObject={selectedObject}
          placedItems={placedItems}
          onSelectObject={setSelectedObject}
          onDeleteSelected={deleteSelected}
        />
        <RightPanel
          activeTab={activeRightTab}
          onTabChange={setActiveRightTab}
          selectedObject={selectedObject}
          onUpdateObject={updateSelectedObject}
          layers={layers}
          onLayersChange={setLayers}
        />
      </div>
    </div>
  )
}

export default App
