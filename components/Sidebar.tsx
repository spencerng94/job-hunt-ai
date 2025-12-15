import React from 'react';
import { LayoutDashboard, Briefcase, Mail, Users, Settings, Calendar, ListChecks, Info } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'applications', label: 'Applications', icon: <Briefcase size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'interviews', label: 'Interviews', icon: <ListChecks size={20} /> },
    { id: 'emails', label: 'Messages', icon: <Mail size={20} /> },
    { id: 'contacts', label: 'Recruiter Contacts', icon: <Users size={20} /> },
    { id: 'accounts', label: 'Accounts', icon: <Settings size={20} /> },
    { id: 'about', label: 'About', icon: <Info size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-indigo-500">Job</span>Hunt
        </h1>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
          <div>
            <p className="text-sm font-medium text-white">Alex Developer</p>
            <p className="text-xs text-slate-500">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
