import { useEffect, useMemo, useState } from 'react'
import { products } from './data/demoDatabase.js'
import { closedRoom, fitObject, isEditable, makeObject, makeRoom, newDesign, objectOverlaps, openingConflict, roomBounds, snap, syncDesign, uid } from './utils/scene.js'
import { money, summarizeBoq } from './utils/boq.js'
import { downloadBlob, downloadBoqExcel } from './utils/exportDesignBoq.js'
import SceneCanvas from './components/editor/SceneCanvas.jsx'
import { BoqDialog, Catalog, Inspector, RoomTools } from './components/editor/DemoPanels.jsx'
import './App.css'

export default function EditorApp() {
  const [timeline, setTimeline] = useState(() => ({ past: [], current: newDesign(), future: [] }))
  const design = timeline.current
  const [view, setView] = useState('top'), [menu, setMenu] = useState('room'), [tool, setTool] = useState('select')
  const [selectedId, select] = useState(null), [tab, setTab] = useState('properties')
  const [dimensions, setDimensions] = useState(true), [gridSnap, setGridSnap] = useState(true), [thickness, setThickness] = useState(120)
  const [message, setMessage] = useState('เริ่มจากห้องตัวอย่าง หรือสร้างห้องใหม่ทางซ้ายได้เลย')
  const [modal, setModal] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const selected = design.objects.find(o => o.objectId === selectedId)
  const summary = useMemo(() => summarizeBoq(design.objects), [design.objects])
  const overlaps = useMemo(() => objectOverlaps(design.objects), [design.objects])
  const editable = isEditable(view)
  function commit(next) {
    setTimeline(t => ({ past: [...t.past.slice(-49), t.current], current: syncDesign(typeof next === 'function' ? next(t.current) : next), future: [] }))
  }
  function undo() {
    setTimeline(t => t.past.length ? { past: t.past.slice(0, -1), current: t.past.at(-1), future: [t.current, ...t.future] } : t)
    select(null); setTool('select'); setMessage('ย้อนกลับการแก้ไข')
  }
  function redo() {
    setTimeline(t => t.future.length ? { past: [...t.past, t.current], current: t.future[0], future: t.future.slice(1) } : t)
    select(null); setTool('select'); setMessage('ทำซ้ำการแก้ไข')
  }
  function changeView(next) { setView(next); if (next !== 'top') setTool('select') }
  function selectObject(id) { select(id); if (id) setTab('properties') }
  function place(id, at) {
    if (!editable) return setMessage('วางสินค้าได้ในมุมบนและ Isometric เท่านั้น')
    const product = products.find(p => p.productId === id)
    if (!product) return
    const b = roomBounds(design.room), pos = at ?? { x: b.x + b.width / 2, y: b.y + b.depth / 2 }
    const result = makeObject(product, design.room, gridSnap ? snap(pos.x) : pos.x, gridSnap ? snap(pos.y) : pos.y)
    if (result.error) return setMessage(result.error)
    if (openingConflict(result.object, design.objects)) return setMessage('ช่องเปิดทับตำแหน่งเดิม ลากไปวางใกล้กำแพงอีกจุดหนึ่ง')
    commit(d => ({ ...d, objects: [...d.objects, result.object], layers: d.layers.map(l => l.layerId === result.object.layerId ? { ...l, isVisible: true } : l) }))
    selectObject(result.object.objectId); setTool('select'); setMessage(`เพิ่ม ${product.productName} แล้ว — ลากย้ายหรือหมุนได้`)
  }
  function update(object) {
    if (!editable) return
    const result = fitObject(object, design.room)
    if (result.error) return setMessage(result.error)
    // Prevent overlapping openings on the same wall; equipment overlap is allowed but warned.
    if (openingConflict(result.object, design.objects)) return setMessage('ช่องเปิดซ้อนกับประตู/หน้าต่างเดิม ลองย้ายไปตำแหน่งอื่น')
    if (JSON.stringify(design.objects.find(o => o.objectId === object.objectId)) === JSON.stringify(result.object)) return
    commit(d => ({ ...d, objects: d.objects.map(o => o.objectId === object.objectId ? result.object : o) })); setMessage('อัปเดตวัตถุแล้ว')
  }
  function remove() {
    if (!selected || !editable) return
    commit(d => ({ ...d, objects: d.objects.filter(o => o.objectId !== selectedId) })); select(null); setMessage('ลบวัตถุแล้ว BOQ ปรับจำนวนตามทันที')
  }
  function duplicate() {
    if (!selected || !editable) return
    const next = { ...structuredClone(selected), objectId: uid(), xMm: selected.xMm + 250, yMm: selected.yMm + 250 }
    const result = fitObject(next, design.room)
    if (result.error) return setMessage(result.error)
    if (next.wallId) return setMessage('เพิ่มประตู/หน้าต่างอีกชิ้นจากคลัง แล้ววางที่กำแพงที่ต้องการ')
    commit(d => ({ ...d, objects: [...d.objects, result.object] })); selectObject(next.objectId); setMessage('ทำสำเนาแล้ว ลากแยกตำแหน่งได้')
  }
  function confirmNewRoom() { return !design.objects.length && !design.room.walls.length || window.confirm('สร้างห้องใหม่และล้างวัตถุในห้องเดิม? สามารถ Undo กลับได้') }
  function create(size) {
    if (!confirmNewRoom()) return
    commit(d => ({ ...d, room: makeRoom(size.width, size.depth, size.height, 0, 0, thickness), objects: [], layers: d.layers.map(l => ({ ...l, isVisible: true })) }))
    select(null); setTool('select'); setView('top'); setMessage('สร้างห้องแล้ว พร้อมลากวางสินค้า')
  }
  function draw(next, height) {
    if (!confirmNewRoom()) return
    commit(d => ({ ...d, room: { ...makeRoom(), walls: [], heightMm: height }, objects: [], layers: d.layers.map(l => ({ ...l, isVisible: true })) }))
    select(null); setView('top'); setTool(next); setMessage(next === 'rectangle' ? 'ลากในพื้นที่ทำงานเพื่อกำหนดขนาดห้อง' : 'ลากกำแพงแรก จากนั้นลากด้านต่อไปจากปลายเดิม')
  }
  useEffect(() => {
    function keyboard(e) {
      if (modal || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (e.key === 'Delete') { e.preventDefault(); remove() }
      else if (e.key === 'Escape') { select(null); setTool('select') }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  })
  async function download() {
    setBusy(true); setError('')
    try { await downloadBoqExcel({ ...design, currentView: view }); setMessage('สร้างไฟล์ BOQ แล้ว ตรวจสอบรายการดาวน์โหลดของเบราว์เซอร์') }
    catch { setError('สร้างไฟล์ไม่สำเร็จ ตรวจสอบว่าติดตั้ง exceljs ใน front แล้ว จากนั้นลองใหม่') }
    finally { setBusy(false) }
  }
  const menus = [['room', '▱', 'ห้อง'], ['products', '▦', 'สินค้า'], ['openings', '▯', 'ช่องเปิด'], ['settings', '⌖', 'การแสดงผล']]
  return <div className="ik-editor font-sans">
    <header className="ik-header"><div className="ik-logo"><span>ik.</span><div>iKitchen<small>DESIGN STUDIO</small></div></div><div className="ik-project"><input aria-label="ชื่อโครงการ" value={design.designName} maxLength={80} onChange={e => setTimeline(t => ({ ...t, current: { ...t.current, designName: e.target.value } }))} /><small><i /> FRONTEND DEMO · ไม่มี Backend</small></div>
      <div className="ik-header-actions"><button title="ย้อนกลับ Ctrl+Z" aria-label="ย้อนกลับ" disabled={!timeline.past.length} onClick={undo}>↶</button><button title="ทำซ้ำ Ctrl+Shift+Z" aria-label="ทำซ้ำ" disabled={!timeline.future.length} onClick={redo}>↷</button><button className="ik-save" onClick={() => { downloadBlob(new Blob([JSON.stringify({ ...design, currentView: view }, null, 2)], { type: 'application/json' }), 'iKitchen-design.json'); setMessage('ส่งออก JSON สำหรับเก็บข้อมูลแล้ว — รุ่นนี้ยังไม่มีเมนูนำเข้า JSON') }}>บันทึก JSON</button><button className="ik-primary" onClick={() => { setModal(true); setError('') }}>สรุป / BOQ ↗</button></div>
    </header>
    <div className="ik-body"><nav className="ik-nav" aria-label="เครื่องมือหลัก">{menus.map(([id, icon, name]) => <button key={id} aria-pressed={menu === id} onClick={() => { setMenu(id); if (id !== 'room') setTool('select') }}><span>{icon}</span><small>{name}</small></button>)}<div className="ik-nav-bottom">DEMO<br />2.0</div></nav>
      <aside className="ik-tools"><div className="ik-panel-scroll">{menu === 'room' ? <RoomTools key={design.room.roomId} design={design} onCreate={create} onDraw={draw} onResume={() => { setView('top'); setTool('wall') }} tool={tool} thickness={thickness} setThickness={setThickness} /> : menu === 'settings' ? <><div className="ik-panel-heading"><small>WORKSPACE</small><h2>การแสดงผล</h2><p>เปลี่ยนการแสดงผล ไม่เปลี่ยนขนาดจริง</p></div><label className="ik-check"><input type="checkbox" checked={dimensions} onChange={e => setDimensions(e.target.checked)} />แสดงขนาดห้อง</label><label className="ik-check"><input type="checkbox" checked={gridSnap} onChange={e => setGridSnap(e.target.checked)} />Snap สินค้าทุก 50 mm</label><label className="ik-field"><span>หน่วยเส้นระยะ</span><select value={design.displayUnit} onChange={e => commit(d => ({ ...d, displayUnit: e.target.value }))}><option value="m">เมตร</option><option value="inch">นิ้ว</option></select></label><p className="ik-footnote">ค่าขนาดในฟอร์มและไฟล์โครงการเก็บเป็น mm เสมอ • มุมอื่นนอกจากมุมบนและ Isometric เป็นมุมดูแบบ • กำแพงโปร่งเพื่อเห็นอุปกรณ์ภายใน</p></> : <Catalog key={menu} openings={menu === 'openings'} onPlace={place} canPlace={editable && closedRoom(design.room)} />}</div></aside>
      <SceneCanvas design={design} view={view} setView={changeView} tool={tool} setTool={setTool} selectedId={selectedId} select={selectObject} onMove={update} onPlace={place} onRoom={room => commit(d => ({ ...d, room }))} onMessage={setMessage} showDimensions={dimensions} gridSnap={gridSnap} wallThickness={thickness} />
      <Inspector design={design} selected={selected} update={update} remove={remove} duplicate={duplicate} tab={tab} setTab={setTab} editable={editable} select={selectObject} toggleLayer={id => { commit(d => ({ ...d, layers: d.layers.map(l => l.layerId === id ? { ...l, isVisible: !l.isVisible } : l) })); if (selected?.layerId === id) select(null) }} />
    </div><footer className="ik-status"><span role="status">{message}</span><div>{overlaps.length > 0 && <span className="ik-overlap">⚠ วัตถุทับซ้อน {overlaps.length} คู่</span>}<b>{summary.count} ชิ้น</b><span>฿{money(summary.knownTotalSatang)}{summary.missingPriceCount > 0 ? ' + รอราคา' : ''}</span></div></footer>
    {modal && <BoqDialog design={design} summary={summary} close={() => setModal(false)} download={download} busy={busy} error={error} />}
  </div>
}
