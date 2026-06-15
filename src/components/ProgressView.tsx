/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Trophy, CheckCircle2, Award, Calendar, Flame, Zap, ArrowRight, ShieldCheck, Heart, Sparkles, Check } from 'lucide-react';
import { FitUser, WeeklyPlan, Workout } from '../types';
import { ALL_BADGES, FOCUS_TAGS } from '../data';

interface ProgressViewProps {
  user: FitUser;
  activePlan: WeeklyPlan | null;
  weightLogs: any[];
  xpActivities: any[];
  unlockedBadgeIds: string[];
}

export default function ProgressView({ user, activePlan, weightLogs, xpActivities, unlockedBadgeIds }: ProgressViewProps) {
  const [hoverBadgeId, setHoverBadgeId] = useState<string | null>(null);

  // Stats Counters computations
  const totalWorkoutsCount = useMemo(() => {
    // Total count of completed activities in XP logs
    return xpActivities.filter(a => a.action.includes('Completed')).length;
  }, [xpActivities]);

  const perfectWeekCount = useMemo(() => {
    return unlockedBadgeIds.includes('week_warrior') ? 1 : 0;
  }, [unlockedBadgeIds]);

  // SVG Weekly Completion rates coordinates - Last 8 Weeks Progress
  // Mock heights representation for bar chart - 8 bars columns
  const barChartWidth = 240;
  const barChartHeight = 110;
  const barPadding = 12;
  const mockWeeklyRates = [80, 45, 100, 60, 95, 100, 75, 100]; // matching perfect weeks indices

  // SVG Doughnut metrics segment calculations for Focus breakdown Muscle tags
  const focusCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    xpActivities.forEach((act) => {
      // Parse focus tag out of title if possible or map arbitrarily
      if (act.action.includes('Full Body')) counts['full_body'] = (counts['full_body'] || 0) + 1;
      else if (act.action.includes('Legs')) counts['legs'] = (counts['legs'] || 0) + 1;
      else if (act.action.includes('Core')) counts['core'] = (counts['core'] || 0) + 1;
      else if (act.action.includes('Push')) counts['push'] = (counts['push'] || 0) + 1;
      else if (act.action.includes('Pull')) counts['pull'] = (counts['pull'] || 0) + 1;
      else if (act.action.includes('Cardio')) counts['cardio'] = (counts['cardio'] || 0) + 1;
    });

    // Make sure we have at least standard values so the doughnut is styled
    if (Object.keys(counts).length === 0) {
      counts['full_body'] = 3;
      counts['core'] = 1;
      counts['legs'] = 2;
    }
    return counts;
  }, [xpActivities]);

  const totalDoughnutsVal = useMemo(() => {
    return Object.values(focusCountMap).reduce((acc: number, curr: number) => acc + curr, 0);
  }, [focusCountMap]);

  // Compute angles coordinates for SVG Doughnut paths
  const doughnutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    const radius = 35;
    const cx = 50;
    const cy = 50;
    const list: Array<{ path: string; tagKey: string; color: string; count: number }> = [];

    const keys = Object.keys(focusCountMap);
    keys.forEach((key) => {
      const count = focusCountMap[key];
      const ratio = count / totalDoughnutsVal;
      const angle = ratio * 360;

      // Calculate path coords
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;

      const x1 = cx + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = cy + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = cx + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = cy + radius * Math.sin((endAngle - 90) * Math.PI / 180);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const tagInfo = FOCUS_TAGS[key] || FOCUS_TAGS.full_body;

      list.push({
        path: pathData,
        tagKey: key,
        color: tagInfo.color,
        count
      });

      accumulatedAngle += angle;
    });

    return list;
  }, [focusCountMap, totalDoughnutsVal]);

  // 52 columns x 7 row Activity Heatmap Squares Array
  // Generate mock year grid filled partially with seed workout achievements
  const heatmapGrid = useMemo(() => {
    const list = [];
    const seedActiveDays = [1, 2, 4, 11, 12, 18, 19, 21, 22, 23]; // active indices
    
    for (let c = 0; c < 52; c++) {
      const colDays = [];
      for (let r = 0; r < 7; r++) {
        const absoluteIndex = c * 7 + r;
        // Map some mock workouts density
        let workoutsCount = 0;
        if (seedActiveDays.includes(absoluteIndex % 31)) {
          workoutsCount = (absoluteIndex % 3) + 1; // 1-3
        }
        
        colDays.push({
          absoluteIndex,
          workoutsCount,
        });
      }
      list.push(colDays);
    }
    return list;
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16 relative max-w-[1650px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="pb-2 border-b border-[#E4E2F0]/20">
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1340] dark:text-[#F0EEFF] tracking-tight">
          Progress & Achievements
        </h1>
        <p className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] font-semibold uppercase tracking-wider mt-1 block">
          🏆 Live tracking rewards stats heatmap, milestone unlock walls, and physical logs
        </p>
      </div>

      {/* SECTION 1: DENSE ACTIVITY HEATMAP CALENDAR */}
      <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm overflow-hidden" id="progress-heatmap-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 dark:border-[#2A2545]/30 pb-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Consistency Map</span>
            <h3 className="text-base font-black text-[#1A1340] dark:text-[#F0EEFF]">Quests Activity Heatmap</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#6B6B8A] font-bold">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#EDE9FF]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#D4CBFF]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#A994FF]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#6C47FF]" />
            <span>More</span>
          </div>
        </div>

        {/* CSS 52x7 Heat Grid layout */}
        <div className="overflow-x-auto select-none py-1.5 scroll-hint">
          <div className="flex gap-[3.5px] items-start min-w-[700px]">
            {heatmapGrid.map((column, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-[3px]">
                {column.map((daySquare) => {
                  const workouts = daySquare.workoutsCount;
                  let bgClass = 'bg-[#EDE9FF] dark:bg-slate-800/40 border-slate-200/50';
                  if (workouts === 1) bgClass = 'bg-[#D4CBFF] dark:bg-[#2A2050]';
                  else if (workouts === 2) bgClass = 'bg-[#A994FF] dark:bg-[#3D3070]';
                  else if (workouts >= 3) bgClass = 'bg-[#6C47FF] dark:bg-[#6C47FF]';

                  return (
                    <div
                      key={daySquare.absoluteIndex}
                      className={`w-2.5 h-2.5 rounded-[2.5px] transition-colors relative group border border-transparent ${bgClass}`}
                      id={`heat-square-${daySquare.absoluteIndex}`}
                    >
                      {/* CSS absolute hover panel tooltip */}
                      <div className="pointer-events-none absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[#1A1340] text-white text-[9px] font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-40">
                        Day {daySquare.absoluteIndex}: {workouts > 0 ? `${workouts} Workouts` : 'Rest Day'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: 4 METRIC ACCUMULATIVE CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="progress-counters-grid">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#1A1630] rounded-2xl p-4 border border-[#E4E2F0]/65 dark:border-[#2A2545]/60 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EDE9FF] text-[#6C47FF] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-sans font-medium text-[11px] text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider">Completed Quests</h4>
            <span className="font-mono text-xl font-bold text-[#1A1340] dark:text-[#F0EEFF] block mt-0.5">{totalWorkoutsCount}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#1A1630] rounded-2xl p-4 border border-[#E4E2F0]/65 dark:border-[#2A2545]/60 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-[#24203A] text-orange-500 flex items-center justify-center shrink-0">
            <Flame className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-sans font-medium text-[11px] text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider">Longest Streak</h4>
            <span className="font-mono text-xl font-bold text-[#1A1340] dark:text-[#F0EEFF] block mt-0.5">{user.longest_streak}d</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#1A1630] rounded-2xl p-4 border border-[#E4E2F0]/65 dark:border-[#2A2545]/60 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-500 flex items-center justify-center shrink-0">
            <Zap className="w-5.5 h-5.5 text-green-500" />
          </div>
          <div>
            <h4 className="font-sans font-medium text-[11px] text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider">Total XP Earned</h4>
            <span className="font-mono text-xl font-bold text-[#1A1340] dark:text-[#F0EEFF] block mt-0.5">{user.xp} XP</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#1A1630] rounded-2xl p-4 border border-[#E4E2F0]/65 dark:border-[#2A2545]/60 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-[#FF8FB5] flex items-center justify-center shrink-0">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-sans font-medium text-[11px] text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider">Perfect Weeks</h4>
            <span className="font-mono text-xl font-bold text-[#1A1340] dark:text-[#F0EEFF] block mt-0.5">{perfectWeekCount}</span>
          </div>
        </div>

      </div>

      {/* SECTION 3: TWO DETAILED CHARTS SIDES-BY-SIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="progress-charts-row">
        
        {/* LHS Completion Bar Chart in SVG */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm min-h-[220px] flex flex-col justify-between" id="progress-weekly-completions-card">
          <div className="pb-3 border-b border-gray-100 dark:border-[#2A2545]/30">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Load Ratiometer</span>
            <h3 className="text-sm font-black text-[#1A1340] dark:text-[#F0EEFF]">Weekly Completion Ratio (Last 8 wks)</h3>
          </div>

          <div className="flex-1 my-4 flex items-end justify-between px-3 h-[110px] relative select-none">
            {/* Horizontal perfect line boundary guide */}
            <div className="absolute top-[10px] left-0 right-0 border-t border-dashed border-[#FF6B9D]/30" />
            <span className="absolute top-[2px] right-2 text-[8px] font-extrabold text-[#FF6B9D] uppercase tracking-wider select-none font-mono">
              Perfect quota 100% ✓
            </span>

            {mockWeeklyRates.map((rate, index) => {
              const bgClass = rate >= 100 ? 'bg-gradient-to-t from-[#6C47FF] to-[#FF6B9D]' : 'bg-[#6C47FF]/75 dark:bg-[#FF8FB5]/75';
              return (
                <div key={index} className="flex flex-col items-center gap-2 group w-[22px]">
                  {/* Absolute Rate percentage Indicator hover bubble */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-[90px] bg-[#1A1340] text-white font-mono font-bold text-[9px] px-1 rounded-sm shadow-md transition-opacity pointer-events-none">
                    {rate}%
                  </div>

                  <div className="w-3.5 h-[80px] rounded-full bg-gray-100 dark:bg-[#24203A] overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-full transition-all duration-800 ${bgClass}`}
                      style={{ height: `${rate}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#6B6B8A] font-mono leading-none">
                    W{index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RHS Doughnut Segment breakdown Chart in SVG */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm min-h-[220px] flex flex-col justify-between" id="progress-muscles-doughnut-card">
          <div className="pb-3 border-b border-gray-100 dark:border-[#2A2545]/30">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Target Breakdown</span>
            <h3 className="text-sm font-black text-[#1A1340] dark:text-[#F0EEFF]">Workout Focus breakdown Segments</h3>
          </div>

          <div className="flex-1 my-3 flex flex-row items-center justify-around gap-4">
            
            {/* The SVG element block */}
            <div className="w-28 h-28 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {doughnutSegments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.path}
                    fill={seg.color}
                    className="hover:scale-105 hover:opacity-90 transition-transform origin-center cursor-pointer"
                  />
                ))}
                {/* Center White masking circle to model a real Doughnut */}
                <circle cx="50" cy="50" r="23" className="fill-white dark:fill-[#1A1630]" />
              </svg>

              {/* Total text placed inside Center mask */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none leading-none select-none">
                <span className="font-mono text-lg font-black text-[#1A1340] dark:text-[#F0EEFF]">{totalDoughnutsVal}</span>
                <span className="text-[8px] font-extrabold text-[#6B6B8A] uppercase tracking-wider mt-0.5">Focus</span>
              </div>
            </div>

            {/* Segment legends metrics */}
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[110px] pr-2 shrink-0">
              {doughnutSegments.map((seg) => {
                const tg = FOCUS_TAGS[seg.tagKey] || FOCUS_TAGS.full_body;
                return (
                  <div key={seg.tagKey} className="flex items-center gap-1.5 text-[10px] font-bold">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[#1A1340] dark:text-[#F0EEFF] truncate max-w-[90px]">
                      {tg.emoji} {tg.label}
                    </span>
                    <span className="font-mono text-[#6B6B8A]">({seg.count})</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 4: BADGE WALLS COLLECTION (15 Badges list) */}
      <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="progress-badges-box">
        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-widest block mb-4 border-b border-gray-100 dark:border-[#2A2545]/30 pb-2.5">
          Locked & Unlocked Achievements Wall
        </span>

        {/* The Wall GRID layout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 items-center justify-center">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                onMouseEnter={() => setHoverBadgeId(badge.id)}
                onMouseLeave={() => setHoverBadgeId(null)}
                className={`p-3 border rounded-2xl flex flex-col items-center justify-center text-center relative pointer-events-auto transition-all select-none min-h-[140px] ${
                  isUnlocked
                    ? 'bg-linear-to-b from-white to-[#EDE9FF]/30 dark:to-slate-900 border-[#FF6B9D]/30 dark:border-[#2A2050] shadow-md hover:scale-105 ring-2 ring-[#FF6B9D]/5'
                    : 'bg-gray-50/50 dark:bg-[#1A1630]/40 border-gray-100 dark:border-[#2A2545]/20 opacity-45'
                }`}
                id={`badge-cell-${badge.id}`}
              >
                {/* The lock symbol overlay if locked */}
                {!isUnlocked && (
                  <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-[#A0A0B8] font-mono select-none">
                    Locked 🔒
                  </span>
                )}

                {/* Badge Icon circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm relative shrink-0 ${
                    isUnlocked 
                      ? 'bg-[#FFE4EF] ring-4 ring-[#FF6B9D]/15 inline-block text-center' 
                      : 'bg-[#EDE9FF]/40 text-gray-400'
                  }`}
                  style={{
                    lineHeight: '52px'
                  }}
                >
                  {badge.icon}
                  {isUnlocked && (
                    <span className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border border-white">
                      <Check className="w-2.5 h-2.5 font-black" />
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-xs mt-3 select-all tracking-tight leading-snug">
                  {isUnlocked ? badge.name : '???'}
                </h4>
                
                <span className="text-[9px] text-[#A0A0B8] font-semibold mt-1 block">
                  {isUnlocked ? 'Completed' : badge.triggerDescription}
                </span>

                {/* Sliding custom tooltips on cell hover */}
                {hoverBadgeId === badge.id && (
                  <div className="absolute top-[-70px] left-1/2 transform -translate-x-1/2 w-48 bg-[#1A1340] text-white p-2.5 rounded-xl shadow-2xl z-50 animate-slide-in pointer-events-none text-left">
                    <h5 className="text-[10px] font-extrabold text-[#FF6B9D] uppercase tracking-newer">{badge.name}</h5>
                    <p className="text-[9px] text-white/80 mt-1 leading-relaxed font-semibold">{badge.description}</p>
                    <span className="text-[8px] text-white/40 block mt-1.5 uppercase font-mono tracking-widest">{badge.triggerDescription}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: TIMELINE XP LOG ENTRIES TABLE */}
      <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="progress-xplog-card">
        <span className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-widest block mb-3 border-b border-gray-100 dark:border-[#2A2545]/30 pb-2.5">
          Experience Reward Timeline logs
        </span>

        <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
          {xpActivities.map((act) => (
            <div key={act.id} className="flex items-center justify-between gap-3 text-xs border-b border-gray-50 dark:border-[#2A2545]/20 pb-3 hover:bg-[#F5F3FF]/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FF] text-[#6C47FF] flex items-center justify-center font-bold text-sm shrink-0">
                  ⚡
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1340] dark:text-[#F0EEFF] leading-snug">{act.action}</h4>
                  <p className="text-[10px] text-[#A0A0B8] font-mono mt-0.5 flex items-center gap-1 font-semibold block">
                    <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </p>
                </div>
              </div>

              <span className="bg-[#EDE9FF] dark:bg-[#24203A] text-[#6C47FF] dark:text-[#FF8FB5] font-black font-mono px-3 py-1 rounded-lg text-xs tracking-wider">
                +{act.xp} XP
              </span>
            </div>
          ))}
          {xpActivities.length === 0 && (
            <p className="text-center text-[#A0A0B8] italic py-4">No logged XP entries.</p>
          )}
        </div>
      </div>

    </div>
  );
}
