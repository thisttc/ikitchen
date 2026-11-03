const views = [
  { id: 'isometric', label: 'Isometric' },
  { id: 'top', label: 'บน' },
  { id: 'bottom', label: 'ล่าง' },
  { id: 'front', label: 'หน้า' },
  { id: 'back', label: 'หลัง' },
  { id: 'left', label: 'ซ้าย' },
  { id: 'right', label: 'ขวา' },
]

const ViewSwitcher = ({ activeView, onChange }) => (
  <div className="flex items-center rounded-2xl border border-stone-200 bg-white/95 p-1.5 shadow-[0_8px_28px_rgba(57,65,51,0.13)] backdrop-blur">
    {views.map((view) => (
      <button
        key={view.id}
        type="button"
        onClick={() => onChange(view.id)}
        className={`min-w-[62px] rounded-xl px-3 py-2 text-sm font-medium transition active:scale-95 ${activeView === view.id ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 hover:bg-brand-50 hover:text-brand-700'}`}
      >
        {view.label}
      </button>
    ))}
  </div>
)

export default ViewSwitcher
