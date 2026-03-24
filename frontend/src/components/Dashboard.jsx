import React, { useState } from 'react';
import { FileDown, ChevronDown, ChevronUp, Flag, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Dashboard({ result, onNewScan }) {
  const [expandedVulns, setExpandedVulns] = useState({});

  const toggleVuln = (id) => {
    setExpandedVulns(prev => ({...prev, [id]: !prev[id]}));
  };

  const getSeverityColor = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#22c55e';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center relative z-20 mt-8 mb-24">
      {/* GLOWING HEALTH GRID HUD */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 items-center mb-16">
        {/* Left Column: Threat Emanation */}
        <div className="flex flex-col items-center md:items-start space-y-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-[10px] tracking-[0.5em] uppercase text-gold/60 font-bold">Threat Emanation</h3>
            <p className="text-sm text-white/40 italic font-light">Calculated risk level from deep scan.</p>
          </div>
          <div className="w-full h-40 glass-morphism rounded-[40px] relative overflow-hidden flex items-center justify-center swirl-pattern">
            <div className="absolute w-32 h-32 rounded-full bg-energy/20 blur-2xl animate-pulse"></div>
            <div className="relative flex flex-col items-center">
              <span className="text-3xl font-thin tracking-tighter uppercase" style={{ color: getSeverityColor(result.overall_risk_level) }}>
                {result.overall_risk_level}
              </span>
              <div className="flex space-x-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-energy/50"></div>
                <div className="w-1 h-1 rounded-full bg-energy/30"></div>
                <div className="w-1 h-1 rounded-full bg-energy/10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Security Health Orb */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="absolute -top-16 text-center">
            <h2 className="text-xs tracking-[0.8em] uppercase text-white/30 mb-2">Security Health</h2>
          </div>
          <div className="orb-gradient w-56 h-56 rounded-full relative flex items-center justify-center border border-white/10 group transition-transform duration-1000 hover:scale-105">
            <div className="absolute inset-0 rounded-full swirl-pattern opacity-40"></div>
            <div className="text-center z-10 flex flex-col items-center">
              <div className="flex items-baseline">
                <span className="text-6xl font-extralight tracking-tighter text-charcoal">{Math.max(0, 100 - result.risk_score)}</span>
                <span className="text-xl font-bold text-charcoal/60">%</span>
              </div>
              <div className="text-[8px] tracking-[0.4em] uppercase text-charcoal/80 mt-1 font-black">
                {result.risk_score < 20 ? 'Optimal' : result.risk_score < 50 ? 'Warning' : 'Critical'}
              </div>
            </div>
            <div className="absolute -inset-8 rounded-full border border-gold/5 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute -inset-12 rounded-full border border-gold/5 animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
          <div className="mt-12 flex space-x-6 z-20">
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `herculesec-${result.scan_id}.json`; a.click();
              URL.revokeObjectURL(url);
            }} className="flex items-center space-x-2 text-white/50 hover:text-gold transition-colors text-xs uppercase tracking-widest cursor-pointer bg-transparent border-none outline-none">
              <FileDown size={14} /> <span>JSON</span>
            </button>
            <button onClick={onNewScan} className="flex items-center space-x-2 text-white/50 hover:text-energy transition-colors text-xs uppercase tracking-widest cursor-pointer bg-transparent border-none outline-none">
              <RefreshCw size={14} /> <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Column: Health Snapshot */}
        <div className="flex flex-col items-center md:items-end space-y-8">
          <div className="text-center md:text-right space-y-1">
            <h3 className="text-[10px] tracking-[0.5em] uppercase text-gold/60 font-bold">Health Snapshot</h3>
            <p className="text-sm text-white/40 italic font-light">Global safety metrics at a glance.</p>
          </div>
          <div className="w-full glass-morphism rounded-[40px] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Integrity</span>
              <span className="text-xs text-gold">{result.integrity}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gold/40" style={{ width: result.integrity }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Latency</span>
              <span className="text-xs text-energy">{result.latency}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[12%] bg-energy/40"></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Resilience</span>
              <span className="text-xs text-white/80">{result.resilience}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FINDINGS SECTION */}
      <div className="w-full mt-12">
        <div className="flex items-center mb-8 border-b border-white/10 pb-4">
           <h2 className="text-lg tracking-[0.3em] font-light text-white/80 uppercase">
             Vulnerability Matrix
           </h2>
           <span className="ml-4 bg-energy/20 text-energy text-xs px-3 py-1 rounded-full border border-energy/30">
             {result.vulnerabilities?.length || 0} Nodes
           </span>
        </div>

        {!result.vulnerabilities || result.vulnerabilities.length === 0 ? (
           <div className="w-full glass-morphism p-12 rounded-3xl text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gold/5 flex items-center justify-center mb-6 border border-gold/20">
                 <span className="material-symbols-outlined text-4xl text-gold/40">shield_lock</span>
              </div>
              <h3 className="text-xl font-light tracking-widest text-white/90 mb-2">Architecture Secured</h3>
              <p className="text-white/40 text-sm">No vulnerabilities were detected during the dual-layer scan.</p>
           </div>
        ) : (
          <div className="space-y-6">
            {result.vulnerabilities.map(vuln => (
              <div key={vuln.id} className="w-full glass-morphism rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20">
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() => toggleVuln(vuln.id)}
                >
                  <div className="flex items-center gap-4">
                    <Flag color={getSeverityColor(vuln.severity)} fill={getSeverityColor(vuln.severity)} size={20} />
                    <span className="font-semibold text-white/90 tracking-wide">{vuln.title}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] tracking-widest uppercase px-3 py-1 rounded border border-energy/30 text-energy bg-energy/10 hidden sm:inline-block">
                      Confirmed
                    </span>
                    {expandedVulns[vuln.id] ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
                  </div>
                </div>

                {expandedVulns[vuln.id] && (
                  <div className="p-8 border-t border-white/10 bg-black/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div>
                         <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Target Line</div>
                         <div className="text-sm text-energy font-mono break-all">{result.target}</div>
                      </div>
                      <div>
                         <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Method</div>
                         <div className="text-sm text-white/80">{vuln.method || 'GET'}</div>
                      </div>
                      <div>
                         <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">CVSS Score</div>
                         <div className="text-sm font-bold" style={{ color: getSeverityColor(vuln.severity) }}>{vuln.cvss_score}</div>
                      </div>
                      <div>
                         <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Ontology (CWE)</div>
                         <div className="text-sm text-white/80">{vuln.cwe || 'CWE-Unknown'}</div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] tracking-[0.3em] uppercase text-gold/80 mb-3">Threat Descriptor</h4>
                        <div className="text-sm text-white/60 leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{vuln.description}</ReactMarkdown>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] tracking-[0.3em] uppercase text-energy/80 mb-3">Remediation Protocol</h4>
                        <div className="text-sm text-white/60 leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{vuln.remediation}</ReactMarkdown>
                        </div>
                      </div>

                      {vuln.secure_code && (
                        <div>
                          <h4 className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-3">AI Auto-Patch Code</h4>
                          <div className="bg-[#0a0a0c] p-4 rounded-lg border border-white/5 text-sm text-green-400 font-mono overflow-x-auto">
                            <pre className="m-0"><code>{vuln.secure_code}</code></pre>
                          </div>
                        </div>
                      )}

                      {vuln.poc && (
                        <div>
                          <h4 className="text-[10px] tracking-[0.3em] uppercase text-red-500/80 mb-3">Proof of Concept</h4>
                          <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/30 text-sm text-red-300 font-mono overflow-x-auto">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{vuln.poc}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
