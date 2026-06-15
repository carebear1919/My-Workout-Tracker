/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Calendar, Layout, Search, Clock, ArrowRight, CheckCircle2, GripVertical, AlertTriangle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { FitUser, WeeklyPlan, Workout, DayPlan } from '../types';
import { FOCUS_TAGS, DEMO_WORKOUTS } from '../data';

interface PlannerViewProps {
  user: FitUser;
  activePlan: WeeklyPlan | null;
  onUpdatePlan: (updated: WeeklyPlan) => void;
  onOpenWorkout: (workout: Workout) => void;
  onAddCustomWorkout: (dayIndex: number, workout: Workout) => void;
  onRemoveWorkout: (dayIndex: number, workoutId: string) => void;
  onToggleWorkoutDone: (dayIndex: number, workoutId: string) => void;
  onSuggestSplit: () => void;
  onToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'xp' | 'badge') => void;
  onNavigate?: (view: string) => void;
}

const FOCUS_DISPLAY: Record<string, { label: string; icon: string; desc: string }> = {
  push_pull_legs: {
    label: 'Push / Pull / Legs (PPL)',
    icon: '🔥',
    desc: 'Hypertrophy program focusing on muscular movement planes.'
  },
  upper_lower: {
    label: 'Upper / Lower Body Divide',
    icon: '⚡',
    desc: 'Perfect balance dividing neural load between upper & lower halves.'
  },
  full_body: {
    label: 'Full-Body Conditioning',
    icon: '🔋',
    desc: 'High output rate functional circuits targeting general base capacity.'
  },
  cardio_core: {
    label: 'Cardio & Abs Shred',
    icon: '❤️',
    desc: 'Aerobic metabolism & athletic core kinetic stabilization.'
  }
};

export default function PlannerView({
  user,
  activePlan,
  onUpdatePlan,
  onOpenWorkout,
  onAddCustomWorkout,
  onRemoveWorkout,
  onToggleWorkoutDone,
  onSuggestSplit,
  onToast,
  onNavigate,
}: PlannerViewProps) {
  // Sidebar Panel Drawer toggle for YouTube Search
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeDayForAdd, setActiveDayForAdd] = useState<number | null>(null);

  // Search local inputs & values
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState<'All' | 'short' | 'medium' | 'long'>('All');
  const [customTitle, setCustomTitle] = useState('');
  const [customDuration, setCustomDuration] = useState('20 min');

  // Drag states
  const [draggedWorkoutId, setDraggedWorkoutId] = useState<string | null>(null);
  const [draggedSourceDayIndex, setDraggedSourceDayIndex] = useState<number | null>(null);

  // Focus Tags dropdown toggling
  const [activeTagDropdown, setActiveTagDropdown] = useState<number | null>(null);
  const [hoveredTagDropdown, setHoveredTagDropdown] = useState<number | null>(null);

  const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Smart Workout Split Suggester states
  const [showSuggester, setShowSuggester] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedSplit, setSelectedSplit] = useState<string>('push_pull_legs');
  const [selectedFrequency, setSelectedFrequency] = useState<number>(4);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['upper_body', 'legs']);

  const toggleMuscle = (muscleKey: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscleKey) 
        ? prev.filter(m => m !== muscleKey) 
        : [...prev, muscleKey]
    );
  };

  // FUTURE WEEKS OFFSET SCHEDULING
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [localPlan, setLocalPlan] = useState<WeeklyPlan | null>(null);

  // YouTube live search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getWeekStartDate = (offsetWeeks = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday + (offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekId = (offsetWeeks = 0) => {
    const monday = getWeekStartDate(offsetWeeks);
    const year = monday.getFullYear();
    const weekNum = getISOWeekNumber(monday);
    return `week_${year}_W${String(weekNum).padStart(2,'0')}`;
  };

  const getISOWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const loadAllWeeksFromStorage = (): WeeklyPlan[] => {
    const cached = localStorage.getItem('fq_weeks');
    if (!cached) return [];
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        return [parsed];
      }
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    const allWeeks = loadAllWeeksFromStorage();
    const targetId = getWeekId(weekOffset);
    let plan = allWeeks.find(w => w.id === targetId);

    if (!plan) {
      const monday = getWeekStartDate(weekOffset);
      plan = {
        id: targetId,
        week_start: monday.toISOString().split('T')[0],
        days: Array.from({ length: 7 }, (_, i) => ({
          day_index: i,
          focus_tag: 'rest',
          is_rest_day: true,
          workouts: []
        })),
        weekly_boss_defeated: false
      };
      
      const nextWeeks = [...allWeeks, plan];
      localStorage.setItem('fq_weeks', JSON.stringify(nextWeeks));
    }
    
    setLocalPlan(plan);
  }, [weekOffset]);

  const updateLocalPlan = (updated: WeeklyPlan) => {
    setLocalPlan(updated);
    
    const allWeeks = loadAllWeeksFromStorage();
    const existingIdx = allWeeks.findIndex(w => w.id === updated.id);
    let nextWeeks = [...allWeeks];
    if (existingIdx >= 0) {
      nextWeeks[existingIdx] = updated;
    } else {
      nextWeeks.push(updated);
    }
    localStorage.setItem('fq_weeks', JSON.stringify(nextWeeks));

    if (weekOffset === 0) {
      onUpdatePlan(updated);
    }
  };

  const handleCopyFromPreviousWeek = () => {
    if (!localPlan) return;
    const allWeeks = loadAllWeeksFromStorage();
    const prevWeekId = getWeekId(weekOffset - 1);
    const prevPlan = allWeeks.find(w => w.id === prevWeekId);

    if (!prevPlan) {
      onToast('No previous week structural layout found.', 'Copy failed', 'warning');
      return;
    }

    const updatedDays = localPlan.days.map((day, idx) => {
      const prevDay = prevPlan.days[idx];
      return {
        ...day,
        focus_tag: prevDay.focus_tag,
        is_rest_day: prevDay.is_rest_day,
        workouts: prevDay.workouts.map(w => ({
          ...w,
          id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          is_completed: false,
          completed_at: null,
          notes: ''
        }))
      };
    });

    updateLocalPlan({
      ...localPlan,
      days: updatedDays
    });
    onToast('Copied Successfully ✓', 'Retrieved weekly structure parameters.', 'success');
  };

  // Perform live search or fallback to Demo workouts
  const performSearch = async (query: string) => {
    const apiKey = localStorage.getItem('fq_yt_api_key') || '';
    if (!apiKey) {
      const rawDemos = DEMO_WORKOUTS;
      let filtered = rawDemos;
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = rawDemos.filter(v => v.title.toLowerCase().includes(q) || v.focus.toLowerCase().includes(q));
      }
      setSearchResults(filtered.map(item => ({
        id: item.id,
        youtube_video_id: item.id,
        title: item.title,
        channel_name: item.channel,
        duration_label: item.duration,
        focus_tag: item.focus
      })));
      return;
    }

    setIsSearching(true);
    try {
      const qText = query.includes('workout') ? query : query + ' workout';
      const params = new URLSearchParams({
        part: 'snippet',
        q: qText,
        type: 'video',
        maxResults: '12',
        key: apiKey
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          onToast('YouTube API key quota exceeded.', 'Showing demo videos.', 'warning');
        }
        const rawDemos = DEMO_WORKOUTS;
        setSearchResults(rawDemos.map(item => ({
          id: item.id,
          youtube_video_id: item.id,
          title: item.title,
          channel_name: item.channel,
          duration_label: item.duration,
          focus_tag: item.focus
        })));
        return;
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        const rawDemos = DEMO_WORKOUTS;
        setSearchResults(rawDemos.map(item => ({
          id: item.id,
          youtube_video_id: item.id,
          title: item.title,
          channel_name: item.channel,
          duration_label: item.duration,
          focus_tag: item.focus
        })));
        return;
      }

      setSearchResults(data.items.map((item: any) => ({
        id: item.id.videoId,
        youtube_video_id: item.id.videoId,
        title: item.snippet.title,
        channel_name: item.snippet.channelTitle,
        duration_label: 'Watch',
        focus_tag: 'full_body'
      })));
    } catch (err) {
      console.error(err);
      onToast('Search failed.', 'Check your connection.', 'error');
      const rawDemos = DEMO_WORKOUTS;
      setSearchResults(rawDemos.map(item => ({
        id: item.id,
        youtube_video_id: item.id,
        title: item.title,
        channel_name: item.channel,
        duration_label: item.duration,
        focus_tag: item.focus
      })));
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, panelOpen]);

  // Handler for focus tag change
  const handleFocusTagChange = (dayIndex: number, newTag: string) => {
    if (!localPlan) return;
    const isRest = newTag === 'rest';
    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === dayIndex) {
        return {
          ...day,
          focus_tag: newTag,
          is_rest_day: isRest,
          workouts: isRest ? [] : day.workouts,
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    onToast('Target focus altered', `Changed day focus to ${FOCUS_TAGS[newTag].label}!`, 'success');
    setActiveTagDropdown(null);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, workoutId: string, dayIndex: number) => {
    setDraggedWorkoutId(workoutId);
    setDraggedSourceDayIndex(dayIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    if (!localPlan || draggedWorkoutId === null || draggedSourceDayIndex === null) return;
    if (draggedSourceDayIndex === targetDayIndex) return;

    const sourceDay = localPlan.days.find((d) => d.day_index === draggedSourceDayIndex);
    const targetDay = localPlan.days.find((d) => d.day_index === targetDayIndex);

    if (!sourceDay || !targetDay || targetDay.is_rest_day) {
      if (targetDay?.is_rest_day) {
        onToast('Action Restricted', 'Cannot drop workouts onto scheduled rest days!', 'warning');
      }
      return;
    }

    const workoutToMove = sourceDay.workouts.find((w) => w.id === draggedWorkoutId);
    if (!workoutToMove) return;

    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === draggedSourceDayIndex) {
        return {
          ...day,
          workouts: day.workouts.filter((w) => w.id !== draggedWorkoutId),
        };
      }
      if (day.day_index === targetDayIndex) {
        return {
          ...day,
          workouts: [...day.workouts, workoutToMove],
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    onToast('Rearranged successfully', `Moved "${workoutToMove.title}" to ${daysLabel[targetDayIndex]}!`, 'success');

    setDraggedWorkoutId(null);
    setDraggedSourceDayIndex(null);
  };

  // YouTube drawer panel add workout action
  const handleAddYouTubeWorkout = (video: any) => {
    if (activeDayForAdd === null || !localPlan) return;

    const newWorkout: Workout = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      youtube_video_id: video.youtube_video_id || video.id,
      title: video.title,
      thumbnail_url: `https://img.youtube.com/vi/${video.youtube_video_id || video.id}/mqdefault.jpg`,
      duration_label: video.duration_label || video.duration || 'Watch',
      channel_name: video.channel_name || video.channel || 'Live Search',
      focus_tag: video.focus_tag || video.focus || 'full_body',
      notes: '',
      is_completed: false,
      completed_at: null,
    };

    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === activeDayForAdd) {
        return {
          ...day,
          workouts: [...day.workouts, newWorkout],
          is_rest_day: false,
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    onToast('Quest Included', `Added "${video.title}" to ${daysLabel[activeDayForAdd]} planner!`, 'success');
    setPanelOpen(false);
  };

  // Manual fallback custom title creation
  const handleAddCustomManualWorkout = () => {
    if (activeDayForAdd === null || !customTitle.trim() || !localPlan) return;

    const newWorkout: Workout = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      youtube_video_id: 'ml6cT4AZdqI',
      title: customTitle,
      thumbnail_url: 'https://img.youtube.com/vi/ml6cT4AZdqI/mqdefault.jpg',
      duration_label: customDuration,
      channel_name: 'Custom Action',
      focus_tag: (localPlan?.days || []).find(d => d.day_index === activeDayForAdd)?.focus_tag || 'full_body',
      notes: '',
      is_completed: false,
      completed_at: null,
    };

    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === activeDayForAdd) {
        return {
          ...day,
          workouts: [...day.workouts, newWorkout],
          is_rest_day: false,
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    onToast('Custom Quest Logged', `Added manual entry "${customTitle}"!`, 'success');
    setCustomTitle('');
    setPanelOpen(false);
  };

  // Helper delete & complete togglers for workout cards inside week columns
  const handleRemoveWorkout = (dayIndex: number, workoutId: string) => {
    if (!localPlan) return;
    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === dayIndex) {
        return {
          ...day,
          workouts: day.workouts.filter((w) => w.id !== workoutId),
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    onToast('Workout Removed', 'Removed quest listing from daily calendar.', 'warning');
  };

  const handleToggleWorkoutDone = (dayIndex: number, workoutId: string) => {
    if (!localPlan) return;
    let completedMarked = false;

    const updatedDays = localPlan.days.map((day) => {
      if (day.day_index === dayIndex) {
        return {
          ...day,
          workouts: day.workouts.map((w) => {
            if (w.id === workoutId) {
              completedMarked = !w.is_completed;
              return {
                ...w,
                is_completed: completedMarked,
                completed_at: completedMarked ? new Date().toISOString() : null,
              };
            }
            return w;
          }),
        };
      }
      return day;
    });

    updateLocalPlan({ ...localPlan, days: updatedDays });
    if (completedMarked) {
      onToast('Status changed', '✓ Verified Daily quota challenge', 'success');
    } else {
      onToast('Status altered', 'Action marked pending.', 'warning');
    }
  };

  const handleApplySuggesterSplit = () => {
    if (!localPlan) return;

    let focusMap: string[] = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];

    if (selectedSplit === 'push_pull_legs') {
      if (selectedFrequency === 3) {
        focusMap = ['push', 'rest', 'pull', 'rest', 'legs', 'rest', 'rest'];
      } else if (selectedFrequency === 4) {
        focusMap = ['push', 'pull', 'rest', 'legs', 'push', 'rest', 'rest'];
      } else if (selectedFrequency === 5) {
        focusMap = ['push', 'pull', 'rest', 'legs', 'push', 'pull', 'rest'];
      } else {
        focusMap = ['push', 'pull', 'legs', 'rest', 'push', 'pull', 'legs'];
      }
    } else if (selectedSplit === 'upper_lower') {
      if (selectedFrequency === 3) {
        focusMap = ['upper_body', 'rest', 'legs', 'rest', 'upper_body', 'rest', 'rest'];
      } else if (selectedFrequency === 4) {
        focusMap = ['upper_body', 'legs', 'rest', 'upper_body', 'legs', 'rest', 'rest'];
      } else {
        focusMap = ['upper_body', 'legs', 'rest', 'upper_body', 'legs', 'upper_body', 'rest'];
      }
    } else if (selectedSplit === 'cardio_core') {
      if (selectedFrequency === 3) {
        focusMap = ['cardio', 'rest', 'core', 'rest', 'cardio', 'rest', 'rest'];
      } else if (selectedFrequency === 4) {
        focusMap = ['cardio', 'core', 'rest', 'cardio', 'core', 'rest', 'rest'];
      } else {
        focusMap = ['cardio', 'core', 'cardio', 'core', 'cardio', 'core', 'rest'];
      }
    } else {
      // full_body
      if (selectedFrequency === 3) {
        focusMap = ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'rest', 'rest'];
      } else if (selectedFrequency === 4) {
        focusMap = ['full_body', 'rest', 'full_body', 'rest', 'full_body', 'full_body', 'rest'];
      } else {
        focusMap = ['full_body', 'full_body', 'rest', 'full_body', 'full_body', 'full_body', 'rest'];
      }
    }

    const updatedDays = localPlan.days.map((day, idx) => {
      const tag = focusMap[idx];
      const isRest = tag === 'rest';

      let workouts: Workout[] = [];
      if (!isRest) {
        const matchingDemos = DEMO_WORKOUTS.filter(v => v.focus === tag || v.focus === 'full_body').slice(0, 2);
        workouts = matchingDemos.map(video => ({
          id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          youtube_video_id: video.id,
          title: video.title,
          thumbnail_url: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          duration_label: video.duration,
          channel_name: video.channel,
          focus_tag: video.focus,
          notes: '',
          is_completed: false,
          completed_at: null
        }));
      }

      return {
        ...day,
        focus_tag: tag,
        is_rest_day: isRest,
        workouts
      };
    });

    updateLocalPlan({
      ...localPlan,
      days: updatedDays
    });

    onToast('Split Applied Successfully!', 'Optimized weekly muscle targets auto-allocated.', 'success');
    setShowSuggester(false);
    setWizardStep(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16 relative max-w-[1650px] mx-auto">
      
      {/* HEADER CONTROLS VIEW */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4 border-b border-[#E4E2F0]/20">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1340] dark:text-[#F0EEFF] tracking-tight">
            Weekly Planner
          </h1>
          <p className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] font-semibold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#6C47FF]" /> Schedule split cycles & calibrate muscle load
          </p>
        </div>

        {/* ================= PLANNER FIX 5: WEEK NAVIGATION BAR ================= */}
        <div className="flex items-center justify-center">
          <div className="bg-white dark:bg-[#1A1630] rounded-full p-1.5 px-2.5 shadow-[0_4px_20px_rgba(108,71,255,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 flex items-center gap-2 select-none">
            <button
              onClick={() => setWeekOffset(prev => Math.max(-4, prev - 1))}
              disabled={weekOffset <= -4}
              className="border-none rounded-full px-4 py-1.5 text-[13px] font-semibold bg-[#EDE9FF] hover:bg-[#6C47FF] text-[#6C47FF] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-[#EDE9FF] disabled:hover:text-[#6C47FF]"
            >
              ◀ Prior Week
            </button>
            
            <div className="text-center min-w-[155px] px-2">
              <span className="text-[15px] font-bold text-[#1A1340] dark:text-[#F0EEFF] tracking-tight block leading-tight">
                {localPlan ? `Week ${localPlan.id.split('_W')[1]} (${localPlan.id.split('_')[1]})` : 'Fetching Week...'}
              </span>
              <span className="text-[11px] text-[#6B6B8A] dark:text-[#9B97C4] font-medium uppercase tracking-wider block mt-0.5 leading-none" style={{ letterSpacing: '0.6px' }}>
                {weekOffset === 0 ? 'CURRENT WEEK' : weekOffset > 0 ? `AHEAD (+${weekOffset}w)` : `PAST (${weekOffset}w)`}
              </span>
            </div>

            <button
              onClick={() => setWeekOffset(prev => Math.min(12, prev + 1))}
              disabled={weekOffset >= 12}
              className="border-none rounded-full px-4 py-1.5 text-[13px] font-semibold bg-[#EDE9FF] hover:bg-[#6C47FF] text-[#6C47FF] hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-[#EDE9FF] disabled:hover:text-[#6C47FF]"
            >
              Next Week ▶
            </button>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="border-none rounded-full px-3.5 py-1.5 bg-[#6C47FF] hover:bg-[#5035CC] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {weekOffset > 0 && (
            <button
              onClick={handleCopyFromPreviousWeek}
              className="border border-[#E4E2F0] dark:border-[#2A2545] hover:border-[#6C47FF] bg-white dark:bg-[#1A1630] hover:bg-[#F5F3FF] dark:hover:bg-[#24203A] text-gray-700 dark:text-[#F0EEFF] font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              📋 Copy Last Week
            </button>
          )}

          <button
            onClick={() => setShowSuggester(true)}
            id="planner-suggest-split"
            className="status-btn border border-[#6C47FF]/70 hover:border-[#6C47FF] hover:bg-[#F5F3FF] dark:hover:bg-[#24203A] text-[#6C47FF] dark:text-[#FF8FB5] font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all btn-active cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Suggest Split
          </button>
        </div>
      </div>

      {/* PLANNER TIMELINE BANNERS */}
      {weekOffset > 0 && (
        <div className="bg-[#EDE9FF] dark:bg-[#24203A] border border-[#6C47FF]/20 p-4 rounded-[20px] flex gap-3 text-[#1A1340] dark:text-[#F0EEFF] items-center">
          <Calendar className="w-5 h-5 text-[#6C47FF] dark:text-[#FF8FB5] shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">
            📅 <strong>Planning ahead:</strong> Workouts scheduled in future weeks won't count toward your live streak metrics or experience points (XP) until that actual week calendar date arrives.
          </p>
        </div>
      )}

      {weekOffset < 0 && (
        <div className="bg-amber-50 dark:bg-[#2A2050] border border-amber-200/40 p-4 rounded-[20px] flex gap-3 text-[#1A1340] dark:text-[#F0EEFF] items-center">
          <AlertCircle className="w-5 h-5 text-[#FF6B9D] shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">
            ⏳ <strong>Historical Log View:</strong> You are browsing previous schedule records. Editing history has been constrained — incomplete entries will display as missed quotas.
          </p>
        </div>
      )}

      {/* ================= PLANNER FIX 7: OVERALL SPACING GRID WITH HORIZONTAL SCROLL PROTECTION ================= */}
      <div className="w-full overflow-x-auto pt-5 pb-4 scroll-hint border-b border-[#E4E2F0]/20 dark:border-[#2A2545]/30">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5 items-start select-none md:min-w-[1360px] 2xl:min-w-full" id="planner-7day-grid">
        {daysLabel.map((dayLabel, dayIdx) => {
          const dayPlan = (localPlan?.days || []).find((d) => d.day_index === dayIdx) || {
            day_index: dayIdx,
            focus_tag: 'rest',
            is_rest_day: true,
            workouts: [],
          };
          const focusTag = FOCUS_TAGS[dayPlan.focus_tag] || FOCUS_TAGS.rest;
          const isTodayColumn = weekOffset === 0 && (new Date().getDay() + 6) % 7 === dayIdx;
          const isTagHovered = hoveredTagDropdown === dayIdx;

          return (
            <div
              key={dayIdx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dayIdx)}
              className={`rounded-2xl p-3.5 border flex flex-col gap-3 min-h-[480px] transition-all relative ${
                dayPlan.is_rest_day
                  ? 'border-[1.5px] border-dashed border-[#C4BFDF] dark:border-[#3E3A60] bg-[#F7F5FF] dark:bg-[#1C1836]/40 shadow-xs hover:border-[#6C47FF]/40'
                  : isTodayColumn
                    ? 'bg-white dark:bg-[#1A1630] border-2 border-[#6C47FF] shadow-[0_4px_24px_rgba(108,71,255,0.14)] ring-4 ring-[#6C47FF]/12'
                    : 'bg-white dark:bg-[#1A1630] border-[1.5px] border-[#E4E2F0]/80 dark:border-[#2A2545]/60 hover:border-[#6C47FF]/40 shadow-xs'
              }`}
              id={`planner-column-${dayIdx}`}
            >
              {/* Today Pill Header Overlay */}
              {isTodayColumn && (
                <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#6C47FF] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-[0_0_0_4px_rgba(108,71,255,0.12)] tracking-wider z-20">
                  TODAY
                </span>
              )}

              {/* Day Header */}
              <div className="flex justify-between items-baseline border-b border-gray-100 dark:border-[#2A2545]/30 pb-2 ml-0.5">
                <div>
                  <h3 className="font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight">
                    {dayLabel}
                  </h3>
                  <span className="text-[10px] text-[#A0A0B8] font-mono font-bold leading-none uppercase">
                    Quest Day {dayIdx + 1}
                  </span>
                </div>
              </div>

              {/* ================= PLANNER FIX 3: FOCUS TAG DROPDOWN ================= */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setActiveTagDropdown(activeTagDropdown === dayIdx ? null : dayIdx)}
                  onMouseEnter={() => setHoveredTagDropdown(dayIdx)}
                  onMouseLeave={() => setHoveredTagDropdown(null)}
                  className="w-full text-left py-1.5 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  style={{
                    borderColor: focusTag.color + '66',
                    backgroundColor: focusTag.color + (isTagHovered ? '33' : '1A'),
                    color: focusTag.color
                  }}
                  id={`focus-selector-day-${dayIdx}`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span>{focusTag.emoji}</span>
                    <span>{focusTag.label}</span>
                  </span>
                  <span className="text-[10px] ml-1.5 opacity-60">▼</span>
                </button>

                {/* Dropdown Items list */}
                {activeTagDropdown === dayIdx && (
                  <div className="absolute top-10 left-0 right-0 z-30 bg-white dark:bg-[#1A1630] border border-[#E4E2F0] dark:border-[#2A2545] rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 py-1.5 flex flex-col gap-1">
                    {Object.keys(FOCUS_TAGS).map((tagKey) => {
                      const tg = FOCUS_TAGS[tagKey];
                      return (
                        <button
                          key={tagKey}
                          onClick={() => handleFocusTagChange(dayIdx, tagKey)}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1A1340] dark:text-[#F0EEFF] hover:bg-gray-100 dark:hover:bg-[#24203A] cursor-pointer flex items-center gap-2"
                          id={`dropdown-tag-${dayIdx}-${tagKey}`}
                        >
                          <span style={{ color: tg.color }} className="text-sm">{tg.emoji}</span>
                          <span>{tg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Workout cards mapped inside column */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden max-h-[300px]">
                {dayPlan.workouts.map((work) => (
                  <div
                    key={work.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, work.id, dayIdx)}
                    style={{ borderLeft: `3px solid ${focusTag.color}` }}
                    className={`p-2 rounded-xl border border-[#E4E2F0]/65 dark:border-[#2A2545]/40 flex flex-col justify-between transition-all duration-150 group cursor-grab active:cursor-grabbing hover:shadow-[0_4px_16px_rgba(108,71,255,0.12)] hover:-translate-y-0.5 relative ${
                      work.is_completed
                        ? 'bg-green-50/75 dark:bg-green-950/20 text-green-900 line-through decoration-green-600/70 border-green-200/40'
                        : 'bg-white dark:bg-[#1A1630]'
                    }`}
                    id={`planner-workout-${work.id}`}
                  >
                    {/* Inline drag grid icon - fades out on hover as trash icon takes its place */}
                    <div className="absolute top-2 right-2 cursor-grab text-[#6B6B8A]/45 opacity-100 group-hover:opacity-0 transition-opacity duration-150 pointer-events-none flex items-center justify-center">
                      <GripVertical className="w-3 h-3" />
                    </div>

                    {/* Absolutely positioned delete button shown only on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWorkout(dayIdx, work.id);
                      }}
                      className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700 bg-white dark:bg-[#1A1630] hover:bg-[#FEE2E2] dark:hover:bg-[#451C24] p-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 border border-transparent hover:border-red-200/40 flex items-center justify-center outline-hidden"
                      id={`delete-${dayIdx}-${work.id}`}
                      title="Remove workout"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Rich inline thumbnail layout */}
                    <div className="flex gap-2 items-center">
                      <img
                        src={`https://img.youtube.com/vi/${work.youtube_video_id}/mqdefault.jpg`}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-12 h-9 object-cover rounded-lg shrink-0 border border-gray-100 dark:border-slate-800"
                        alt={work.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-sans font-semibold text-[13px] text-[#1A1340] dark:text-[#F0EEFF] tracking-tight leading-snug line-clamp-2 h-[34px] overflow-hidden">
                          {work.title}
                        </h4>
                        <p className="font-sans font-normal text-xs text-[#6B6B8A] dark:text-[#9B97C4] mt-1 flex items-center gap-1 leading-none">
                          <span className="text-[10px]">⏱</span> {work.duration_label}
                        </p>
                      </div>
                    </div>

                    {/* Check complete and video actions layout - side by side, taking equal space for symmetry and safety against wrapping */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100 dark:border-[#2A2545]/30">
                      {weekOffset < 0 && !work.is_completed ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-bold px-2 py-0.5 rounded-sm shrink-0">
                          ⚠️ Missed
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWorkoutDone(dayIdx, work.id);
                          }}
                          className={`text-[11px] font-semibold py-1 rounded-full cursor-pointer transition-all border-none text-center flex-1 min-w-[45px] whitespace-nowrap ${
                            work.is_completed
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 px-1.5'
                              : 'bg-[#EDE9FF] hover:bg-[#E2DBFF] text-[#6C47FF] dark:bg-slate-800 dark:text-[#CEBFFF] dark:hover:bg-[#2F275C] px-2.5'
                          }`}
                          id={`mark-done-${dayIdx}-${work.id}`}
                        >
                          {work.is_completed ? 'Done ✓' : 'Check'}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWorkout(work);
                        }}
                        className="bg-[#FFE2EC] hover:bg-[#FFD1E1] text-[#D13B6B] dark:bg-[#3D1A25] dark:text-[#FF8FB5] dark:hover:bg-[#4D2431] border-none rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors text-center flex-1 min-w-[45px] whitespace-nowrap"
                        id={`play-planner-${work.id}`}
                      >
                        Video
                      </button>
                    </div>
                  </div>
                ))}

                {/* ================= PLANNER FIX 1: REST DAY STYLING ================= */}
                {dayPlan.is_rest_day && (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
                    <span className="text-3xl mb-2.5">😴</span>
                    <h5 className="text-[11px] font-extrabold text-[#6C47FF] dark:text-[#FF8FB5] uppercase tracking-wider">Scheduled Rest</h5>
                    <p className="text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] leading-relaxed max-w-[130px] mx-auto mt-1">Muscle fibers structural protein building reset.</p>
                  </div>
                )}

                {/* Empty Plan Placement indicator */}
                {!dayPlan.is_rest_day && dayPlan.workouts.length === 0 && (
                  <div className="py-4 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50/20 dark:bg-[#1A1630] text-center px-1.5">
                    <p className="text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] leading-relaxed font-semibold">No exercises programmed — click Append exercise to add workouts</p>
                  </div>
                )}

                {/* ================= PLANNER FIX 4: APPEND EXERCISE BUTTON ================= */}
                {!dayPlan.is_rest_day && (
                  <button
                    onClick={() => {
                      setActiveDayForAdd(dayIdx);
                      setPanelOpen(true);
                    }}
                    className="w-full p-2.5 border-[1.5px] border-dashed border-[#9B6BFF] hover:border-solid hover:border-[#6C47FF] rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FF] dark:bg-[#201A3D]/40 dark:hover:bg-[#201A3D]/70 text-[#6C47FF] dark:text-[#E9DFFF] font-semibold text-[13px] cursor-pointer transition-all duration-150 flex items-center justify-center"
                    id={`add-to-day-${dayIdx}`}
                  >
                    <span className="text-[16px] font-bold mr-1.5 leading-none">+</span> Append exercise
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* ================= YouTube SEARCH DRAWER CABINET PANEL (Slides In from Right) ================= */}
      {panelOpen && activeDayForAdd !== null && (
        <div id="slide-out-youtube-search" className="fixed top-0 right-0 h-screen w-full sm:w-[380px] bg-white dark:bg-[#1A1630] border-l border-[#E4E2F0] dark:border-[#2A2545] z-[9995] shadow-[-8px_0_40px_rgba(108,71,255,0.12)] flex flex-col justify-between animate-slide-in">
          {/* Drawer Title Block */}
          {/* ================= PLANNER FIX 6: DRAWER HEADER ================= */}
          <div className="p-5 bg-[#6C47FF] text-white flex items-center justify-between shadow-md relative z-10 shrink-0">
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Add Quest to {daysLabel[activeDayForAdd]}
              </h2>
              <p className="text-[11px] text-[#EDE9FF] font-medium mt-1">Add real live exercises or local fallbacks</p>
            </div>
            <button
              onClick={() => {
                setPanelOpen(false);
                setActiveDayForAdd(null);
              }}
              id="close-search-panel"
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Drawer Search panel scrollable filters & results */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            
            {/* Live Filter search query input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search workouts (HIIT, strength, etc)..."
                value={searchQuery}
                aria-label="Search workouts"
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border-none rounded-full py-3 pl-11 pr-5 text-sm text-[#1A1340] dark:text-[#F0EEFF] focus:outline-hidden focus:ring-2 focus:ring-[#6C47FF]/30 placeholder-[#6B6B8A]/60"
                id="workout-query-input"
              />
              <Search className="w-4 h-4 text-[#6C47FF] absolute left-4 top-3.5" />
            </div>

            {/* Durations badges rows filter pill */}
            <div className="flex items-center gap-1.5 overflow-x-auto select-none py-1.5 scrollbar-none shrink-0">
              {[
                { key: 'All', label: 'All mins' },
                { key: 'short', label: '≤15 min' },
                { key: 'medium', label: '15-30m' },
                { key: 'long', label: '30m+' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setDurationFilter(pill.key as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-none transition-colors shrink-0 ${
                    durationFilter === pill.key
                      ? 'bg-[#6C47FF] text-white shadow-xs'
                      : 'bg-[#EDE9FF] text-[#6C47FF] hover:bg-[#E2DBFF] dark:bg-slate-800 dark:text-[#CEBFFF] dark:hover:bg-[#2F275C]'
                  }`}
                  id={`filter-${pill.key}`}
                >
                  {pill.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Live indicator / Offline fallback advisory banner */}
            <div className="bg-gradient-to-br from-[#6C47FF] to-[#9B6BFF] text-white rounded-xl p-3.5 shadow-sm text-xs font-medium flex gap-2.5 items-start shrink-0">
              <Sparkles className="w-5 h-5 text-white/90 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {localStorage.getItem('fq_yt_api_key') 
                  ? '✓ YouTube live search mode unlocked! Streaming results on demand.' 
                  : '🔌 Demo mode active. Save a YouTube API key in Settings to search real live video splits!'}
              </p>
            </div>

            {/* Results Grid List */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-widest block">Available Exercises:</span>
              
              {isSearching ? (
                <div className="text-center py-6 text-xs text-[#6B6B8A]">⏳ Querying live indices...</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {searchResults.map((video) => (
                    <div
                      key={video.id}
                      className="py-3 px-1 border-b border-[#E4E2F0]/65 dark:border-[#2A2545]/40 flex items-center justify-between gap-3 relative transition-all group"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-[72px] h-12 object-cover rounded-lg shrink-0 border border-black/5 dark:border-white/5 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-semibold text-[13px] text-[#1A1340] dark:text-[#F0EEFF] truncate leading-tight">
                          {video.title}
                        </h4>
                        <p className="font-sans font-normal text-xs text-[#6B6B8A] dark:text-[#9B97C4] mt-1 truncate">
                          {video.channel_name} · <span className="font-mono text-[11px] font-medium text-[#6C47FF] dark:text-[#FF8FB5]">{video.duration_label}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddYouTubeWorkout(video)}
                        className="bg-[#6C47FF] hover:bg-[#5035CC] text-white border-none rounded-lg px-3.5 py-1.5 text-xs font-bold transition-transform duration-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                        id={`append-fallback-${video.id}`}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual exercise entry form block */}
            <div className="border-t border-[#E4E2F0] dark:border-[#2A2545]/60 pt-4 flex flex-col gap-3 shrink-0">
              <span className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-widest block">Or create custom manual task</span>
              
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="E.g., 5 miles running track"
                  value={customTitle}
                  aria-label="Custom task title"
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#F4F2FF] dark:bg-slate-800 border p-2 text-xs rounded-xl focus:outline-hidden"
                  id="custom-workout-title"
                />
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="30 mins"
                    value={customDuration}
                    aria-label="Custom task duration"
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="w-1/2 bg-[#F4F2FF] dark:bg-slate-800 border p-2 text-xs rounded-xl focus:outline-hidden"
                    id="custom-workout-duration"
                  />
                  <button
                    onClick={handleAddCustomManualWorkout}
                    className="w-1/2 bg-[#FF6B9D] text-white text-[11px] font-black rounded-xl hover:bg-[#E8527F] cursor-pointer"
                    id="submit-custom-manual"
                  >
                    Confirm Custom
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= SMART WORKOUT SPLIT SUGGESTER WIZARD MODAL ================= */}
      {showSuggester && (
        <div id="suggest-split-modal" className="fixed inset-0 bg-[#1A1340]/60 dark:bg-black/75 z-[99992] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0] dark:border-[#2A2545] rounded-[28px] max-w-lg w-full p-6 shadow-2xl animate-scale-in flex flex-col gap-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-[#E4E2F0]/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6C47FF] dark:text-[#FF8FB5]" />
                <h2 className="text-lg font-black text-[#1A1340] dark:text-[#F0EEFF] tracking-tight">
                  Workout Split Suggester
                </h2>
              </div>
              <button
                onClick={() => { setShowSuggester(false); setWizardStep(1); }}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 bg-gray-50 dark:bg-slate-800 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Stepper Wizard Progress Indicators */}
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    wizardStep === step 
                      ? 'bg-[#6C47FF] text-white' 
                      : wizardStep > step 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 dark:bg-slate-800 text-[#6B6B8A]'
                  }`}>
                    {step}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B6B8A]">
                    {step === 1 ? 'Focus' : step === 2 ? 'Frequency' : 'Muscles'}
                  </span>
                  {step < 3 && <div className="w-12 h-0.5 bg-gray-200 dark:bg-slate-700" />}
                </div>
              ))}
            </div>

            {/* Step Content: Step 1 (Focus selection) */}
            {wizardStep === 1 && (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">Step 1: Choose split programming philosophy</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {Object.entries(FOCUS_DISPLAY).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedSplit(key)}
                      className={`p-3 rounded-xl border text-left flex gap-3 transition-all cursor-pointer ${
                        selectedSplit === key 
                          ? 'border-2 border-[#6C47FF] bg-[#F4F2FF] dark:bg-[#201A3D]' 
                          : 'border-[#E4E2F0]/65 dark:border-[#2A2545]/60 bg-white dark:bg-[#1A1630]'
                      }`}
                    >
                      <span className="text-2xl pt-0.5">{item.icon}</span>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#1A1340] dark:text-[#F0EEFF]">{item.label}</h4>
                        <p className="text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content: Step 2 (Weekly Frequency) */}
            {wizardStep === 2 && (
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">Step 2: Calibrate weekly training allocation frequency</label>
                <p className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] leading-relaxed">
                  How many unique training quotas do you wish to log? We recommend <strong>{user.workout_days_per_week || 4} days</strong> based on your profile preferences.
                </p>
                <div className="flex justify-between items-center gap-2 px-2">
                  {[3, 4, 5, 6, 7].map(freq => (
                    <button
                      key={freq}
                      onClick={() => setSelectedFrequency(freq)}
                      className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedFrequency === freq 
                          ? 'border-2 border-[#6C47FF] bg-[#6C47FF] text-white shadow-md' 
                          : 'border-[#E4E2F0] hover:border-gray-400 text-gray-700 dark:text-[#F0EEFF]'
                      }`}
                    >
                      <span className="text-sm font-extrabold leading-tight">{freq}</span>
                      <span className="text-[8px] uppercase font-bold tracking-widest leading-none">Days</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content: Step 3 (Target Muscles) */}
            {wizardStep === 3 && (
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">Step 3: Define targeted biological clusters</label>
                <p className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] leading-relaxed">
                  Select target groups to ensure maximum alignment with your smart training calibration parameters:
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { key: 'upper_body', label: '💪 Upper Body Clusters', desc: 'Chest, Arms, Upper Back, Shoulders' },
                    { key: 'legs', label: '🦵 Lower Body Chains', desc: 'Quads, Glutes, Hamstrings, Gastrocnemius' },
                    { key: 'core', label: '🛡️ Midsection Core Guard', desc: 'Abdominals, lower stabilizing spine obliques' },
                    { key: 'cardio', label: '🏃 Aerobic Endurance', desc: 'Oxygen metabolic rate cardio capacities' },
                  ].map(muscleObj => {
                    const active = selectedMuscles.includes(muscleObj.key);
                    return (
                      <button
                        key={muscleObj.key}
                        onClick={() => toggleMuscle(muscleObj.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active 
                            ? 'border-2 border-green-500 bg-green-50/15' 
                            : 'border-[#E4E2F0]/60 dark:border-[#2A2545]/40 bg-white dark:bg-[#1A1630]'
                        }`}
                      >
                        <h4 className="font-extrabold text-xs text-[#1A1340] dark:text-[#F0EEFF] flex items-center justify-between">
                          <span>{muscleObj.label}</span>
                          <span>{active ? '✓' : '○'}</span>
                        </h4>
                        <p className="text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] mt-0.5 leading-snug">{muscleObj.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Controls Navigation Line */}
            <div className="flex justify-between items-center border-t border-[#E4E2F0]/50 pt-4 mt-1">
              {wizardStep > 1 ? (
                <button
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="px-4 py-2 border border-[#E4E2F0] rounded-xl text-xs font-bold text-gray-700 dark:text-[#F0EEFF] hover:bg-gray-50 cursor-pointer"
                >
                  ◀ Back
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 3 ? (
                <button
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-xs font-bold hover:bg-[#5035CC] cursor-pointer"
                >
                  Continue ▶
                </button>
              ) : (
                <button
                  onClick={handleApplySuggesterSplit}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  ✓ Calibrate & Apply Split
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
