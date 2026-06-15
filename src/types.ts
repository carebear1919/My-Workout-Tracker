/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GoalType = 'weight_loss' | 'muscle_gain' | 'endurance' | 'maintenance';

export type UnitType = 'metric' | 'imperial';

export interface FocusTag {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

export interface Workout {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  duration_label: string;
  channel_name: string;
  focus_tag: string;
  notes: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface DayPlan {
  day_index: number; // 0=Mon, 6=Sun
  focus_tag: string;
  is_rest_day: boolean;
  workouts: Workout[];
}

export interface WeeklyPlan {
  id: string; // e.g. "week_2025_W03"
  week_start: string; // Monday ISO date string (YYYY-MM-DD)
  days: DayPlan[];
  weekly_boss_defeated: boolean;
}

export interface FitUser {
  name: string;
  goal: GoalType;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  age: number;
  gender: string;
  units: UnitType;
  theme: 'light' | 'dark';
  workout_days_per_week: number;
  preferred_time: 'morning' | 'afternoon' | 'evening';
  show_weekly_boss: boolean;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_workout_date: string | null; // ISO date string or YYYY-MM-DD
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
  waist_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggerDescription: string;
}

export interface XPActivity {
  id: string;
  action: string;
  timestamp: string; // ISO string
  xp: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'xp' | 'badge' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}
