/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Check, Award, Flame, Play, Clock, FileText } from 'lucide-react';
import { Workout } from '../types';
import { FOCUS_TAGS } from '../data';

interface WorkoutModalProps {
  workout: Workout;
  onClose: () => void;
  onComplete: (id: string, notes: string) => void;
}

export default function WorkoutModal({ workout, onClose, onComplete }: WorkoutModalProps) {
  const [notes, setNotes] = useState(workout.notes || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const tag = FOCUS_TAGS[workout.focus_tag] || FOCUS_TAGS.full_body;

  return (
    <div id="workout-detail-modal" className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#0A0528]/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1A1630] border border-[#E4E2F0]/25 dark:border-[#2A2545]/25 max-w-2xl w-full rounded-[24px] shadow-2xl relative overflow-hidden animate-scale-up max-h-[92vh] flex flex-col">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E2F0]/50 dark:border-[#2A2545]/50 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
              style={{ backgroundColor: tag.color }}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </span>
            {workout.is_completed && (
              <span className="bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Checked Complete
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            id="close-workout-detail"
            className="text-[#6B6B8A] dark:text-[#9B97C4] hover:text-[#1A1340] dark:hover:text-[#F0EEFF] transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#24203A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content inside */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1 flex flex-col gap-5">
          {/* Main Title Block */}
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-[#1A1340] dark:text-[#F0EEFF] tracking-tight mb-2 leading-snug">
              {workout.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B8A] dark:text-[#9B97C4] font-medium">
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" /> {workout.channel_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#6C47FF]" /> {workout.duration_label}
              </span>
              <span>•</span>
              <span className="bg-purple-100 dark:bg-[#24203A] text-[#6C47FF] dark:text-[#A994FF] px-2 py-0.5 rounded-md font-bold font-mono">+50 XP</span>
            </div>
          </div>

          {/* YouTube IFrame Embed Player Area */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner relative group border border-gray-100 dark:border-[#2A2545]/50">
            {!isPlaying ? (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center flex items-center justify-center cursor-pointer"
                style={{ backgroundImage: `url(${workout.thumbnail_url})` }}
                onClick={() => setIsPlaying(true)}
                id="play-workout-video-preview"
              >
                {/* Backdrop overlay */}
                <div className="absolute inset-0 bg-[#0A0528]/30 transition-opacity group-hover:bg-[#0A0528]/45" />
                <button className="relative w-16 h-16 rounded-full bg-white text-[#6C47FF] flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110 group-hover:bg-[#FF6B9D] group-hover:text-white">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </button>
              </div>
            ) : (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${workout.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                title={workout.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                id="workout-iframe-player"
              />
            )}
          </div>

          {/* Notes Input Area */}
          <div className="bg-[#F5F3FF] dark:bg-[#1E1A40]/55 p-4 rounded-xl border border-[#D4CBFF]/30 dark:border-[#2A2050]/40">
            <label className="text-xs font-bold text-[#6C47FF] dark:text-[#A994FF] uppercase tracking-wider mb-2 flex items-center gap-1.5 shadow-xs">
              <FileText className="w-4 h-4" /> Personal Notes & Targets
            </label>
            <textarea
              className="w-full h-20 bg-white dark:bg-[#1A1630] border border-[#E4E2F0] dark:border-[#2A2545] text-sm text-[#1A1340] dark:text-[#F0EEFF] p-3 rounded-lg focus:outline-hidden focus:border-[#6C47FF] resize-none transition-all placeholder:text-[#A0A0B8]"
              placeholder="Track sets, weight values, target repetitions, or how you felt..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="workout-notes-input"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-[#E4E2F0]/50 dark:border-[#2A2545]/50 shrink-0 bg-gray-50/70 dark:bg-[#191535]/15 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-[#24203A] text-[#1A1340] dark:text-[#F0EEFF] text-sm font-semibold rounded-xl transition-colors btn-active"
            id="close-workout-dialog-button"
          >
            Go Back
          </button>

          {!workout.is_completed ? (
            <button
              onClick={() => onComplete(workout.id, notes)}
              id="mark-workout-done-button"
              className="bg-[#6C47FF] hover:bg-[#5035CC] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#6C47FF]/25 hover:shadow-xl transition-all btn-active"
            >
              <Check className="w-4 h-4" /> Save & Mark Done (+50 XP)
            </button>
          ) : (
            <button
              onClick={() => onComplete(workout.id, notes)}
              id="save-workout-metadata-button"
              className="bg-[#FF6B9D] hover:bg-[#E8527F] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-[#FF6B9D]/25 transition-all btn-active"
            >
              Update Workout Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
