import React, { useState } from 'react';
import ScanForm from './components/ScanForm';
import Dashboard from './components/Dashboard';
import { ShieldAlert } from 'lucide-react';
import './index.css';

function App() {
  const [scanResult, setScanResult] = useState(null);

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <ShieldAlert size={36} style={{ display: 'inline', marginRight: '10px' }} />
          HerculesSec Pro
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Dual-Layer AI Security Validation for Modern Architectures
        </p>
      </header>
      
      {!scanResult ? (
        <ScanForm onScanComplete={setScanResult} />
      ) : (
        <Dashboard result={scanResult} onNewScan={() => setScanResult(null)} />
      )}
    </div>
  );
}

export default App;
