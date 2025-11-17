import React from 'react';
import type { Notification } from '../types';
import { NotificationToast } from './NotificationToast';

interface NotificationContainerProps {
    notifications: Notification[];
    onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onClose }) => {
    return (
        <div aria-live="polite" aria-atomic="true" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {notifications.map(notification => (
                    <NotificationToast 
                        key={notification.id}
                        notification={notification}
                        onClose={onClose}
                    />
                ))}
            </div>
        </div>
    );
};
