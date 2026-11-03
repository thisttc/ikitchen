import React from 'react'
import { FiEdit3, FiHexagon, FiSquare } from 'react-icons/fi'
import SegmentedControl from '../ui/SegmentedControl'

const roomShapes = [
  { id: 'rectangle', label: 'สี่เหลี่ยม', icon: FiSquare },
  { id: 'l-shape', label: 'ตัว L', icon: FiEdit3 },
  { id: 'free', label: 'อิสระ', icon: FiHexagon },
]

const RoomPanel = ({ unit, onUnitChange }) => {
  const [shape, setShape] = React.useState('rectangle')
  const [wallTool, setWallTool] = React.useState('straight')

  return (
    <section>
      <h1 className="mb-1 text-[22px] font-bold text-stone-900">สร้างและแก้ไขห้อง</h1>
      <p className="mb-6 text-sm text-stone-400">เลือกรูปแบบและกำหนดขนาดพื้นที่</p>

      <h2 className="mb-3 text-[16px] font-semibold">รูปแบบห้อง</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {roomShapes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setShape(id)}
            className={`flex h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border transition hover:-translate-y-0.5 ${shape === id ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-stone-200 bg-white text-stone-500 hover:border-brand-200'}`}
          >
            <Icon size={27} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-[16px] font-semibold">เครื่องมือผนัง</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { id: 'straight', label: 'วาดผนัง', icon: '╱' },
          { id: 'curve', label: 'ผนังโค้ง', icon: '◒' },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setWallTool(tool.id)}
            className={`flex h-[82px] items-center justify-center gap-3 rounded-2xl border text-sm font-medium transition hover:-translate-y-0.5 ${wallTool === tool.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 bg-white text-stone-600 hover:border-brand-200'}`}
          >
            <span className="text-3xl leading-none">{tool.icon}</span>{tool.label}
          </button>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-[16px] font-semibold">หน่วย</h2>
      <SegmentedControl
        options={[{ value: 'meter', label: 'เมตร' }, { value: 'inch', label: 'นิ้ว' }]}
        value={unit}
        onChange={onUnitChange}
      />

      <h2 className="mb-3 mt-6 text-[16px] font-semibold">ขนาดเริ่มต้น</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-400 focus-within:border-brand-500">
          กว้าง
          <div className="mt-1 flex items-end gap-1">
            <input defaultValue="4.20" className="min-w-0 flex-1 text-lg font-semibold text-stone-800 outline-none" />
            <span className="pb-0.5 text-sm">{unit === 'meter' ? 'm' : 'in'}</span>
          </div>
        </label>
        <label className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-400 focus-within:border-brand-500">
          ยาว
          <div className="mt-1 flex items-end gap-1">
            <input defaultValue="3.60" className="min-w-0 flex-1 text-lg font-semibold text-stone-800 outline-none" />
            <span className="pb-0.5 text-sm">{unit === 'meter' ? 'm' : 'in'}</span>
          </div>
        </label>
      </div>
      <button type="button" className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]">สร้างห้อง</button>
    </section>
  )
}

export default RoomPanel
