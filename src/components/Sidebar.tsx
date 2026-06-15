/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, CalendarDays, Scale, Trophy, Settings, Moon, Sun, ChevronRight, LogOut } from 'lucide-react';
import { FitUser } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: FitUser;
  onToggleTheme: () => void;
  onResetAll: () => void;
}

export default function Sidebar({ currentView, onNavigate, user, onToggleTheme, onResetAll }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Workout Planner', icon: CalendarDays },
    { id: 'tracker', label: 'Body Stats Tracker', icon: Scale },
    { id: 'progress', label: 'Progress & Badges', icon: Trophy },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-50 text-white select-none transition-all duration-300 ease-in-out bg-[#6C47FF] dark:bg-[#120E28] border-r border-white/10"
        style={{ width: isHovered ? '240px' : '76px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Logo Brand */}
        <div className="flex items-center h-20 px-4 shrink-0 overflow-hidden relative border-b border-white/5 bg-black/10">
          <div className="w-10 h-10 rounded-full bg-white text-[#6C47FF] dark:text-[#120E28] font-black tracking-tighter text-lg flex items-center justify-center shadow-lg shrink-0">
            FQ
          </div>
          <span
            className={`font-black tracking-tight text-xl ml-3 whitespace-nowrap transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none'
            }`}
          >
            FitQuest<span className="text-[#FF6B9D]">.</span>
          </span>
          {isHovered && (
            <span className="absolute right-4 text-xs font-mono bg-[#FF6B9D] px-1.5 py-0.5 rounded-sm animate-pulse">
              PRO
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center relative rounded-xl h-11 text-left font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white/18 text-white font-bold ml-0.5 shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/8'
                }`}
                style={{
                  paddingLeft: '11px'
                }}
                id={`nav-${item.id}`}
              >
                {/* Active Indicator Bar on LHS */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF6B9D] rounded-full" />
                )}

                <div className="shrink-0 flex items-center justify-center w-8">
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none'
                  }`}
                >
                  {item.label}
                </span>

                {/* Micro tooltip label when collapsed */}
                {!isHovered && (
                  <div className="absolute left-16 bg-[#1A1340] dark:bg-[#1A1630] text-xs text-white px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Elements Footer */}
        <div className="p-3 border-t border-white/5 bg-black/5 shrink-0 flex flex-col gap-2">
          {/* Theme custom Toggle Button */}
          <button
            onClick={onToggleTheme}
            id="sidebar-theme-toggle"
            className="w-full flex items-center p-3 rounded-xl h-11 text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          >
            <div className="shrink-0 flex items-center justify-center w-8">
              {user.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
            </div>
            <span
              className={`ml-3 whitespace-nowrap text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {user.theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </span>
          </button>

          {/* Quick reset/exit button */}
          <button
            onClick={() => {
              if (window.confirm('Do you really want to reset your FitQuest account? This will erase all plans, levels, activity lists, and body weight graphs.')) {
                onResetAll();
              }
            }}
            id="sidebar-sign-out"
            className="w-full flex items-center p-3 rounded-xl h-11 text-red-300 hover:text-red-100 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <div className="shrink-0 flex items-center justify-center w-8">
              <LogOut className="w-5 h-5" />
            </div>
            <span
              className={`ml-3 whitespace-nowrap text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              Reset Data
            </span>
          </button>

          {/* User profile avatar info summary area */}
          <div className="flex items-center gap-2 mt-2 p-1.5 rounded-xl border border-white/10 bg-white/5 leading-none">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6B9D] to-[#8B6BFF] p-0.5 shrink-0 flex items-center justify-center text-xs font-black select-none text-white font-mono relative">
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
              <span className="absolute -bottom-1 -right-1 bg-[#FF6B9D] border border-white text-[9px] px-1 rounded-full text-white font-bold font-mono">
                {user.level}
              </span>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'
              }`}
            >
              <div className="font-extrabold text-xs truncate max-w-[120px] text-white">
                {user.name || 'FitAthlete'}
              </div>
              <div className="text-[10px] text-white/60 font-mono tracking-wider mt-0.5">
                {user.xp} XP total
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM TAB BAR ================= */}
      <nav
        id="mobile-tabbar"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#120E28] border-t border-[#E4E2F0] dark:border-[#2A2545] z-[40] flex items-center justify-around px-1 select-none"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-[#6C47FF] dark:text-[#FF8FB5] font-bold'
                  : 'text-[#6B6B8A] dark:text-[#9B97C4]'
              }`}
              id={`nav-mob-${item.id}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#EDE9FF] dark:bg-[#2A2050]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-0.5 tracking-tight font-medium scale-90">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
