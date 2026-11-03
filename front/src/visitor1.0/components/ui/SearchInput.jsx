import { FiSearch } from 'react-icons/fi'

const SearchInput = ({ value, onChange, placeholder }) => (
  <label className="flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-100">
    <FiSearch className="text-lg text-stone-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-stone-400"
    />
  </label>
)

export default SearchInput
