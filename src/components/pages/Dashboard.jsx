import React from 'react';

const Dashboard = ({ 
  cardsVisible, 
  battery, 
  mqttConnected, 
  mqttPing, 
  buzzerAlerts, 
  setBuzzerAlerts,
  activity = 'Awake',
  sedentaryMinutes = 0,
  buzzerActive = false,
  handleDismissAlert
}) => {
  
  // Determine if the current state is sleep-related
  const isSleepMode = ['Light_Sleep', 'Deep_Sleep', 'REM_Sleep', 'Awake_Sleep', 'Sleep'].some(s => 
    activity.toLowerCase().includes(s.toLowerCase())
  );

  // Format activity label for nice display
  const formatActivityLabel = (act) => {
    return act.replace('_', ' ');
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
      
      {/* ===== DYNAMIC HERO CARD ===== */}
      <div className={`bento-card col-span-4 md:col-span-12 p-6 md:p-8 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col items-center text-center justify-center min-h-[300px] relative overflow-hidden transition-all duration-500 ${cardsVisible ? 'visible' : ''}`}>
        
        {/* Glow Background depending on state */}
        {isSleepMode ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#121826] via-[#1b253b] to-[#0f1420] pointer-events-none" />
        ) : (buzzerActive || sedentaryMinutes >= 50) ? (
          <div className="absolute inset-0 bg-gradient-to-br from-error-container/30 to-transparent pointer-events-none" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
          
          {/* Main Visual Indicator */}
          {isSleepMode ? (
            <div className="w-24 h-24 rounded-full bg-[#3b82f6]/10 flex items-center justify-center relative mb-4">
              <span className="material-symbols-outlined text-[#60a5fa] text-5xl animate-pulse">nights_stay</span>
            </div>
          ) : (buzzerActive || sedentaryMinutes >= 50) ? (
            <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center relative mb-4">
              <div className="w-16 h-16 rounded-t-full rounded-b-lg bg-error relative flex items-center justify-center shadow-lg animate-bounce">
                <span className="material-symbols-outlined text-white text-3xl">notifications_active</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error">
                <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-75" />
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative mb-4">
              <span className="material-symbols-outlined text-primary text-5xl">directions_run</span>
            </div>
          )}

          {/* Heading Text */}
          {isSleepMode ? (
            <h3 className="text-2xl font-bold tracking-tight text-[#93c5fd]">Sleep Monitoring Active</h3>
          ) : (buzzerActive || sedentaryMinutes >= 50) ? (
            <h3 className="text-2xl font-bold tracking-tight text-error">Time to Stand Up!</h3>
          ) : (
            <h3 className="text-2xl font-bold tracking-tight text-on-surface">Digital Wellness Active</h3>
          )}

          {/* Subtitle / Details */}
          {isSleepMode ? (
            <p className="text-sm md:text-base text-[#94a3b8] mt-2 mb-4">
              Current State: <span className="font-semibold text-white">{formatActivityLabel(activity)}</span>. Light and movement sensors are scanning sleep cycles.
            </p>
          ) : (buzzerActive || sedentaryMinutes >= 50) ? (
            <p className="text-sm md:text-base text-on-surface mt-2 mb-6">
              You've been sitting for <span className="font-bold text-error">{sedentaryMinutes} minutes</span> without stretching.
            </p>
          ) : (
            <p className="text-sm md:text-base text-on-surface-variant mt-2 mb-6">
              Current Activity: <span className="font-semibold text-primary">{formatActivityLabel(activity)}</span> • Sitting duration: <span className="font-semibold">{sedentaryMinutes} / 50 min</span>
            </p>
          )}

          {/* Action Button */}
          {(buzzerActive || sedentaryMinutes >= 50) ? (
            <button 
              onClick={handleDismissAlert}
              className="px-6 py-3 rounded-inner-panel font-medium text-sm transition-all shadow-md bg-error hover:bg-error/90 text-white active:scale-[0.98]"
            >
              Dismiss Alarm
            </button>
          ) : !isSleepMode && (
            <div className="w-full bg-surface-high/50 h-2.5 rounded-full overflow-hidden shadow-inner max-w-sm mb-2">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, (sedentaryMinutes / 50) * 100)}%` }} 
              />
            </div>
          )}

        </div>
      </div>

      {/* Sleep Tile */}
      <div className={`bento-card col-span-4 md:col-span-6 p-6 bg-surface-lowest/80 backdrop-blur-xl rounded-bento shadow-[0_16px_40px_-12px_rgba(0,102,255,0.15)] border-[1.5px] border-white flex flex-col justify-between min-h-[200px] ${cardsVisible ? 'visible' : ''}`}>
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-medium">Wellness Vitals</h4>
          <span className="material-symbols-outlined text-tertiary text-2xl">bedtime</span>
        </div>
        <div className="mt-4">
          <span className="text-xs text-on-surface-variant block uppercase tracking-wider font-semibold">Active Classification</span>
          <div className="text-3xl md:text-4xl font-bold tracking-tight text-tertiary mt-1">{formatActivityLabel(activity)}</div>
          <p className="text-xs text-on-surface-variant mt-1">
            {isSleepMode ? "LDR Sensor reports low light (sleep mode)" : "Accelerometer/Gyro features tracking motion"}
          </p>
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
            <span className="text-xs text-on-surface-variant block">MQTT Broker (broker.emqx.io)</span>
            <div className="text-base font-semibold">{mqttConnected ? 'Connected' : 'Offline'}</div>
            <span className="text-xs text-on-surface-variant font-medium">Ping: {mqttPing}ms</span>
          </div>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full ping-ring-custom ${mqttConnected ? 'bg-secondary/30' : 'bg-error/30'}`} />
            <div className={`w-3 h-3 rounded-full relative z-10 ${mqttConnected ? 'bg-secondary' : 'bg-error'}`} />
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
