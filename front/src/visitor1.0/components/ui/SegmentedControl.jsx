const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`flex rounded-xl border border-stone-200 bg-stone-100 p-1 ${className}`}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${value === option.value ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

export default SegmentedControl
