import React, { useState } from 'react';

export default function Heartbeat() {
  const generatePoints = () => {
    const numSpikes = Math.floor(Math.random() * 5) + 3; // 3 to 7 points
    let pts = ["0,50"];
    let currentX = 15;
    const step = 70 / numSpikes; // Distribute across
    
    for (let i = 0; i < numSpikes; i++) {
       const isUp = i % 2 === (Math.random() > 0.5 ? 0 : 1);
       const y = isUp 
           ? Math.floor(Math.random() * 25) + 5 // 5 to 30
           : 95 - Math.floor(Math.random() * 25); // 70 to 95
           
       currentX += step;
       pts.push(`${currentX.toFixed(1)},${y}`);
    }
    pts.push("100,50");
    return pts.join(" ");
  };

  const [points, setPoints] = useState(generatePoints());

  return (
    <div 
      className="heartbeat-pulse-container flex items-center" 
      onAnimationIteration={() => setPoints(generatePoints())}
    >
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 100%)', boxShadow: '0 0 15px 1px rgba(255,255,255,0.5)' }}></div>
      
      <div className="spike-wrapper shrink-0 -mx-[2px]">
        <svg viewBox="0 0 100 100" className="w-32 h-24" preserveAspectRatio="none">
          <polyline 
            points={points} 
            fill="none" 
            stroke="rgba(255,255,255,0.9)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}
          />
        </svg>
      </div>
      
      <div className="h-[2px] w-12" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, transparent 100%)', boxShadow: '0 0 15px 1px rgba(255,255,255,0.5)' }}></div>
    </div>
  );
}
