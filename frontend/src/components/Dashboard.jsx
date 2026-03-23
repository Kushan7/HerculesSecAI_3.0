import React from 'react';
import { Shield, ShieldAlert, CheckCircle, RefreshCw, Code2, FileDown } from 'lucide-react';

export default function Dashboard({ result, onNewScan }) {
  if (!result || result.vulnerabilities.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <CheckCircle size={64} color="var(--low)" style={{ margin: '0 auto 1rem' }} />
        <h2>No Vulnerabilities Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This architecture appears secure based on current checks.</p>
        <button onClick={onNewScan} className="btn-primary" style={{ marginTop: '2rem' }}>New Scan</button>
      </div>
    );
  }

  const criticalCount = result.vulnerabilities.filter(v => v.severity === 'Critical').length;
  const highCount = result.vulnerabilities.filter(v => v.severity === 'High').length;

  return (
    <div className="dashboard-grid">
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Risk Profile</h3>
        
        <div className={`score-circle ${result.risk_score > 70 ? 'bad' : 'good'}`}>
          {result.risk_score}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
          {result.risk_score > 70 ? 'Critical Attention Required' : 'Acceptable Posture'}
        </p>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Critical</span> <strong style={{ color: 'var(--critical)' }}>{criticalCount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>High</span> <strong style={{ color: 'var(--high)' }}>{highCount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Medium / Low</span> <strong>{result.vulnerabilities.length - criticalCount - highCount}</strong>
          </div>
        </div>

        <button onClick={onNewScan} className="btn-primary" style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <RefreshCw size={18} /> Rescan
        </button>
        <button 
          onClick={() => {
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vibe-scan-${result.scan_id}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)' }}>
          <FileDown size={18} /> Export JSON Report
        </button>
      </div>

      <div>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert color="var(--primary-accent)" />
          Vulnerability Report
        </h2>
        {result.vulnerabilities.map(vuln => (
          <div key={vuln.id} className={`vuln-card ${vuln.severity.toLowerCase()}`}>
            <span className={`badge ${vuln.severity.toLowerCase()}`}>{vuln.severity} (CVSS: {vuln.cvss_score})</span>
            <h3 style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>{vuln.title}</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{vuln.description}</p>
            
            {vuln.poc && (
              <>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Code2 size={16}/> Proof of Concept</h4>
                <div className="code-block">{vuln.poc}</div>
              </>
            )}

            <h4 style={{ color: 'var(--low)', marginTop: '1.5rem' }}>AI Auto-Remediation</h4>
            <p style={{ marginBottom: '0.5rem' }}>{vuln.remediation}</p>
            {vuln.secure_code && (
              <div className="code-block" style={{ borderLeft: '4px solid var(--low)' }}>
                {vuln.secure_code}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
