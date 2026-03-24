import React, { useState } from 'react';
import { FileDown, ChevronDown, ChevronUp, Flag, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function Dashboard({ result, onNewScan }) {
  const [expandedVulns, setExpandedVulns] = useState({});

  if (!result || result.vulnerabilities.length === 0) {
    return (
      <div className="summary-box" style={{ textAlign: 'center', padding: '3rem' }}>
        <CheckCircle size={64} color="var(--low)" style={{ margin: '0 auto 1rem' }} />
        <h2>No Vulnerabilities Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This architecture appears secure based on current checks.</p>
        <button onClick={onNewScan} className="btn-primary" style={{ marginTop: '2rem' }}>New Scan</button>
      </div>
    );
  }

  const toggleVuln = (id) => {
    setExpandedVulns(prev => ({...prev, [id]: !prev[id]}));
  };

  const getSeverityColor = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'critical': return 'var(--critical)';
      case 'high': return 'var(--high)';
      case 'medium': return 'var(--medium)';
      case 'low': return 'var(--low)';
      default: return 'var(--info)';
    }
  };

  const counts = {
    critical: result.vulnerabilities.filter(v => v.severity === 'Critical').length,
    high: result.vulnerabilities.filter(v => v.severity === 'High').length,
    medium: result.vulnerabilities.filter(v => v.severity === 'Medium').length,
    low: result.vulnerabilities.filter(v => v.severity === 'Low').length,
    info: result.vulnerabilities.filter(v => v.severity === 'Info').length,
  };

  const InfoRow = ({ label, value, status }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${status ? 'status-finished' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* SUMMARY BOX */}
      <div className="summary-box">
        <div className="summary-header">Website Vulnerability Scanner Report</div>
        <div className="summary-body">
          <div className="overall-risk">
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Overall risk level:</div>
            <div className="risk-badge-large" style={{ backgroundColor: getSeverityColor(result.overall_risk_level) }}>
              {result.overall_risk_level}
            </div>
          </div>
          
          <div className="risk-bars-container">
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Risk ratings:</div>
            <div className="risk-bars">
              {['Critical', 'High', 'Medium', 'Low', 'Info'].map(lvl => {
                const count = counts[lvl.toLowerCase()];
                const width = Math.max(0, (count / Math.max(result.vulnerabilities.length, 1)) * 100);
                return (
                  <div className="risk-row" key={lvl}>
                    <span className="risk-label">{lvl}:</span>
                    <div className="risk-track">
                      {count > 0 && (
                        <div className="risk-fill" style={{ width: `${Math.max(width, 5)}%`, backgroundColor: getSeverityColor(lvl) }}>
                          {count}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="scan-info">
            <InfoRow label="Start time:" value={result.start_time ? new Date(result.start_time).toLocaleString() : 'N/A'} />
            <InfoRow label="Finish time:" value={result.finish_time ? new Date(result.finish_time).toLocaleString() : 'N/A'} />
            <InfoRow label="Scan duration:" value={result.scan_duration} />
            <InfoRow label="Tests performed:" value={`${result.tests_performed} / ${result.tests_performed}`} />
            <InfoRow label="Scan status:" value={result.status.toUpperCase()} status={true} />
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `herculessec-scan-${result.scan_id}.json`; a.click();
                  URL.revokeObjectURL(url);
                }} className="btn-primary" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FileDown size={16} /> Export JSON
                </button>
                <button onClick={onNewScan} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)' }}>
                  <RefreshCw size={16} />
                </button>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', marginTop: '3rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Findings
      </h2>

      {result.vulnerabilities.map(vuln => (
        <div key={vuln.id} className="finding-card">
          <div className="find-header" onClick={() => toggleVuln(vuln.id)}>
            <div className="find-title-group">
              <Flag color={getSeverityColor(vuln.severity)} fill={getSeverityColor(vuln.severity)} size={20} />
              {vuln.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="find-tag">CONFIRMED</span>
              {expandedVulns[vuln.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          <table className="find-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Method</th>
                <th>Vulnerable Parameter</th>
                <th>Evidence</th>
                <th>CVSS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--primary-accent)', wordBreak: 'break-all', maxWidth: '200px' }}>{result.target}</td>
                <td>{vuln.method || 'GET'}</td>
                <td>{vuln.vulnerable_parameter || 'header / payload'}</td>
                <td className="evidence">{vuln.evidence || vuln.description.substring(0,60)+'...'}</td>
                <td style={{ fontWeight: 600 }}>{vuln.cvss_score}</td>
              </tr>
            </tbody>
          </table>

          {expandedVulns[vuln.id] && (
            <div className="find-details-area">
              <div className="find-section-title">Risk Description:</div>
              <p style={{ marginBottom: '1.5rem' }}>{vuln.description}</p>

              <div className="find-section-title">Recommendation:</div>
              <p style={{ marginBottom: '1.5rem' }}>{vuln.remediation}</p>

              {vuln.secure_code && (
                <>
                  <div className="find-section-title">AI Auto-Remediation:</div>
                  <div className="code-block" style={{ marginBottom: '1.5rem', borderLeft: `3px solid ${getSeverityColor(vuln.severity)}` }}>
                    {vuln.secure_code}
                  </div>
                </>
              )}

              {vuln.poc && (
                <>
                  <div className="find-section-title">Proof of Concept:</div>
                  <div className="code-block" style={{ marginBottom: '1.5rem', color: '#fca5a5' }}>
                    {vuln.poc}
                  </div>
                </>
              )}

              <div className="find-section-title">Classification:</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div><strong>CWE:</strong> {vuln.cwe || 'CWE-Unknown'}</div>
                <div><strong>OWASP:</strong> {vuln.owasp || 'A00: Unknown'}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
