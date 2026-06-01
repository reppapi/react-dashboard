import React, { useState } from 'react';

const Dashboard = ({ 
  cardsVisible, 
  battery, 
  mqttConnected, 
  mqttPing, 
  buzzerAlerts, 
  setBuzzerAlerts 
}) => {
  const [standAlertDismissed, setStandAlertDismissed] = useState(false);

  return (
    <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
      
      {/* Hero Alert: Time to Stand Up */}
      <div className={`bento-card col-span-4 md:col-span-12 p-6 md:p-8 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col items-center text-center justify-center min-h-[320px] relative overflow-hidden ${cardsVisible ? 'visible' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative mb-6">
            <div className={`w-16 h-16 rounded-t-full rounded-b-lg bg-primary opacity-80 relative flex items-center justify-center shadow-lg ${!standAlertDismissed ? 'animate-bounce' : ''}`}>
              <span className="material-symbols-outlined text-on-primary text-3xl">notifications_active</span>
              <div className="w-4 h-4 rounded-full bg-[#005bc1] absolute -bottom-2 left-1/2 -translate-x-1/2" />
            </div>
            {!standAlertDismissed && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Time to Stand Up</h3>
          <p className="text-sm md:text-base text-on-surface-variant mt-2 mb-6">You've been sitting for 50 minutes.</p>
          <button 
            onClick={() => setStandAlertDismissed(true)}
            disabled={standAlertDismissed}
            className={`px-6 py-3 rounded-inner-panel font-medium text-sm transition-all shadow-md ${
              standAlertDismissed 
                ? 'bg-surface-high text-on-surface-variant cursor-not-allowed opacity-70' 
                : 'bg-primary hover:bg-[#004a9e] text-on-primary active:scale-[0.98]'
            }`}
          >
            {standAlertDismissed ? 'Dismissed' : 'Dismiss'}
          </button>
        </div>
      </div>

      {/* Sleep Tile */}
      <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[200px] ${cardsVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-medium">Sleep</h4>
          <span className="material-symbols-outlined text-tertiary text-2xl">bedtime</span>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="text-4xl md:text-5xl font-bold tracking-tight">7h 45m</div>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">Light &amp; Deep cycles optimal</p>
        </div>
        <div className="flex items-end gap-1 h-12 md:h-8 mt-4 opacity-50">
          <div className="flex-1 bg-tertiary-container rounded-t h-[33%]" />
          <div className="flex-1 bg-tertiary-container rounded-t h-[66%]" />
          <div className="flex-1 bg-tertiary-container rounded-t h-[100%]" />
          <div className="flex-1 bg-tertiary-container rounded-t h-[50%]" />
          <div className="flex-1 bg-tertiary-container rounded-t h-[75%]" />
          <div className="flex-1 bg-tertiary-container rounded-t h-[25%]" />
        </div>
      </div>

      {/* Device Battery Tile */}
      <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[200px] ${cardsVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-medium">Device Battery</h4>
          <span className="material-symbols-outlined text-primary text-2xl">battery_5_bar</span>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-4xl md:text-5xl font-bold tracking-tight">{battery}%</span>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-4 rounded-full bg-surface-high overflow-hidden shadow-inner w-full relative">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-[#4da6ff] transition-all duration-1000 ease-out rounded-full" style={{ width: `${battery}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* MQTT Connection Status Tile */}
      <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[200px] ${cardsVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-medium">Network Hub</h4>
          <span className="material-symbols-outlined text-on-surface-variant text-2xl">router</span>
        </div>
        <div className="bg-surface-low rounded-inner-panel p-4 flex justify-between items-center mt-4 flex-1">
          <div>
            <span className="text-xs text-on-surface-variant block">MQTT Status</span>
            <div className="text-base font-semibold">{mqttConnected ? 'Connected' : 'Offline'}</div>
            <span className="text-xs text-on-surface-variant font-medium">Ping: {mqttPing}ms</span>
          </div>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-secondary/30 ping-ring-custom" />
            <div className="w-3 h-3 rounded-full bg-secondary relative z-10" />
          </div>
        </div>
      </div>

      {/* Buzzer Toggle switch */}
      <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[200px] ${cardsVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">notifications_active</span>Buzzer Alarm
          </h4>
        </div>
        <div className="bg-surface-low rounded-inner-panel p-5 flex justify-between items-center mt-4 flex-1">
          <div>
            <div className="text-base font-medium">Audible Alerts</div>
            <span className={`text-xs font-semibold ${buzzerAlerts ? 'text-secondary' : 'text-on-surface-variant'}`}>{buzzerAlerts ? 'ON' : 'OFF'}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={buzzerAlerts} onChange={(e) => setBuzzerAlerts(e.target.checked)} className="sr-only peer" />
            <div className="w-[52px] h-7 bg-surface-high rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
