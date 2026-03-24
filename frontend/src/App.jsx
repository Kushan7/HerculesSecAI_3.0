import React, { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import Dashboard from './components/Dashboard';
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      axios.post(`${API_URL}/api/auth/github`, { code })
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
    <div className="text-white min-h-screen font-sans selection:bg-gold selection:text-charcoal relative z-0">
      <div className="blob w-96 h-96 bg-gold/10 -top-20 -left-20 pointer-events-none"></div>
      <div className="blob w-[600px] h-[600px] bg-energy/5 bottom-0 right-0 pointer-events-none"></div>
      <div className="blob w-80 h-80 bg-gold/5 top-1/4 left-1/2 pointer-events-none"></div>
      <div className="heartbeat-central opacity-20"></div>

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 py-10 w-full">
        {user && (
           <div className="absolute right-8 top-8 flex items-center gap-3 bg-[rgba(0,0,0,0.4)] px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
             <img src={user.avatar} alt="Avatar" width={32} height={32} className="rounded-full border border-gold/40" />
             <span className="font-semibold text-sm text-white/90">{user.username}</span>
             <div className="w-[1px] h-4 bg-white/20" />
             <button onClick={logout} className="bg-transparent border-none text-white/50 hover:text-white/90 cursor-pointer text-xs uppercase tracking-widest transition-colors">Log out</button>
           </div>
        )}

        <header className="text-center mb-12 space-y-4 pt-16">
          <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.2em] text-white/90 uppercase">
            Herculesec <span className="block text-sm tracking-[0.5em] mt-2 text-gold opacity-80">Vulnerability Scanner</span>
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mt-6"></div>
        </header>

        {!scanResult ? (
          <ScanForm onScanComplete={setScanResult} user={user} />
        ) : (
          <Dashboard result={scanResult} onNewScan={() => setScanResult(null)} />
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-8 opacity-20 pointer-events-none z-0">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-sm">mouse</span>
          <span className="text-[9px] tracking-widest uppercase">Glide to explore</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-sm">waves</span>
          <span className="text-[9px] tracking-widest uppercase">Organic Flow Active</span>
        </div>
      </div>
    </div>
  );
}

export default App;
