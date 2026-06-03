import React from 'react';

const Sidebar = ({ activePage, setActivePage, sidebarOpen, setSidebarOpen, handleSync, syncing }) => {
  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'health', label: 'Health Metrics', icon: 'monitor_heart' },
    { id: 'history', label: 'Activity History', icon: 'history' },
    { id: 'devices', label: 'Device Status', icon: 'sensors' }
  ];

  return (
    <>
      <aside className={`fixed left-0 top-0 bottom-0 w-[260px] bg-gradient-to-b from-[#ffffff]/90 to-[#f2f6fc] backdrop-blur-xl shadow-lg border-r border-surface-low flex flex-col p-8 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-10 px-3">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">monitor_heart</span>
          </div>
          <div>
            <div className="text-xl font-bold text-primary tracking-tight">HealthOS</div>
            <div className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">Smart Badge IoT</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                setActivePage(link.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 border-r-4 ${activePage === link.id ? 'bg-primary/5 text-primary border-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container border-transparent'}`}
            >
              <span className="material-symbols-outlined text-2xl">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 flex flex-col gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-3 rounded-inner-panel bg-primary hover:bg-[#004a9e] text-on-primary font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-lg ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Syncing...' : 'Sync Devices'}
          </button>
        </div>
      </aside>

      {/* Side Nav overlay backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
