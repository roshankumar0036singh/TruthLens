import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  History, 
  Activity, 
  Settings, 
  Cpu,
  Users,
  Trophy,
  Network
} from 'lucide-react';

const NavItem = ({ icon: Icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 relative transition-all flex-shrink-0 min-w-0 ${
      active ? 'text-lime-400' : 'text-gray-600 hover:text-white'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeTab" 
        className="absolute bottom-0 left-0 w-full h-[1px] bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]" 
      />
    )}
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[7px] uppercase tracking-widest font-bold leading-none">{label}</span>
  </button>
);

const Navigation = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex border-t border-white/5 bg-black/80 backdrop-blur-3xl sticky bottom-0 z-50 w-full overflow-x-hidden">
      <NavItem icon={Search} active={activeTab === 'analyzer'} onClick={() => onTabChange('analyzer')} label="Scan" />
      <NavItem icon={Network} active={activeTab === 'graphs'} onClick={() => onTabChange('graphs')} label="Graphs" />
      <NavItem icon={History} active={activeTab === 'history'} onClick={() => onTabChange('history')} label="Logs" />
      <NavItem icon={Trophy} active={activeTab === 'quests'} onClick={() => onTabChange('quests')} label="Quests" />
    </nav>
  );
};

export default Navigation;
