

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Notification } from '../types';
import { NotificationType } from '../types';
import { BellIcon, CheckSquareIcon, ClockIcon, RupeeIcon } from './common/icons';
import { timeSince } from '../utils';

interface NotificationBellProps {
    notifications: Notification[];
    onMarkAllAsRead: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
        case NotificationType.TaskDue:
            return <CheckSquareIcon className="w-5 h-5 text-yellow-600" />;
        case NotificationType.FollowUp:
            return <ClockIcon className="w-5 h-5 text-blue-600" />;
        case NotificationType.StatusChange:
            return <RupeeIcon className="w-5 h-5 text-green-600" />;
        case NotificationType.Info:
            return <BellIcon className="w-5 h-5 text-purple-600" />;
        default:
            return <BellIcon className="w-5 h-5 text-slate-500" />;
    }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAllAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            onMarkAllAsRead();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleToggle} 
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle notifications"
            >
                <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                     <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-800" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                    </div>
                    <ul className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <li key={notification.id} className={`px-3 py-2.5 flex items-start gap-3 transition-colors ${!notification.read ? 'bg-sky-50 dark:bg-sky-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-700 dark:text-slate-200">{notification.message}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeSince(notification.timestamp)}</p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                You're all caught up!
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};