import React, { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import Dashboard from './components/Dashboard';
import { ShieldAlert } from 'lucide-react';
import axios from 'axios';
import './index.css';

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Session Restoration
    const savedUser = localStorage.getItem('hercules_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    // OAuth 2.0 PKCE Callback Capture
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      axios.post('http://localhost:8000/api/auth/github', { code })
        .then(res => {
          localStorage.setItem('hercules_user', JSON.stringify(res.data));
          localStorage.setItem('hercules_token', res.data.token);
          setUser(res.data);
          // Purge the insecure code from the URL bar immediately
          window.history.replaceState({}, document.title, "/");
        })
        .catch(err => console.error("OAuth Exchange Failed", err));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('hercules_user');
    localStorage.removeItem('hercules_token');
    setUser(null);
  }

  return (
    <div className="app-container">
      <header className="header" style={{ position: 'relative' }}>
        {user && (
          <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
             <img src={user.avatar} alt="Avatar" width={28} height={28} style={{ borderRadius: '50%' }} />
             <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.username}</span>
             <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
             <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>Log out</button>
          </div>
        )}
        <h1>
          <ShieldAlert size={36} style={{ display: 'inline', marginRight: '10px' }} />
          HerculesSec Pro
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Dual-Layer AI Security Validation for Modern Architectures
        </p>
      </header>

      {!scanResult ? (
        <ScanForm onScanComplete={setScanResult} user={user} />
      ) : (
        <Dashboard result={scanResult} onNewScan={() => setScanResult(null)} />
      )}
    </div>
  );
}

export default App;
