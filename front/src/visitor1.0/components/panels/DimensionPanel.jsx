import ToggleSwitch from '../ui/ToggleSwitch'
import SegmentedControl from '../ui/SegmentedControl'

const SettingRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3.5 transition hover:border-brand-200">
    <span className="text-[15px] font-medium text-stone-700">{label}</span>
    <ToggleSwitch checked={checked} onChange={onChange} label={label} />
  </div>
)

const DimensionPanel = ({ unit, onUnitChange, settings, onSettingChange }) => (
  <section>
    <h1 className="mb-1 text-[22px] font-bold text-stone-900">เส้นบอกระยะ</h1>
    <p className="mb-6 text-sm text-stone-400">กำหนดรายละเอียดที่แสดงบนพื้นที่ออกแบบ</p>
    <SettingRow label="แสดงเส้นบอกระยะ" checked={settings.visible} onChange={(value) => onSettingChange('visible', value)} />
    <h2 className="mb-3 mt-6 text-[16px] font-semibold">รายการที่แสดง</h2>
    <div className="space-y-3">
      <SettingRow label="ความยาวผนัง" checked={settings.wallLength} onChange={(value) => onSettingChange('wallLength', value)} />
      <SettingRow label="มุมระหว่างผนัง" checked={settings.wallAngle} onChange={(value) => onSettingChange('wallAngle', value)} />
    </div>
    <h2 className="mb-3 mt-6 text-[16px] font-semibold">หน่วย</h2>
    <SegmentedControl options={[{ value: 'meter', label: 'เมตร' }, { value: 'inch', label: 'นิ้ว' }]} value={unit} onChange={onUnitChange} />
  </section>
)

export default DimensionPanel
