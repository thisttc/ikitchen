import React, { useMemo, useState } from 'react'
import { FiSliders } from 'react-icons/fi'
import { productItems } from '../../data/mockData'
import CatalogItem from '../ui/CatalogItem'
import SearchInput from '../ui/SearchInput'

const ProductPanel = ({ onAddItem }) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const categories = ['ทั้งหมด', 'เตา', 'ตู้', 'อ่างล้าง', 'เครื่องดูดควัน']
  const filteredItems = useMemo(() => productItems.filter((item) => {
    const matchesCategory = category === 'ทั้งหมด' || item.category === category
    const matchesSearch = `${item.name} ${item.code}`.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [search, category])

  return (
    <section>
      <h1 className="mb-1 text-[22px] font-bold text-stone-900">สินค้า</h1>
      <p className="mb-5 text-sm text-stone-400">ค้นหาและเพิ่มอุปกรณ์ลงในแบบ</p>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><SearchInput value={search} onChange={setSearch} placeholder="ค้นหาสินค้า..." /></div>
        <button type="button" aria-label="ตัวกรองสินค้า" className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"><FiSliders /></button>
      </div>
      <div className="app-scrollbar my-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-brand-50 hover:text-brand-700'}`}>{item}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredItems.map((item) => <CatalogItem key={item.id} item={item} onAdd={onAddItem} />)}
        {!filteredItems.length && <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-400">ไม่พบสินค้าที่ค้นหา</div>}
      </div>
    </section>
  )
}

export default ProductPanel
