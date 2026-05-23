import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// ─── DATA ────────────────────────────────────────────────────────
const REG_RAW = {
  '22': { '06':199,'10':210,'11':216,'12':217,'13':216,'14':211 },
  '23': { '06':127,'07':125,'08':166,'09':240,'10':213,'11':239,'12':324,'13':255,'14':572,'15':28 },
  '24': { '06':60,'07':92,'08':179,'09':114,'10':92 }
}
const VS_RAW = { '22':945,'23':1433 }
const OPD_BY_DAY = {
  '22': [
    {name:'คลินิกวัคซีนไข้หวัดใหญ่',val:474},
    {name:'คลินิกฟังผลตรวจสุขภาพ',val:461},
    {name:'คลินิกกระดูกและข้อ',val:247},
    {name:'คลินิก X-ray ปอด',val:241},
    {name:'คลินิกตรวจคลื่นไฟฟ้าหัวใจ (EKG)',val:232},
    {name:'คลินิกตรวจคัดกรองและวัดสายตา',val:200},
    {name:'คลินิกตรวจโรคผิวหนัง',val:157},
    {name:'คลินิกเวชศาสตร์ฟื้นฟู',val:87},
    {name:'คลินิกตรวจไขมันพอกตับฯ',val:84},
    {name:'คลินิกคัดกรองมะเร็งเต้านม',val:80},
    {name:'คลินิกคัดกรองมะเร็งปากมดลูก',val:32},
    {name:'คลินิกตรวจ Echocardiogram',val:25},
    {name:'คลินิกวัดมวลกล้ามเนื้อและกระดูก',val:21},
    {name:'คลินิก ABI',val:18},
    {name:'คลินิกตรวจหลอดเลือดแดงที่คอ',val:18},
    {name:'คลินิกผ่าตัดเล็กฯ',val:13},
    {name:'คลินิกฝังเข็ม',val:4}
  ],
  '23': null,
  '24': null
}
const COLORS   = { '22':'#1D9E75','23':'#378ADD','24':'#EF9F27' }
const DAY_LABELS = { '22':'22 พ.ค.','23':'23 พ.ค.','24':'24 พ.ค.' }
const HOURS    = ['06','07','08','09','10','11','12','13','14','15']

const sumObj   = obj => Object.values(obj).reduce((a,b)=>a+b,0)
const REG_DAY  = { '22':sumObj(REG_RAW['22']),'23':sumObj(REG_RAW['23']),'24':sumObj(REG_RAW['24']) }
const hexAlpha = (hex,a) => {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}
const fmt = n => (n == null || n === 0) ? '—' : n.toLocaleString('th')

// ─── HOOK: chart instance manager ───────────────────────────────
function useChart(canvasRef, buildConfig, deps) {
  const instRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current) return
    if (instRef.current) instRef.current.destroy()
    const cfg = buildConfig()
    if (!cfg) return
    instRef.current = new Chart(canvasRef.current, cfg)
    return () => { if (instRef.current) instRef.current.destroy() }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── STYLES (injected once) ──────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .rdb-root {
    font-family: 'Sarabun', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #1a1916;
    background: #f5f4f0;
    min-height: 100vh;
  }
  .rdb-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* filter bar */
  .rdb-filter-bar {
    background: #fff;
    border-bottom: 0.5px solid rgba(0,0,0,0.08);
    padding: 0 2rem;
    display: flex; align-items: center; gap: 8px;
    height: 48px;
    position: sticky; top: 0; z-index: 90;
  }
  .rdb-filter-label {
    font-size: 11px; font-weight: 500; color: #9a9890;
    font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.08em; text-transform: uppercase; margin-right: 4px;
  }
  .rdb-filter-btn {
    padding: 5px 16px; font-size: 12px;
    font-family: 'IBM Plex Mono', monospace;
    border: 0.5px solid rgba(0,0,0,0.15);
    border-radius: 6px; cursor: pointer;
    background: transparent; color: #5a5850;
    transition: all 0.15s;
  }
  .rdb-filter-btn:hover { background: #f0efe9; }
  .rdb-filter-btn.active { background: #1a1916; color: white; border-color: #1a1916; }
  .rdb-filter-ctx { margin-left: auto; font-size: 11px; color: #9a9890; font-family: 'IBM Plex Mono', monospace; }

  /* page */
  .rdb-page { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

  /* section label */
  .rdb-slabel {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 500;
    letter-spacing: 0.12em; color: #9a9890; text-transform: uppercase;
    margin-bottom: 12px; margin-top: 2.5rem;
  }
  .rdb-slabel:first-child { margin-top: 0; }

  /* metrics */
  .rdb-metric-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 2rem; }
  @media (max-width:700px) { .rdb-metric-grid { grid-template-columns: repeat(2,1fr); } }
  .rdb-metric {
    background: #fff; border: 0.5px solid rgba(0,0,0,0.08);
    border-radius: 12px; padding: 18px 20px;
    position: relative; overflow: hidden;
  }
  .rdb-metric::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
  .rdb-metric.c-teal::before  { background:#1D9E75; }
  .rdb-metric.c-blue::before  { background:#378ADD; }
  .rdb-metric.c-amber::before { background:#EF9F27; }
  .rdb-metric.c-coral::before { background:#D85A30; }
  .rdb-mlabel { font-size:12px; color:#9a9890; margin-bottom:8px; }
  .rdb-mvalue { font-size:30px; font-weight:600; line-height:1; font-family:'IBM Plex Mono',monospace; letter-spacing:-0.02em; }
  .rdb-metric.c-teal  .rdb-mvalue { color:#0F6E56; }
  .rdb-metric.c-blue  .rdb-mvalue { color:#185FA5; }
  .rdb-metric.c-amber .rdb-mvalue { color:#854F0B; }
  .rdb-metric.c-coral .rdb-mvalue { color:#993C1D; }
  .rdb-msub { font-size:11px; color:#9a9890; margin-top:6px; }

  /* cards */
  .rdb-card { background:#fff; border:0.5px solid rgba(0,0,0,0.08); border-radius:12px; padding:1.5rem; margin-bottom:1rem; }
  .rdb-card-title { font-size:14px; font-weight:500; color:#1a1916; margin-bottom:1.25rem; }
  .rdb-two-col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  @media (max-width:760px) { .rdb-two-col { grid-template-columns:1fr; } }

  /* chart */
  .rdb-chart-wrap { position:relative; width:100%; }

  /* reconcile table */
  .rdb-rtable { width:100%; border-collapse:collapse; font-size:13px; }
  .rdb-rtable thead th {
    text-align:left; padding:8px 12px;
    font-size:11px; font-weight:500; color:#9a9890;
    font-family:'IBM Plex Mono',monospace; letter-spacing:0.06em;
    border-bottom:0.5px solid rgba(0,0,0,0.08); background:#f0efe9;
  }
  .rdb-rtable thead th:first-child { border-radius:8px 0 0 0; }
  .rdb-rtable thead th:last-child  { border-radius:0 8px 0 0; }
  .rdb-rtable tbody td { padding:10px 12px; border-bottom:0.5px solid rgba(0,0,0,0.08); vertical-align:middle; }
  .rdb-rtable tbody tr:last-child td { border-bottom:none; }
  .rdb-rtable tbody tr:hover td { background:#f0efe9; }
  .rdb-rtable .num { text-align:right; font-family:'IBM Plex Mono',monospace; font-size:13px; }
  .rdb-rtable .total-row td { background:#f0efe9; font-weight:600; border-top:0.5px solid rgba(0,0,0,0.15); }

  /* badge */
  .rdb-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:500; font-family:'IBM Plex Mono',monospace; white-space:nowrap; }
  .rdb-badge.ok   { background:#EAF3DE; color:#3B6D11; }
  .rdb-badge.na   { background:#f0efe9; color:#9a9890; }
  .rdb-badge.warn { background:#FAEEDA; color:#854F0B; }
  .rdb-bdot { width:5px; height:5px; border-radius:50%; background:currentColor; }

  /* legend */
  .rdb-legend { display:flex; flex-wrap:wrap; gap:14px; margin-bottom:12px; }
  .rdb-legend-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#5a5850; }
  .rdb-legend-sw { width:10px; height:10px; border-radius:2px; flex-shrink:0; }

  /* clinic table */
  .rdb-ctable { width:100%; border-collapse:collapse; font-size:13px; }
  .rdb-ctable th { text-align:left; padding:8px 10px; font-size:11px; font-weight:500; color:#9a9890; font-family:'IBM Plex Mono',monospace; letter-spacing:0.06em; border-bottom:0.5px solid rgba(0,0,0,0.08); background:#f0efe9; }
  .rdb-ctable td { padding:8px 10px; border-bottom:0.5px solid rgba(0,0,0,0.08); color:#1a1916; }
  .rdb-ctable tr:last-child td { border-bottom:none; }
  .rdb-ctable tr:hover td { background:#f0efe9; }
  .rdb-ctable .num { text-align:right; font-family:'IBM Plex Mono',monospace; }
  .rdb-bar-cell { display:flex; align-items:center; gap:8px; }
  .rdb-mini-bar { height:6px; background:#378ADD; border-radius:3px; min-width:2px; }
  .rdb-pct { font-size:11px; color:#9a9890; font-family:'IBM Plex Mono',monospace; min-width:36px; }

  /* no data */
  .rdb-nodata { text-align:center; padding:2rem; color:#9a9890; font-size:13px; }
  .rdb-nodata-icon { font-size:28px; margin-bottom:8px; }
`

function injectStyles() {
  if (document.getElementById('rdb-styles')) return
  const el = document.createElement('style')
  el.id = 'rdb-styles'
  el.textContent = CSS
  document.head.appendChild(el)
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function ReconcileDashboard() {
  const [activeDay, setActiveDay] = useState('all')

  useEffect(() => { injectStyles() }, [])

  const getDays   = () => activeDay === 'all' ? ['22','23','24'] : [activeDay]
  const totalReg  = () => getDays().reduce((a,d) => a + REG_DAY[d], 0)
  const totalVS   = () => getDays().reduce((a,d) => a + (VS_RAW[d] || 0), 0)
  const hasVS     = () => getDays().some(d => VS_RAW[d])
  const hasOPD    = () => getDays().some(d => OPD_BY_DAY[d])
  const getOPDList = () => {
    const map = {}
    getDays().forEach(d => {
      if (!OPD_BY_DAY[d]) return
      OPD_BY_DAY[d].forEach(c => { map[c.name] = (map[c.name]||0) + c.val })
    })
    return Object.entries(map).map(([name,val])=>({name,val})).sort((a,b)=>b.val-a.val)
  }
  const totalOPD  = () => getOPDList().reduce((a,c)=>a+c.val, 0)

  const vsReg     = () => getDays().filter(d=>VS_RAW[d]).reduce((a,d)=>a+REG_DAY[d],0)
  const ratio     = () => vsReg() > 0 ? Math.round(totalVS()/vsReg()*100)+'%' : '—'

  const dayLabel  = activeDay === 'all' ? '22–24 พ.ค. 2569' : DAY_LABELS[activeDay]+' 2569'
  const filterCtx = activeDay === 'all' ? '22–24 พ.ค. 2569 · 3 วัน' : DAY_LABELS[activeDay]+' 2569'

  return (
    <div className="rdb-root">
      {/* FILTER BAR */}
      <div className="rdb-filter-bar">
        <span className="rdb-filter-label">ดูข้อมูล</span>
        {['all','22','23','24'].map(d => (
          <button
            key={d}
            className={`rdb-filter-btn${activeDay===d?' active':''}`}
            onClick={() => setActiveDay(d)}
          >
            {d === 'all' ? 'ทุกวัน' : DAY_LABELS[d]}
          </button>
        ))}
        <span className="rdb-filter-ctx">{filterCtx}</span>
      </div>

      <div className="rdb-page">

        {/* METRICS */}
        <div className="rdb-slabel">ภาพรวม</div>
        <div className="rdb-metric-grid">
          <div className="rdb-metric c-teal">
            <div className="rdb-mlabel">ยอดแสดงความสนใจร่วมงานแพทย์อาสาฯ</div>
            <div className="rdb-mvalue">{fmt(totalReg())}</div>
            <div className="rdb-msub">{dayLabel}</div>
          </div>
          <div className="rdb-metric c-blue">
            <div className="rdb-mlabel">จำนวนผู้เข้ารับบริการ</div>
            <div className="rdb-mvalue">{hasVS() ? fmt(totalVS()) : '—'}</div>
            <div className="rdb-msub">{hasVS() ? dayLabel : 'ยังไม่มีข้อมูล'}</div>
          </div>
          <div className="rdb-metric c-amber">
            <div className="rdb-mlabel">จำนวน OPD Form</div>
            <div className="rdb-mvalue">{hasOPD() ? fmt(totalOPD()) : '—'}</div>
            <div className="rdb-msub">{hasOPD() ? dayLabel : 'ยังไม่มีข้อมูล'}</div>
          </div>
          <div className="rdb-metric c-coral">
            <div className="rdb-mlabel">อัตรา จำนวนผู้เข้ารับบริการ / ลงทะเบียน</div>
            <div className="rdb-mvalue">{ratio()}</div>
            <div className="rdb-msub">{hasVS() ? dayLabel : 'ยังไม่มีข้อมูล'}</div>
          </div>
        </div>

        {/* RECONCILE TABLE */}
        <div className="rdb-slabel">Reconcile รายวัน</div>
        <div className="rdb-card">
          <div className="rdb-card-title">เปรียบเทียบยอด — ลงทะเบียน / จำนวนผู้เข้ารับบริการ / OPD คลีนิก</div>
          <ReconTable activeDay={activeDay} />
        </div>

        {/* REG CHART */}
        <div className="rdb-slabel">การกระจายตัวรายชั่วโมง</div>
        <div className="rdb-card">
          <div className="rdb-card-title">
            {activeDay === 'all'
              ? 'จำนวนผู้ลงทะเบียนรายชั่วโมง — ทุกวัน'
              : `จำนวนผู้ลงทะเบียนรายชั่วโมง — ${DAY_LABELS[activeDay]} 2569`}
          </div>
          <div className="rdb-legend">
            {getDays().map(d => (
              <div key={d} className="rdb-legend-item">
                <div className="rdb-legend-sw" style={{background:COLORS[d]}}/>
                {DAY_LABELS[d]}
              </div>
            ))}
          </div>
          <RegChart activeDay={activeDay} getDays={getDays} />
        </div>

        {/* OPD */}
        <div className="rdb-slabel">ผู้รับบริการแต่ละคลีนิก</div>
        <div className="rdb-two-col">
          <div className="rdb-card">
            <div className="rdb-card-title">
              Top 10 คลีนิก — {activeDay === 'all' ? 'ทุกวัน' : DAY_LABELS[activeDay]+' 2569'}
            </div>
            {hasOPD()
              ? <OPDChart opdList={getOPDList()} activeDay={activeDay} />
              : <NoData icon="📋" text={`ยังไม่มีข้อมูล OPD\nสำหรับ ${DAY_LABELS[activeDay]} 2569`} />}
          </div>
          <div className="rdb-card" style={{display:'flex',flexDirection:'column'}}>
            <div className="rdb-card-title">รายการทั้งหมด — สัดส่วน</div>
            {hasOPD()
              ? <ClinicTable opdList={getOPDList()} total={totalOPD()} />
              : <NoData icon="📋" text="ยังไม่มีข้อมูล" />}
          </div>
        </div>

        {/* จำนวนผู้เข้ารับบริการ CHART */}
        <div className="rdb-slabel">จำนวนผู้เข้ารับบริการ เทียบกับลงทะเบียน</div>
        <div className="rdb-card">
          <div className="rdb-card-title">
            {activeDay === 'all'
              ? 'จำนวนผู้เข้ารับบริการ vs ลงทะเบียน — ทุกวัน'
              : `จำนวนผู้เข้ารับบริการ vs ลงทะเบียน — ${DAY_LABELS[activeDay]} 2569`}
          </div>
          <div className="rdb-legend">
            <div className="rdb-legend-item"><div className="rdb-legend-sw" style={{background:'#1D9E75'}}/>จำนวนผู้เข้ารับบริการ</div>
            <div className="rdb-legend-item"><div className="rdb-legend-sw" style={{background:'rgba(29,158,117,0.2)'}}/>ลงทะเบียน (เทียบ)</div>
          </div>
          {hasVS()
            ? <VSChart activeDay={activeDay} getDays={getDays} />
            : <NoData icon="💓" text={`ยังไม่มีข้อมูล จำนวนผู้เข้ารับบริการ\nสำหรับ ${DAY_LABELS[activeDay]} 2569`} />}
        </div>

      </div>

        {/* QR PANEL */}
        <div className="rdb-slabel">แบบฟอร์มปรับปรุงข้อมูล</div>
        <div className="rdb-card" style={{display:'flex',alignItems:'center',gap:'2rem',flexWrap:'wrap'}}>
          <img src={QR_DATA_URI} alt="QR Code สำหรับปรับปรุงข้อมูล" style={{width:160,height:160,objectFit:'contain',borderRadius:8,flexShrink:0}} />
          <div>
            <div className="rdb-card-title" style={{marginBottom:8}}>กรณีที่ต้องการปรับปรุง จำนวนผู้เข้ารับบริการในแต่ละคลีนิค</div>
            <p style={{fontSize:13,color:'#5a5850',lineHeight:1.8}}>ให้ scan QR นี้เพื่อเข้าสู่แบบฟอร์มปรับปรุงข้อมูล<br/>ข้อมูลจะถูกอัปเดตใน dashboard หลังจากกรอกเสร็จสิ้น</p>
          </div>
        </div>

    </div>
  )
}

// ─── RECONCILE TABLE ─────────────────────────────────────────────
function ReconTable({ activeDay }) {
  const days = activeDay === 'all' ? ['22','23','24'] : [activeDay]
  const opdSum22 = OPD_BY_DAY['22'].reduce((a,c)=>a+c.val,0)

  const rowData = [
    { d:'22', opd:opdSum22 },
    { d:'23', opd:null },
    { d:'24', opd:null }
  ].filter(r => days.includes(r.d))

  const totReg = days.reduce((a,d)=>a+REG_DAY[d],0)
  const totVS  = days.reduce((a,d)=>a+(VS_RAW[d]||0),0)
  const totOPD = days.includes('22') ? opdSum22 : 0
  const vsRegBase = days.filter(d=>VS_RAW[d]).reduce((a,d)=>a+REG_DAY[d],0)

  return (
    <table className="rdb-rtable">
      <thead>
        <tr>
          <th>วันที่</th>
          <th style={{textAlign:'right'}}>ลงทะเบียน</th>
          <th style={{textAlign:'right'}}>จำนวนผู้เข้ารับบริการ</th>
          <th style={{textAlign:'right'}}>OPD คลีนิก</th>
          <th style={{textAlign:'right'}}>จำนวนผู้เข้ารับบริการ / ลงทะเบียน</th>
          <th style={{textAlign:'right'}}>ให้บริการ 1 คนต่อกี่ Clinic</th>
          <th>สถานะ</th>
        </tr>
      </thead>
      <tbody>
        {rowData.map(({d,opd}) => {
          const r = REG_DAY[d], vs = VS_RAW[d]
          const vsRatio  = vs  ? Math.round(vs/r*100)+'%' : '—'
          const opdRatio = opd ? (opd/r).toFixed(1) : '—'
          let badgeCls = 'na', badgeTxt = 'รอข้อมูล'
          if (vs && opd) { badgeCls='ok';   badgeTxt='ครบทั้ง 3 ยอด' }
          else if (vs)   { badgeCls='warn'; badgeTxt='รอข้อมูล OPD' }
          return (
            <tr key={d}>
              <td style={{fontWeight:500}}>{DAY_LABELS[d]} 2569</td>
              <td className="num">{fmt(r)}</td>
              <td className="num">{vs ? fmt(vs) : '—'}</td>
              <td className="num">{opd ? fmt(opd) : '—'}</td>
              <td className="num">{vsRatio}</td>
              <td className="num">{opdRatio}</td>
              <td>
                <span className={`rdb-badge ${badgeCls}`}>
                  <span className="rdb-bdot"/>
                  {badgeTxt}
                </span>
              </td>
            </tr>
          )
        })}
        {activeDay === 'all' && (
          <tr className="total-row">
            <td>รวม</td>
            <td className="num">{fmt(totReg)}</td>
            <td className="num">{fmt(totVS)}</td>
            <td className="num">{fmt(totOPD)}</td>
            <td className="num">{vsRegBase>0 ? Math.round(totVS/vsRegBase*100)+'%' : '—'}</td>
            <td className="num">{(totOPD/REG_DAY['22']).toFixed(1)}</td>
            <td/>
          </tr>
        )}
      </tbody>
    </table>
  )
}

// ─── REG CHART ───────────────────────────────────────────────────
function RegChart({ activeDay, getDays }) {
  const canvasRef = useRef(null)
  useChart(canvasRef, () => ({
    type: 'bar',
    data: {
      labels: HOURS.map(h=>h+':00'),
      datasets: getDays().map(d => ({
        label: DAY_LABELS[d],
        data: HOURS.map(h => REG_RAW[d][h]||0),
        backgroundColor: COLORS[d],
        borderRadius: 4, borderSkipped: false
      }))
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y.toLocaleString('th')} คน`}} },
      scales:{
        x:{ grid:{display:false}, ticks:{font:{size:11,family:'IBM Plex Mono'},color:'#9a9890'} },
        y:{ grid:{color:'rgba(0,0,0,0.05)'}, ticks:{font:{size:11,family:'IBM Plex Mono'},color:'#9a9890'} }
      }
    }
  }), [activeDay])

  return (
    <div className="rdb-chart-wrap" style={{height:240}}>
      <canvas ref={canvasRef} role="img" aria-label="กราฟลงทะเบียนรายชั่วโมง"/>
    </div>
  )
}

// ─── OPD CHART ───────────────────────────────────────────────────
function OPDChart({ opdList, activeDay }) {
  const canvasRef = useRef(null)
  const top10 = opdList.slice(0,10)
  useChart(canvasRef, () => ({
    type: 'bar',
    data: {
      labels: top10.map(d=>d.name),
      datasets:[{
        label:'ผู้รับบริการ',
        data: top10.map(d=>d.val),
        backgroundColor:'#378ADD', borderRadius:4, borderSkipped:false
      }]
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.x.toLocaleString('th')} คน`}}},
      scales:{
        x:{ grid:{color:'rgba(0,0,0,0.05)'}, ticks:{font:{size:11,family:'IBM Plex Mono'},color:'#9a9890'} },
        y:{ grid:{display:false}, ticks:{font:{size:11},color:'#5a5850'} }
      }
    }
  }), [activeDay])

  return (
    <div className="rdb-chart-wrap" style={{height:320}}>
      <canvas ref={canvasRef} role="img" aria-label="Top 10 คลีนิก"/>
    </div>
  )
}

// ─── CLINIC TABLE ────────────────────────────────────────────────
function ClinicTable({ opdList, total }) {
  const maxVal = opdList[0]?.val || 1
  return (
    <div style={{overflowY:'auto',flex:1}}>
      <table className="rdb-ctable">
        <thead>
          <tr>
            <th>คลีนิก</th>
            <th style={{textAlign:'right'}}>จำนวน</th>
            <th>สัดส่วน</th>
          </tr>
        </thead>
        <tbody>
          {opdList.map((c,i) => {
            const pct = Math.round(c.val/total*100)
            const bw  = Math.round(c.val/maxVal*100)
            return (
              <tr key={i}>
                <td style={{fontSize:12}}>{c.name}</td>
                <td className="num">{c.val.toLocaleString('th')}</td>
                <td>
                  <div className="rdb-bar-cell">
                    <div className="rdb-mini-bar" style={{width:Math.min(bw,100)+'px'}}/>
                    <span className="rdb-pct">{pct}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── VS CHART ────────────────────────────────────────────────────
function VSChart({ activeDay, getDays }) {
  const canvasRef = useRef(null)
  const days = getDays().filter(d=>VS_RAW[d])
  useChart(canvasRef, () => ({
    type:'bar',
    data:{
      labels: days.map(d=>DAY_LABELS[d]+' 2569'),
      datasets:[
        {
          label:'จำนวนผู้เข้ารับบริการ',
          data: days.map(d=>VS_RAW[d]),
          backgroundColor: days.map(d=>COLORS[d]),
          borderRadius:6, borderSkipped:false, maxBarThickness:80
        },
        {
          label:'ลงทะเบียน',
          data: days.map(d=>REG_DAY[d]),
          backgroundColor: days.map(d=>hexAlpha(COLORS[d],0.2)),
          borderRadius:6, borderSkipped:false, maxBarThickness:80
        }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y.toLocaleString('th')} คน (${ctx.dataset.label})`}} },
      scales:{
        x:{ grid:{display:false}, ticks:{font:{size:12},color:'#5a5850'} },
        y:{ grid:{color:'rgba(0,0,0,0.05)'}, ticks:{font:{size:11,family:'IBM Plex Mono'},color:'#9a9890'} }
      }
    }
  }), [activeDay])

  return (
    <div className="rdb-chart-wrap" style={{height:220}}>
      <canvas ref={canvasRef} role="img" aria-label="จำนวนผู้เข้ารับบริการ รายวัน"/>
    </div>
  )
}

// ─── NO DATA ─────────────────────────────────────────────────────
function NoData({ icon, text }) {
  return (
    <div className="rdb-nodata">
      <div className="rdb-nodata-icon">{icon}</div>
      {text.split('\n').map((t,i)=><div key={i}>{t}</div>)}
    </div>
  )
}
