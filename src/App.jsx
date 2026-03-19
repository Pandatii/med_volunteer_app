import { useState, useEffect } from 'react'
import './App.css'

const FORM_URL = 'https://script.google.com/macros/s/AKfycbxfam_VE45v3oEv8LreeU0i-FFPeUK77Ridi_nDk7ZvOd2W6_wzLIMq-HM1e3e1mhC12Q/exec'
const RESULT_URL = 'https://script.google.com/macros/s/AKfycbzcnhXAIgVzxdOfcOkwxzdZ0nxKWUFnZEp5D4NV_1R1DGu6KJ6teTgmFOx0kvCS1kYwpA/exec' 

const clinics = [
  { id: 1, name: 'บันทึกผลการตรวจ', icon: '🩺', desc: 'ตรวจโรคทุกคลินิก' }, 
]

export default function App() {
  const [tab, setTab] = useState('form')
  const [clock, setClock] = useState('')

  useEffect(() => {
    function updateClock() {
      const now  = new Date()
      const date = now.toLocaleDateString('th-TH', { day:'2-digit', month:'long', year:'numeric' })
      const time = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
      setClock(date + '  |  ' + time)
    }
    updateClock()
    const id = setInterval(updateClock, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="app">
      <div class="clock-bar" id="clock"></div>
      <header className="header">
        <div className="header-inner">
          <div className="logo-mark">✚</div>
          <div className="header-text">
            <h1 className="title">ระบบจัดการคลินิก</h1>
            <p className="subtitle">โครงการแพทย์อาสา ณ วัดชลประทานรังสฤษฎ์</p>
          </div>
          <div className="clock">{clock}</div>
        </div>
        
      </header>

      <nav className="tab-bar">
        <button className={`tab-btn ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>
          <span className="tab-icon">📋</span>
          <span>บันทึกผลการตรวจ</span>
        </button>
        <button className={`tab-btn ${tab === 'result' ? 'active' : ''}`} onClick={() => setTab('result')}>
          <span className="tab-icon">🔍</span>
          <span>ดูผลการตรวจ</span>
        </button>
      </nav>

      <main className="content">
        {tab === 'form' ? <FormTab /> : <ResultTab />}
      </main>

      <footer className="footer">
        <p>โครงการแพทย์อาสา &nbsp;|&nbsp; วัดชลประทานรังสฤษฎ์</p>
        <div class="clock-bar" id="clock"></div>
      </footer>
    </div>
  )
}

function FormTab() {
  return (
    <section className="tab-section">
      <div className="section-header">
        <h2>บันทึกผลการตรวจ</h2>
        <p className="section-desc">กดปุ่มเพื่อเข้าสู่แบบฟอร์มกรอกผลการตรวจของแต่ละคลินิก</p>
      </div>
      <div className="clinic-grid">
        {clinics.map((c) => (
          <a key={c.id} href={FORM_URL} target="_blank" rel="noopener noreferrer" className="clinic-card">
            <div className="clinic-icon">{c.icon}</div>
            <div className="clinic-info">
              <div className="clinic-name">{c.name}</div>
              <div className="clinic-desc">{c.desc}</div>
            </div>
            <div className="clinic-arrow">›</div>
          </a>
        ))}
      </div>
      <div className="note-box">
        <span className="note-icon">ℹ️</span>
        <span>หากฟอร์มเปิดไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือติดต่อเจ้าหน้าที่</span>
      </div>
    </section>
  )
}

function ResultTab() {
  return (
    <section className="tab-section">
      <div className="section-header">
        <h2>ดูผลการตรวจ</h2>
        <p className="section-desc">กดปุ่มด้านล่างเพื่อเข้าสู่ระบบดูผลการตรวจของผู้รับบริการ</p>
      </div>
      <div className="result-center">
        <div className="result-card">
          <div className="result-icon-big">📊</div>
          <h3>ระบบดูผลการตรวจ</h3>
          <p>เข้าสู่ระบบเพื่อค้นหาและดูผลการตรวจของผู้รับบริการ<br />ตามชื่อหรือหมายเลขบัตรประชาชน</p>
          <a href={RESULT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <span>เข้าสู่ระบบดูผล</span>
            <span className="btn-arrow">→</span>
          </a>
        </div>
      </div>
      <div className="note-box">
        <span className="note-icon">🔒</span>
        <span>ข้อมูลผลการตรวจเป็นความลับ กรุณาใช้งานในพื้นที่ที่เหมาะสม</span>
      </div>
    </section>
  )
}
