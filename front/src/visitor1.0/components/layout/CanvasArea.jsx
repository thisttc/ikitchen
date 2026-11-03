import { FiCopy, FiGrid, FiMaximize, FiMinus, FiMove, FiPlus, FiRotateCw, FiTrash2 } from 'react-icons/fi'
import ViewSwitcher from '../editor/ViewSwitcher'

const canvasViewLabels = {
  isometric: 'มุมมอง Isometric',
  top: 'มุมมองด้านบน',
  bottom: 'มุมมองด้านล่าง',
  front: 'มุมมองด้านหน้า',
  back: 'มุมมองด้านหลัง',
  left: 'มุมมองด้านซ้าย',
  right: 'มุมมองด้านขวา',
}

const CanvasTool = ({ icon, label, danger = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex h-9 w-9 items-center justify-center rounded-lg transition hover:-translate-y-0.5 ${danger ? 'text-red-500 hover:bg-red-50' : 'text-stone-600 hover:bg-stone-100 hover:text-brand-700'}`}
  >
    {icon}
  </button>
)

const CanvasArea = ({ activeView, onViewChange, selectedObject, placedItems, onSelectObject, onDeleteSelected }) => (
  <main className="relative min-w-0 flex-1 overflow-hidden bg-canvas" onClick={() => onSelectObject(null)}>
    <div className="canvas-grid absolute inset-0" />

    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-xs text-stone-500 shadow-sm backdrop-blur">
      <FiGrid />
      Grid 10 cm
      <span className="h-1 w-1 rounded-full bg-stone-300" />
      {canvasViewLabels[activeView]}
    </div>

    <div className="absolute inset-x-8 bottom-24 top-16 flex items-center justify-center">
      <div
        className={`relative transition-all duration-500 ${activeView === 'isometric' ? 'room-isometric h-[310px] w-[430px]' : 'h-[330px] w-[470px]'}`}
        onClick={(event) => {
          event.stopPropagation()
          onSelectObject({ id: 'wall-main', type: 'wall', name: 'ผนัง', length: 4.2, angle: 90, transparent: false })
        }}
        role="button"
        tabIndex={0}
      >
        <div className={`pointer-events-none absolute inset-0 border-[10px] border-brand-700 bg-[#efe9dc]/70 shadow-[0_20px_40px_rgba(55,62,50,0.14)] transition ${selectedObject?.type === 'wall' ? 'ring-4 ring-sky-400/35 ring-offset-4' : ''}`} />
        <div className="pointer-events-none absolute -top-8 left-0 right-0 text-center text-xs font-medium text-brand-700">4.20 m</div>
        <div className="pointer-events-none absolute -left-12 top-1/2 -rotate-90 text-xs font-medium text-brand-700">3.60 m</div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelectObject({ id: 'door-main', type: 'door', name: 'ประตูบานเดี่ยว', code: 'DR-101', width: 0.9, height: 2.1, transparent: false, tone: '#a8754f' })
          }}
          className={`absolute -bottom-[10px] left-[52px] h-[18px] w-[82px] rounded-sm border-2 bg-white transition hover:scale-105 ${selectedObject?.id === 'door-main' ? 'border-sky-500 ring-4 ring-sky-300/30' : 'border-[#a8754f]'}`}
          aria-label="เลือกประตู"
        />

        {placedItems.map((item, index) => (
          <button
            type="button"
            key={`${item.id}-${index}`}
            onClick={(event) => {
              event.stopPropagation()
              onSelectObject(item)
            }}
            className={`absolute flex h-14 w-16 items-center justify-center rounded-lg border-2 bg-white/95 text-[11px] font-semibold shadow-md transition hover:-translate-y-1 ${selectedObject?.instanceId === item.instanceId ? 'border-sky-500 ring-4 ring-sky-300/30' : 'border-white'}`}
            style={{ left: 160 + (index % 3) * 76, top: 75 + Math.floor(index / 3) * 76, color: item.tone }}
          >
            {item.code}
          </button>
        ))}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelectObject({ id: 'dimension-main', type: 'dimension', name: 'เส้นบอกระยะ', distance: 4.2, unit: 'm', visible: true })
          }}
          className={`absolute -top-8 left-1/4 right-1/4 h-5 border-t transition ${selectedObject?.type === 'dimension' ? 'border-sky-500 text-sky-600' : 'border-brand-500 text-brand-700 hover:border-sky-500'}`}
          aria-label="เลือกเส้นบอกระยะ"
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold">4.20 m</span>
        </button>
      </div>
    </div>

    {selectedObject && (
      <div className="soft-enter absolute left-1/2 top-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(57,65,51,0.15)]" onClick={(event) => event.stopPropagation()}>
        <CanvasTool icon={<FiMove />} label="ย้าย" />
        <CanvasTool icon={<FiRotateCw />} label="หมุน 90 องศา" />
        <CanvasTool icon={<FiCopy />} label="ทำสำเนา" />
        <span className="mx-1 h-6 w-px bg-stone-200" />
        <CanvasTool icon={<FiTrash2 />} label="ลบ" danger onClick={onDeleteSelected} />
      </div>
    )}

    <div className="absolute bottom-4 left-1/2 -translate-x-1/2" onClick={(event) => event.stopPropagation()}>
      <ViewSwitcher activeView={activeView} onChange={onViewChange} />
    </div>

    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg" onClick={(event) => event.stopPropagation()}>
      <CanvasTool icon={<FiMinus />} label="ซูมออก" />
      <span className="w-12 text-center text-xs font-semibold text-stone-600">100%</span>
      <CanvasTool icon={<FiPlus />} label="ซูมเข้า" />
      <CanvasTool icon={<FiMaximize />} label="พอดีหน้าจอ" />
    </div>
  </main>
)

export default CanvasArea
