import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import './App.css'
import CanvasArea from './components/layout/CanvasArea'
import Header from './components/layout/Header'
import RightPanel from './components/layout/RightPanel'
import Sidebar from './components/layout/Sidebar'
import ToolPanel from './components/layout/ToolPanel'
import { initialLayers } from './data/mockData'

const defaultWall = {
  id: 'wall-main',
  type: 'wall',
  name: 'ผนัง',
  length: 4.2,
  angle: 90,
  transparent: false,
}

const App = () => {
  const [activeMenu, setActiveMenu] = useState('room')
  const [activeRightTab, setActiveRightTab] = useState('properties')
  const [activeView, setActiveView] = useState('isometric')
  const [unit, setUnit] = useState('meter')
  const [selectedObject, setSelectedObject] = useState(defaultWall)
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
      width: item.type === 'product' ? 0.5 : 0.9,
      depth: 0.5,
      height: item.type === 'product' ? 0.5 : 2.1,
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
    if (!selectedObject?.instanceId) return
    setHistory((current) => [...current, placedItems])
    setPlacedItems((current) => current.filter((item) => item.instanceId !== selectedObject.instanceId))
    setSelectedObject(defaultWall)
  }

  const undo = () => {
    if (!history.length) return
    const previous = history[history.length - 1]
    setRedoStack((current) => [placedItems, ...current])
    setPlacedItems(previous)
    setHistory((current) => current.slice(0, -1))
    setSelectedObject(defaultWall)
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

  const showSummary = () => Swal.fire({
    title: 'สรุปงานออกแบบ',
    html: `<div style="text-align:left;line-height:2"><b>ขนาดห้อง:</b> 4.20 × 3.60 เมตร<br/><b>วัตถุที่วาง:</b> ${placedItems.length} รายการ<br/><b>ราคารวมโดยประมาณ:</b> ฿${totalPrice.toLocaleString()}</div>`,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#4f6147',
  })

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
