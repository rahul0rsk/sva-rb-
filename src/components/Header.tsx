import React, { useState } from 'react';
import { PhoneIcon, SearchIcon, MenuIcon } from './common/icons';
import { NotificationBell } from './NotificationBell';
import type { User, Notification } from '../types';
import { Role } from '../types';
import { ShiftTracker } from './ShiftTracker';

interface HeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    notifications: Notification[];
    onMarkAllAsRead: () => void;
    currentUser: User;
    onGlobalSearch?: (query: string) => void;
    onToggleSidebar?: () => void;
    onOpenDialPad?: () => void;
    sessionStartTime: number | null;
    isOnBreak: boolean;
    breakStartTime: number | null;
    totalBreakDuration: number;
    onToggleBreak: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
    const { title, subtitle, children, notifications, onMarkAllAsRead, currentUser, onGlobalSearch, onToggleSidebar, onOpenDialPad, ...shiftTrackerProps } = props;
    const showDialPadButton = currentUser.role === Role.Admin || currentUser.role === Role.SubAdmin || currentUser.role === Role.TeamLead;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && onGlobalSearch) {
            onGlobalSearch(searchQuery.trim());
        }
    };
    
    return (
        <header className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
            <div className="flex items-center gap-4">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 -ml-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                )}
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
                    {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
                </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                  {onGlobalSearch && (
                      <form onSubmit={handleSearch} className="relative hidden md:block">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                              type="search"
                              placeholder="Search leads, tasks, docs..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 w-64 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                          />
                      </form>
                  )}
                  {showDialPadButton && onOpenDialPad && (
                      <button onClick={onOpenDialPad} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <PhoneIcon className="w-5 h-5 text-blue-500"/>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Dial Pad</span>
                      </button>
                  )}
                  {children}
                   <NotificationBell notifications={notifications} onMarkAllAsRead={onMarkAllAsRead} />
              </div>
              <ShiftTracker user={currentUser} {...shiftTrackerProps} />
            </div>
      </header>
    );
}