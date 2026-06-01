import React from 'react';

const TopBar = ({ activePage, lastSyncTime, handleSync, syncing, setSidebarOpen }) => {
  const getPageTitle = () => {
    switch(activePage) {
      case 'devices': return 'Device Status';
      case 'health': return 'Health Metrics';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      {/* ===== TOP BAR (Desktop) ===== */}
      <header className="hidden md:flex justify-between items-center px-10 py-5 sticky top-0 bg-gradient-to-r from-[#f2f6fc]/80 to-[#edf3fa]/80 backdrop-blur-md z-30 border-b border-surface-high/20">
        <h1 className="text-3xl font-semibold text-primary tracking-tight">{getPageTitle()}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-on-surface-variant font-medium">Last sync: {lastSyncTime}</span>
          <button 
            onClick={handleSync}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors ${syncing ? 'animate-spin text-primary' : ''}`}
          >
            <span className="material-symbols-outlined">sync</span>
          </button>
        </div>
      </header>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="flex md:hidden justify-between items-center px-4 py-3 sticky top-0 bg-gradient-to-r from-[#f2f6fc]/95 to-[#edf3fa]/95 backdrop-blur-md shadow-sm z-40 border-b border-white/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl font-bold">monitor_heart</span>
          <span className="text-lg font-bold text-primary">HealthOS</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-low"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default TopBar;
