/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Flame } from 'lucide-react';

interface LevelUpCelebrationProps {
  level: number;
  levelName: string;
  onClose: () => void;
}

export default function LevelUpCelebration({ level, levelName, onClose }: LevelUpCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string; size: number }>>([]);

  useEffect(() => {
    // Generate confetti pieces
    const colors = ['#6C47FF', '#FF6B9D', '#F59E0B', '#22C55E', '#A994FF', '#FF8FB5', '#3B82F6'];
    const list = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      delay: Math.random() * 1.5, // seconds delay
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.floor(Math.random() * 8) + 6, // 6px - 14px
    }));
    setConfetti(list);

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3200);

    return () => clearTimeout(timer);
  }, [level, onClose]);

  return (
    <div id="level-up-modal" className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-opacity-75 bg-[#0A0528]/80 backdrop-blur-sm animate-fade-in select-none">
      {/* Confetti container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="confetti-piece rounded-full"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              width: `${c.size}px`,
              height: `${c.size}px`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/20 dark:border-[#2A2545]/20 max-w-md w-full rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-scale-up flex flex-col items-center">
        {/* Decorative elements */}
        <div className="absolute top-2 left-2 animate-bounce text-[#FF6B9D] opacity-60">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute bottom-4 right-4 animate-pulse text-[#6C47FF] opacity-50">
          <Trophy className="w-10 h-10" />
        </div>

        {/* Level Circle Medal */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6C47FF] to-[#FF6B9D] p-1 shadow-lg relative flex items-center justify-center mb-6">
          <div className="absolute inset-0.5 rounded-full bg-white dark:bg-[#1A1630] flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider mb-0.5">Level</span>
            <span className="font-mono text-4xl font-extrabold text-[#6C47FF] dark:text-[#FF8FB5]">{level}</span>
          </div>
        </div>

        {/* Level Up Title */}
        <h2 className="text-3xl font-extrabold text-[#1A1340] dark:text-[#F0EEFF] tracking-tight mb-2 animate-pulse">
          LEVEL UP! ⚡
        </h2>

        <p className="text-[#6B6B8A] dark:text-[#9B97C4] px-4 font-medium mb-6">
          Amazing commitment! You have climbed into outstanding territory.
        </p>

        {/* New Standing badge */}
        <div className="bg-[#F5F3FF] dark:bg-[#24203A] border border-[#D4CBFF] dark:border-[#2A2050] px-6 py-3 rounded-2xl mb-6">
          <div className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] font-bold uppercase tracking-widest mb-1">
            New Standing Title
          </div>
          <div className="text-xl font-bold text-[#6C47FF] dark:text-[#A994FF] flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 text-[#FF6B9D] fill-current" />
            {levelName}
          </div>
        </div>

        <button
          onClick={onClose}
          id="celebration-continue-btn"
          className="bg-[#6C47FF] hover:bg-[#5035CC] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-[#6C47FF]/30 transition-all transform hover:scale-105 btn-active"
        >
          Keep Crushing It!
        </button>
      </div>
    </div>
  );
}
