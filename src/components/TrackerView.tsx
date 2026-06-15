/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Scale, Ruler, TrendingDown, ArrowUpRight, ArrowDownRight, Award, Plus, Calendar, AlertCircle } from 'lucide-react';
import { FitUser, WeightLog } from '../types';

interface TrackerViewProps {
  user: FitUser;
  weightLogs: WeightLog[];
  onLogWeight: (weight: number, waist: number | null, hips: number | null, arms: number | null) => void;
  onToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'xp' | 'badge') => void;
}

export default function TrackerView({ user, weightLogs, onLogWeight, onToast }: TrackerViewProps) {
  const [logWeight, setLogWeight] = useState(user.weight_kg.toString());
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');

  // Graph timeframe state
  const [timeframe, setTimeframe] = useState<'30' | '90' | 'all'>('30');

  // BMI calculations
  const bmiValue = useMemo(() => {
    let ht = user.height_cm;
    let wt = user.weight_kg;
    if (wt <= 0 || ht <= 0) return 0;
    const computed = wt / Math.pow(ht / 100, 2);
    return Number(computed.toFixed(1));
  }, [user]);

  const bmiMeta = useMemo(() => {
    if (bmiValue <= 0) return { label: 'Unknown', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    if (bmiValue < 18.5) return { label: 'Underweight', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 border-blue-200/50' };
    if (bmiValue < 25) return { label: 'Healthy', color: 'bg-green-50 dark:bg-green-950/30 text-green-500 border-green-200/50' };
    if (bmiValue < 30) return { label: 'Overweight', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-200/50' };
    return { label: 'Obese', color: 'bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200/50' };
  }, [bmiValue]);

  // Sort logs by date ascending for chart rendering
  const sortedLogs = useMemo(() => {
    return [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightLogs]);

  // Adjust line logs mapping based on selected timeframe
  const filteredLogsForGraph = useMemo(() => {
    if (timeframe === 'all') return sortedLogs;
    const limitDays = timeframe === '30' ? 30 : 90;
    const cutoffTime = Date.now() - limitDays * 24 * 60 * 60 * 1000;
    return sortedLogs.filter((log) => new Date(log.date).getTime() >= cutoffTime);
  }, [sortedLogs, timeframe]);

  // Multi-unit conversions for visual displays
  const formatWeightVal = (kg: number) => {
    if (user.units === 'imperial') {
      return `${Math.round(kg * 2.20462)} lbs`;
    }
    return `${kg} kg`;
  };

  const formatHeightVal = (cm: number) => {
    if (user.units === 'imperial') {
      const inchesTotal = Math.round(cm / 2.54);
      const ft = Math.floor(inchesTotal / 12);
      const inches = inchesTotal % 12;
      return `${ft}' ${inches}"`;
    }
    return `${cm} cm`;
  };

  const formatMeasureVal = (cm: number | null) => {
    if (!cm) return '—';
    if (user.units === 'imperial') {
      return `${(cm / 2.54).toFixed(1)} in`;
    }
    return `${cm} cm`;
  };

  // Log weight dispatcher action
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(logWeight);
    if (isNaN(wt) || wt <= 0) {
      onToast('Invalid Entry', 'Weight logged value must be a positive number.', 'warning');
      return;
    }

    const ws = waist === '' ? null : parseFloat(waist);
    const hp = hips === '' ? null : parseFloat(hips);
    const ar = arms === '' ? null : parseFloat(arms);

    // If imperial, convert inputs to metric in database store
    let weightKgToSave = wt;
    if (user.units === 'imperial') {
      weightKgToSave = wt / 2.20462;
    }

    let waistCm = ws;
    let hipsCm = hp;
    let armsCm = ar;

    if (user.units === 'imperial') {
      if (ws) waistCm = ws * 2.54;
      if (hp) hipsCm = hp * 2.54;
      if (ar) armsCm = ar * 2.54;
    }

    onLogWeight(weightKgToSave, waistCm, hipsCm, armsCm);
    onToast('Target recorded', `Logged weight entry of ${wt} ${user.units === 'metric' ? 'kg' : 'lbs'}!`, 'success');

    // Reset optional panels
    setShowMeasurements(false);
    setWaist('');
    setHips('');
    setArms('');
  };

  // Create SVG points coordinates dynamically for the Trend line chart!
  // Graph height fixed to 180, width to 440
  const chartWidth = 460;
  const chartHeight = 180;
  const padding = 25;

  const chartPoints = useMemo(() => {
    if (filteredLogsForGraph.length < 2) return null;

    const weights = filteredLogsForGraph.map((l) => l.weight_kg);
    const minWeight = Math.min(...weights, user.target_weight_kg) - 1.5;
    const maxWeight = Math.max(...weights, user.target_weight_kg) + 1.5;
    const weightRange = maxWeight - minWeight;

    const points = filteredLogsForGraph.map((log, index) => {
      const x = padding + (index / (filteredLogsForGraph.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - ((log.weight_kg - minWeight) / weightRange) * (chartHeight - padding * 2);
      return { x, y, weight: log.weight_kg, date: log.date };
    });

    // Create spline or line path path
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Area fill path back-anchor
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

    // Calculate Y target weight line anchor height
    const targetY = chartHeight - padding - ((user.target_weight_kg - minWeight) / weightRange) * (chartHeight - padding * 2);

    return { points, linePath, areaPath, targetY, minWeight, maxWeight };
  }, [filteredLogsForGraph, user.target_weight_kg]);

  // Determine delta difference change compared to earlier log entry
  const displayLogsList = useMemo(() => {
    return sortedLogs.slice().reverse().map((log, idx, arr) => {
      let diff = 0;
      const earlierLog = arr[idx + 1];
      if (earlierLog) {
        diff = log.weight_kg - earlierLog.weight_kg;
      }
      return {
        ...log,
        diff,
      };
    });
  }, [sortedLogs]);

  const targetDiffKg = user.weight_kg - user.target_weight_kg;
  const weightProgressPct = Math.min(100, Math.max(0, (1 - (targetDiffKg < 0 ? -targetDiffKg : targetDiffKg) / user.weight_kg) * 100));

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in pb-16 relative max-w-[1650px] mx-auto">
      
      {/* ================= LEFT CONTROLLER BAR ================= */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-5">
        
        {/* Statistics Hero Overview White Card */}
        <div className="bg-[#6C47FF] text-white rounded-[24px] p-5 shadow-lg flex flex-col gap-4 relative overflow-hidden" id="tracker-stats-panel">
          <div className="absolute top-1 right-1 text-white/5 font-bold font-mono text-7xl select-none z-10 pointer-events-none">
            STATS
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/75">Metric Calibration</span>
            <h3 className="text-lg font-black mt-0.5">Physical Standing</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-4 font-mono z-20">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 tracking-wider">Height Measure</span>
              <span className="text-lg font-black text-white mt-1">{formatHeightVal(user.height_cm)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 tracking-wider">Weight Current</span>
              <span className="text-lg font-black text-[#FF8FB5] mt-1">{formatWeightVal(user.weight_kg)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 tracking-wider">Target Goal</span>
              <span className="text-lg font-black text-white mt-1">{formatWeightVal(user.target_weight_kg)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 tracking-wider">Body Rating</span>
              <span className="text-sm font-black text-white bg-white/20 px-2.5 py-1 rounded-md border border-white/15 inline-block text-center mt-1 outline-inset shadow-xs uppercase">
                {bmiMeta.label} ({bmiValue})
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 z-20">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span>Goal Milestones</span>
              <span>{Math.round(weightProgressPct)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/5">
              <div
                className="h-full bg-linear-to-r from-green-400 to-[#FF6B9D] rounded-full transition-all duration-800"
                style={{ width: `${weightProgressPct}%` }}
              />
            </div>
            <span className="text-[9px] font-semibold text-white/65 mt-1 block">
              {targetDiffKg > 0
                ? `${targetDiffKg.toFixed(1)} kg remaining to reach target goal`
                : 'Target weight goal fully reached! Congratulations.'
              }
            </span>
          </div>
        </div>

        {/* Log Weight stats Form Card */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="tracker-logform-card">
          <h4 className="text-sm font-extrabold text-[#1A1340] dark:text-[#F0EEFF] tracking-tight mb-3 flex items-center gap-1.5">
            <Scale className="w-5 h-5 text-[#6C47FF]" /> Log Day's Weight
          </h4>

          <form onSubmit={handleLogSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                required
                value={logWeight}
                onChange={(e) => setLogWeight(e.target.value)}
                className="w-full bg-[#F4F2FF] dark:bg-[#24203A] border border-[#E4E2F0] dark:border-[#2A2545] text-2xl font-black text-[#1A1340] dark:text-[#F0EEFF] p-3 rounded-xl focus:border-[#6C47FF] focus:outline-hidden pr-12 font-mono"
                placeholder="75.0"
                id="tracker-weight-input"
              />
              <span className="text-xs font-bold text-[#6B6B8A] absolute right-4 top-5 uppercase tracking-wide">
                {user.units === 'metric' ? 'kg' : 'lbs'}
              </span>
            </div>

            {/* Collapsible Additional physical properties */}
            <div className="border border-gray-100 dark:border-[#2A2545]/40 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-[#1E1A40]/10">
              <button
                type="button"
                onClick={() => setShowMeasurements(!showMeasurements)}
                className="w-full text-left p-3 text-xs font-bold text-[#6C47FF] dark:text-[#FF8FB5] hover:bg-[#EDE9FF]/30 flex items-center justify-between cursor-pointer"
                id="tracker-measurements-toggle"
              >
                <span>{showMeasurements ? '▼ Hide' : '▲ Show'} Body Measurements (Optional)</span>
                <Ruler className="w-3.5 h-3.5" />
              </button>

              {showMeasurements && (
                <div className="p-3 border-t border-gray-100 dark:border-[#2A2545]/35 grid grid-cols-3 gap-2.5 animate-slide-in">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider block mb-1">Waist</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder={user.units === 'metric' ? 'cm' : 'in'}
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-white dark:bg-[#1A1630] border text-xs text-[#1A1340] dark:text-[#F0EEFF] p-1.5 rounded-lg focus:outline-hidden"
                      id="input-measure-waist"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider block mb-1">Hips</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder={user.units === 'metric' ? 'cm' : 'in'}
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full bg-white dark:bg-[#1A1630] border text-xs text-[#1A1340] dark:text-[#F0EEFF] p-1.5 rounded-lg focus:outline-hidden"
                      id="input-measure-hips"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-wider block mb-1">Arms</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder={user.units === 'metric' ? 'cm' : 'in'}
                      value={arms}
                      onChange={(e) => setArms(e.target.value)}
                      className="w-full bg-white dark:bg-[#1A1630] border text-xs text-[#1A1340] dark:text-[#F0EEFF] p-1.5 rounded-lg focus:outline-hidden"
                      id="input-measure-arms"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              id="tracker-submit-form"
              className="w-full bg-[#6C47FF] hover:bg-[#5035CC] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C47FF]/15 btn-active cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Statistics Record
            </button>
          </form>
        </div>

      </div>

      {/* ================= RIGHT MAIN GRAPH AND HISTORY ROWS ================= */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Graph Card Section */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm flex flex-col justify-between min-h-[290px]" id="tracker-chart-box">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-3 border-b border-gray-100 dark:border-[#2A2545]/30">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6B8A] dark:text-[#9B97C4]">Stats Graph</span>
              <h3 className="text-base font-black text-[#1A1340] dark:text-[#F0EEFF]">Weight Trend Analysis</h3>
            </div>

            <div className="flex bg-[#F4F2FF] dark:bg-[#24203A] p-0.5 rounded-lg border">
              {[
                { timeframeKey: '30', label: '30d Limit' },
                { timeframeKey: '90', label: '90d Limit' },
                { timeframeKey: 'all', label: 'All logs' },
              ].map((btn) => (
                <button
                  key={btn.timeframeKey}
                  onClick={() => setTimeframe(btn.timeframeKey as any)}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition-all cursor-pointer ${
                    timeframe === btn.timeframeKey
                      ? 'bg-white dark:bg-[#1A1630] text-[#6C47FF] shadow-xs'
                      : 'text-[#6B6B8A]'
                  }`}
                  id={`timeframe-${btn.timeframeKey}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inline SVG Chart elements */}
          <div className="flex-1 min-h-[180px] my-4 relative flex items-center justify-center">
            {chartPoints ? (
              <svg className="w-full h-full" overflow="visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(108, 71, 255, 0.15)" />
                    <stop offset="100%" stopColor="rgba(108, 71, 255, 0)" />
                  </linearGradient>
                </defs>

                {/* Y-axis helper lines */}
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y = padding + ratio * (chartHeight - padding * 2);
                  return (
                    <line
                      key={ratio}
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="opacity-50"
                    />
                  );
                })}

                {/* TARGET WEIGHT GREEN DASHED LINE */}
                <line
                  x1={padding}
                  y1={chartPoints.targetY}
                  x2={chartWidth - padding}
                  y2={chartPoints.targetY}
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                />
                
                {/* TARGET LABEL TEXT */}
                <text
                  x={padding + 10}
                  y={chartPoints.targetY - 5}
                  fill="#22C55E"
                  fontSize="8px"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  TARGET: {formatWeightVal(user.target_weight_kg)}
                </text>

                {/* AREA FILL */}
                <path d={chartPoints.areaPath} fill="url(#areaGrad)" />

                {/* LINE PATH */}
                <path
                  d={chartPoints.linePath}
                  fill="none"
                  stroke="#6C47FF"
                  strokeWidth="3.5"
                  className="chart-draw-line"
                />

                {/* PLOTS DOT MATRIX BUTTONS */}
                {chartPoints.points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#6C47FF"
                      strokeWidth="2"
                      className="cursor-pointer group hover:scale-150 transition-all"
                    />
                    <title>{`${p.date}: ${formatWeightVal(p.weight)}`}</title>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-center text-xs text-[#6B6B8A] py-10">
                <AlertCircle className="w-8 h-8 text-[#A0A0B8] mx-auto mb-2" />
                <h4 className="font-bold">Insufficient Stats Data</h4>
                <p>Log today's weight values to start displaying analytics charts.</p>
              </div>
            )}
          </div>

          {/* Legend indicator footer info */}
          <div className="flex gap-4 items-center justify-center text-[10px] text-[#6B6B8A] dark:text-[#9B97C4] font-bold shrink-0">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[#6C47FF]" />
              <span>Weight Level Overtime</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-t border-dashed border-green-500" />
              <span>Target Weight Goal</span>
            </div>
          </div>
        </div>

        {/* Weight logs history past entries list tracker table */}
        <div className="bg-white dark:bg-[#1A1630] rounded-[24px] border border-[#E4E2F0]/60 dark:border-[#2A2545]/60 p-5 shadow-sm" id="tracker-history-table">
          <span className="text-[10px] font-bold text-[#6B6B8A] uppercase tracking-widest block mb-3.5">Past Weight Logs History</span>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1340] dark:text-[#F0EEFF] font-medium border-collapse" id="weight-history-table">
              <thead>
                <tr className="border-b border-[#E4E2F0]/60 dark:border-[#2A2545]/30 text-[#6B6B8A] uppercase tracking-wider text-[9px] font-extrabold bg-[#F4F2FF]/40 dark:bg-slate-800/20 py-1">
                  <th className="p-3">Logged Date</th>
                  <th className="p-3">Weight Level</th>
                  <th className="p-3">Measurement delta (cm)</th>
                  <th className="p-3 text-right">Progress Delta</th>
                </tr>
              </thead>
              <tbody>
                {displayLogsList.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 dark:border-[#2A2545]/20 hover:bg-gray-50/50 dark:hover:bg-[#24203A]/25 transition-colors">
                    <td className="p-3 font-semibold flex items-center gap-1.5 shrink-0 select-none">
                      <Calendar className="w-3.5 h-3.5 text-[#6C47FF]/70" />
                      <span>{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {formatWeightVal(log.weight_kg)}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#6B6B8A] dark:text-[#9B97C4]">
                      W: {formatMeasureVal(log.waist_cm)} | H: {formatMeasureVal(log.hips_cm)} | A: {formatMeasureVal(log.arms_cm)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {log.diff === 0 ? (
                        <span className="text-[#A0A0B8]">——</span>
                      ) : log.diff < 0 ? (
                        <span className="text-green-500 flex items-center justify-end gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {-log.diff.toFixed(1)} kg
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-end gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{log.diff.toFixed(1)} kg
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {displayLogsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#A0A0B8]">No past weights archived.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
