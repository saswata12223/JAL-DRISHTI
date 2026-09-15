import React from 'react';
import { NavLink } from 'react-router-dom';

const MOBILE_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Actions', path: '/immediate-actions', icon: 'shield_with_heart' },
  { name: 'Analytics', path: '/analytics', icon: 'analytics' },
  { name: 'Alerts', path: '/alerts', icon: 'notifications' },
  { name: 'Monitoring', path: '/monitoring', icon: 'sensors' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-1.5 pb-safe bg-[#0F4C81] text-white border-t border-[#0B3B66] shadow-lg">
      {MOBILE_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-3 py-1 rounded transition-colors ${
              isActive
                ? 'bg-[#8FD3E8] text-[#0F4C81] font-bold shadow-xs'
                : 'text-slate-100 hover:text-white hover:bg-white/10'
            }`
          }
          title={item.name}
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="text-[10px] tracking-tight">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}



