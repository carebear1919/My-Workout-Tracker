/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import DashboardView from './components/DashboardView';
import PlannerView from './components/PlannerView';
import TrackerView from './components/TrackerView';
import ProgressView from './components/ProgressView';
import ProfileView from './components/ProfileView';
import WorkoutModal from './components/WorkoutModal';
import ToastContainer from './components/ToastContainer';
import LevelUpCelebration from './components/LevelUpCelebration';

import { FitUser, WeeklyPlan, Workout, WeightLog, XPActivity, ToastMessage, GoalType } from './types';
import { FOCUS_TAGS, DEMO_WORKOUTS, generateSeedData, getOffsetDateString, getLevelInfo } from './data';

export default function App() {
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Core state synced to localStorage
  const [user, setUser] = useState<FitUser>({
    name: 'Athelete',
    goal: 'weight_loss',
    height_cm: 170,
    weight_kg: 70,
    target_weight_kg: 65,
    age: 25,
    gender: 'Not Specified',
    units: 'metric',
    theme: 'light',
    workout_days_per_week: 3,
    preferred_time: 'morning',
    show_weekly_boss: true,
    xp: 0,
    level: 1,
    streak: 0,
    longest_streak: 0,
    last_workout_date: null,
  });

  const [activePlan, setActivePlan] = useState<WeeklyPlan | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [xpActivities, setXpActivities] = useState<XPActivity[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);

  // Global UI controls
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedWorkoutForModal, setSelectedWorkoutForModal] = useState<Workout | null>(null);
  const [activeDayIdxForOpenedModal, setActiveDayIdxForOpenedModal] = useState<number | null>(null);
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState<boolean>(false);
  const [celebratedLevelNum, setCelebratedLevelNum] = useState<number>(1);
  const [celebratedTitleName, setCelebratedTitleName] = useState<string>('Rookie');

  // ================= MOUNT INITIALIZER & PERSISTENCE SYNC =================
  useEffect(() => {
    // Check if onboarded
    const onboardFlag = localStorage.getItem('fq_onboarded');
    if (onboardFlag === 'true') {
      setOnboarded(true);

      // Load User statistics
      const usrCached = localStorage.getItem('fq_user');
      if (usrCached) {
        const u = JSON.parse(usrCached);
        setUser(u);
        // Set document theme
        document.documentElement.setAttribute('data-theme', u.theme || 'light');
      }

      // Load Planner weekly layout
      const planCached = localStorage.getItem('fq_weeks');
      if (planCached) {
        setActivePlan(JSON.parse(planCached));
      }

      // Load weight history logs
      const logsCached = localStorage.getItem('fq_weight_log');
      if (logsCached) {
        setWeightLogs(JSON.parse(logsCached));
      }

      // Load activities feed list
      const actsCached = localStorage.getItem('fq_activities_xp');
      if (actsCached) {
        setXpActivities(JSON.parse(actsCached));
      }

      // Load unlocked badges milestones
      const badgesCached = localStorage.getItem('fq_badges');
      if (badgesCached) {
        setUnlockedBadgeIds(JSON.parse(badgesCached));
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // System toast trigger handler
  const addToast = (title: string, message: string, type: ToastMessage['type'], duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ================= ONBOARD SUCCESS DISPATCHER =================
  const handleOnboardComplete = (newUser: Partial<FitUser>, selectedMuscleTags: string[]) => {
    const fullUser: FitUser = {
      ...user,
      ...newUser,
      xp: 0, 
      level: 1,
      streak: 0,
      longest_streak: 0,
    };

    // Calculate dynamic calendar splitting based on goal preferences
    const plan = generateInitialPlannerSplit(fullUser.goal, fullUser.workout_days_per_week, selectedMuscleTags);

    // Dynamic Seed statistics logs history
    const seed = generateSeedData(fullUser.weight_kg);

    // Save ALL to state & localStorage
    setUser(fullUser);
    setActivePlan(plan);
    setWeightLogs(seed.weightLogs);
    setXpActivities(seed.xpLogs);
    setSelectedWorkoutForModal(null);
    setUnlockedBadgeIds([]);

    localStorage.setItem('fq_user', JSON.stringify(fullUser));
    localStorage.setItem('fq_weeks', JSON.stringify(plan));
    localStorage.setItem('fq_weight_log', JSON.stringify(seed.weightLogs));
    localStorage.setItem('fq_activities_xp', JSON.stringify(seed.xpLogs));
    localStorage.setItem('fq_badges', JSON.stringify([]));
    localStorage.setItem('fq_onboarded', 'true');

    // Sync HTML theme
    document.documentElement.setAttribute('data-theme', fullUser.theme);

    setOnboarded(true);
    setCurrentView('dashboard');
    addToast('FitQuest Profile Active!', 'Your training curriculum calibrator has been successfully established.', 'success');
  };

  // Generator math for planner splits
  const generateInitialPlannerSplit = (goal: GoalType, numDays: number, muscles: string[]): WeeklyPlan => {
    // Determine schedule split mappings:
    const daysArrObj = Array.from({ length: 7 }).map((_, idx) => {
      // Mon=0, Sun=6
      return {
        day_index: idx,
        focus_tag: 'rest',
        is_rest_day: true,
        workouts: [] as Workout[],
      };
    });

    // Populate active training tags based on days count
    const possibleMuscleKeys = muscles.length > 0 ? muscles : ['upper_body', 'legs', 'core'];
    let muscleIdx = 0;

    let trainingDaysIndices = [0, 2, 4]; // defaults for 3 days setup (Mon, Wed, Fri)
    if (numDays === 4) trainingDaysIndices = [0, 2, 4, 5]; // Mon, Wed, Fri, Sat
    else if (numDays === 5) trainingDaysIndices = [0, 1, 3, 4, 5]; // Mon, Tue, Thu, Fri, Sat
    else if (numDays === 6) trainingDaysIndices = [0, 1, 2, 3, 4, 5]; // Mon-Sat
    else if (numDays === 7) trainingDaysIndices = [0, 1, 2, 3, 4, 5, 6]; // All days

    trainingDaysIndices.forEach((dIdx) => {
      const activeMuscleKey = possibleMuscleKeys[muscleIdx % possibleMuscleKeys.length];
      muscleIdx++;

      // Match demo fallback workouts
      const matchedDemoVideo = DEMO_WORKOUTS.find(v => v.focus === activeMuscleKey) || DEMO_WORKOUTS[0];

      daysArrObj[dIdx] = {
        day_index: dIdx,
        focus_tag: activeMuscleKey,
        is_rest_day: false,
        workouts: [
          {
            id: `workout-init-${dIdx}-${Date.now()}`,
            youtube_video_id: matchedDemoVideo.id,
            title: matchedDemoVideo.title,
            thumbnail_url: `https://img.youtube.com/vi/${matchedDemoVideo.id}/mqdefault.jpg`,
            duration_label: matchedDemoVideo.duration,
            channel_name: matchedDemoVideo.channel,
            focus_tag: activeMuscleKey,
            notes: '',
            is_completed: false,
            completed_at: null,
          },
        ],
      };
    });

    return {
      id: `week_${new Date().getFullYear()}_W03`,
      week_start: getOffsetDateString(-((new Date().getDay() + 6) % 7)), // monday of current week
      days: daysArrObj,
      weekly_boss_defeated: false,
    };
  };

  // ================= GENERAL EXPERIENCE REWARDS MACHINE =================
  const awardXP = (amount: number, reason: string, updatedUserObject?: FitUser) => {
    const activeTargetUser = updatedUserObject || user;
    const nextTotalXp = activeTargetUser.xp + amount;

    // Determine target level threshold bounds
    const prevLevelInfo = getLevelInfo(activeTargetUser.xp);
    const nextLevelInfo = getLevelInfo(nextTotalXp);

    const isLevelUp = nextLevelInfo.level > prevLevelInfo.level;

    const freshUser: FitUser = {
      ...activeTargetUser,
      xp: nextTotalXp,
      level: nextLevelInfo.level,
    };

    setUser(freshUser);
    localStorage.setItem('fq_user', JSON.stringify(freshUser));

    // Append standard activities feed entries
    const freshXpActivity: XPActivity = {
      id: `xp-act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: reason,
      timestamp: new Date().toISOString(),
      xp: amount,
    };
    const updatedActs = [freshXpActivity, ...xpActivities];
    setXpActivities(updatedActs);
    localStorage.setItem('fq_activities_xp', JSON.stringify(updatedActs));

    // Trigger Slide-in XP Toasters
    addToast('Experience points Earned! ⚡', `${reason} (+${amount} XP)`, 'xp');

    if (isLevelUp) {
      setTimeout(() => {
        setCelebratedLevelNum(nextLevelInfo.level);
        setCelebratedTitleName(nextLevelInfo.name);
        setShowLevelUpCelebration(true);
      }, 700);
    }

    // Evaluate dynamic Badge locks and milestones!
    checkBadgesMilestones(freshUser, updatedActs);
  };

  // Evaluate dynamic badges conditions
  const checkBadgesMilestones = (activeUser: FitUser, activeActs: XPActivity[]) => {
    const freshUnlockedList = [...unlockedBadgeIds];
    const triggerUnlock = (badgeId: string, name: string, emoji: string) => {
      if (!freshUnlockedList.includes(badgeId)) {
        freshUnlockedList.push(badgeId);
        setUnlockedBadgeIds(freshUnlockedList);
        localStorage.setItem('fq_badges', JSON.stringify(freshUnlockedList));
        addToast(`Milestone Unlocked! ${emoji}`, `Awarded badge standing: "${name}"`, 'badge', 6000);
      }
    };

    // Rule 1: First Ever Workout
    if (activeActs.some(a => a.action.includes('Completed'))) {
      triggerUnlock('first_flame', 'First Flame', '🔥');
    }

    // Rule 2: 3-day Streak Active
    if (activeUser.streak >= 3) triggerUnlock('streak_3', 'On Fire', '🔥');
    // Rule 3: 7-day Streak Active
    if (activeUser.streak >= 7) triggerUnlock('streak_7', 'Week Streak', '🗓️');
    // Rule 4: 14-day Streak Active
    if (activeUser.streak >= 14) triggerUnlock('streak_14', 'Fortnight', '💫');
    // Rule 5: 30-day Streak Active
    if (activeUser.streak >= 30) triggerUnlock('streak_30', 'Monthly Master', '🏅');

    // Rule 6: Height/Weight logs reach target
    const currentLogsCount = weightLogs.length;
    if (currentLogsCount >= 7) triggerUnlock('weight_logger', 'Scale Watcher', '⚖️');

    // Rule 7: Target weight achieved safely
    if (activeUser.units === 'metric') {
      if (activeUser.weight_kg <= activeUser.target_weight_kg) triggerUnlock('on_target', 'On Target', '🎯');
    } else {
      // check in lbs
      const weightLbs = activeUser.weight_kg * 2.20462;
      const targetLbs = activeUser.target_weight_kg * 2.20462;
      if (weightLbs <= targetLbs) triggerUnlock('on_target', 'On Target', '🎯');
    }

    // Rule 8: Level milestones thresholds
    if (activeUser.level >= 5) triggerUnlock('level_5', 'Athlete', '🏃');
    if (activeUser.level >= 8) triggerUnlock('legend', 'Legend', '🏆');
  };

  // ================= DYNAMIC WORKOUT SELECTION MODAL HANDLERS =================
  const handleOpenWorkoutDetail = (workout: Workout) => {
    // Find what day index this workout is attached to
    if (!activePlan) return;
    let foundDayIdx = 0;
    activePlan.days.forEach((day) => {
      if (day.workouts.some((w) => w.id === workout.id)) {
        foundDayIdx = day.day_index;
      }
    });

    setActiveDayIdxForOpenedModal(foundDayIdx);
    setSelectedWorkoutForModal(workout);
  };

  const handleCompleteWorkout = (workoutId: string, notesText: string) => {
    if (!activePlan || activeDayIdxForOpenedModal === null) return;

    let curCompletedState = false;

    const updatedDays = activePlan.days.map((day) => {
      if (day.day_index === activeDayIdxForOpenedModal) {
        return {
          ...day,
          workouts: day.workouts.map((w) => {
            if (w.id === workoutId) {
              curCompletedState = w.is_completed;
              return {
                ...w,
                is_completed: true,
                notes: notesText,
                completed_at: new Date().toISOString(),
              };
            }
            return w;
          }),
        };
      }
      return day;
    });

    const refreshedWeeklyPlan = { ...activePlan, days: updatedDays };
    setActivePlan(refreshedWeeklyPlan);
    localStorage.setItem('fq_weeks', JSON.stringify(refreshedWeeklyPlan));

    // Close Modal View
    setSelectedWorkoutForModal(null);
    setActiveDayIdxForOpenedModal(null);

    // If it wasn't pre-completed, award reward levels!
    if (!curCompletedState) {
      // Calculate dynamic streak updates
      let freshStreak = user.streak;
      const lastWDate = user.last_workout_date;
      const todayStr = new Date().toISOString().split('T')[0];

      if (lastWDate !== todayStr) {
        if (lastWDate === getOffsetDateString(-1)) {
          // worked out yesterday, increment
          freshStreak = user.streak + 1;
        } else if (lastWDate === null || lastWDate < getOffsetDateString(-1)) {
          // gap, overwrite streak to 1
          freshStreak = 1;
        }
      }

      const freshUserObj: FitUser = {
        ...user,
        streak: freshStreak,
        longest_streak: Math.max(user.longest_streak, freshStreak),
        last_workout_date: todayStr,
      };

      // Call Experience increment
      awardXP(50, `💪 Completed daily exercise: "${workoutId.substring(0, 5)}..."`, freshUserObj);
    } else {
      addToast('Workout notes updated', 'Notes metadata saved to daily planner.', 'success');
    }
  };

  // ================= PLANNER ADD/REMOVE UTILITY DRIVER =================
  const handleAddWorkoutToPlanner = (dayIndex: number, newWorkout: Workout) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.day_index === dayIndex) {
        return {
          ...day,
          workouts: [...day.workouts, newWorkout],
          is_rest_day: false,
        };
      }
      return day;
    });

    const updated = { ...activePlan, days: updatedDays };
    setActivePlan(updated);
    localStorage.setItem('fq_weeks', JSON.stringify(updated));

    // Award minor experience points for active planner scheduling!
    awardXP(5, `📅 Scheduled exercise in planner schedule for ${daysLabelShort[dayIndex]}`);
  };

  const daysLabelShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleRemoveWorkoutFromPlanner = (dayIndex: number, workoutId: string) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.day_index === dayIndex) {
        return {
          ...day,
          workouts: day.workouts.filter((w) => w.id !== workoutId),
        };
      }
      return day;
    });

    const updated = { ...activePlan, days: updatedDays };
    setActivePlan(updated);
    localStorage.setItem('fq_weeks', JSON.stringify(updated));
    addToast('Workout Removed', 'Removed quest listing from daily calendar.', 'warning');
  };

  const handleToggleWorkoutDoneState = (dayIndex: number, workoutId: string) => {
    if (!activePlan) return;
    let completedMarked = false;

    const updatedDays = activePlan.days.map((day) => {
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

    const updated = { ...activePlan, days: updatedDays };
    setActivePlan(updated);
    localStorage.setItem('fq_weeks', JSON.stringify(updated));

    if (completedMarked) {
      awardXP(50, `✓ Verified Daily quota challenge`);
    } else {
      addToast('Status altered', 'Action marked pending.', 'warning');
    }
  };

  // Auto suggest splits re-dispatcher
  const handleSuggestSplitTrigger = () => {
    const freshPlan = generateInitialPlannerSplit(user.goal, user.workout_days_per_week, ['upper_body', 'core', 'cardio']);
    setActivePlan(freshPlan);
    localStorage.setItem('fq_weeks', JSON.stringify(freshPlan));
    addToast('Dynamic plan populated', 'Full weekly quota structured around target muscles!', 'success');
  };

  // ================= GENERAL BODY WEIGHT LOGGER ACTION =================
  const handleTrackWeightLog = (wt: number, waist: number | null, hips: number | null, arms: number | null) => {
    // Save to State logs history
    const inputDate = new Date().toISOString().split('T')[0];
    const newEntry: WeightLog = {
      id: `weight-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: inputDate,
      weight_kg: wt,
      waist_cm: waist,
      hips_cm: hips,
      arms_cm: arms,
    };

    const nextLogs = [newEntry, ...weightLogs];
    setWeightLogs(nextLogs);
    localStorage.setItem('fq_weight_log', JSON.stringify(nextLogs));

    // Update active user current mass
    const nextUser = { ...user, weight_kg: wt };
    setUser(nextUser);
    localStorage.setItem('fq_user', JSON.stringify(nextUser));

    // Award XP level rewards
    awardXP(10, `⚖️ Logged physical mass scale tracking metrics`, nextUser);
  };

  // Interface Settings modifications
  const handleUpdateUserSettings = (updatedUser: FitUser) => {
    setUser(updatedUser);
    localStorage.setItem('fq_user', JSON.stringify(updatedUser));
  };

  // Export JSON account data
  const handleExportAccountData = () => {
    const dataObj = {
      user,
      planner: activePlan,
      weightLogs,
      xpActivities,
      unlockedBadgeIds,
    };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitquest-account-${user.name || 'user'}.json`;
    link.click();
    addToast('Account parameters exported ✓', 'Personal dataset successfully saved to local directory.', 'success');
  };

  // Reset entire database structure
  const handleClearFitDatabase = () => {
    localStorage.clear();
    setOnboarded(false);
    setUser({
      name: 'Athlete',
      goal: 'weight_loss',
      height_cm: 170,
      weight_kg: 70,
      target_weight_kg: 65,
      age: 25,
      gender: 'Not Specified',
      units: 'metric',
      theme: 'light',
      workout_days_per_week: 3,
      preferred_time: 'morning',
      show_weekly_boss: true,
      xp: 0,
      level: 1,
      streak: 0,
      longest_streak: 0,
      last_workout_date: null,
    });
    setWeightLogs([]);
    setXpActivities([]);
    setActivePlan(null);
    setUnlockedBadgeIds([]);
    setCurrentView('dashboard');
    addToast('Account Eradicated', 'Local persistent cached variables purged successfully.', 'error');
  };

  const toggleThemeGlobal = () => {
    const nextTheme = user.theme === 'dark' ? 'light' : 'dark';
    const nextU = { ...user, theme: nextTheme };
    setUser(nextU);
    localStorage.setItem('fq_user', JSON.stringify(nextU));
    document.documentElement.setAttribute('data-theme', nextTheme);
    addToast('Theme settings modified', `Switched app into ${nextTheme} view.`, 'success');
  };

  return (
    <>
      <main className="text-sm">
        {/* Onboarding block if un-onboarded */}
        {!onboarded ? (
          <Onboarding onComplete={handleOnboardComplete} />
        ) : (
          <div className="flex bg-[#ECEAF5] dark:bg-[#0E0C1A] min-h-screen text-[#1A1340] dark:text-[#F0EEFF] transition-colors leading-relaxed">
            
            {/* Sidebar Navigation */}
            <Sidebar
              currentView={currentView}
              onNavigate={setCurrentView}
              user={user}
              onToggleTheme={toggleThemeGlobal}
              onResetAll={handleClearFitDatabase}
            />

            {/* Main scrollable content view stage */}
            <div className="flex-1 md:pl-[76px] transition-all min-h-screen">
              <div className="px-3 py-4 md:p-7 pb-24 md:pb-7 max-w-[1650px] mx-auto w-full">
                
                {/* Dashboard View rendering */}
                {currentView === 'dashboard' && (
                  <DashboardView
                    user={user}
                    activePlan={activePlan}
                    onOpenWorkout={handleOpenWorkoutDetail}
                    onNavigate={setCurrentView}
                    onQuickLogWeight={(wt) => handleTrackWeightLog(wt, null, null, null)}
                    xpActivities={xpActivities}
                  />
                )}

                {/* Planner View rendering */}
                {currentView === 'planner' && (
                  <PlannerView
                    user={user}
                    activePlan={activePlan}
                    onUpdatePlan={setActivePlan}
                    onOpenWorkout={handleOpenWorkoutDetail}
                    onAddCustomWorkout={handleAddWorkoutToPlanner}
                    onRemoveWorkout={handleRemoveWorkoutFromPlanner}
                    onToggleWorkoutDone={handleToggleWorkoutDoneState}
                    onSuggestSplit={handleSuggestSplitTrigger}
                    onToast={addToast}
                  />
                )}

                {/* Tracker View rendering */}
                {currentView === 'tracker' && (
                  <TrackerView
                    user={user}
                    weightLogs={weightLogs}
                    onLogWeight={handleTrackWeightLog}
                    onToast={addToast}
                  />
                )}

                {/* Progress rendering */}
                {currentView === 'progress' && (
                  <ProgressView
                    user={user}
                    activePlan={activePlan}
                    weightLogs={weightLogs}
                    xpActivities={xpActivities}
                    unlockedBadgeIds={unlockedBadgeIds}
                  />
                )}

                {/* Settings Profile rendering */}
                {currentView === 'profile' && (
                  <ProfileView
                    user={user}
                    onUpdateUser={handleUpdateUserSettings}
                    onExportData={handleExportAccountData}
                    onResetData={handleClearFitDatabase}
                    onToast={addToast}
                  />
                )}

              </div>
            </div>

            {/* Workout Youtube Player Details IFrame Modal POPUP */}
            {selectedWorkoutForModal && (
              <WorkoutModal
                workout={selectedWorkoutForModal}
                onClose={() => {
                  setSelectedWorkoutForModal(null);
                  setActiveDayIdxForOpenedModal(null);
                }}
                onComplete={handleCompleteWorkout}
              />
            )}

            {/* LEVEL UP CELEBRATION MODAL BANNER */}
            {showLevelUpCelebration && (
              <LevelUpCelebration
                level={celebratedLevelNum}
                levelName={celebratedTitleName}
                onClose={() => setShowLevelUpCelebration(false)}
              />
            )}

            {/* FLOATING ACTION TOAST NOTIFICATIONS DRAWER CABINET */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

          </div>
        )}
      </main>
    </>
  );
}
