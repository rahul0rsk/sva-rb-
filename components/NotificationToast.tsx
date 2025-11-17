import React, { useEffect, useState } from 'react';
import type { Notification } from '../types';
import { NotificationType } from '../types';
import { BellIcon, CheckSquareIcon, ClockIcon, RupeeIcon, XIcon } from './common/icons';

interface NotificationToastProps {
    notification: Notification;
    onClose: (id: string) => void;
}

const getNotificationStyle = (type: NotificationType) => {
    switch(type) {
        case NotificationType.TaskDue:
            return { icon: <CheckSquareIcon className="w-6 h-6 text-amber-500" />, border: 'border-amber-500', progressBg: 'bg-amber-500' };
        case NotificationType.FollowUp:
            return { icon: <ClockIcon className="w-6 h-6 text-blue-500" />, border: 'border-blue-500', progressBg: 'bg-blue-500' };
        case NotificationType.StatusChange:
            return { icon: <RupeeIcon className="w-6 h-6 text-green-500" />, border: 'border-green-500', progressBg: 'bg-green-500' };
        case NotificationType.Info:
            return { icon: <BellIcon className="w-6 h-6 text-purple-500" />, border: 'border-purple-500', progressBg: 'bg-purple-500' };
        default:
            return { icon: <BellIcon className="w-6 h-6 text-slate-500" />, border: 'border-slate-500', progressBg: 'bg-slate-500' };
    }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification.id]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(notification.id);
        }, 300); // Allow time for exit animation
    };

    const { icon, border, progressBg } = getNotificationStyle(notification.type);

    return (
        <div 
            role="alert"
            aria-live="assertive"
            className={`
                max-w-sm w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black dark:ring-slate-700 ring-opacity-5 overflow-hidden
                transition-all duration-300 ease-in-out transform
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
                animate-toast-in
            `}
        >
            <style>{`
                @keyframes toast-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-toast-in {
                    animation: toast-in 0.3s ease-out;
                }
                @keyframes progress-bar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .progress-bar-animate {
                    animation: progress-bar 5s linear;
                }
            `}</style>
            <div className={`border-l-4 ${border}`}>
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            {icon}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {notification.message}
                            </p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="bg-white dark:bg-slate-800 rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                            >
                                <span className="sr-only">Close</span>
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
             {/* Progress Bar */}
            <div className="h-1 bg-slate-200 dark:bg-slate-700/50">
                <div 
                    className={`h-full ${progressBg} progress-bar-animate`} 
                ></div>
            </div>
        </div>
    );
};