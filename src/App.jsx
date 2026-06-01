import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './components/pages/Dashboard';
import HealthMetrics from './components/pages/HealthMetrics';
import Devices from './components/pages/Devices';

function App() {
  // ---- Application State ----
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  // ---- IoT Telemetry State ----
  const [mqttConnected, setMqttConnected] = useState(true);
  const [mqttPing, setMqttPing] = useState(12);
  const [battery, setBattery] = useState(85);
  const [optimizationMode, setOptimizationMode] = useState(true);

  // ---- Hardware Control State ----
  const [buzzerAlerts, setBuzzerAlerts] = useState(true);

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

  // Real-time IoT Data Stream Simulation
  useEffect(() => {
    const netInterval = setInterval(() => {
      setMqttPing(Math.floor(Math.random() * 15) + 8);
    }, 5000);

    const battInterval = setInterval(() => {
      setBattery(prev => {
        if (Math.random() > 0.8) {
          return Math.max(10, prev - 1);
        }
        return prev;
      });
    }, 45000);

    return () => {
      clearInterval(netInterval);
      clearInterval(battInterval);
    };
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 2000);
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
              buzzerAlerts={buzzerAlerts}
              setBuzzerAlerts={setBuzzerAlerts}
            />
          )}
          {activePage === 'health' && <HealthMetrics cardsVisible={cardsVisible} />}
          {activePage === 'devices' && (
            <Devices 
              cardsVisible={cardsVisible}
              battery={battery}
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
              buzzerAlerts={buzzerAlerts}
              setBuzzerAlerts={setBuzzerAlerts}
            />
          )}
        </main>
      </div>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default App;
