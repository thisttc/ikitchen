import { FiBox, FiColumns, FiGrid, FiHome, FiMaximize2, FiRotateCw } from 'react-icons/fi'
import ToggleSwitch from '../ui/ToggleSwitch'

const NumberField = ({ label, value, unit = 'm', onChange }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-stone-600">{label}</span>
    <div className="flex h-11 items-center rounded-xl border border-stone-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-100">
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-stone-800 outline-none" />
      <span className="text-sm text-stone-400">{unit}</span>
    </div>
  </label>
)

const ObjectPreview = ({ object }) => {
  const Icon = object.type === 'wall' ? FiHome : object.type === 'product' ? FiBox : object.type === 'window' ? FiGrid : object.type === 'dimension' ? FiMaximize2 : FiColumns
  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl bg-brand-50 p-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm"><Icon size={34} /></div>
      <div className="min-w-0">
        <h2 className="truncate text-[17px] font-bold text-stone-800">{object.name}</h2>
        {object.code && <p className="text-sm text-stone-500">{object.code}</p>}
        <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">{object.type === 'wall' ? 'โครงสร้างห้อง' : object.type === 'product' ? 'สินค้า' : object.type === 'dimension' ? 'เครื่องมือวัด' : 'ประตู/หน้าต่าง'}</span>
      </div>
    </div>
  )
}

const PropertiesPanel = ({ selectedObject, onUpdateObject }) => {
  if (!selectedObject) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><FiBox size={28} /></div>
        <h2 className="font-semibold text-stone-700">ยังไม่ได้เลือกวัตถุ</h2>
        <p className="mt-1 max-w-[220px] text-sm leading-6 text-stone-400">เลือกผนัง ประตู หรือสินค้าบนพื้นที่ออกแบบเพื่อดูคุณสมบัติ</p>
      </div>
    )
  }

  const update = (key, value) => onUpdateObject({ ...selectedObject, [key]: value })

  return (
    <section className="soft-enter">
      <ObjectPreview object={selectedObject} />
      {selectedObject.type === 'wall' && (
        <div className="space-y-4">
          <NumberField label="ความยาว" value={selectedObject.length ?? 4.2} onChange={(value) => update('length', value)} />
          <NumberField label="มุม" value={selectedObject.angle ?? 90} unit="°" onChange={(value) => update('angle', value)} />
          <label className="block text-sm font-medium text-stone-600">ประเภท
            <select className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-[15px] outline-none transition focus:border-brand-500">
              <option>ผนังตรง</option><option>ผนังโค้ง</option>
            </select>
          </label>
        </div>
      )}
      {(selectedObject.type === 'door' || selectedObject.type === 'window') && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="กว้าง" value={selectedObject.width ?? 0.9} onChange={(value) => update('width', value)} />
          <NumberField label="สูง" value={selectedObject.height ?? 2.1} onChange={(value) => update('height', value)} />
          {selectedObject.type === 'window' && <div className="col-span-2"><NumberField label="ระดับจากพื้น" value={selectedObject.floorLevel ?? 0.9} onChange={(value) => update('floorLevel', value)} /></div>}
        </div>
      )}
      {selectedObject.type === 'product' && (
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-700">ขนาด</h3>
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="กว้าง" value={selectedObject.width ?? 0.5} onChange={(value) => update('width', value)} />
              <NumberField label="ยาว" value={selectedObject.depth ?? 0.5} onChange={(value) => update('depth', value)} />
              <NumberField label="สูง" value={selectedObject.height ?? 0.5} onChange={(value) => update('height', value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="การหมุน" value={selectedObject.rotation ?? 0} unit="°" onChange={(value) => update('rotation', value)} />
            <NumberField label="ราคา" value={selectedObject.price ?? 0} unit="บาท" onChange={(value) => update('price', value)} />
          </div>
          <button type="button" onClick={() => update('rotation', ((selectedObject.rotation ?? 0) + 90) % 360)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"><FiRotateCw /> หมุน 90°</button>
        </div>
      )}
      {selectedObject.type === 'dimension' && (
        <div className="space-y-4">
          <NumberField label="ระยะ" value={selectedObject.distance ?? 4.2} onChange={(value) => update('distance', value)} />
          <label className="block text-sm font-medium text-stone-600">หน่วย
            <select value={selectedObject.unit ?? 'm'} onChange={(event) => update('unit', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-[15px] outline-none transition focus:border-brand-500">
              <option value="m">เมตร</option><option value="in">นิ้ว</option>
            </select>
          </label>
        </div>
      )}
      {selectedObject.type === 'dimension' ? (
        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-5">
          <span className="text-[15px] font-medium text-stone-700">แสดงเส้นระยะ</span>
          <ToggleSwitch checked={selectedObject.visible ?? true} onChange={(value) => update('visible', value)} label="แสดงเส้นระยะ" />
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-5">
          <span className="text-[15px] font-medium text-stone-700">โปร่งใส</span>
          <ToggleSwitch checked={selectedObject.transparent ?? false} onChange={(value) => update('transparent', value)} label="ความโปร่งใส" />
        </div>
      )}
    </section>
  )
}

export default PropertiesPanel
