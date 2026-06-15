/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sparkles, Trophy, Flame, Play, Clock, ChevronRight, Activity, Search, ShieldAlert, Award, AlertCircle } from 'lucide-react';
import { FitUser, WeeklyPlan, Workout } from '../types';
import { FOCUS_TAGS } from '../data';

interface DashboardViewProps {
  user: FitUser;
  activePlan: WeeklyPlan | null;
  onOpenWorkout: (workout: Workout) => void;
  onNavigate: (view: string) => void;
  onQuickLogWeight: (w: number) => void;
  xpActivities: any[];
}

const MONTHS_DATA = [
  { name: 'Jan', idx: 0 },
  { name: 'Feb', idx: 1 },
  { name: 'Mar', idx: 2 },
  { name: 'Apr', idx: 3 },
  { name: 'May', idx: 4 },
  { name: 'Jun', idx: 5 },
  { name: 'Jul', idx: 6 },
  { name: 'Aug', idx: 7 },
  { name: 'Sep', idx: 8 },
  { name: 'Oct', idx: 9 },
  { name: 'Nov', idx: 10 },
  { name: 'Dec', idx: 11 }
];

export default function DashboardView({ user, activePlan, onOpenWorkout, onNavigate, onQuickLogWeight, xpActivities }: DashboardViewProps) {
  const [quickWeight, setQuickWeight] = useState(user.weight_kg.toString());
  const [searchQuery, setSearchQuery] = useState('');

  // Find the user's current device-resolved month to set as starting index
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(() => {
    const curMonth = new Date().getMonth();
    return curMonth >= 0 && curMonth < 12 ? curMonth : 5; // default to Jun
  });

  const [activeMetric, setActiveMetric] = useState<'frequency' | 'duration'>('frequency');

  // State mapping of frequency records (sessions)
  const [frequencyOverride, setFrequencyOverride] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem('fq_workout_frequency_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      Jan: 3, Feb: 4, Mar: 6, Apr: 5, May: 8, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
  });

  // State mapping of duration records (minutes)
  const [durationOverride, setDurationOverride] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem('fq_workout_durations_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      Jan: 90, Feb: 120, Mar: 180, Apr: 150, May: 240, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };
  });

  const setMonthFreq = (monthName: string, val: number) => {
    const nextObj = { ...frequencyOverride, [monthName]: Math.max(0, val) };
    setFrequencyOverride(nextObj);
    localStorage.setItem('fq_workout_frequency_v2', JSON.stringify(nextObj));
  };

  const setMonthDur = (monthName: string, val: number) => {
    const nextObj = { ...durationOverride, [monthName]: Math.max(0, val) };
    setDurationOverride(nextObj);
    localStorage.setItem('fq_workout_durations_v2', JSON.stringify(nextObj));
  };

  // Dynamic completed workouts aggregation
  const completedWorkoutsThisWeek = activePlan
    ? (activePlan.days || []).flatMap(d => d.workouts).filter(w => w.is_completed)
    : [];

  const completedCount = completedWorkoutsThisWeek.length;
  const completedMins = completedWorkoutsThisWeek.reduce((sum, w) => {
    const match = w.duration_label?.match(/(\d+)/);
    const m = match ? parseInt(match[1], 10) : 30;
    return sum + m;
  }, 0);

  const getDisplayValue = (monthName: string, metric: 'frequency' | 'duration') => {
    if (metric === 'frequency') {
      const base = frequencyOverride[monthName] || 0;
      return monthName === 'Jun' ? base + completedCount : base;
    } else {
      const base = durationOverride[monthName] || 0;
      return monthName === 'Jun' ? base + completedMins : base;
    }
  };

  // Compute active maximum to scale SVG height dynamically
  const activeValues = MONTHS_DATA.map(m => getDisplayValue(m.name, activeMetric));
  const maxVal = Math.max(...activeValues, 1);

  const chartPoints = MONTHS_DATA.map((m, idx) => {
    const val = getDisplayValue(m.name, activeMetric);
    const x = 25 + idx * 41; // Keep points standard aligned but dynamic y
    const ratio = val / maxVal;
    const y = 95 - (ratio * 70); // Y ranges from 25 to 95
    return { name: m.name, val, x, y };
  });

  const currentMonthData = chartPoints[selectedMonthIdx];
  const activeDisplayVal = currentMonthData.val;

  // Now build curve paths
  let waveLine = '';
  let wavePoints = '';

  if (chartPoints.length > 0) {
    let dLine = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cpX1 = p0.x + 20;
      const cpY1 = p0.y;
      const cpX2 = p1.x - 20;
      const cpY2 = p1.y;
      dLine += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    waveLine = dLine;
    wavePoints = `${waveLine} L ${chartPoints[chartPoints.length - 1].x} 120 L ${chartPoints[0].x} 120 Z`;
  }

  // Find today's workouts: Map index of today's day (0-6)
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6 in Europe/ISO standards
  const todayPlan = (activePlan?.days || []).find(d => d.day_index === todayIndex);

  // Intelligently target the single active workout of the day: choose first pending, else fallback to first completed
  const todayWorkout = todayPlan && todayPlan.workouts.length > 0 
    ? (todayPlan.workouts.find(w => !w.is_completed) || todayPlan.workouts[0]) 
    : null;

  // Stats for the overview
  const thisWeekTotalWorkouts = activePlan
    ? (activePlan.days || []).flatMap(d => d.workouts).length
    : 0;
  const thisWeekCompletedWorkouts = activePlan
    ? (activePlan.days || []).flatMap(d => d.workouts).filter(w => w.is_completed).length
    : 0;

  // XP Progress values
  const currentLevelXp = user.xp;
  let levelThreshold = 200;
  let prevLevelThreshold = 0;
  if (user.level === 2) { levelThreshold = 500; prevLevelThreshold = 200; }
  else if (user.level === 3) { levelThreshold = 1000; prevLevelThreshold = 500; }
  else if (user.level === 4) { levelThreshold = 2000; prevLevelThreshold = 1000; }
  else if (user.level === 5) { levelThreshold = 4000; prevLevelThreshold = 2000; }
  else if (user.level === 6) { levelThreshold = 7500; prevLevelThreshold = 4000; }
  else if (user.level === 7) { levelThreshold = 12000; prevLevelThreshold = 7500; }
  else if (user.level >= 8) { levelThreshold = 25000; prevLevelThreshold = 12000; }

  const levelProgressPct = Math.min(100, Math.max(0, ((user.xp - prevLevelThreshold) / (levelThreshold - prevLevelThreshold)) * 100));

  // Determine which level index title
  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return 'Rookie';
    if (lvl === 2) return 'Starter';
    if (lvl === 3) return 'Consistent';
    if (lvl === 4) return 'Dedicated';
    if (lvl === 5) return 'Athlete';
    if (lvl === 6) return 'Beast Mode';
    if (lvl === 7) return 'Elite';
    return 'Legend';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Render 3 workout list cards in Row 2
  // We can select the first three distinct workouts planned for this week to show.
  const allSubWorkouts = activePlan ? (activePlan.days || []).flatMap(d => d.workouts) : [];
  const topThreeWorkouts = allSubWorkouts.slice(0, 3);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative max-w-[1650px] mx-auto pb-16">
      
      {/* ================= LEFT MAIN GRID PANEL ================= */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* HEADER TOP ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E4E2F0]/20">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1340] dark:text-[#F0EEFF] tracking-tight leading-none">
              Primary Dashboard
            </h1>
            <p className="text-xs font-semibold text-[#6B6B8A] dark:text-[#9B97C4] uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <span>{formattedDate}</span>
              <span className="text-[#6C47FF] font-bold font-mono">•</span>
              <span>Week 3 Quest Active</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pill Search */}
            <div className="relative w-full md:w-60">
              <input
                type="text"
                placeholder="Quest, workout muscle..."
                value={searchQuery}
                aria-label="Search"
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1A1340] border border-[#E4E2F0] dark:border-[#2A2545]/70 rounded-full py-2 pl-9 pr-4 text-xs text-[#1A1340] dark:text-[#F0EEFF] focus:border-[#6C47FF] focus:outline-hidden font-medium placeholder:text-[#A0A0B8]"
                id="dashboard-search-bar"
              />
              <Search className="w-4 h-4 text-[#A0A0B8] absolute left-3 top-2.5" />
            </div>
            
            {/* Quick avatar wrapper clickable to Settings */}
            <button
              id="avatar-quick-settings"
              onClick={() => onNavigate('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6C47FF] to-[#FF6B9D] p-0.5 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-[#1A1630] flex items-center justify-center font-mono font-bold text-xs text-[#6C47FF] dark:text-[#FF8FB5]">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
              </div>
            </button>
          </div>
        </div>

        {/* ROW 1: LARGE HERO CARD & 2 STACKED SIDE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Overlord Purple Hero Card */}
          <div className="md:col-span-3 bg-[#6C47FF] rounded-[24px] p-5 text-white shadow-lg overflow-hidden flex flex-col justify-between relative min-h-[300px]" id="dashboard-weekly-overview-card">
            {/* Top row overview */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">Metrics Analytics</span>
                <h3 className="text-lg md:text-xl font-black mt-0.5">Overview</h3>
              </div>
              
              {/* Toggle metric switcher & log controls grouped side-by-side */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Metric Selector Tab */}
                <div className="flex bg-[#5339CE]/80 backdrop-blur-md rounded-full p-0.5 border border-white/10 text-[9px]">
                  <button
                    type="button"
                    onClick={() => setActiveMetric('frequency')}
                    className={`px-2 py-0.5 rounded-full font-black uppercase transition-all whitespace-nowrap cursor-pointer text-[8px] sm:text-[9px] ${
                      activeMetric === 'frequency' ? 'bg-[#FF6B9D] text-white shadow-xs' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Freq<span className="hidden sm:inline">uency</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetric('duration')}
                    className={`px-2 py-0.5 rounded-full font-black uppercase transition-all whitespace-nowrap cursor-pointer text-[8px] sm:text-[9px] ${
                      activeMetric === 'duration' ? 'bg-[#FF6B9D] text-white shadow-xs' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Dur<span className="hidden sm:inline">ation</span>
                  </button>
                </div>

                {/* Log editor component targeting selected month */}
                <div className="bg-[#5035CC]/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 rounded-full font-bold border border-white/10 flex items-center gap-1 sm:gap-1.5 shadow-sm">
                  <span className="text-[7.5px] sm:text-[8px] uppercase text-white/75 font-extrabold">Log {activeMetric === 'frequency' ? 'Sets' : 'Mins'}</span>
                  <div className="flex items-center gap-1 border-l border-white/15 pl-1 md:pl-1.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMetric === 'frequency') {
                          setMonthFreq(currentMonthData.name, activeDisplayVal - 1);
                        } else {
                          setMonthDur(currentMonthData.name, activeDisplayVal - 15);
                        }
                      }}
                      className="hover:text-[#FF6B9D] font-mono text-[10px] px-0.5 cursor-pointer active:scale-75 select-none"
                      title={activeMetric === 'frequency' ? '-1 workout' : '-15 mins'}
                    >
                      -
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const pLabel = activeMetric === 'frequency' ? 'completed workouts count' : 'total minutes';
                        const input = prompt(`Enter ${pLabel} for ${currentMonthData.name}:`, activeDisplayVal.toString());
                        if (input !== null) {
                          const parsed = parseInt(input, 10);
                          if (!isNaN(parsed) && parsed >= 0) {
                            if (activeMetric === 'frequency') {
                              setMonthFreq(currentMonthData.name, parsed);
                            } else {
                              setMonthDur(currentMonthData.name, parsed);
                            }
                          }
                        }
                      }}
                      className="text-[9px] underline font-bold hover:text-[#FF8FB5] cursor-pointer"
                      title="Set custom amount"
                    >
                      Set
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMetric === 'frequency') {
                          setMonthFreq(currentMonthData.name, activeDisplayVal + 1);
                        } else {
                          setMonthDur(currentMonthData.name, activeDisplayVal + 15);
                        }
                      }}
                      className="hover:text-green-300 font-mono text-[10px] px-0.5 cursor-pointer active:scale-75 select-none"
                      title={activeMetric === 'frequency' ? '+1 workout' : '+15 mins'}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Curvy Wave SVG Area graph with Glowing pink dot */}
            <div className="bg-[#5035CC] rounded-2xl p-4 my-3 overflow-hidden relative border border-white/5 shadow-inner flex flex-col justify-between h-[120px]">
              {/* Backgrid SVG Lines - Styled Month Selector Buttons */}
              <div className="absolute inset-x-0 bottom-2 px-1 flex justify-between gap-0.5 text-[8px] text-white/40 tracking-tight z-30 font-mono overflow-x-auto scrollbar-none snap-x whitespace-nowrap">
                {MONTHS_DATA.map((m, idx) => {
                  const isSelected = selectedMonthIdx === idx;
                  return (
                    <button
                      key={m.name}
                      onClick={() => setSelectedMonthIdx(idx)}
                      className={`px-1.5 py-0.5 rounded-sm transition-all cursor-pointer font-bold snap-start shrink-0 ${
                        isSelected 
                          ? 'text-white bg-[#FF6B9D] shadow-xs scale-105' 
                          : 'text-white/55 hover:bg-white/10'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>

              {/* Grid vertical dots */}
              <div className="absolute inset-0 flex justify-around items-end pb-8 pointer-events-none opacity-10">
                {MONTHS_DATA.map((_, i) => <div key={i} className="w-px h-full border-l border-dashed border-white" />)}
              </div>

              {/* The SVG curve line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,107,157,0.3)" />
                    <stop offset="100%" stopColor="rgba(108,71,255,0)" />
                  </linearGradient>
                </defs>
                {/* Curve Fill Area */}
                <path d={wavePoints} fill="url(#purpleAreaGrad)" className="opacity-95 transition-all duration-300" />
                {/* Curve Line Stroke */}
                <path d={waveLine} fill="none" stroke="#FF8FB5" strokeWidth="4.5" className="chart-draw-line transition-all duration-300" />
                {/* Glowing Dot Ring at dynamic selected index Peak */}
                <g transform={`translate(${currentMonthData.x}, ${currentMonthData.y})`} className="transition-all duration-300">
                  <circle r="12" fill="rgba(255, 107, 157, 0.3)" className="animate-ping" />
                  <circle r="7" fill="#FF6B9D" stroke="#FFFFFF" strokeWidth="2.5" className="pulse-glow" />
                </g>
              </svg>

              {/* Absolute steps display pill matching visual references */}
              <div 
                className="absolute bg-[#1A1340] border border-white/15 px-2.5 py-1 rounded-lg shadow-xl text-center flex flex-col items-center transition-all duration-300 z-10"
                style={{ 
                  left: `${(currentMonthData.x / 500) * 100}%`, 
                  top: `${(currentMonthData.y / 120) * 100}%`,
                  transform: 'translate(-50%, -122%)'
                }}
              >
                <span className="text-[12px] font-mono font-black text-white">
                  {activeDisplayVal.toLocaleString()}
                </span>
                <span className="text-[7px] font-bold text-white/50 tracking-white leading-none uppercase mt-0.5">
                  {activeMetric === 'frequency' ? 'Workouts' : 'Mins'}
                </span>
              </div>
            </div>

            {/* Bottom 3 metrics blocks in a grid row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Workout Target</span>
                <span className="font-mono text-lg font-black mt-0.5">{thisWeekCompletedWorkouts} / {thisWeekTotalWorkouts}</span>
                <span className="text-[8px] text-white/45 font-semibold mt-0.5">Assigned Daily</span>
              </div>
              <div className="flex flex-col border-x border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">XP Progress</span>
                <span className="font-mono text-lg font-black text-[#FF8FB5] mt-0.5">+{thisWeekCompletedWorkouts * 50} XP</span>
                <span className="text-[8px] text-white/45 font-semibold mt-0.5">Week Total</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Target Ratio</span>
                <span className="font-mono text-lg font-black mt-0.5">{thisWeekTotalWorkouts > 0 ? Math.round((thisWeekCompletedWorkouts / thisWeekTotalWorkouts) * 100) : 0}%</span>
                <span className="text-[8px] text-white/45 font-semibold mt-0.5">Quota Completed</span>
              </div>
            </div>
          </div>

          {/* RHS 2 STACKED CARDS WRAP */}
          <div className="md:col-span-2 flex flex-col gap-4">
            
            {/* Card 1: Today's Featured Workout (Purple background / Thumbnail overlay) */}
            <div 
              className="bg-[#6C47FF] text-white rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between shadow-md h-36" 
              id="dashboard-featured-card"
              style={todayWorkout ? { 
                backgroundImage: `linear-gradient(rgba(108, 71, 255, 0.45), rgba(26, 19, 64, 0.88)), url(https://img.youtube.com/vi/${todayWorkout.youtube_video_id}/mqdefault.jpg)`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              } : undefined}
            >
              <div className="flex justify-between items-start">
                <div className="max-w-[130px]">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF8FB5]">Primary Goal</span>
                  <h4 className="font-black text-sm tracking-tight leading-snug mt-1 truncate">
                    {todayWorkout ? todayWorkout.title : 'Active Core Break'}
                  </h4>
                  <p className="text-[10px] text-white/70 font-mono mt-1">
                    {todayWorkout ? todayWorkout.duration_label : '15-min'}
                  </p>
                </div>
                {/* Small Play circular container to trigger popup */}
                <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/10 shrink-0 flex items-center justify-center text-white">
                  <Play className="w-5 h-5 fill-current" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                {todayWorkout ? (
                  todayWorkout.is_completed ? (
                    <button
                      onClick={() => onOpenWorkout(todayWorkout)}
                      className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm shrink-0 btn-active cursor-pointer border border-white/25"
                      id="trigger-start-workout-btn"
                    >
                      Review Workout ↺ <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenWorkout(todayWorkout)}
                      className="bg-white hover:bg-white/9 text-[#6C47FF] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm shrink-0 btn-active cursor-pointer animate-pulse"
                      id="trigger-start-workout-btn"
                    >
                      Start Workout <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => onNavigate('planner')}
                    className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shrink-0 btn-active cursor-pointer border border-white/10"
                    id="trigger-open-planner-btn"
                  >
                    Schedule Day <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {todayWorkout ? (
                  todayWorkout.is_completed ? (
                    <span className="text-[10px] bg-green-500/20 text-[#56E39F] border border-green-500/30 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest font-mono shrink-0">
                      Completed ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-[#FFE270] border border-amber-500/30 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest font-mono shrink-0 animate-bounce">
                      Ready
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest font-mono shrink-0">
                    Resting
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Current Streak Widget (Coral Hot-Pink solid card) */}
            <div className="bg-[#FF6B9D] text-white rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between shadow-md h-36" id="dashboard-streak-card">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/80">Streak Multiplier</span>
                  <h4 className="text-xl font-black mt-1 flex items-center gap-1 tracking-tight">
                    🔥 {user.streak} Days Active
                  </h4>
                </div>
                {/* Arrow circular icon button link to progress */}
                <button
                  onClick={() => onNavigate('progress')}
                  className="w-10 h-10 rounded-full bg-white text-[#FF6B9D] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
                >
                  <ChevronRight className="w-5 h-5 stroke-[3px]" />
                </button>
              </div>

              <div className="flex items-end justify-between leading-none mt-2">
                <div className="flex flex-col">
                  <span className="text-[14px] font-mono font-black">748 Hr</span>
                  <span className="text-[8px] font-extrabold text-white/70 uppercase tracking-wider mt-1 block">Total Gym Active</span>
                </div>
                <span className="text-[9px] bg-white/20 px-2 py-1 rounded-sm border border-white/10 font-mono font-bold">
                  REC: {user.longest_streak}d
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ROW 2: 3 DETAILED WORKOUT CARDS LISTING THIS WEEK'S EXERCISES */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#1A1340] dark:text-[#F0EEFF] tracking-tight">
              This Week's Assigned Quests
            </h3>
            <button
              onClick={() => onNavigate('planner')}
              className="text-[#6C47FF] dark:text-[#FF8FB5] hover:underline text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Examine Full Planner <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {topThreeWorkouts.map((workout) => {
              const tag = FOCUS_TAGS[workout.focus_tag] || FOCUS_TAGS.full_body;
              return (
                <div
                  key={workout.id}
                  onClick={() => onOpenWorkout(workout)}
                  className="bg-white dark:bg-[#1A1630] rounded-[22px] border border-[#E4E2F0]/50 dark:border-[#2A2545]/50 relative card-hover cursor-pointer shadow-sm flex flex-col justify-between gap-0 overflow-hidden"
                  id={`workout-card-${workout.id}`}
                >
                  {/* YouTube Thumbnail (16:9), object-fit: cover */}
                  <div className="relative">
                    <img
                      src={`https://img.youtube.com/vi/${workout.youtube_video_id}/mqdefault.jpg`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                      className="w-full h-[140px] object-cover block"
                      alt={workout.title}
                      referrerPolicy="no-referrer"
                    />
                    <div
                      style={{ display: 'none' }}
                      className="w-full h-[140px] bg-gradient-to-tr from-[#6C47FF] to-[#FF6B9D] flex items-center justify-center text-3xl font-mono"
                    >
                      {tag.emoji}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    {/* [focus icon circle]        [Pending] / [Completed] badge */}
                    <div className="flex justify-between items-center">
                      <span
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm shadow-xs"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.emoji}
                      </span>
                      {workout.is_completed ? (
                        <span className="text-[9px] bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 font-bold px-2.5 py-1 rounded-full border border-green-200/40">
                          Compeleted ✓
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-50 dark:bg-[#2A2050] text-amber-600 dark:text-[#8B6BFF] font-bold px-2.5 py-1 rounded-full border border-amber-100/30">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Body title details */}
                    <div className="min-h-[46px] flex flex-col justify-center">
                      <h4 className="font-semibold text-[#1A1340] dark:text-[#F0EEFF] text-xs leading-snug tracking-tight truncate-2-lines">
                        {workout.title}
                      </h4>
                      <p className="text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] mt-0.5 flex items-center gap-1 font-medium leading-none">
                        <span>{workout.channel_name}</span>
                        <span>·</span>
                        <span className="font-mono">{workout.duration_label}</span>
                      </p>
                    </div>

                    {/* Bottom Progress Bar mimic on reference card */}
                    <div className="pt-2 border-t border-gray-100 dark:border-[#2A2545]/40 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] font-bold">
                        <span>Completeness Goal</span>
                        <span className="font-mono text-purple-600 dark:text-[#FF8FB5]">
                          {workout.is_completed ? '100%' : '0%'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#24203A] overflow-hidden">
                        <div
                          className="h-full bg-[#6C47FF] dark:bg-[#FF8FB5] rounded-full transition-all duration-500"
                          style={{ width: workout.is_completed ? '100%' : '5%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {topThreeWorkouts.length === 0 && (
              <div className="col-span-3 text-center py-6 bg-white dark:bg-[#1A1630] rounded-2xl border border-dashed border-[#E4E2F0]">
                <AlertCircle className="w-8 h-8 text-[#A0A0B8] mx-auto mb-2" />
                <h4 className="font-extrabold text-[#1A1340]">No Workouts Scheduled This Week</h4>
                <p className="text-xs text-[#6B6B8A] mt-1 mb-3">Add workouts to start gaining levels.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="bg-[#6C47FF] text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#5035CC]"
                >
                  Create Planner Plan
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= RIGHT HUD HUD-SIDEBAR PANEL ================= */}
      <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-5">
        
        {/* Widget 1: Levels & XP HUD circle */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="dashboard-xp-panel">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Rank Standings</span>
            <span className="bg-[#6C47FF]/10 text-[#6C47FF] dark:text-[#FF8FB5] text-[10px] px-2.5 py-0.5 rounded-full font-black">
              Lv. {user.level} {getLevelTitle(user.level)}
            </span>
          </div>

          {/* XP Progress Bar status */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline font-bold">
              <span className="text-xs text-[#1A1340] dark:text-[#F0EEFF]">Current Experience</span>
              <span className="text-xs text-[#6C47FF] font-mono">{user.xp} XP</span>
            </div>

            <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-[#24203A] overflow-hidden p-0.5 border border-[#E4E2F0]/30">
              <div
                className="h-full bg-gradient-to-r from-[#6C47FF] to-[#FF6B9D] rounded-full transition-all duration-800"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[9px] text-[#A0A0B8] font-bold mt-1">
              <span>Lv. {user.level}</span>
              <span>{levelThreshold - user.xp} XP to level {user.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Boss Monster widget (Optional feature defined in prompt) */}
        {user.show_weekly_boss && (
          <div className="bg-[#1A1340] dark:bg-[#120E28] rounded-[24px] text-white p-4 shadow-xl border border-white/5 relative overflow-hidden" id="weekly-boss-widget">
            <div className="absolute top-1 right-2 font-mono text-2xl animate-bounce">
              🐉
            </div>
            <div>
              <span className="text-[8px] bg-[#FF6B9D] text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                Weekly Overlord Boss
              </span>
              <h4 className="text-sm font-extrabold mt-1 tracking-tight">Colossus Titan (HP Depleting)</h4>
            </div>

            {/* Boss progress */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-white/60 font-mono font-bold mb-1">
                <span>HP Indicator</span>
                <span>
                  {thisWeekTotalWorkouts > 0 
                    ? Math.max(0, 100 - Math.round((thisWeekCompletedWorkouts / thisWeekTotalWorkouts) * 100))
                    : 100
                  }%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-linear-to-r from-red-500 to-[#FF6B9D] transition-all duration-800"
                  style={{ 
                    width: `${thisWeekTotalWorkouts > 0 
                      ? Math.max(0, 100 - Math.round((thisWeekCompletedWorkouts / thisWeekTotalWorkouts) * 100))
                      : 100
                    }%` 
                  }}
                />
              </div>
            </div>
            <p className="text-[9px] text-white/50 mt-2 leading-tight font-medium">
              Defeat the boss by completing all workouts scheduled in the Planner this week! (+75 XP Reward on defeat)
            </p>
          </div>
        )}

        {/* Widget 2: Log Weight Quick Widget */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="dashboard-quick-weightlog-card">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4] block mb-2.5">
            Quick Stats Weight Log
          </span>
          <div className="flex gap-2.5 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                placeholder="75"
                value={quickWeight}
                aria-label="Weight"
                onChange={(e) => setQuickWeight(e.target.value)}
                className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545]/70 rounded-xl py-2 pl-3 pr-8 text-sm text-[#1A1340] dark:text-[#F0EEFF] font-black focus:outline-hidden"
                id="quick-weight-input"
              />
              <span className="text-xs font-mono font-bold text-[#6B6B8A] dark:text-[#9B97C4] absolute right-3.5 top-2.5">
                {user.units === 'metric' ? 'kg' : 'lbs'}
              </span>
            </div>
            <button
              onClick={() => {
                const parsed = parseFloat(quickWeight);
                if (!isNaN(parsed) && parsed > 0) {
                  onQuickLogWeight(parsed);
                }
              }}
              id="submit-quick-weight"
              className="bg-[#6C47FF] hover:bg-[#5035CC] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 btn-active cursor-pointer"
            >
              Log it
            </button>
          </div>
        </div>

        {/* Widget 3: Recent Activity Event Feed list */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm flex flex-col gap-3.5" id="dashboard-activities-history-card">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Recent Activity</span>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-bold text-[#6C47FF] dark:text-[#FF8FB5] hover:underline"
            >
              Logs Table
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {xpActivities.slice(0, 4).map((xp) => (
              <div key={xp.id} className="flex items-center gap-2.5 leading-tight pb-2 border-b border-gray-50 dark:border-[#2A2545]/30">
                {/* Visual side circle */}
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FF] dark:bg-[#24203A] text-xs flex items-center justify-center shrink-0 text-[#6C47FF]">
                  ⚡
                </div>
                {/* Descr block */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF] truncate leading-normal">
                    {xp.action}
                  </p>
                  <span className="text-[9px] font-semibold text-[#A0A0B8] font-mono leading-none">
                    {new Date(xp.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                {/* XP badge */}
                <span className="text-[10px] bg-[#EDE9FF] dark:bg-[#24203A] text-[#6C47FF] dark:text-[#A994FF] font-black font-mono px-2 py-0.5 rounded-md">
                  +{xp.xp}
                </span>
              </div>
            ))}
            {xpActivities.length === 0 && (
              <p className="text-xs text-[#6B6B8A] text-center italic py-2">No exercises completed yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
