import DimensionPanel from '../panels/DimensionPanel'
import DoorWindowPanel from '../panels/DoorWindowPanel'
import ProductPanel from '../panels/ProductPanel'
import RoomPanel from '../panels/RoomPanel'

const ToolPanel = ({ activeMenu, unit, onUnitChange, onAddItem, dimensionSettings, onDimensionChange }) => (
  <aside className="app-scrollbar z-10 w-[350px] shrink-0 overflow-y-auto border-r border-stone-200 bg-[#fdfcf9] p-5">
    <div key={activeMenu} className="soft-enter">
      {activeMenu === 'room' && <RoomPanel unit={unit} onUnitChange={onUnitChange} />}
      {activeMenu === 'door-window' && <DoorWindowPanel onAddItem={onAddItem} />}
      {activeMenu === 'product' && <ProductPanel onAddItem={onAddItem} />}
      {activeMenu === 'dimension' && (
        <DimensionPanel
          unit={unit}
          onUnitChange={onUnitChange}
          settings={dimensionSettings}
          onSettingChange={onDimensionChange}
        />
      )}
    </div>
  </aside>
)

export default ToolPanel
