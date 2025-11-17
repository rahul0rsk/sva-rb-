import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { formatShiftTime, formatDurationHMS } from '../utils';
import { ClockIcon, CoffeeIcon, CalendarIcon } from './common/icons';

interface ShiftTrackerProps {
  user: User;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
}

export const ShiftTracker: React.FC<ShiftTrackerProps> = ({ user, sessionStartTime, isOnBreak, breakStartTime, totalBreakDuration, onToggleBreak }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  const sessionDuration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
  const currentBreakDuration = (isOnBreak && breakStartTime) ? Math.floor((Date.now() - breakStartTime) / 1000) : 0;

  const shiftStart = user.shiftStartTime ? formatShiftTime(user.shiftStartTime) : 'N/A';
  const shiftEnd = user.shiftEndTime ? formatShiftTime(user.shiftEndTime) : 'N/A';

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <div>
          <p className="text-slate-500 dark:text-slate-400">Shift</p>
          <p className="font-mono font-semibold text-slate-700 dark:text-slate-200">{shiftStart} - {shiftEnd}</p>
        </div>
      </div>
      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
      <div className="flex items-center gap-2 text-sm">
        <ClockIcon className="w-5 h-5 text-slate-500" />
        <div>
          <p className="text-slate-500 dark:text-slate-400">Logged In</p>
          <p className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatDurationHMS(sessionDuration)}</p>
        </div>
      </div>
      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
      <div className="flex items-center gap-2 text-sm">
        <CoffeeIcon className={`w-5 h-5 ${isOnBreak ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`} />
        <div>
          <p className="text-slate-500 dark:text-slate-400">Total Break</p>
          <p className={`font-mono font-semibold ${isOnBreak ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>{formatDurationHMS(totalBreakDuration + currentBreakDuration)}</p>
        </div>
      </div>
      <button 
        onClick={onToggleBreak}
        className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
          isOnBreak 
          ? 'bg-amber-500 text-white hover:bg-amber-600' 
          : 'bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
        }`}
      >
        {isOnBreak ? 'End Break' : 'Start Break'}
      </button>
    </div>
  );
};