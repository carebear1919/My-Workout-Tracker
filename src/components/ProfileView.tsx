/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ShieldAlert, Award, FileSpreadsheet, Eye, EyeOff, Check, AlertCircle, RefreshCcw, Download, Clock } from 'lucide-react';
import { FitUser, GoalType, UnitType } from '../types';

interface ProfileViewProps {
  user: FitUser;
  onUpdateUser: (updated: FitUser) => void;
  onExportData: () => void;
  onResetData: () => void;
  onToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'xp' | 'badge') => void;
}

export default function ProfileView({ user, onUpdateUser, onExportData, onResetData, onToast }: ProfileViewProps) {
  // Option lists accordions local toggle
  const [activeAccordion, setActiveAccordion] = useState<string | null>('personal');

  // Personal Info state
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [height, setHeight] = useState(user.height_cm);
  const [gender, setGender] = useState(user.gender || 'Not Specified');

  // Goals Info state
  const [goal, setGoal] = useState<GoalType>(user.goal);
  const [targetWeight, setTargetWeight] = useState(user.target_weight_kg);
  const [daysSlider, setDaysSlider] = useState(user.workout_days_per_week);

  // Notifications time local state
  const [workoutReminderEnabled, setWorkoutReminderEnabled] = useState(true);
  const [workoutReminderTime, setWorkoutReminderTime] = useState('08:00');
  const [weightReminderEnabled, setWeightReminderEnabled] = useState(true);
  const [weightReminderTime, setWeightReminderTime] = useState('07:00');

  // API Key visual input
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<'none' | 'success' | 'fail'>('none');
  const [ytKeyStatus, setYtKeyStatus] = useState<string>('empty');

  useEffect(() => {
    const key = localStorage.getItem('fq_yt_api_key') || '';
    setApiKey(key);
    setYtKeyStatus(key ? 'saved' : 'empty');
  }, []);

  const saveYouTubeAPIKey = () => {
    if (!apiKey.trim()) {
      onToast('Validation error', 'Please enter an API key first.', 'warning');
      return;
    }
    localStorage.setItem('fq_yt_api_key', apiKey.trim());
    setYtKeyStatus('saved');
    onToast('YouTube API key saved successfully!', '✓ Live search enabled', 'success');
  };

  const clearYouTubeAPIKey = () => {
    localStorage.removeItem('fq_yt_api_key');
    setApiKey('');
    setYtKeyStatus('empty');
    onToast('API key removed.', 'Using fallback demo videos', 'warning');
  };

  const testYouTubeAPIKey = async () => {
    const key = apiKey.trim();
    if (!key) {
      onToast('No API key entered.', 'Please enter an API key.', 'warning');
      return;
    }

    setApiTesting(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${key}`
      );
      if (res.ok) {
        setYtKeyStatus('valid');
        onToast('YouTube API key is working!', '✓ Connection established', 'success');
      } else {
        setYtKeyStatus('invalid');
        onToast('API key is invalid or quota exceeded.', '✗ Connection failed', 'error');
      }
    } catch (e) {
      onToast('Connection test failed. Check your internet.', 'Connection failed', 'error');
    } finally {
      setApiTesting(false);
    }
  };

  // Reset confirmation input
  const [resetInput, setResetInput] = useState('');

  // Save personal stats handler
  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      age,
      height_cm: height,
      gender,
    });
    onToast('Target verified', 'Personal measurements stored successfully!', 'success');
  };

  // Save fitness metrics handler
  const handleSaveGoals = () => {
    onUpdateUser({
      ...user,
      goal,
      target_weight_kg: targetWeight,
      workout_days_per_week: daysSlider,
    });
    onToast('Profile goals stored', 'Weekly metrics schedule recalibrated!', 'success');
  };

  // Test YouTube API key mock function
  const testApiKeyMock = () => {
    if (!apiKey.trim()) {
      onToast('Validation error', 'API key field is empty.', 'warning');
      return;
    }
    setApiTesting(true);
    setApiTestResult('none');
    setTimeout(() => {
      setApiTesting(false);
      setApiTestResult('success');
      onToast('Connected Successfully', 'Live YouTube workouts mapped perfectly!', 'success');
    }, 1200);
  };

  // Switch systems theme
  const handleToggleTheme = () => {
    const curTheme = user.theme === 'dark' ? 'light' : 'dark';
    onUpdateUser({ ...user, theme: curTheme });
    document.documentElement.setAttribute('data-theme', curTheme);
    onToast('Theme calibration changed', `Active interface is now styled in ${curTheme} mode!`, 'success');
  };

  const handleUnitToggle = (unitVal: UnitType) => {
    onUpdateUser({ ...user, units: unitVal });
    onToast('Unit calibrations modified', `All physical stats displaying in ${unitVal} properties!`, 'success');
  };

  const handleResetActionSubmit = () => {
    if (resetInput !== 'RESET') {
      onToast('Validation error', 'Please write RESET explicitly to delete files.', 'warning');
      return;
    }
    onResetData();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in pb-16 relative max-w-[1650px] mx-auto">
      
      {/* ================= LHS PROFILE CARD (Purple) ================= */}
      <div className="w-full lg:w-[320px] shrink-0" id="profile-lhs-card">
        <div className="bg-[#6C47FF] text-white rounded-[24px] p-6 shadow-lg text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-2 left-2 text-white/5 font-bold font-mono text-8xl select-none pointer-events-none">
            USER
          </div>

          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF6B9D] to-[#8B6BFF] p-1 shadow-md mb-4 flex items-center justify-center font-bold text-2xl font-mono text-white relative z-20">
            {user.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
          </div>

          <h3 className="text-xl font-black tracking-tight z-20">{user.name || 'FitAthlete'}</h3>
          <span className="bg-white/20 border border-white/10 px-3.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wider mt-1.5 inline-block z-20">
            Lv. {user.level} Standard Ranking
          </span>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4 shrink-0 px-0.5 z-20">
            <div className="h-full bg-[#FF6B9D] rounded-full" style={{ width: '45%' }} />
          </div>
          <span className="text-[10px] text-white/60 font-mono mt-1 z-20">450 / 1000 XP to Level 4</span>

          <div className="grid grid-cols-3 gap-1 pt-4 mt-5 border-t border-white/10 w-full text-center shrink-0 z-20 font-mono">
            <div>
              <span className="text-[14px] font-black block">{user.streak}d</span>
              <span className="text-[8px] text-white/50 uppercase tracking-wide">Streak</span>
            </div>
            <div className="border-x border-white/10">
              <span className="text-[14px] font-black block">{user.xp} XP</span>
              <span className="text-[8px] text-white/50 uppercase tracking-wide">Total XP</span>
            </div>
            <div>
              <span className="text-[14px] font-black block">{user.target_weight_kg} kg</span>
              <span className="text-[8px] text-white/50 uppercase tracking-wide">Goal Limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RHS ACCORDION FORMS ================= */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Accordion 1: Personal Info */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'personal' ? null : 'personal')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-personal-btn"
          >
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#6C47FF]" /> 1. Personal Measurements & Calibration
            </span>
            <span>{activeAccordion === 'personal' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'personal' && (
            <form onSubmit={handleSavePersonal} className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 grid grid-cols-2 gap-4 animate-slide-in">
              <div>
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] p-2 rounded-xl focus:border-[#6C47FF] focus:outline-hidden font-bold"
                  id="profile-name-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Age (yrs)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] p-2 rounded-xl focus:border-[#6C47FF] focus:outline-hidden font-bold"
                  id="profile-age-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] p-2 rounded-xl focus:border-[#6C47FF] focus:outline-hidden font-bold"
                  id="profile-height-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] p-2 rounded-xl focus:border-[#6C47FF] focus:outline-hidden font-bold cursor-pointer"
                  id="profile-gender-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Not Specified">Prefer Not To Say</option>
                </select>
              </div>

              <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-[#2A2545]/30 flex justify-end">
                <button
                  type="submit"
                  id="profile-save-personal"
                  className="bg-[#6C47FF] hover:bg-[#5035CC] text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-xl btn-active cursor-pointer"
                >
                  Confirm Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Accordion 2: Goals */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'goals' ? null : 'goals')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-goals-btn"
          >
            <span className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6C47FF]" /> 2. Fitness Goal & Target weights calibration
            </span>
            <span>{activeAccordion === 'goals' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'goals' && (
            <div className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 flex flex-col gap-4 animate-slide-in">
              {/* Goals list radios */}
              <div>
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider block mb-2">Primary Quest Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'weight_loss', title: '🔥 Lose Weight' },
                    { key: 'muscle_gain', title: '💪 Build Muscle' },
                    { key: 'endurance', title: '🏃 Endurance' },
                    { key: 'maintenance', title: '🌿 Stay Active' },
                  ].map((gl) => (
                    <button
                      key={gl.key}
                      onClick={() => setGoal(gl.key as any)}
                      className={`text-left p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        goal === gl.key
                          ? 'border-[#6C47FF] bg-[#F5F3FF] text-[#6C47FF]'
                          : 'border-[#E4E2F0] hover:border-gray-300'
                      }`}
                      id={`profile-goal-${gl.key}`}
                    >
                      {gl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider block mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border p-2 rounded-xl focus:outline-hidden font-bold"
                    id="profile-targetweight-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider block mb-1">Workout Days Per Week</label>
                  <input
                    type="range"
                    min="3"
                    max="7"
                    value={daysSlider}
                    onChange={(e) => setDaysSlider(Number(e.target.value))}
                    className="w-full accent-[#6C47FF] mt-3 cursor-pointer"
                    id="profile-days-slider"
                  />
                  <span className="text-xs font-black font-mono text-[#6C47FF] mt-1 block">Selected: {daysSlider} days</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-[#2A2545]/30 flex justify-end">
                <button
                  onClick={handleSaveGoals}
                  id="profile-save-goals"
                  className="bg-[#6C47FF] hover:bg-[#5035CC] text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-xl btn-active cursor-pointer"
                >
                  Recalibrate Plan Goals
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Units, display, theme */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'display' ? null : 'display')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-display-btn"
          >
            <span className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-[#6C47FF]" /> 3. Theme & Units Measurements Display
            </span>
            <span>{activeAccordion === 'display' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'display' && (
            <div className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 flex flex-col gap-5 animate-slide-in">
              {/* Unit Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF]">Metric/Imperial Multiplier units</h4>
                  <p className="text-[10px] text-[#A0A0B8]">All Physical numbers convert in logs and dashboards.</p>
                </div>
                <div className="bg-[#EDE9FF] p-0.5 rounded-full border flex">
                  <button
                    onClick={() => handleUnitToggle('metric')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                      user.units === 'metric' ? 'bg-[#6C47FF] text-white' : 'text-[#6C47FF]'
                    }`}
                    id="profile-unit-metric"
                  >
                    Metric
                  </button>
                  <button
                    onClick={() => handleUnitToggle('imperial')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                      user.units === 'imperial' ? 'bg-[#6C47FF] text-white' : 'text-[#6C47FF]'
                    }`}
                    id="profile-unit-imperial"
                  >
                    Imperial
                  </button>
                </div>
              </div>

              {/* Theme Settings light/dark */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF]">Color Theme mode</h4>
                  <p className="text-[10px] text-[#A0A0B8]">Switch interfaces immediately into Dark cosmic settings.</p>
                </div>
                <button
                  onClick={handleToggleTheme}
                  id="profile-theme-toggle"
                  className="bg-[#6C47FF] text-white font-bold text-xs uppercase px-4 py-2 rounded-xl border border-white/10 shrink-0 select-none btn-active cursor-pointer"
                >
                  {user.theme === 'dark' ? '☀️ App Light' : '🌙 App Dark Mode'}
                </button>
              </div>

              {/* Boss Widget show flag toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF]">Show Weekly Boss</h4>
                  <p className="text-[10px] text-[#A0A0B8]">Display HP monster bar on your dashboard panel.</p>
                </div>
                <input
                  type="checkbox"
                  checked={user.show_weekly_boss}
                  onChange={(e) => onUpdateUser({ ...user, show_weekly_boss: e.target.checked })}
                  className="w-5 h-5 accent-[#6C47FF] shrink-0 cursor-pointer"
                  id="profile-boss-toggle"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 4: Reminders notifications Mock */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'notif' ? null : 'notif')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-notif-btn"
          >
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6C47FF]" /> 4. Local App Reminders & Notification Alarms
            </span>
            <span>{activeAccordion === 'notif' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'notif' && (
            <div className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 flex flex-col gap-4 animate-slide-in">
              {/* Reminder 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF]">🏋️ Workout Reminder</h4>
                  <p className="text-[10px] text-[#A0A0B8]">Alert trigger if no exercises logged before target hour.</p>
                </div>
                <div className="flex items-center gap-3">
                  {workoutReminderEnabled && (
                    <input
                      type="time"
                      value={workoutReminderTime}
                      onChange={(e) => setWorkoutReminderTime(e.target.value)}
                      className="bg-gray-100 dark:bg-[#24203A] border text-xs text-[#1A1340] dark:text-[#F0EEFF] p-1.5 rounded-lg outline-hidden"
                      id="input-time-workout"
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={workoutReminderEnabled}
                    onChange={(e) => setWorkoutReminderEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#6C47FF] shrink-0 cursor-pointer"
                    id="checkbox-workout-reminder"
                  />
                </div>
              </div>

              {/* Reminder 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1340] dark:text-[#F0EEFF]">⚖️ Weight Log Reminder</h4>
                  <p className="text-[10px] text-[#A0A0B8]">Scales indicators alarm on early mornings.</p>
                </div>
                <div className="flex items-center gap-3">
                  {weightReminderEnabled && (
                    <input
                      type="time"
                      value={weightReminderTime}
                      onChange={(e) => setWeightReminderTime(e.target.value)}
                      className="bg-gray-100 dark:bg-[#24203A] border text-xs text-[#1A1340] dark:text-[#F0EEFF] p-1.5 rounded-lg outline-hidden"
                      id="input-time-weight"
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={weightReminderEnabled}
                    onChange={(e) => setWeightReminderEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#6C47FF] shrink-0 cursor-pointer"
                    id="checkbox-weight-reminder"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 5: YouTube API Key */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'api' ? null : 'api')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-api-btn"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#6C47FF]" /> 5. YouTube API Credential settings
            </span>
            <span>{activeAccordion === 'api' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'api' && (
            <div className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 flex flex-col gap-4 animate-slide-in" id="yt-api-section">
              <p className="text-xs mb-2 text-[#6B6B8A] dark:text-[#9B97C4]">
                A YouTube Data API v3 key enables live workout search inside the app. 
                Without it, only fallback demo videos are available.
                <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
                   className="text-[#6C47FF] dark:text-[#FF8FB5] font-semibold ml-1.5 hover:underline">
                  Get your free key →
                </a>
              </p>

              <div className="flex gap-2.5 items-center">
                <input 
                  type={showApiKey ? 'text' : 'password'} 
                  id="yt-api-key-input" 
                  placeholder="Paste Google Cloud API key (starts with AIza)" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] text-xs text-[#1A1340] dark:text-[#F0EEFF] p-3 rounded-xl focus:outline-hidden focus:border-[#6C47FF]"
                />
                <button 
                  onClick={() => setShowApiKey(!showApiKey)} 
                  id="yt-eye-btn"
                  type="button"
                  className="p-3 bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] rounded-xl cursor-pointer text-xs"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>

              <div id="yt-key-status" className="text-xs min-h-[18px] font-bold">
                {ytKeyStatus === 'saved' && (
                  <span className="text-purple-600 dark:text-[#FF8FB5]">✓ Key saved — live search enabled</span>
                )}
                {ytKeyStatus === 'valid' && (
                  <span className="text-green-500">✓ Connected — YouTube API is working</span>
                )}
                {ytKeyStatus === 'invalid' && (
                  <span className="text-red-500">✗ Invalid key — check and try again</span>
                )}
                {ytKeyStatus === 'empty' && (
                  <span className="text-[#6B6B8A] dark:text-[#9B97C4]">No key saved — using demo videos</span>
                )}
              </div>

              <div className="flex gap-2.5">
                <button 
                  onClick={saveYouTubeAPIKey} 
                  type="button"
                  className="flex-1 p-2.5 bg-[#6C47FF] hover:bg-[#5035CC] text-white rounded-xl transition-all text-xs font-bold cursor-pointer"
                >
                  💾 Save Key
                </button>
                <button 
                  onClick={testYouTubeAPIKey} 
                  id="yt-test-btn"
                  type="button"
                  disabled={apiTesting}
                  className="flex-1 p-2.5 bg-transparent text-[#6C47FF] dark:text-[#FF8FB5] border border-[#6C47FF] dark:border-[#FF8FB5] hover:bg-[#F4F2FF] dark:hover:bg-[#24203A] rounded-xl transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {apiTesting ? '⏳ Testing...' : '🔌 Test Connection'}
                </button>
                <button 
                  onClick={clearYouTubeAPIKey}
                  type="button"
                  className="p-2.5 bg-transparent text-red-500 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all text-xs cursor-pointer"
                  title="Clear Key"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 6: Data Actions Export/Reset */}
        <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 rounded-[20px] overflow-hidden shadow-xs">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'data' ? null : 'data')}
            className="w-full text-left p-4 font-extrabold text-[#1A1340] dark:text-[#F0EEFF] text-sm tracking-tight hover:bg-gray-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between cursor-pointer"
            id="accordion-data-btn"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-red-500" /> 6. Data Management & Profile Eradication
            </span>
            <span>{activeAccordion === 'data' ? '▲' : '▼'}</span>
          </button>

          {activeAccordion === 'data' && (
            <div className="p-5 border-t border-gray-100 dark:border-[#2A2545]/30 flex flex-col gap-4 animate-slide-in">
              <p className="text-xs text-[#6B6B8A] leading-relaxed">
                Export all weight logs, streaking milestones, and workout planners directly or clear local cached files instantly.
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={onExportData}
                  id="profile-export"
                  className="bg-gray-100 hover:bg-[#EDE9FF]/55 text-[#1A1340] dark:bg-slate-800 dark:text-hover dark:text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors btn-active cursor-pointer border shadow-sm"
                >
                  <Download className="w-4 h-4" /> Export account JSON
                </button>
              </div>

              <div className="border-t border-[#E4E2F0] dark:border-[#2A2545]/30 pt-4 flex flex-col gap-3">
                <div className="bg-red-50 dark:bg-red-950/15 border border-red-200/40 p-3.5 rounded-xl flex gap-2 text-red-700">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-red-600 font-semibold leading-relaxed">
                    <strong>Critical Reset Zone:</strong> To completely wipe local databases, please write the keyword <span className="underline font-black bg-red-100 text-red-700 dark:text-red-300 dark:bg-red-950/40 px-1 rounded-sm">RESET</span> inside the form field below to confirm profiles eradication.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Type RESET"
                    value={resetInput}
                    onChange={(e) => setResetInput(e.target.value)}
                    className="flex-1 bg-red-50/45 dark:bg-[#1A1630] border border-red-200 p-2 text-xs rounded-xl focus:outline-hidden"
                    id="reset-confirmation-input"
                  />
                  <button
                    onClick={handleResetActionSubmit}
                    id="profile-wipe-all"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all inline-block hover:shadow-md btn-active cursor-pointer"
                  >
                    Confirm Wipe Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
