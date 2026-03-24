import React, { useState, useEffect } from 'react';
import { Search, Loader2, Github } from 'lucide-react';
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
      // Fetch private repositories from GitHub APIs securely via FastAPI proxy
      axios.get('http://localhost:8000/api/github/repos', {
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
      const payload = url.includes('/') && !url.startsWith('http') ? { target_repo: url } : { target_url: url };
      const initRes = await axios.post('http://localhost:8000/api/scan', payload);
      const scanId = initRes.data.scan_id;
      
      let finalResult = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await axios.get(`http://localhost:8000/api/scan/${scanId}`);
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
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Target Scope Selection</h2>
      
      {!user && (
        <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Activate advanced OSV analysis across all your environments by synchronizing your GitHub architecture profiles.</p>
          <button onClick={loginWithGithub} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#24292e', color: 'white', border: '1px solid #1b1f23' }}>
            <Github size={18} /> Authenticate with GitHub
          </button>
        </div>
      )}

      <form onSubmit={startScan} className="input-group">
        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {user ? 'Select Repository or Provide Target Target:' : 'Provide Target URL or Repository Payload (e.g. github_user/repo):'}
        </label>
        
        {user && repos.length > 0 ? (
          <select 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            className="input-field"
            style={{ appearance: 'none', background: 'var(--surface-color-light)' }}
          >
            <option value="">-- Click to query synchronized private repositories --</option>
            {repos.map(r => (
              <option key={r.name} value={r.name}>
                {r.private ? '🔒 Private ' : '🌐 Public '} - {r.name}
              </option>
            ))}
          </select>
        ) : (
          <input 
            type="text" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example: https://vulnerable-store.com"
            className="input-field"
            required={!user}
            disabled={isScanning}
          />
        )}
        
        <button type="submit" disabled={isScanning || !url} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', marginTop: '1rem', opacity: (!url || isScanning) ? 0.5 : 1 }}>
          {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          {isScanning ? 'Dual-Layer AI Engine Activated...' : 'Launch Deep Scan'}
        </button>
      </form>
      {error && <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--critical-bg)', color: '#fca5a5', borderRadius: '8px', border: '1px solid var(--critical)', fontSize: '0.9rem' }}>{error}</div>}
    </div>
  );
}
