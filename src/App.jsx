import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/pages/Dashboard';
import HealthMetrics from './components/pages/HealthMetrics';
import ActivityHistory from './components/pages/ActivityHistory';
import Devices from './components/pages/Devices';

function App() {
  // ---- Application State ----
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  // ---- IoT Telemetry State (Synced with Backend) ----
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttPing, setMqttPing] = useState(12);
  const [qualityScore, setQualityScore] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState(true);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [activity, setActivity] = useState('Awake');
  const [sedentaryMinutes, setSedentaryMinutes] = useState(0);
  const [ldrValue, setLdrValue] = useState(200);

  // ---- Sync State ----
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  // Trigger stagger animation on page load/change
  useEffect(() => {
    setCardsVisible(false);
    const timer = setTimeout(() => {
      setCardsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [activePage]);

  // Real-time backend status polling
  const fetchQuality = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/quality');
      if (response.ok) {
        const data = await response.json();
        setQualityScore(data.quality_score);
      }
    } catch (error) {
      console.error('Error fetching quality score:', error);
    }
  };
    try {
      const response = await fetch('http://localhost:5000/api/status');
      if (response.ok) {
        const data = await response.json();
        setMqttConnected(data.mqtt_connected);
        setMqttPing(data.mqtt_ping);
        setBattery(data.battery);
        setOptimizationMode(data.optimization_mode);
        setBuzzerActive(data.buzzer_active);
        setActivity(data.activity);
        setSedentaryMinutes(data.sedentary_minutes);
        setLdrValue(data.ldr_value);
      } else {
        setMqttConnected(false);
      }
    } catch (error) {
      console.error('Error fetching backend status:', error);
      setMqttConnected(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchQuality();
    const interval = setInterval(() => { fetchStatus(); fetchQuality(); }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('http://localhost:5000/api/sync', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setLastSyncTime(data.time);
      }
    } catch (e) {
      console.error('Sync request failed:', e);
    } finally {
      setTimeout(() => {
        setSyncing(false);
      }, 1000);
    }
  };

  const handleToggleBuzzerEnabled = async (enabled) => {
    setBuzzerEnabled(enabled);
    try {
      await fetch('http://localhost:5000/api/settings/buzzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
    } catch (e) {
      console.error('Failed to toggle buzzer:', e);
    }
  };

  const handleToggleOptimization = async (enabled) => {
    setOptimizationMode(enabled);
    try {
      await fetch('http://localhost:5000/api/settings/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
    } catch (e) {
      console.error('Failed to toggle optimization:', e);
    }
  };

  const handleDismissAlert = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dismiss', { method: 'POST' });
      if (response.ok) {
        fetchStatus();
      }
    } catch (e) {
      console.error('Dismiss failed:', e);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f2f6fc] via-[#edf3fa] to-[#e4eef9] text-on-surface">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        handleSync={handleSync}
        syncing={syncing}
      />

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[260px] pb-20 md:pb-0">
        
        <TopBar 
          activePage={activePage}
          lastSyncTime={lastSyncTime}
          handleSync={handleSync}
          syncing={syncing}
          setSidebarOpen={setSidebarOpen}
        />

        {/* ===== SCROLLABLE CANVAS ===== */}
        <main className="flex-1 p-4 md:p-10 max-w-[1440px] mx-auto w-full">
          {activePage === 'dashboard' && (
            <Dashboard 
              cardsVisible={cardsVisible}
              battery={battery}
              mqttConnected={mqttConnected}
              mqttPing={mqttPing}
              buzzerAlerts={buzzerEnabled}
              setBuzzerAlerts={handleToggleBuzzerEnabled}
              activity={activity}
              sedentaryMinutes={sedentaryMinutes}
              buzzerActive={buzzerActive}
              handleDismissAlert={handleDismissAlert}
              qualityScore={qualityScore}
            />
          )}
          {activePage === 'health' && <HealthMetrics cardsVisible={cardsVisible} />}
          {activePage === 'history' && <ActivityHistory cardsVisible={cardsVisible} />}
          {activePage === 'devices' && (
            <Devices 
              cardsVisible={cardsVisible}
              battery={battery}
              optimizationMode={optimizationMode}
              setOptimizationMode={handleToggleOptimization}
              buzzerAlerts={buzzerEnabled}
              setBuzzerAlerts={handleToggleBuzzerEnabled}
            />
          )}
        </main>
      </div>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default App;
