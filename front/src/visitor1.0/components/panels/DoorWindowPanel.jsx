import React, { useMemo, useState } from 'react'
import { doorItems } from '../../data/mockData'
import CatalogItem from '../ui/CatalogItem'
import SearchInput from '../ui/SearchInput'

const DoorWindowPanel = ({ onAddItem }) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const filteredItems = useMemo(() => doorItems.filter((item) => {
    const matchesCategory = category === 'all' || item.type === category
    const matchesSearch = `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [search, category])

  return (
    <section>
      <h1 className="mb-1 text-[22px] font-bold text-stone-900">ประตูและหน้าต่าง</h1>
      <p className="mb-5 text-sm text-stone-400">เลือกช่องเปิดที่ต้องการใช้ในห้อง</p>
      <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาแบบ..." />
      <div className="my-4 flex gap-2">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'door', label: 'ประตู' },
          { id: 'window', label: 'หน้าต่าง' },
        ].map((item) => (
          <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === item.id ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-brand-50 hover:text-brand-700'}`}>{item.label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredItems.map((item) => <CatalogItem key={item.id} item={item} onAdd={onAddItem} />)}
        {!filteredItems.length && <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-400">ไม่พบแบบที่ค้นหา</div>}
      </div>
    </section>
  )
}

export default DoorWindowPanel
