import { FiColumns, FiHome, FiMaximize2, FiPackage } from 'react-icons/fi'

const menuItems = [
  { id: 'room', label: 'ห้อง', icon: FiHome },
  { id: 'door-window', label: 'ประตู/หน้าต่าง', icon: FiColumns },
  { id: 'product', label: 'สินค้า', icon: FiPackage },
  { id: 'dimension', label: 'เส้นระยะ', icon: FiMaximize2 },
]

const Sidebar = ({ activeMenu, onChange }) => (
  <aside className="z-20 flex w-[104px] shrink-0 flex-col border-r border-stone-200 bg-white px-2 py-3">
    <nav className="flex h-full flex-col gap-2" aria-label="เครื่องมือออกแบบหลัก">
      {menuItems.map(({ id, label, icon: Icon }) => {
        const active = activeMenu === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`group relative flex min-h-[106px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center transition-all duration-200 active:scale-[0.97] ${active ? 'bg-brand-600 text-white shadow-[0_8px_20px_rgba(79,97,71,0.2)]' : 'text-stone-500 hover:bg-brand-50 hover:text-brand-700'}`}
          >
            <Icon size={28} className={`transition-transform duration-200 ${active ? '' : 'group-hover:-translate-y-1'}`} />
            <span className="text-[14px] font-medium leading-tight">{label}</span>
            {active && <span className="absolute -right-2 h-8 w-1 rounded-full bg-sand" />}
          </button>
        )
      })}
    </nav>
  </aside>
)

export default Sidebar
