import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ScanForm({ onScanComplete, user }) {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [repos, setRepos] = useState([]);
  
  // Public Client ID mapped directly from GitHub portal
  const CLIENT_ID = "Ov23liLr6PHdt35NN2QE";

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('hercules_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // Fetch private repositories from GitHub APIs securely via FastAPI proxy
      axios.get(`${API_URL}/api/github/repos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setRepos(res.data))
      .catch(err => console.error("Failed to map github datastores", err));
    }
  }, [user]);

  const loginWithGithub = () => {
    // Invoke GitHub's secure OAuth flow endpoint
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  };

  const startScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsScanning(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const payload = url.includes('/') && !url.startsWith('http') ? { target_repo: url } : { target_url: url };
      const initRes = await axios.post(`${API_URL}/api/scan`, payload);
      const scanId = initRes.data.scan_id;
      
      let finalResult = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await axios.get(`${API_URL}/api/scan/${scanId}`);
        if (pollRes.data.status === 'completed' || pollRes.data.status === 'failed') {
          finalResult = pollRes.data;
          break;
        }
      }
      
      if (finalResult && finalResult.status === 'completed') {
        onScanComplete(finalResult);
      } else {
        throw new Error("Scan execution terminated unexpectedly during AI Red Team logic checks.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Connection to Scanner Engine core failed.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {!user && (
        <div className="mb-16">
          <button 
            type="button"
            onClick={loginWithGithub}
            className="relative group flex items-center justify-center w-20 h-20 rounded-full glass-morphism neural-glow hover:scale-110 transition-all duration-700"
          >
            <div className="absolute inset-0 rounded-full border border-energy/30 animate-ping opacity-20"></div>
            <svg className="w-8 h-8 fill-white/80 group-hover:fill-gold transition-colors" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
            </svg>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 group-hover:text-gold transition-all">Authorize Node</span>
          </button>
        </div>
      )}

      <form onSubmit={startScan} className="w-full max-w-2xl mb-24 group relative z-20">
        <div className="relative energy-conduit px-2 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.2)]">
          <div className="flex items-center shrink-0 w-full overflow-hidden h-[72px]">
            <span className="material-symbols-outlined text-gold/40 px-4 shrink-0">flare</span>
            
            {user && repos.length > 0 ? (
              <select 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-white/90 w-full px-2 py-4 text-xl font-light tracking-widest cursor-pointer appearance-none outline-none"
              >
                <option value="" className="bg-charcoal text-white/50">-- SYNCED REPOSITORIES --</option>
                {repos.map(r => (
                  <option key={r.name} value={r.name} className="bg-charcoal text-white/90">
                    {r.private ? '🔒 ' : '🌐 '} {r.full_name || r.name}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-white/90 placeholder-white/20 w-full px-2 py-4 text-xl font-light tracking-widest outline-none" 
                placeholder="CORE INFUSION ADDRESS..." 
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required={!user}
                disabled={isScanning}
              />
            )}
            
            <button 
              type="submit" 
              disabled={isScanning || !url} 
              className="flex items-center shrink-0 space-x-2 text-gold hover:text-white transition-colors px-6 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none outline-none"
            >
              {isScanning ? (
                 <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-[0.4em] font-medium hidden sm:inline-block">Analyze</span>
                  <span className="material-symbols-outlined text-sm">trending_flat</span>
                </>
              )}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
        </div>
        
        {error && (
           <div className="absolute top-full left-0 mt-4 w-full p-4 bg-red-900/20 text-red-300 border border-red-900/50 rounded-lg text-sm font-mono text-center shadow-lg">
             <span className="material-symbols-outlined text-xs mr-2 relative top-[2px]">error</span>
             {error}
           </div>
        )}
      </form>

      {/* Decorative Network Nodes Section - Displayed when NOT scanning and NO result */}
      {!isScanning && (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 items-center opacity-70 transition-opacity hover:opacity-100 z-10 relative">
          <div className="order-2 md:order-1 flex flex-col items-center md:items-start space-y-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-[10px] tracking-[0.5em] uppercase text-gold/60 font-bold">Threat Emanation</h3>
              <p className="text-sm text-white/40 italic font-light">Swirling bio-luminescent patterns indicate node stability.</p>
            </div>
            <div className="w-full h-40 glass-morphism rounded-[40px] relative overflow-hidden flex items-center justify-center swirl-pattern">
              <div className="absolute w-32 h-32 rounded-full bg-energy/20 blur-2xl animate-pulse"></div>
              <div className="relative flex flex-col items-center">
                <span className="text-3xl font-thin tracking-tighter text-energy/80">LOW</span>
                <div className="flex space-x-1 mt-2">
                  <div className="w-1 h-1 rounded-full bg-energy/50"></div>
                  <div className="w-1 h-1 rounded-full bg-energy/30"></div>
                  <div className="w-1 h-1 rounded-full bg-energy/10"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 flex flex-col items-center justify-center relative">
            <div className="absolute -top-16 text-center">
              <h2 className="text-xs tracking-[0.8em] uppercase text-white/30 mb-2">Security Health</h2>
            </div>
            <div className="orb-gradient w-56 h-56 rounded-full relative flex items-center justify-center border border-white/10 group cursor-default transition-transform duration-1000 hover:scale-105">
              <div className="absolute inset-0 rounded-full swirl-pattern opacity-40"></div>
              <div className="text-center z-10 flex flex-col items-center">
                <div className="flex items-baseline">
                  <span className="text-6xl font-extralight tracking-tighter text-charcoal">95</span>
                  <span className="text-xl font-bold text-charcoal/60">%</span>
                </div>
                <div className="text-[8px] tracking-[0.4em] uppercase text-charcoal/80 mt-1 font-black">Optimal</div>
              </div>
              <div className="absolute -inset-8 rounded-full border border-gold/5 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute -inset-12 rounded-full border border-gold/5 animate-[spin_15s_linear_infinite_reverse]"></div>
            </div>
            <div className="mt-12 text-center opacity-30">
              <p className="text-[9px] tracking-[0.3em] uppercase">Rhythmic Pulse Synchronization Active</p>
            </div>
          </div>
          <div className="order-3 flex flex-col items-center md:items-end space-y-8">
            <div className="text-center md:text-right space-y-1">
              <h3 className="text-[10px] tracking-[0.5em] uppercase text-gold/60 font-bold">Health Snapshot</h3>
              <p className="text-sm text-white/40 italic font-light">Global safety metrics at a glance.</p>
            </div>
            <div className="w-full glass-morphism rounded-[40px] p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Integrity</span>
                <span className="text-xs text-gold">99.2%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[99%] bg-gold/40"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Latency</span>
                <span className="text-xs text-energy">12ms</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[12%] bg-energy/40"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Resilience</span>
                <span className="text-xs text-white/80">High</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
