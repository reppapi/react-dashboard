import React, { useState } from 'react';

const TIPS = [
  "Your deep sleep is slightly below optimal. Try caffeine-free herbal tea 30 min before bed.",
  "Consistent sleep schedules help regulate your circadian rhythm. Try waking up at the same time every day.",
  "Maintain your current routine for optimal recovery!"
];

const HealthMetrics = ({ cardsVisible }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [sleepData, setSleepData] = useState({
    score: 88,
    duration_str: '7h 42m',
    efficiency: '94%',
    stages: { light: 55, deep: 25, rem: 20 }
  });

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % TIPS.length);
  };

  React.useEffect(() => {
    const fetchSleepAnalysis = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sleep-analysis');
        if (response.ok) {
          const data = await response.json();
          setSleepData(data);
        }
      } catch (e) {
        console.error('Failed to fetch sleep analysis:', e);
      }
    };
    fetchSleepAnalysis();
  }, []);

  const L = sleepData.stages.light;
  const D = sleepData.stages.deep;
  const R = sleepData.stages.rem;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-on-surface tracking-tight font-sans">Sleep Architecture</h2>
        <p className="text-base text-on-surface-variant mt-1">Your physiological recovery patterns</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
        
        {/* Sleep Quality Score */}
        <div className={`bento-card col-span-4 md:col-span-12 p-6 md:p-8 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-center min-h-[380px] relative overflow-hidden ${cardsVisible ? 'visible' : ''}`}>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 w-full justify-around">
            <div className="w-full text-center md:text-left max-w-lg">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-bold tracking-wider mb-6">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>OPTIMAL REST
              </div>
              <div className="text-7xl font-bold tracking-tight mb-1">{sleepData.score}<span className="text-2xl text-outline ml-1 font-semibold">/100</span></div>
              <p className="text-2xl font-medium text-on-surface-variant mt-2 mb-8">Sleep Quality Score</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-low p-5 rounded-inner-panel">
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Duration</p>
                  <p className="text-3xl font-bold">{sleepData.duration_str}</p>
                </div>
                <div className="bg-surface-low p-5 rounded-inner-panel">
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-2">Efficiency</p>
                  <p className="text-3xl font-bold">{sleepData.efficiency}</p>
                </div>
              </div>
            </div>
            {/* Glowing Moon Graphic */}
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-surface-lowest/80 to-surface-container shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex items-center justify-center flex-shrink-0">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '130px' }}>dark_mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sleep Stages */}
        <div className={`bento-card col-span-4 md:col-span-8 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white min-h-[240px] flex flex-col justify-center ${cardsVisible ? 'visible' : ''}`}>
          <h3 className="text-lg font-medium mb-6">Sleep Stages</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-around">
            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-high)" strokeWidth="4"/>
                {/* Dynamic segments */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={`${L} 100`} strokeDashoffset="0" strokeLinecap="round"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#001a41" strokeWidth="4" strokeDasharray={`${D} 100`} strokeDashoffset={-L} strokeLinecap="round"/>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--primary-fixed-dim)" strokeWidth="4" strokeDasharray={`${R} 100`} strokeDashoffset={-(L+D)} strokeLinecap="round"/>
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs text-on-surface-variant font-medium">Total</span>
                <span className="text-xl font-bold">{sleepData.duration_str.split(' ')[0]}</span>
              </div>
            </div>
            
            <div className="flex-1 w-full flex flex-col gap-5">
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-primary" /><span className="text-on-surface-variant font-medium">Light Sleep</span></div>
                <span className="font-bold">{L}%</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#001a41]" /><span className="text-on-surface-variant font-medium">Deep Sleep</span></div>
                <span className="font-bold">{D}%</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-primary-fixed-dim" /><span className="text-on-surface-variant font-medium">REM</span></div>
                <span className="font-bold">{R}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Insight Box (Dynamic Tips) */}
        <div className={`bento-card col-span-4 md:col-span-4 p-6 bg-primary-container text-on-primary rounded-bento shadow-md flex flex-col justify-between relative overflow-hidden ${cardsVisible ? 'visible' : ''}`}>
          <div className="absolute right-[-16px] bottom-[-16px] opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">lightbulb</span>
          </div>
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 text-white">
              <span className="material-symbols-outlined text-2xl">tips_and_updates</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Daily Insight</h3>
            <p className="text-sm opacity-90 leading-relaxed min-h-[80px] transition-all duration-300">
              {TIPS[tipIndex]}
            </p>
          </div>
          <button 
            onClick={nextTip}
            className="mt-8 self-start px-5 py-3 bg-white text-primary-container border-none rounded-xl text-xs font-semibold tracking-wider uppercase transition-transform active:scale-95 shadow-sm"
          >
            Read More Tips
          </button>
        </div>

      </div>
    </div>
  );
};

export default HealthMetrics;
