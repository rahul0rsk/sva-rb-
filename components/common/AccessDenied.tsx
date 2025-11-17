import React from 'react';
import { LockIcon } from './icons';

export const AccessDenied: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-900">
            <div className="w-24 h-24 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                <LockIcon className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
                You do not have the necessary permissions to view this page.
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                Please contact your administrator if you believe this is an error.
            </p>
        </div>
    );
};
