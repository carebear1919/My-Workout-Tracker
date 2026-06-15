/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FocusTag, Workout, Badge, WeightLog, XPActivity } from './types';

export const FOCUS_TAGS: Record<string, FocusTag> = {
  upper_body: { key: 'upper_body', label: 'Upper Body', emoji: '💪', color: '#6C47FF' },
  push: { key: 'push', label: 'Push', emoji: '🔼', color: '#8B5CF6' },
  pull: { key: 'pull', label: 'Pull', emoji: '🔽', color: '#5035CC' },
  legs: { key: 'legs', label: 'Legs', emoji: '🦵', color: '#FF6B9D' },
  glutes: { key: 'glutes', label: 'Glutes', emoji: '🍑', color: '#FF8FB5' },
  arms: { key: 'arms', label: 'Arms', emoji: '💪', color: '#A994FF' },
  core: { key: 'core', label: 'Core', emoji: '⬡', color: '#F59E0B' },
  cardio: { key: 'cardio', label: 'Cardio', emoji: '❤️', color: '#EF4444' },
  full_body: { key: 'full_body', label: 'Full Body', emoji: '⚡', color: '#6C47FF' },
  active_recovery: { key: 'active_recovery', label: 'Active Recovery', emoji: '🧘', color: '#22C55E' },
  rest: { key: 'rest', label: 'Rest Day', emoji: '😴', color: '#A0A0B8' },
};

export const DEMO_WORKOUTS = [
  { id: 'ml6cT4AZdqI', title: '30-Min Full Body HIIT', channel: 'FitnessBlender', duration: '33 min', focus: 'full_body' },
  { id: 'UBMk30rjy0o', title: '20-Min Leg Day Workout', channel: 'Heather Robertson', duration: '22 min', focus: 'legs' },
  { id: 'cbKkB3POqaY', title: 'Upper Body Strength', channel: 'FitnessBlender', duration: '35 min', focus: 'upper_body' },
  { id: 'IT94xC35u6k', title: 'Booty & Glutes Workout', channel: 'Chloe Ting', duration: '20 min', focus: 'glutes' },
  { id: 'gC_L9qAHVJ8', title: '10-Min Core Abs', channel: 'Heather Robertson', duration: '11 min', focus: 'core' },
  { id: 'Mvo2snJGhtM', title: 'Cardio Dance HIIT', channel: 'POPSUGAR Fitness', duration: '30 min', focus: 'cardio' },
  { id: 'vc1E5CfRfos', title: 'Push Day - Chest & Shoulders', channel: 'Jeremy Ethier', duration: '28 min', focus: 'push' },
  { id: '7Wkub5m7a_8', title: 'Active Recovery Yoga', channel: 'Yoga with Adriene', duration: '25 min', focus: 'active_recovery' }
];

export const ALL_BADGES: Badge[] = [
  { id: 'first_flame', name: 'First Flame', icon: '🔥', description: 'Complete your first workout ever to strike the fitness spark.', triggerDescription: 'Complete first workout' },
  { id: 'week_warrior', name: 'Week Warrior', icon: '🗡️', description: 'Achieve total dedication by finishing a full week of scheduled workouts.', triggerDescription: 'Complete a full week' },
  { id: 'planner_pro', name: 'Planner Pro', icon: '📅', description: 'Take control of your regime by scheduling workouts for all 7 days in the planner.', triggerDescription: 'Fill all 7 days in planner' },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Power through 3 workouts that are under 20 minutes.', triggerDescription: '3 workouts under 20 min' },
  { id: 'streak_3', name: 'On Fire', icon: '🔥', description: 'Maintain momentum with a consistent 3-day workout streak.', triggerDescription: '3-day streak' },
  { id: 'streak_7', name: 'Week Streak', icon: '🗓️', description: 'Awesome consistency! Log a workout 7 days in a row.', triggerDescription: '7-day streak' },
  { id: 'streak_14', name: 'Fortnight', icon: '💫', description: 'Two weeks of unshakeable fitness commitment.', triggerDescription: '14-day streak' },
  { id: 'streak_30', name: 'Monthly Master', icon: '🏅', description: 'Thirty consecutive days! You are are an absolute powerhouse.', triggerDescription: '30-day streak' },
  { id: 'weight_logger', name: 'Scale Watcher', icon: '⚖️', description: 'Build awareness by logging your weight 7 days in a row.', triggerDescription: 'Log weight 7 days straight' },
  { id: 'on_target', name: 'On Target', icon: '🎯', description: 'Celebrate reaching your weight or physical goals!', triggerDescription: 'Reach target weight' },
  { id: 'level_5', name: 'Athlete', icon: '🏃', description: 'Climb high by successfully achieving Level 5 standing.', triggerDescription: 'Reach level 5' },
  { id: 'legend', name: 'Legend', icon: '🏆', description: 'Cross into the halls of fitness fame by reaching Level 8.', triggerDescription: 'Reach level 8' },
  { id: 'boss_slayer', name: 'Boss Slayer', icon: '🐉', description: 'Defeat the colossal Weekly Boss by standardizing your workout quota.', triggerDescription: 'Defeat weekly boss' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Complete and record your workout before 8:00 AM.', triggerDescription: 'Workout logged before 8AM' },
  { id: 'comeback', name: 'Comeback Kid', icon: '💪', description: 'Return back to the grind and log a workout after being away for 7+ days.', triggerDescription: 'Return after 7+ days off' }
];

export const LEVELS = [
  { level: 1, name: 'Rookie', xp: 0 },
  { level: 2, name: 'Starter', xp: 200 },
  { level: 3, name: 'Consistent', xp: 500 },
  { level: 4, name: 'Dedicated', xp: 1000 },
  { level: 5, name: 'Athlete', xp: 2000 },
  { level: 6, name: 'Beast Mode', xp: 4000 },
  { level: 7, name: 'Elite', xp: 7500 },
  { level: 8, name: 'Legend', xp: 12000 }
];

export function getLevelInfo(xp: number) {
  let activeLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      activeLevel = LEVELS[i];
      break;
    }
  }
  const nextLevel = LEVELS.find(l => l.level === activeLevel.level + 1) || null;
  return {
    ...activeLevel,
    next: nextLevel
  };
}

// Generate YYYY-MM-DD helper
export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export function generateSeedData(currentWeightKg: number) {
  // Return clean, unseeded starting logs representing only the current baseline
  const logs: WeightLog[] = [
    {
      id: `initial-log-${Date.now()}`,
      date: getOffsetDateString(0),
      weight_kg: currentWeightKg,
      waist_cm: null,
      hips_cm: null,
      arms_cm: null
    }
  ];

  const xpLogs: XPActivity[] = [];

  return {
    weightLogs: logs,
    xpLogs
  };
}
