import { FiCornerUpLeft, FiCornerUpRight, FiFileText, FiMoreHorizontal, FiUpload } from 'react-icons/fi'

const ActionButton = ({ children, icon, onClick, disabled = false, primary = false, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`group flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${primary ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
  >
    <span className="text-lg transition-transform group-hover:-translate-y-0.5">{icon}</span>
    {children}
  </button>
)

const Header = ({ canUndo, canRedo, onUndo, onRedo, onSummary, onExport }) => (
  <header className="relative z-30 flex h-[68px] shrink-0 items-center border-b border-stone-200 bg-white px-5 shadow-[0_1px_12px_rgba(36,44,32,0.04)]">
    <div className="flex w-[430px] items-center gap-7">
      <div className="select-none text-[29px] font-bold tracking-[-0.04em]">
        <span className="text-[#4d9aa5]">i</span><span className="text-[#70bd62]">Kitchen</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.13)]" />
        ยังไม่ได้บันทึก
      </div>
    </div>

    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
      <ActionButton icon={<FiCornerUpLeft />} onClick={onUndo} disabled={!canUndo} label="ย้อนกลับ">ย้อนกลับ</ActionButton>
      <ActionButton icon={<FiCornerUpRight />} onClick={onRedo} disabled={!canRedo} label="ทำซ้ำ">ทำซ้ำ</ActionButton>
    </div>

    <div className="ml-auto flex items-center gap-1.5">
      <ActionButton icon={<FiFileText />} onClick={onSummary} label="ดูสรุปรายการ">สรุป</ActionButton>
      <ActionButton icon={<FiUpload />} onClick={onExport} primary label="ส่งออกงานออกแบบ">ส่งออก</ActionButton>
      <ActionButton icon={<FiMoreHorizontal />} label="เมนูเพิ่มเติม" />
    </div>
  </header>
)

export default Header
