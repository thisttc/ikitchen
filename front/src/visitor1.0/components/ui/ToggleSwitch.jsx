const ToggleSwitch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${checked ? 'bg-brand-600' : 'bg-stone-300'}`}
  >
    <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

export default ToggleSwitch
