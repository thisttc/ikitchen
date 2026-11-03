import LayerPanel from '../panels/LayerPanel'
import PropertiesPanel from '../panels/PropertiesPanel'

const RightPanel = ({ activeTab, onTabChange, selectedObject, onUpdateObject, layers, onLayersChange }) => (
  <aside className="z-10 flex w-[350px] shrink-0 flex-col border-l border-stone-200 bg-white">
    <div className="grid h-[62px] shrink-0 grid-cols-2 border-b border-stone-200 px-4">
      {[
        { id: 'properties', label: 'คุณสมบัติ' },
        { id: 'layers', label: 'Layer' },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`relative text-[16px] font-semibold transition ${activeTab === tab.id ? 'text-brand-700' : 'text-stone-400 hover:text-stone-700'}`}
        >
          {tab.label}
          {activeTab === tab.id && <span className="absolute inset-x-7 bottom-0 h-[3px] rounded-full bg-sand" />}
        </button>
      ))}
    </div>
    <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
      {activeTab === 'properties' ? (
        <PropertiesPanel selectedObject={selectedObject} onUpdateObject={onUpdateObject} />
      ) : (
        <LayerPanel layers={layers} onLayersChange={onLayersChange} />
      )}
    </div>
  </aside>
)

export default RightPanel
