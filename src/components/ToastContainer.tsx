/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Trophy, Sparkles, Heart, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div id="toast-container" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.slice(-4).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void; key?: string }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || (toast.type === 'badge' ? 6000 : 4000);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(left);
      if (left <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [toast, duration, onRemove]);

  const borderColors = {
    success: 'border-l-[6px] border-l-green-500',
    xp: 'border-l-[6px] border-l-[#6C47FF]',
    badge: 'border-l-[6px] border-l-[#FF6B9D] shadow-pink-md',
    warning: 'border-l-[6px] border-l-amber-500',
    error: 'border-l-[6px] border-l-red-500',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
    xp: <Sparkles className="w-5 h-5 text-[#6C47FF] shrink-0" />,
    badge: <Trophy className="w-5 h-5 text-[#FF6B9D] shrink-0 pulse-glow" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto bg-white dark:bg-[#1A1630] text-[#1A1340] dark:text-[#F0EEFF] rounded-xl shadow-lg ${borderColors[toast.type]} p-4 flex flex-col gap-2 relative transition-all duration-300 transform translate-x-0 animate-slide-in overflow-hidden border border-[#E4E2F0]/45 dark:border-[#2A2545]/45`}
      style={{
        boxShadow: toast.type === 'badge' ? '0 10px 30px rgba(255,107,157,0.25)' : 'var(--shadow-card)'
      }}
    >
      <div className="flex gap-3 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="mt-0.5">{icons[toast.type]}</div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">{toast.title}</h4>
            <p className="text-xs text-[#6B6B8A] dark:text-[#9B97C4] mt-0.5 whitespace-pre-line leading-relaxed">{toast.message}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-[#A0A0B8] hover:text-[#1A1340] dark:hover:text-[#F0EEFF] transition-colors p-1 rounded-lg"
          id={`close-toast-${toast.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-[#24203A] w-full">
        <div
          className={`h-full ${
            toast.type === 'success'
              ? 'bg-green-500'
              : toast.type === 'xp'
              ? 'bg-[#6C47FF]'
              : toast.type === 'badge'
              ? 'bg-[#FF6B9D]'
              : toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
        />
      </div>
    </div>
  );
}
