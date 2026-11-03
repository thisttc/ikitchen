import { useEffect, useMemo, useRef, useState } from 'react'
import { products } from './data/demoDatabase.js'
import { closedRoom, DEFAULT_ISOMETRIC_CAMERA, emptyRoom, fitObject, isEditable, makeObject, makeRoom, newDesign, objectOverlaps, openingConflict, resizeDesignRoom, roomBounds, snap, syncDesign, uid } from './utils/scene.js'
import { MAX_IMPORT_BYTES, parseDesignJSON } from './utils/importDesign.js'
import { money, summarizeBoq } from './utils/boq.js'
import { downloadBlob, downloadBoqExcel } from './utils/exportDesignBoq.js'
import SceneCanvas from './components/editor/SceneCanvas.jsx'
import { BoqDialog, Catalog, DimensionTools, Inspector, RoomTools } from './components/editor/DemoPanels.jsx'
import './App.css'

export default function EditorApp() {
  const [timeline, setTimeline] = useState(() => ({ past: [], current: newDesign(), future: [] }))
  const design = timeline.current
  const [view, setView] = useState('top'), [menu, setMenu] = useState('room'), [tool, setTool] = useState('select')
  const [camera, setCamera] = useState(() => ({ ...DEFAULT_ISOMETRIC_CAMERA }))
  const [selectedId, select] = useState(null), [tab, setTab] = useState('properties'), [cameraKey, resetCamera] = useState(0)
  const [dimensions, setDimensions] = useState(true), [wallDimensions, setWallDimensions] = useState(false), [gridSnap, setGridSnap] = useState(true), [thickness, setThickness] = useState(120)
  const [message, setMessage] = useState('สร้างห้องทางซ้าย หรือ Import งานออกแบบจากแถบด้านบน')
  const [modal, setModal] = useState(false), [busy, setBusy] = useState(false), [pdfBusy, setPdfBusy] = useState(false), [importBusy, setImportBusy] = useState(false), [error, setError] = useState(''), [exportOpen, setExportOpen] = useState(false)
  const fileRef = useRef(null), exportRef = useRef(null)
  const selected = design.objects.find(o => o.objectId === selectedId)
  const summary = useMemo(() => summarizeBoq(design.objects), [design.objects])
  const overlaps = useMemo(() => objectOverlaps(design.objects), [design.objects])
  const editable = isEditable(view)
  function commit(next) {
    setTimeline(t => ({ past: [...t.past.slice(-49), t.current], current: syncDesign(typeof next === 'function' ? next(t.current) : next), future: [] }))
  }
  function undo() {
    setTimeline(t => t.past.length ? { past: t.past.slice(0, -1), current: t.past.at(-1), future: [t.current, ...t.future] } : t)
    select(null); setTool('select'); resetCamera(k => k + 1); setMessage('ย้อนกลับการแก้ไข')
  }
  function redo() {
    setTimeline(t => t.future.length ? { past: [...t.past, t.current], current: t.future[0], future: t.future.slice(1) } : t)
    select(null); setTool('select'); resetCamera(k => k + 1); setMessage('ทำซ้ำการแก้ไข')
  }
  function changeView(next) { setView(next); if (next !== 'top') setTool('select') }
  function selectObject(id) { select(id); if (id) setTab('properties') }
  function place(id, at) {
    if (!editable) return setMessage('วางสินค้าได้ในมุมบนและ Isometric เท่านั้น')
    if (design.objects.length >= 500) return setMessage('งานหนึ่งรองรับวัตถุได้ไม่เกิน 500 ชิ้น')
    const product = products.find(p => p.productId === id)
    if (!product) return
    const b = roomBounds(design.room), pos = at ?? { x: b.x + b.width / 2, y: b.y + b.depth / 2 }
    const result = makeObject(product, design.room, gridSnap ? snap(pos.x) : pos.x, gridSnap ? snap(pos.y) : pos.y)
    if (result.error) return setMessage(result.error)
    if (openingConflict(result.object, design.objects)) return setMessage('ช่องเปิดทับตำแหน่งเดิม ลากไปวางใกล้กำแพงอีกจุดหนึ่ง')
    commit(d => ({ ...d, objects: [...d.objects, result.object], layers: d.layers.map(l => l.layerId === result.object.layerId ? { ...l, isVisible: true } : l) }))
    selectObject(result.object.objectId); setTool('select'); setMessage('เพิ่ม ' + product.productName + ' แล้ว — ลากย้ายหรือหมุนได้')
  }
  function update(candidate) {
    if (!editable) return
    const old = design.objects.find(o => o.objectId === candidate.objectId)
    if (!old || ![candidate.xMm, candidate.yMm, candidate.rotationDeg].every(Number.isFinite) || candidate.rotationDeg % 90 !== 0) return
    // Only placement can change here: keep catalog dimensions, elevation and specifications intact.
    const result = fitObject({ ...old, xMm: candidate.xMm, yMm: candidate.yMm, rotationDeg: candidate.rotationDeg }, design.room)
    if (result.error) return setMessage(result.error)
    if (openingConflict(result.object, design.objects)) return setMessage('ช่องเปิดซ้อนกับประตู/หน้าต่างเดิม ลองย้ายไปตำแหน่งอื่น')
    if (JSON.stringify(old) === JSON.stringify(result.object)) return
    commit(d => ({ ...d, objects: d.objects.map(o => o.objectId === old.objectId ? result.object : o) })); setMessage('อัปเดตตำแหน่งวัตถุแล้ว')
  }
  function remove() {
    if (!selected || !editable) return
    commit(d => ({ ...d, objects: d.objects.filter(o => o.objectId !== selectedId) })); select(null); setMessage('ลบวัตถุแล้ว BOQ ปรับจำนวนตามทันที')
  }
  function duplicate() {
    if (!selected || !editable || selected.wallId) return
    if (design.objects.length >= 500) return setMessage('งานหนึ่งรองรับวัตถุได้ไม่เกิน 500 ชิ้น')
    const next = { ...structuredClone(selected), objectId: uid(), xMm: selected.xMm + 250, yMm: selected.yMm + 250 }
    const result = fitObject(next, design.room)
    if (result.error) return setMessage(result.error)
    commit(d => ({ ...d, objects: [...d.objects, result.object] })); selectObject(next.objectId); setMessage('ทำสำเนาแล้ว ลากแยกตำแหน่งได้')
  }
  function confirmNewRoom() { return (!design.objects.length && !design.room.walls.length) || window.confirm('สร้างห้องใหม่และล้างวัตถุในห้องเดิม? สามารถ Undo กลับได้') }
  function create(size) {
    if (!confirmNewRoom()) return
    commit(d => ({ ...d, room: makeRoom(size.width, size.depth, size.height, 0, 0, size.thickness), objects: [], layers: d.layers.map(l => ({ ...l, isVisible: true })) }))
    setThickness(size.thickness); select(null); setTool('select'); setView('top'); setCamera({ ...DEFAULT_ISOMETRIC_CAMERA }); resetCamera(k => k + 1); setMessage('สร้างห้องแล้ว พร้อมลากวางสินค้า')
  }
  function resize(size) {
    const result = resizeDesignRoom(design, size)
    if (result.error) return setMessage(result.error)
    commit(result.design); setThickness(size.thickness); resetCamera(k => k + 1)
    setMessage('ปรับขนาดห้องแล้ว เก็บวัตถุเดิมครบ' + (result.movedCount ? ' · ขยับเข้าขอบห้อง ' + result.movedCount + ' ชิ้น' : ''))
  }
  function draw(next, size) {
    if (!confirmNewRoom()) return
    commit(d => ({ ...d, room: emptyRoom(size.height), objects: [], layers: d.layers.map(l => ({ ...l, isVisible: true })) }))
    setThickness(size.thickness); select(null); setView('top'); setTool(next); setCamera({ ...DEFAULT_ISOMETRIC_CAMERA }); resetCamera(k => k + 1)
    setMessage(next === 'rectangle' ? 'ลากในพื้นที่ทำงานเพื่อกำหนดขนาดห้อง' : 'ลากกำแพงแรก จากนั้นลากด้านต่อไปจากปลายเดิม')
  }
  async function importFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportBusy(true)
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('ไฟล์ JSON ต้องมีขนาดไม่เกิน 5 MB')
      const next = parseDesignJSON(await file.text())
      if ((design.room.walls.length || design.objects.length) && !window.confirm('นำเข้างานนี้แทนงานปัจจุบัน? สามารถ Undo กลับได้')) { setMessage('ยกเลิกการนำเข้า'); return }
      commit(next); select(null); setTool('select'); setView(next.currentView); setCamera(next.isometricCamera); setThickness(next.room.walls[0]?.thicknessMm ?? 120); resetCamera(k => k + 1)
      setMessage('นำเข้า ' + next.designName + ' แล้ว · ' + next.objects.length + ' ชิ้น')
    } catch (e) { setMessage('นำเข้าไม่สำเร็จ: ' + e.message) }
    finally { setImportBusy(false); event.target.value = '' }
  }
  useEffect(() => {
    const outside = e => { if (!exportRef.current?.contains(e.target)) setExportOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  useEffect(() => {
    function keyboard(e) {
      if (e.key === 'Escape') setExportOpen(false)
      if (modal || importBusy || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return
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
    try { await downloadBoqExcel({ ...design, currentView: view, isometricCamera: camera }); setMessage('สร้างไฟล์ BOQ แล้ว ตรวจสอบรายการดาวน์โหลดของเบราว์เซอร์') }
    catch { setError('สร้างไฟล์ไม่สำเร็จ ตรวจสอบว่าติดตั้ง exceljs ใน front แล้ว จากนั้นลองใหม่') }
    finally { setBusy(false) }
  }
  async function downloadPdf() {
    setExportOpen(false); setPdfBusy(true); setMessage('กำลังสร้างรายงาน PDF…')
    try { const { downloadDesignPdf } = await import('./utils/exportDesignPdf.jsx'); await downloadDesignPdf({ ...design, currentView: view, isometricCamera: camera }); setMessage('สร้าง PDF แล้ว ตรวจสอบรายการดาวน์โหลดของเบราว์เซอร์') }
    catch { setMessage('สร้าง PDF ไม่สำเร็จ ตรวจสอบว่าติดตั้ง jspdf และคัดลอกโฟลเดอร์ assets ครบ แล้วลองใหม่') }
    finally { setPdfBusy(false) }
  }
  function save() {
    downloadBlob(new Blob([JSON.stringify({ ...design, designName: design.designName.trim() || 'ครัวของฉัน', currentView: view, isometricCamera: camera }, null, 2)], { type: 'application/json' }), 'iKitchen-design.json')
    setMessage('บันทึก JSON แล้ว ใช้ปุ่ม Import เพื่อนำกลับมาออกแบบต่อ')
  }
  const bounds = roomBounds(design.room), roomKey = [design.room.roomId, bounds.width, bounds.depth, design.room.heightMm, design.room.walls[0]?.thicknessMm ?? thickness].join('-')
  const menus = [['room', '▱', 'ห้อง'], ['openings', '▯', 'ช่องเปิด'], ['products', '▦', 'สินค้า'], ['dimensions', '⌖', 'เส้นระยะ']]
  const changeUnit = unit => commit(d => ({ ...d, displayUnit: unit }))
  return <div className="ik-editor font-sans">
    <header className="ik-header"><div className="ik-logo"><span>ik.</span><div>iKitchen</div></div><div className="ik-project"><input aria-label="ชื่อโครงการ" value={design.designName} maxLength={80} onChange={e => setTimeline(t => ({ ...t, current: { ...t.current, designName: e.target.value } }))} /></div>
      <div className="ik-header-actions"><button title="ย้อนกลับ Ctrl+Z" aria-label="ย้อนกลับ" disabled={!timeline.past.length || importBusy} onClick={undo}>↶</button><button title="ทำซ้ำ Ctrl+Shift+Z" aria-label="ทำซ้ำ" disabled={!timeline.future.length || importBusy} onClick={redo}>↷</button>
        <input ref={fileRef} className="ik-import-input" type="file" accept=".json,application/json" aria-label="เลือกไฟล์งาน JSON" disabled={importBusy} onChange={importFile} />
        <button disabled={importBusy} onClick={() => fileRef.current.click()}>{importBusy ? 'กำลังนำเข้า…' : 'Import'}</button><button className="ik-save" onClick={save}>บันทึก JSON</button>
        <div className="ik-export-menu" ref={exportRef}><button className="ik-primary" aria-expanded={exportOpen} aria-controls="ik-export-options" disabled={pdfBusy || importBusy} onClick={() => setExportOpen(v => !v)}>{pdfBusy ? 'กำลังสร้าง PDF…' : 'ส่งออก ▾'}</button>
          {exportOpen && <div id="ik-export-options" className="ik-export-options"><button onClick={() => { setModal(true); setError(''); setExportOpen(false) }}>BOQ <small>สรุปรายการและดาวน์โหลด Excel</small></button><button disabled={!closedRoom(design.room)} title={!closedRoom(design.room) ? 'สร้างห้องให้ครบก่อนส่งออก PDF' : 'รายงานห้องและรายการสินค้า'} onClick={downloadPdf}>PDF <small>แบบห้องมุมบนและ Isometric</small></button></div>}
        </div>
      </div>
    </header>
    <div className="ik-body"><nav className="ik-nav" aria-label="เครื่องมือหลัก">{menus.map(([id, icon, name]) => <button key={id} aria-pressed={menu === id} onClick={() => { setMenu(id); if (id !== 'room') setTool('select') }}><span>{icon}</span><small>{name}</small></button>)}</nav>
      <aside className="ik-tools"><div className="ik-panel-scroll">{menu === 'room' ? <RoomTools key={roomKey} design={design} onCreate={create} onResize={resize} onDraw={draw} onResume={() => { setView('top'); setTool('wall') }} tool={tool} thickness={thickness} onUnitChange={changeUnit} /> : menu === 'dimensions' ? <DimensionTools unit={design.displayUnit} onUnitChange={changeUnit} dimensions={dimensions} setDimensions={setDimensions} wallDimensions={wallDimensions} setWallDimensions={setWallDimensions} gridSnap={gridSnap} setGridSnap={setGridSnap} /> : <Catalog key={menu} openings={menu === 'openings'} onPlace={place} canPlace={editable && closedRoom(design.room)} />}</div></aside>
      <SceneCanvas key={cameraKey} design={design} view={view} setView={changeView} camera={camera} setCamera={setCamera} tool={tool} setTool={setTool} selectedId={selectedId} select={selectObject} onMove={update} onPlace={place} onRoom={room => commit(d => ({ ...d, room }))} onMessage={setMessage} showDimensions={dimensions} wallDimensions={wallDimensions} gridSnap={gridSnap} wallThickness={thickness} />
      <Inspector design={design} selected={selected} update={update} remove={remove} duplicate={duplicate} tab={tab} setTab={setTab} editable={editable} select={selectObject}
        toggleWall={id => commit(d => ({ ...d, room: { ...d.room, walls: d.room.walls.map(w => w.wallId === id ? { ...w, isVisible: w.isVisible === false } : w) } }))}
        toggleLayer={id => { commit(d => ({ ...d, layers: d.layers.map(l => l.layerId === id ? { ...l, isVisible: !l.isVisible } : l) })); if (selected?.layerId === id) select(null) }} />
    </div><footer className="ik-status"><span role="status">{message}</span><div>{overlaps.length > 0 && <span className="ik-overlap">⚠ วัตถุทับซ้อน {overlaps.length} คู่</span>}<b>{summary.count} ชิ้น</b><span>฿{money(summary.knownTotalSatang)}{summary.missingPriceCount > 0 ? ' + รอราคา' : ''}</span></div></footer>
    {modal && <BoqDialog design={design} summary={summary} close={() => setModal(false)} download={download} busy={busy} error={error} />}
  </div>
}
