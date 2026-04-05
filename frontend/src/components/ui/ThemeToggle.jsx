import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
