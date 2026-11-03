import { FiBox, FiColumns, FiGrid, FiPlus } from 'react-icons/fi'

const CatalogItem = ({ item, onAdd }) => (
  <article className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_10px_28px_rgba(56,70,50,0.09)]">
    <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.tone}22`, color: item.tone }}>
      {item.type === 'product' ? <FiBox size={27} /> : item.type === 'window' ? <FiGrid size={27} /> : <FiColumns size={27} />}
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-[15px] font-semibold text-stone-800">{item.name}</h3>
      <p className="text-xs text-stone-400">{item.code}</p>
      <p className="text-xs text-stone-500">{item.size}</p>
      {item.price && <p className="mt-0.5 text-sm font-semibold text-brand-700">฿{item.price.toLocaleString()}</p>}
    </div>
    <button
      type="button"
      onClick={() => onAdd(item)}
      aria-label={`เพิ่ม ${item.name}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 text-brand-600 transition hover:scale-105 hover:bg-brand-600 hover:text-white active:scale-95"
    >
      <FiPlus size={21} />
    </button>
  </article>
)

export default CatalogItem
