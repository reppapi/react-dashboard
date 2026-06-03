import React from 'react';

const BottomNav = ({ activePage, setActivePage }) => {
  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', shortLabel: 'Home' },
    { id: 'health', label: 'Health Metrics', icon: 'monitor_heart', shortLabel: 'Vitals' },
    { id: 'history', label: 'Activity History', icon: 'history', shortLabel: 'History' },
    { id: 'devices', label: 'Device Status', icon: 'sensors', shortLabel: 'Device' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-r from-[#ffffff]/90 to-[#f2f6fc]/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,102,255,0.08)] border-t border-white/50 z-40 py-2 flex justify-around items-center">
      {navLinks.map(link => (
        <button
          key={link.id}
          onClick={() => setActivePage(link.id)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-on-surface-variant"
        >
          <div className={`w-16 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${activePage === link.id ? 'bg-[#0070eb] text-white font-semibold' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[24px]">{link.icon}</span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${activePage === link.id ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
            {link.shortLabel}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
