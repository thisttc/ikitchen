import { FiEye, FiEyeOff, FiLayers, FiLock, FiMoreHorizontal } from 'react-icons/fi'

const LayerPanel = ({ layers, onLayersChange }) => {
  const toggleVisibility = (id) => onLayersChange(layers.map((layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer))
  return (
    <section className="soft-enter">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-stone-800">เลเยอร์งานออกแบบ</h2>
          <p className="text-sm text-stone-400">จัดลำดับวัตถุบนพื้นที่</p>
        </div>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition hover:bg-brand-100"><FiLayers /></button>
      </div>
      <div className="space-y-2.5">
        {layers.map((layer, index) => (
          <div key={layer.id} className={`group flex items-center gap-3 rounded-xl border p-3 transition hover:border-brand-200 hover:bg-brand-50/40 ${index === 0 ? 'border-brand-300 bg-brand-50/60' : 'border-stone-200 bg-white'}`}>
            <button type="button" onClick={() => toggleVisibility(layer.id)} className="text-stone-400 transition hover:text-brand-700" aria-label={`แสดงหรือซ่อน ${layer.name}`}>{layer.visible ? <FiEye /> : <FiEyeOff />}</button>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-700">{layer.name}</p><p className="text-xs text-stone-400">{layer.count} รายการ</p></div>
            <FiLock className="text-stone-300" />
            <button type="button" className="text-stone-400 opacity-0 transition group-hover:opacity-100"><FiMoreHorizontal /></button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 w-full rounded-xl border border-dashed border-brand-300 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">+ เพิ่ม Layer</button>
    </section>
  )
}

export default LayerPanel
