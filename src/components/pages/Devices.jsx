import React from 'react';

const Devices = ({
  cardsVisible,
  battery,
  optimizationMode,
  setOptimizationMode,
  buzzerAlerts,
  setBuzzerAlerts
}) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-on-surface tracking-tight font-sans">Device Management</h2>
        <p className="text-base text-on-surface-variant mt-1">Monitor and configure your connected health wearables.</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
        
        {/* Hero Connection Badge */}
        <div className={`bento-card col-span-4 md:col-span-12 p-6 md:p-8 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col sm:flex-row items-center gap-8 min-h-[360px] relative overflow-hidden ${cardsVisible ? 'visible' : ''}`}>
          <div className="absolute right-[-64px] top-[-64px] w-64 h-64 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute left-[-40px] bottom-[-40px] w-40 h-40 bg-secondary/10 rounded-full filter blur-2xl pointer-events-none" />
          
          <div className="flex-1 z-10 flex flex-col justify-center text-center sm:text-left items-center sm:items-start pl-4 md:pl-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>Connected
            </div>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">PulseBadge Pro</h3>
            <p className="text-base md:text-lg text-on-surface-variant max-w-md">
              Primary vitals monitor active. Health parameters are continuously synchronizing with your personal dashboard.
            </p>
            <div className="mt-8 px-5 py-3 bg-surface-low text-on-surface-variant rounded-xl text-sm font-medium border border-surface-high/30 inline-block">
              Device ID: PB-893-XJ2 • Firmware: v2.1.4
            </div>
          </div>

          {/* Badge Visual — SVG inline (no missing image) */}
          <div className="w-64 h-64 flex items-center justify-center relative z-10 select-none mr-4 md:mr-10 pulse-custom">
            <div className="relative w-48 h-60 flex items-center justify-center">
              {/* Badge outer shape */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#1a75ff] via-[#0055cc] to-[#003a99] shadow-[0_20px_60px_-10px_rgba(0,102,255,0.6)]" />
              {/* Clip at top (badge pin area) */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-[#c0c8d8] to-[#8090a8] shadow-md border-2 border-white/30" />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-5 bg-gradient-to-b from-[#b0bcc8] to-[#8090a8]" />
              {/* Screen/display area */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-2 px-4 w-full">
                <div className="w-full h-16 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[#4da6ff] text-4xl">monitoring</span>
                </div>
                <div className="text-white font-bold text-base tracking-wide">PulseBadge</div>
                <div className="flex gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-[#6ffb85] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-[#4da6ff]" />
                  <div className="w-2 h-2 rounded-full bg-[#c084fc]" />
                </div>
              </div>
              {/* Gloss overlay */}
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Battery status circle */}
        <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[360px] ${cardsVisible ? 'visible' : ''}`}>
          <div className="flex justify-between items-start">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">battery_charging_full</span>Power Level
            </h4>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">Est. 4 Days</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface-high)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--secondary)" strokeWidth="8" 
                        strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - battery / 100)} strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"/>
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-bold tracking-tighter">{battery}%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-low p-5 rounded-xl flex justify-between items-center">
            <span className="text-sm text-on-surface-variant font-medium">Optimization Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={optimizationMode} onChange={(e) => setOptimizationMode(e.target.checked)} className="sr-only peer" />
              <div className="w-[52px] h-7 bg-surface-high rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>

        {/* Hardware Toggle Panel */}
        <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white ${cardsVisible ? 'visible' : ''}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">tune</span>
            </div>
            <h4 className="text-lg font-medium">Hardware Controls</h4>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-surface-low p-6 rounded-3xl flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-outline text-4xl">notifications_active</span>
                <div>
                  <p className="text-xl font-semibold">Buzzer Alarm</p>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">Audible alerts for critical notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={buzzerAlerts} onChange={(e) => setBuzzerAlerts(e.target.checked)} className="sr-only peer" />
                <div className="w-14 h-8 bg-surface-high rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Devices;
