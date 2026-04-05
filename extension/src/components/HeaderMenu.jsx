import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Cpu,
  Users,
  Activity,
  ChevronRight
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-lime-400/10 text-lime-400' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${active ? 'bg-lime-400/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[10px] uppercase tracking-[0.1em] font-black">{label}</span>
    </div>
    <ChevronRight size={12} className={`transition-transform duration-200 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
  </button>
);

const HeaderMenu = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'registry', label: 'Nodes', icon: Cpu },
    { id: 'community', label: 'Network', icon: Users },
    { id: 'telemetry', label: 'Metrics', icon: Activity },
    { id: 'settings', label: 'Config', icon: Settings }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Menu Dropdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10, x: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-16 right-6 w-56 z-[60] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-2"
          >
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HeaderMenu;
