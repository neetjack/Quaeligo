import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Subject from './pages/Subject';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';

function App() {
  const { i18n } = useTranslation();
  const [globalVolume, setGlobalVolume] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <div className="lang-switch" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '10px', zIndex: 1000 }}>
        <div style={{ position: 'relative' }}>
          <button className="pixel-btn secondary" style={{padding: '5px 10px', fontSize: '1.2rem'}} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
          {mobileMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: 'white', border: '4px solid #000', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
              <div style={{ marginBottom: '5px', textAlign: 'center', fontWeight: 'bold' }}>Volume</div>
              <input type="range" min="0" max="1" step="0.01" value={globalVolume} onChange={(e) => setGlobalVolume(parseFloat(e.target.value))} className="pixel-slider" style={{minHeight: '44px'}} />
              <button className="pixel-btn secondary" style={{padding: '10px', fontSize: '1rem', width: '100%'}} onClick={() => { changeLanguage('zh'); setMobileMenuOpen(false); }}>中文</button>
              <button className="pixel-btn secondary" style={{padding: '10px', fontSize: '1rem', width: '100%'}} onClick={() => { changeLanguage('en'); setMobileMenuOpen(false); }}>EN</button>
              <button className="pixel-btn secondary" style={{padding: '10px', fontSize: '1rem', width: '100%'}} onClick={() => { changeLanguage('ja'); setMobileMenuOpen(false); }}>日本語</button>
            </div>
          )}
        </div>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey/:slug" element={<Subject globalVolume={globalVolume} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
