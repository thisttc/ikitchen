import { useEffect, useRef, useState } from 'react'
import { categories, products } from '../../data/demoDatabase.js'
import { productImageUrl } from '../../data/productImages.js'
import { closedRoom, formatLength, fromInputUnit, openingObject, roomBounds, toInputUnit, units, wallLabel } from '../../utils/scene.js'
import { dataWarnings, money, statusText, waterTypes } from '../../utils/boq.js'

export function ProductArt({ product: p }) {
  const src = productImageUrl(p.imageUrl ?? p.faceImages?.front)
  return src ? <img src={src} alt={p.productName} draggable={false} className="ik-product-art" /> : <span className="ik-product-no-image">ไม่มีภาพ</span>
}

export function NumberField({ label, value, onCommit, min = 0, max = 15000, step = 50 }) {
  return <label className="ik-field"><span>{label}</span><input type="number" key={value} defaultValue={value} min={min} max={max} step={step}
    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={e => {
      const raw = e.currentTarget.value.trim(), v = Number(raw)
      e.currentTarget.value = value
      if (raw && Number.isFinite(v) && v >= min && v <= max) onCommit(v)
    }} /></label>
}

export function Catalog({ openings, onPlace, canPlace }) {
  const [query, setQuery] = useState(''), [category, setCategory] = useState('all')
  const filtered = products.filter(p => (openings ? p.kind !== 'product' : p.kind === 'product') && (category === 'all' || p.categoryId === category)
    && `${p.productName} ${p.model}`.toLowerCase().includes(query.toLowerCase()))
  return <><div className="ik-panel-heading"><small>PRODUCT CATALOG</small><h2>{openings ? 'ช่องเปิดห้อง' : 'คลังสินค้า'}</h2>
    {/* <p>{openings ? 'ชุดทดลองนี้มีเฉพาะสินค้าสองรุ่น ยังไม่มีรายการช่องเปิด' : 'ลากเข้าห้อง หรือกด + เพื่อวางกลางห้อง'}</p> */}
  </div>
    <div className="ik-catalog-filters"><input aria-label="ค้นหาสินค้า" placeholder="ค้นหาชื่อ / รุ่น…" value={query} onChange={e => setQuery(e.target.value)} />
      {!openings && <select aria-label="หมวดหมู่สินค้า" value={category} onChange={e => setCategory(e.target.value)}><option value="all">ทุกหมวดหมู่</option>{categories.filter(c => c.categoryId !== 'openings').map(c => <option value={c.categoryId} key={c.categoryId}>{c.categoryName}</option>)}</select>}</div>
    <div className="ik-product-list">{filtered.map(p => <article key={p.productId} className="ik-product-card" draggable={canPlace} data-product-id={p.productId}
      onDragStart={e => { e.dataTransfer.setData('application/ikitchen-product', p.productId); e.dataTransfer.effectAllowed = 'copy' }}>
      <div className="ik-product-image"><ProductArt product={p} /><span>{p.model}</span></div>
      <div className="ik-product-info"><h3>{p.productName}</h3><small>{p.widthMm} × {p.depthMm} × {p.heightMm} mm</small><div><strong>{p.unitPriceSatang == null ? '6000 บาท': `฿${money(p.unitPriceSatang)}`}</strong><button disabled={!canPlace} onClick={() => onPlace(p.productId)} aria-label={`เพิ่ม ${p.productName}`} title="วางกลางห้อง">+</button></div></div>
    </article>)}{!filtered.length && <p className="ik-empty">ไม่พบสินค้า</p>}</div>
    {/* <p className="ik-footnote">ภาพถ่ายตัวอย่างสำหรับทดลองวาง ขนาดเป็นค่าจำลอง</p> */}
  </>
}

export function RoomTools({ design, onCreate, onResize, onDraw, onResume, tool, thickness, onUnitChange }) {
  const b = roomBounds(design.room)
  const closed = closedRoom(design.room), unit = design.displayUnit, u = units[unit]
  const [size, setSize] = useState({ width: closed ? b.width : 4200, depth: closed ? b.depth : 3600, height: design.room.heightMm, thickness: design.room.walls[0]?.thicknessMm ?? thickness })
  return <>
    <label className="ik-field"><span>หน่วยกรอกขนาดห้อง</span><select value={unit} onChange={e => onUnitChange(e.target.value)}>{Object.entries(units).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
    <div className="ik-form-grid">{[['width', 'กว้าง', 1000, 15000], ['depth', 'ลึก', 1000, 15000], ['height', 'สูง', 2200, 6000], ['thickness', 'หนาผนัง', 50, 500]].map(([id, label, min, max]) => <NumberField key={`${id}-${unit}`} label={`${label} (${u.short})`} value={toInputUnit(size[id], unit)} min={toInputUnit(min, unit)} max={toInputUnit(max, unit)} step={unit === 'm' ? .01 : unit === 'cm' ? 1 : .1} onCommit={v => setSize(s => ({ ...s, [id]: fromInputUnit(v, unit) }))} />)}</div>
    <button className="ik-primary ik-full" onClick={() => closed ? onResize(size) : onCreate(size)}>{closed ? 'ปรับขนาดห้อง' : 'สร้างห้องตามขนาด'}</button>
    {closed && <button className="ik-full ik-new-room" onClick={() => onCreate(size)}>สร้างห้องใหม่</button>}
    <div className="ik-divider" /><h3 className="ik-subheading">หรือวาดบนพื้นที่ทำงาน</h3>
    <button className={`ik-tool-card ${tool === 'rectangle' ? 'active' : ''}`} onClick={() => onDraw('rectangle', size)}><span>▱</span><div><strong>ลากพื้นที่สี่เหลี่ยม</strong><small>กดค้าง → ลาก → ปล่อย</small></div></button>
    <button className={`ik-tool-card ${tool === 'wall' ? 'active' : ''}`} onClick={() => onDraw('wall', size)}><span>⌜</span><div><strong>วาดกำแพงทีละด้าน</strong><small>ต่อ 4 ด้าน · มุมฉาก · ช่วยปิดรูป</small></div></button>
    {design.room.walls.length > 0 && design.room.walls.length < 4 && <button className="ik-primary ik-full" onClick={onResume}>วาดต่อจากปลายกำแพงเดิม</button>}
  </>
}

export function DimensionTools({ unit, onUnitChange, dimensions, setDimensions, wallDimensions, setWallDimensions, gridSnap, setGridSnap }) {
  return <><div className="ik-panel-heading"><small>DIMENSIONS</small><h2>เส้นระยะ</h2><p>เลือกหน่วยและเส้นวัดที่ต้องการแสดง</p></div>
    <label className="ik-field"><span>หน่วยเส้นระยะ</span><select value={unit} onChange={e => onUnitChange(e.target.value)}>{Object.entries(units).map(([id, u]) => <option key={id} value={id}>{u.label}</option>)}</select></label>
    <label className="ik-check"><input type="checkbox" checked={dimensions} onChange={e => setDimensions(e.target.checked)} />แสดงขนาดห้อง</label>
    <label className="ik-check"><input type="checkbox" checked={wallDimensions} onChange={e => setWallDimensions(e.target.checked)} />แสดงความยาวแต่ละผนัง</label>
    <label className="ik-check"><input type="checkbox" checked={gridSnap} onChange={e => setGridSnap(e.target.checked)} />จัดตำแหน่งสินค้าทุก {formatLength(50, unit)}</label>
  </>
}

export function Inspector({ design, selected, update, remove, duplicate, tab, setTab, toggleLayer, toggleWall, select, editable }) {
  const p = selected?.productSnapshot, warnings = p ? dataWarnings(p) : []
  return <aside className="ik-inspector"><div className="ik-inspector-tabs"><button aria-pressed={tab === 'properties'} onClick={() => setTab('properties')}>คุณสมบัติ</button><button aria-pressed={tab === 'layers'} onClick={() => setTab('layers')}>Layers</button></div>
    <div className="ik-panel-scroll">{tab === 'layers' ? <>
      <h3 className="ik-subheading">องค์ประกอบงานออกแบบ</h3><p className="ik-footnote">ซ่อนจากภาพเท่านั้น — BOQ ยังนับทุกชิ้น</p>
      {design.layers.map(l => l.layerId === 'room' ? <details className="ik-wall-group" key={l.layerId} open><summary><label onClick={e => e.stopPropagation()}><input aria-label="ผนังห้องทั้งหมด" type="checkbox" checked={l.isVisible} onChange={() => toggleLayer(l.layerId)} />ผนังห้อง</label><span>{design.room.walls.length} ด้าน ▾</span></summary>
        {design.room.walls.map((w, i) => <label className="ik-wall-toggle" key={w.wallId}><input type="checkbox" disabled={!l.isVisible} checked={w.isVisible !== false} onChange={() => toggleWall(w.wallId)} />{wallLabel(w, i)}</label>)}
        {!design.room.walls.length && <p className="ik-footnote">ยังไม่มีผนัง</p>}
      </details> : <div className="ik-layer" key={l.layerId}><label><input type="checkbox" checked={l.isVisible} onChange={() => toggleLayer(l.layerId)} />{l.layerName}</label><span>{design.objects.filter(o => o.layerId === l.layerId).length}</span></div>)}
      {design.objects.map((o, i) => <button className={`ik-object-row ${selected?.objectId === o.objectId ? 'active' : ''}`} key={o.objectId} disabled={!design.layers.find(l => l.layerId === o.layerId)?.isVisible} onClick={() => { select(o.objectId); setTab('properties') }}><span>{String(i + 1).padStart(2, '0')}</span><div>{o.productSnapshot.productName}<small>{o.productSnapshot.model}</small></div></button>)}
    </> : p ? <>
      <div className="ik-selected-product"><ProductArt product={p} /><small>{p.categoryName}</small><h2>{p.productName}</h2><p>{p.manufacturer} · {p.model}</p><strong>{p.unitPriceSatang == null ? 'ยังไม่ระบุราคา' : `฿${money(p.unitPriceSatang)}`}</strong></div>
      {!editable && <p className="ik-notice">มุมนี้ดูแบบเท่านั้น สลับมุมบนหรือ Isometric เพื่อแก้ไข</p>}
      <h3 className="ik-subheading">ขนาดและตำแหน่ง</h3><dl className="ik-readonly-grid">
        {[['widthMm', 'กว้าง', p.widthMm], ['depthMm', 'ลึก', p.depthMm], ['heightMm', 'สูง', p.heightMm], ['elevationMm', 'ระดับจากพื้น', selected.elevationMm], ['xMm', 'ตำแหน่ง X', selected.xMm], ['yMm', 'ตำแหน่ง Y', selected.yMm]].map(([key, label, value]) => <div key={key}><dt>{label}</dt><dd data-field={key}>{formatLength(value, design.displayUnit)}</dd></div>)}
        <div><dt>มุมหมุน</dt><dd data-field="rotationDeg">{selected.rotationDeg}°</dd></div>
      </dl><fieldset disabled={!editable}><h3 className="ik-subheading">จัดการวัตถุ</h3>
        <div className="ik-rotation"><span>หมุนตำแหน่ง</span><button disabled={openingObject(selected)} onClick={() => update({ ...selected, rotationDeg: (selected.rotationDeg + 90) % 360 })}>↻ หมุน 90°</button></div>
        {openingObject(selected) && <p className="ik-footnote">ประตู/หน้าต่างจัดแนวและเจาะช่องตามกำแพงที่ใกล้ที่สุด</p>}
        <div className="ik-button-row"><button disabled={openingObject(selected)} onClick={duplicate}>⧉ ทำสำเนา</button><button className="ik-danger" onClick={remove}>ลบวัตถุ</button></div></fieldset>
      <div className="ik-divider" /><h3 className="ik-subheading">ข้อมูลประกอบ BOQ</h3>
      <dl className="ik-specs"><dt>ไฟฟ้า</dt><dd>{statusText(p.electrical.required)}{p.electrical.required && ` · ${p.electrical.powerKw ?? 'ไม่ระบุ'} kW · ${p.electrical.voltageV ?? '?'} V · ${p.electrical.phase ?? '?'} เฟส`}</dd><dt>น้ำเข้า / น้ำทิ้ง</dt><dd>{statusText(p.plumbing.requiresWater)} / {statusText(p.plumbing.requiresDrain)}</dd>{p.plumbing.connections.map((c, i) => <dd key={i}>{waterTypes[c.type]} {c.sizeInch ?? '?'}″ × {c.pointCount ?? '?'} จุด</dd>)}<dt>แก๊ส</dt><dd>{statusText(p.gas.required)}{p.gas.required && ` · ${p.gas.inputBtuPerHour ?? '?'} BTU/h`}</dd></dl>
      {!!warnings.length && <p className="ik-notice">{warnings.join(' • ')}</p>}
    </> : <div className="ik-empty-inspector"><div>↖</div><h3>เลือกวัตถุเพื่อดูข้อมูล</h3><p>คลิกวัตถุในห้อง<br />คุณสมบัติของชิ้นนั้นจะแสดงที่นี่</p><div className="ik-divider" /><small>วางและย้ายได้ทั้งมุมบน<br />และมุม Isometric</small></div>}</div>
  </aside>
}

export function BoqDialog({ design, summary, close, download, busy, error }) {
  const ref = useRef(null), b = roomBounds(design.room)
  useEffect(() => { const el = ref.current; el.showModal(); return () => el.close() }, [])
  return <dialog ref={ref} className="ik-boq-dialog" onCancel={e => { e.preventDefault(); if (!busy) close() }}>
    <div className="ik-modal-header"><div><small>DESIGN SUMMARY</small><h2>สรุปงานออกแบบ</h2></div><button aria-label="ปิดสรุป" disabled={busy} onClick={close}>×</button></div>
    <div className="ik-modal-body"><h3>{design.designName}</h3><div className="ik-summary-stats"><div><small>ขนาดห้อง (กว้าง × ลึก)</small><strong>{closedRoom(design.room) ? `${b.width / 1000} × ${b.depth / 1000} ม.` : 'ห้องยังไม่ปิด'}</strong></div><div><small>วัตถุทั้งหมด</small><strong>{summary.count} ชิ้น</strong></div><div><small>รวมเฉพาะราคาที่ระบุ</small><strong>฿{money(summary.knownTotalSatang)}</strong></div></div>
      {!!summary.incompleteCount && <p className="ik-notice">ข้อมูลไม่ครบ {summary.incompleteCount} ชิ้น · ไม่ระบุราคา {summary.missingPriceCount} ชิ้น — ยอดนี้ยังไม่ใช่ราคาครบทั้งงาน</p>}
      <div className="ik-table-wrap"><table><thead><tr><th>หมวด / รายการ</th><th>รุ่น</th><th>ขนาด mm</th><th>จำนวน</th><th>รวม (บาท)</th></tr></thead><tbody>{summary.rows.map((r, i) => <tr key={i}><td><small>{r.categoryName}</small>{r.productName}</td><td>{r.model}</td><td>{r.widthMm} × {r.depthMm} × {r.heightMm}</td><td>{r.quantity} {r.unit}</td><td>{money(r.totalSatang)}</td></tr>)}</tbody></table>{!summary.rows.length && <p className="ik-empty">ยังไม่มีวัตถุในห้อง สามารถส่งออกไฟล์เปล่าได้</p>}</div>
      <div className="ik-system-summary"><section><h4>ไฟฟ้า (กำลังป้ายชื่อจำลอง)</h4>{Object.entries(summary.electrical).map(([k, v]) => <p key={k}>{k} <b>{Number(v.toFixed(3))} kW</b></p>)}</section><section><h4>จุดต่อประปา</h4>{Object.entries(summary.water).map(([k, v]) => <p key={k}>{k} <b>{v} จุด</b></p>)}</section><section><h4>แก๊ส (เฉพาะค่าที่ระบุ)</h4>{Object.entries(summary.gas).map(([k, v]) => <p key={k}>{k} <b>{v.toLocaleString()} BTU/h</b></p>)}</section></div>
      <p className="ik-footnote">Excel มี 2 ชีต: BOQ และไฟ–น้ำ–แก๊ส • รวมวัตถุใน Layer ที่ซ่อนด้วย • ไม่รวมภาษี ค่าแรง ขนส่ง และงานระบบ • ข้อมูลจำลอง ไม่ใช่ใบเสนอราคาหรือข้อกำหนดติดตั้ง</p>
      {error && <p role="alert" className="ik-notice">{error}</p>}
    </div><div className="ik-modal-footer"><button disabled={busy} onClick={close}>ปิด</button><button className="ik-primary" disabled={busy} onClick={download}>{busy ? 'กำลังสร้าง Excel…' : 'ดาวน์โหลดแบบ Excel'}</button></div>
  </dialog>
}
