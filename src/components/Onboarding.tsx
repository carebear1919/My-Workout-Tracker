/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Heart, Flame, Shield, Activity, User, Scale, Calendar, Check } from 'lucide-react';
import { FitUser, GoalType, UnitType } from '../types';
import { FOCUS_TAGS } from '../data';

interface OnboardingProps {
  onComplete: (user: Partial<FitUser>, selectedTags: string[]) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('Alex');
  const [goal, setGoal] = useState<GoalType>('weight_loss');
  const [units, setUnits] = useState<UnitType>('metric');
  const [height, setHeight] = useState<number>(172); // cm or inches
  const [weight, setWeight] = useState<number>(75); // kg or lbs
  const [targetWeight, setTargetWeight] = useState<number>(66); // kg or lbs
  const [age, setAge] = useState<number>(27);
  const [gender, setGender] = useState<string>('Not Specified');
  const [workoutDays, setWorkoutDays] = useState<number>(5);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [selectedMuscleTags, setSelectedMuscleTags] = useState<string[]>(['upper_body', 'core', 'cardio']);

  // Calculated Live BMI
  const [bmi, setBmi] = useState<number>(0);
  const [bmiLabel, setBmiLabel] = useState<string>('');
  const [bmiColor, setBmiColor] = useState<string>('');

  useEffect(() => {
    // Calculate BMI
    let hCm = height;
    let wKg = weight;

    if (units === 'imperial') {
      // height is in inches, weight in lbs
      hCm = height * 2.54;
      wKg = weight / 2.20462;
    }

    if (hCm > 0 && wKg > 0) {
      const calcBmi = wKg / Math.pow(hCm / 100, 2);
      setBmi(Number(calcBmi.toFixed(1)));

      if (calcBmi < 18.5) {
        setBmiLabel('Underweight');
        setBmiColor('text-blue-500 bg-blue-50 ring-blue-500/10');
      } else if (calcBmi < 25) {
        setBmiLabel('Healthy');
        setBmiColor('text-green-500 bg-green-50 ring-green-500/10');
      } else if (calcBmi < 30) {
        setBmiLabel('Overweight');
        setBmiColor('text-amber-500 bg-amber-50 ring-amber-500/10');
      } else {
        setBmiLabel('Obese');
        setBmiColor('text-red-500 bg-red-50 ring-red-500/10');
      }
    } else {
      setBmi(0);
      setBmiLabel('');
    }
  }, [height, weight, units]);

  const toggleMuscleTag = (key: string) => {
    if (selectedMuscleTags.includes(key)) {
      setSelectedMuscleTags(selectedMuscleTags.filter(t => t !== key));
    } else {
      setSelectedMuscleTags([...selectedMuscleTags, key]);
    }
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      triggerSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const triggerSubmit = () => {
    setLoading(true);
    // Simulate natural AI computation load for 1.5 seconds
    setTimeout(() => {
      onComplete(
        {
          name,
          goal,
          units,
          height_cm: units === 'metric' ? height : Math.round(height * 2.54),
          weight_kg: units === 'metric' ? weight : Math.round(weight / 2.20462),
          target_weight_kg: units === 'metric' ? targetWeight : Math.round(targetWeight / 2.20462),
          age,
          gender,
          workout_days_per_week: workoutDays,
          preferred_time: preferredTime,
          theme: 'light',
          show_weekly_boss: true,
          xp: 165,
          level: 1,
          streak: 3,
          longest_streak: 7,
          last_workout_date: null
        },
        selectedMuscleTags
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div id="onboarding-flow-container" className="fixed inset-0 z-50 overflow-y-auto bg-[#ECEAF5] flex items-center justify-center p-4">
      {loading ? (
        <div className="bg-white rounded-[28px] max-w-sm w-full p-8 text-center shadow-2xl border border-white/50 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-t-4 border-b-4 border-brand border-[#6C47FF] animate-spin mb-6" />
          <h2 className="text-2xl font-black text-[#1A1340] tracking-tight mb-2">Generating Your Schedule...</h2>
          <p className="text-sm text-[#6B6B8A]">Assembling split plans, setting calibration milestones, and preparing quest logs.</p>
        </div>
      ) : (
        <div className="bg-white max-w-lg w-full rounded-[28px] p-6 md:p-8 shadow-2xl border border-[#E4E2F0]/50 relative flex flex-col gap-6 animate-scale-up">
          {/* Progress Indicator Head */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E4E2F0]">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#EDE9FF] text-[#6C47FF] flex items-center justify-center font-bold text-sm">
                {step}
              </span>
              <span className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">
                Step {step} of 4
              </span>
            </div>
            {/* Dots */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === i ? 'w-6 bg-[#6C47FF]' : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ================= STEP 1: GOAL SELECTION ================= */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1340] tracking-tight mb-1 flex items-center gap-1">
                  Welcome to FitQuest 👋
                </h2>
                <p className="text-sm text-[#6B6B8A]">
                  Select your primary training focus to adapt the weekly planner split automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'weight_loss',
                    title: 'Lose Weight',
                    desc: 'Prioritize fat oxidation and rapid energy expenditures.',
                    emoji: '🔥',
                  },
                  {
                    id: 'muscle_gain',
                    title: 'Build Muscle',
                    desc: 'Focus on progressive strength splits and structural loads.',
                    emoji: '💪',
                  },
                  {
                    id: 'endurance',
                    title: 'Improve Endurance',
                    desc: 'Enhance aerobic thresholds, cardiovascular power, and duration.',
                    emoji: '🏃',
                  },
                  {
                    id: 'maintenance',
                    title: 'Stay Active',
                    desc: 'Steady full-body recovery templates and active health maintenance.',
                    emoji: '🌿',
                  },
                ].map((g) => {
                  const isSelected = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id as GoalType)}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#6C47FF] bg-[#F5F3FF] shadow-md ring-2 ring-[#6C47FF]/15'
                          : 'border-[#E4E2F0] hover:border-[#6C47FF]/50 bg-white hover:bg-gray-50'
                      }`}
                      id={`goal-${g.id}`}
                    >
                      <div className="text-3xl mb-2.5">{g.emoji}</div>
                      <h4 className="font-extrabold text-[#1A1340] text-sm tracking-tight mb-0.5">{g.title}</h4>
                      <p className="text-[11px] text-[#6B6B8A] leading-relaxed">{g.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: BODY STATS ================= */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1340] tracking-tight mb-1 flex items-center gap-1.5">
                  <User className="w-6 h-6 text-[#6C47FF]" /> Your Body Stats
                </h2>
                <p className="text-sm text-[#6B6B8A]">
                  We calculate a live Body Mass Index (BMI) to guide calibrations.
                </p>
              </div>

              {/* Units Selector Switch Pill */}
              <div className="flex justify-center mb-1">
                <div className="bg-[#EDE9FF] p-1 rounded-full flex gap-1 border border-[#D4CBFF]/40">
                  <button
                    onClick={() => {
                      setUnits('metric');
                      // convert from imperial defaults
                      setHeight(172);
                      setWeight(75);
                      setTargetWeight(66);
                    }}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
                      units === 'metric' ? 'bg-[#6C47FF] text-white shadow-sm' : 'text-[#6C47FF]'
                    }`}
                    id="unit-metric"
                  >
                    Metric (cm/kg)
                  </button>
                  <button
                    onClick={() => {
                      setUnits('imperial');
                      // convert to imperial defaults
                      setHeight(68); // 5ft 8in
                      setWeight(160);
                      setTargetWeight(145);
                    }}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
                      units === 'imperial' ? 'bg-[#6C47FF] text-white shadow-sm' : 'text-[#6C47FF]'
                    }`}
                    id="unit-imperial"
                  >
                    Imperial (in/lbs)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden"
                    placeholder="Enter name"
                    required
                    id="input-name"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Age (yrs)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden"
                    required
                    id="input-age"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden cursor-pointer"
                    id="input-gender"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Not Specified">Prefer Not To Say</option>
                  </select>
                </div>

                {/* Height */}
                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">
                    Height {units === 'metric' ? '(cm)' : '(inches)'}
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden"
                    required
                    id="input-height"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">
                    Current Weight {units === 'metric' ? '(kg)' : '(lbs)'}
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden"
                    required
                    id="input-current-weight"
                  />
                </div>

                {/* Target Weight */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider mb-1.5 block">
                    Target Weight Goal {units === 'metric' ? '(kg)' : '(lbs)'}
                  </label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F4F2FF] border border-[#E4E2F0] text-sm text-[#1A1340] font-bold p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden"
                    required
                    id="input-target-weight"
                  />
                </div>
              </div>

              {/* BMI Live Alert indicator badge */}
              {bmi > 0 && (
                <div className={`p-3.5 rounded-xl flex items-center justify-between border ring-1 shrink-0 ${bmiColor}`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold uppercase tracking-wide">Dynamic BMI Rating</span>
                    <span className="text-[11px] font-medium leading-none opacity-80 mt-1">
                      Targeting {units === 'metric' ? `${targetWeight} kg` : `${targetWeight} lbs`}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-xl font-black">{bmi}</span>
                    <span className="text-xs font-extrabold border px-2 py-0.5 rounded-md border-inherit">
                      {bmiLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: SCHEDULE & PREFERENCE ================= */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1340] tracking-tight mb-1 flex items-center gap-1.5">
                  <Calendar className="w-6 h-6 text-[#6C47FF]" /> Schedule Settings
                </h2>
                <p className="text-sm text-[#6B6B8A]">
                  Define how active your schedule is. We will balance rest days.
                </p>
              </div>

              {/* Days count buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">
                  How many workout days per week?
                </label>
                <div className="flex items-center justify-between gap-1.5">
                  {[3, 4, 5, 6, 7].map((num) => {
                    const isSelected = num === workoutDays;
                    return (
                      <button
                        key={num}
                        onClick={() => setWorkoutDays(num)}
                        className={`flex-1 text-center py-2.5 rounded-xl font-bold font-mono text-sm border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6C47FF] text-white border-[#6C47FF] shadow-md shadow-[#6C47FF]/20'
                            : 'bg-[#F4F2FF] border-[#E4E2F0] text-[#6C47FF] hover:bg-white'
                        }`}
                        id={`days-${num}`}
                      >
                        {num}d
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#A0A0B8]">
                  {workoutDays === 3 && 'Perfect for simple active balance overall.'}
                  {workoutDays === 4 && 'Solid load distribution with 3 recovery periods.'}
                  {workoutDays === 5 && 'High consistency! Great performance template.'}
                  {workoutDays === 6 && 'Advanced athlete conditioning protocol.'}
                  {workoutDays === 7 && 'Max active training. Designed with mild cardio elements.'}
                </p>
              </div>

              {/* Workout hours selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#6B6B8A] uppercase tracking-wider">
                  Preferred workout time?
                </label>
                <div className="flex flex-col gap-2.5">
                  {[
                    { key: 'morning', title: '🌅 Morning Run', desc: 'Slayers who rise with the sun (5 AM - 11 AM).' },
                    { key: 'afternoon', title: '☀️ Afternoon Power', desc: 'Noon dynamic breaks & post-lunch pushes (12 PM - 5 PM).' },
                    { key: 'evening', title: '🌙 Night Beast', desc: 'Wind down by burning off daily stress (6 PM - 10 PM).' },
                  ].map((t) => {
                    const isSelected = preferredTime === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setPreferredTime(t.key as 'morning' | 'afternoon' | 'evening')}
                        className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#6C47FF] bg-[#F5F3FF] ring-2 ring-[#6C47FF]/15'
                            : 'border-[#E4E2F0] bg-white hover:bg-gray-50'
                        }`}
                        id={`pref-${t.key}`}
                      >
                        <div>
                          <h4 className="font-extrabold text-[#1A1340] text-sm tracking-tight">{t.title}</h4>
                          <p className="text-[11px] text-[#6B6B8A] mt-0.5">{t.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#6C47FF] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FOCUS AREAS ================= */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#1A1340] tracking-tight mb-1 flex items-center gap-1.5">
                  <Activity className="w-6 h-6 text-[#6C47FF]" /> Focus Target Muscle Groups
                </h2>
                <p className="text-sm text-[#6B6B8A]">
                  Select the target areas you wish to prioritize outside of rest. Click to select/deselect.
                </p>
              </div>

              {/* Muscle chip tags grid wrap */}
              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                {Object.keys(FOCUS_TAGS)
                  .filter((key) => key !== 'rest' && key !== 'active_recovery')
                  .map((key) => {
                    const item = FOCUS_TAGS[key];
                    const isSelected = selectedMuscleTags.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleMuscleTag(key)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6C47FF] text-white border-[#6C47FF] shadow-xs'
                            : 'bg-white border-[#E4E2F0] text-[#1A1340] hover:border-[#6C47FF]'
                        }`}
                        id={`muscle-${key}`}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>

              <div className="bg-[#FFE4EF] p-4 rounded-xl border border-[#FF6B9D]/20 text-[#1A1340] flex items-start gap-3">
                <span className="text-2xl shrink-0">✨</span>
                <p className="text-xs font-semibold leading-relaxed text-[#6B6B8A]">
                  <strong className="text-[#FF6B9D]">Planner Customization:</strong> We will structure the split to cycle these groups, with customized workouts matched to each day index automatically!
                </p>
              </div>
            </div>
          )}

          {/* ================= NAVIGATION FOOTER ACTIONS ================= */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E4E2F0]">
            <button
              onClick={prevStep}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-[#6B6B8A] hover:bg-gray-100 hover:text-[#1A1340]'
              }`}
              id="back-onboarding-btn"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>

            <button
              onClick={nextStep}
              className="bg-[#6C47FF] hover:bg-[#5035CC] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-[#6C47FF]/20 transition-all transform hover:translate-x-0.5 btn-active"
              id="next-onboarding-btn"
            >
              {step === 4 ? 'Build My Profile!' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
