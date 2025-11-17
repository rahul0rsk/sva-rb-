import React, { useState } from 'react';
import { View } from '../types';
import type { User, Notification, Client, Task, Interaction } from '../types';
import { Header } from './Header';
import { AlertTriangleIcon, SettingsIcon, UserIcon as GeneralIcon, BellIcon, ReportsIcon as DataIcon, DownloadIcon, UploadIcon } from './common/icons';
import { Permissions } from '../permissions';
import { exportToCsv } from '../utils';

interface SettingsViewProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onResetData: () => void;
  currentUser: User;
  setCurrentView: (view: View) => void;
  can: (permission: string) => boolean;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
  clients: Client[];
  tasks: Task[];
  interactions: Interaction[];
  users: User[];
}

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'data';

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button
        type="button"
        className={`${
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
    >
        <span
            aria-hidden="true"
            className={`${
                checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { clients, tasks, interactions, users, theme, setTheme, onResetData, currentUser, setCurrentView, can, ...headerProps } = props;
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const [notificationPrefs, setNotificationPrefs] = useState({
        taskDue: true,
        followUp: true,
        statusChange: true,
    });
    
    const handlePrefChange = (key: keyof typeof notificationPrefs) => {
      setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExportLeads = () => {
        const dataToExport = clients.map(c => ({
            ID: c.id,
            Name: c.name,
            Email: c.email,
            Phone: c.phone,
            PAN: c.pan,
            DOB: c.dob,
            'Contact Date': c.contactDate,
            'Risk Profile': c.riskProfile,
            Status: c.status,
            'Loan Type': c.loanType,
            'Lead Source': c.leadSource,
            'Referral Name': c.referralName,
            'Referral Number': c.referralNumber,
            'Assigned To': users.find(u => u.id === c.assignedTo)?.name || 'Unassigned',
            'Created By': users.find(u => u.id === c.createdBy)?.name || 'Unknown',
            'Application ID': c.applicationId,
            'Bank Name': c.bankName,
            'Follow-up Date': c.followUpDate,
            'Requested Amount': c.loanDetails?.requestedAmount,
            'Approved Amount': c.loanDetails?.approvedAmount,
            'Disbursed Amount': c.loanDetails?.disbursedAmount,
            'Approval Date': c.loanDetails?.approvalDate,
            'Company Name': c.generalInformation?.companyName,
            'Turnover': c.generalInformation?.turnover,
            'Office Email': c.generalInformation?.officeEmail,
            'Loan Duration (Months)': c.generalInformation?.loanDuration,
            'Office Address': c.generalInformation?.officeAddress,
            'Present Address': c.generalInformation?.presentAddress,
            Notes: c.notes,
        }));
        exportToCsv(dataToExport, `sva-crm-leads-${new Date().toISOString().split('T')[0]}.csv`);
    };
    
    const handleExportTasks = () => {
        const dataToExport = tasks.map(t => ({
            ID: t.id,
            Title: t.title,
            Description: t.description,
            'Client Name': t.clientId ? clients.find(c => c.id === t.clientId)?.name : 'Internal Task',
            'Due Date': t.dueDate,
            'Due Time': t.dueTime,
            Completed: t.completed,
            Priority: t.priority,
        }));
        exportToCsv(dataToExport, `sva-crm-tasks-${new Date().toISOString().split('T')[0]}.csv`);
    };
    
    const handleExportInteractions = () => {
        const dataToExport = interactions.map(i => ({
            ID: i.id,
            'Client Name': i.clientId ? clients.find(c => c.id === i.clientId)?.name : 'N/A',
            Date: i.date,
            Type: i.type,
            Subject: i.subject,
            Duration_Seconds: i.duration,
            Disposition: i.disposition,
            Notes: i.notes,
        }));
        exportToCsv(dataToExport, `sva-crm-interactions-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const navItems = [
      { id: 'general', label: 'General', icon: <GeneralIcon className="w-5 h-5" /> },
      { id: 'appearance', label: 'Appearance', icon: <SettingsIcon className="w-5 h-5" /> },
      { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
      { id: 'data', label: 'Data Management', icon: <DataIcon className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'general':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Profile Information</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and edit your personal details.</p>
                            <button onClick={() => setCurrentView(View.Profile)} className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Go to Profile →</button>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Change Password</h3>
                             <div className="mt-4 space-y-4">
                                <input type="password" placeholder="Current Password" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600" />
                                <input type="password" placeholder="New Password" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600" />
                                <input type="password" placeholder="Confirm New Password" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600" />
                                <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md">Update Password</button>
                            </div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Application Theme</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose between light and dark mode.</p>
                         <div className="mt-6 flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-100">Enable Dark Mode</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Switch to a darker interface.</p>
                            </div>
                            <Toggle 
                                checked={theme === 'dark'} 
                                onChange={(isChecked) => setTheme(isChecked ? 'dark' : 'light')} 
                            />
                        </div>
                    </div>
                );
            case 'notifications':
                 return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md divide-y divide-slate-200 dark:divide-slate-700">
                        <div className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                           <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-100">Task Due Reminders</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">For due or overdue tasks.</p>
                           </div>
                           <Toggle checked={notificationPrefs.taskDue} onChange={() => handlePrefChange('taskDue')} />
                        </div>
                        <div className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                           <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-100">Follow-Up Reminders</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">For scheduled client follow-ups.</p>
                           </div>
                           <Toggle checked={notificationPrefs.followUp} onChange={() => handlePrefChange('followUp')} />
                        </div>
                        <div className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                           <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-100">Loan Status Changes</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">For loan approvals or disbursements.</p>
                           </div>
                           <Toggle checked={notificationPrefs.statusChange} onChange={() => handlePrefChange('statusChange')} />
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Data Export & Import</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Download your CRM data as CSV files or upload from a backup.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button onClick={handleExportLeads} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-600 text-white rounded-md hover:bg-slate-700">
                                    <DownloadIcon className="w-4 h-4" /> Export Leads
                                </button>
                                <button onClick={handleExportTasks} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-600 text-white rounded-md hover:bg-slate-700">
                                    <DownloadIcon className="w-4 h-4" /> Export Tasks
                                </button>
                                <button onClick={handleExportInteractions} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-600 text-white rounded-md hover:bg-slate-700">
                                    <DownloadIcon className="w-4 h-4" /> Export Interactions
                                </button>
                                <button 
                                    disabled 
                                    title="Import functionality is coming soon."
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-200 text-slate-500 rounded-md cursor-not-allowed dark:bg-slate-700 dark:text-slate-400 opacity-60"
                                >
                                    <UploadIcon className="w-4 h-4" /> Import Data
                                </button>
                            </div>
                        </div>
                        {can(Permissions.RESET_DATA) && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-2 border-red-500/50">
                                <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action is destructive and cannot be undone.</p>
                                <div className="mt-4">
                                    <button onClick={onResetData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700">
                                        Reset Application Data
                                    </button>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Resets all clients, tasks, and interactions to the initial demo state.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="p-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header
                title="Settings"
                subtitle="Manage your account and application preferences."
                {...props}
            />
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1">
                   <nav className="space-y-1">
                        {navItems.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={`w-full flex items-center gap-3 p-3 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === item.id 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                                    : `text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700`
                                }`}
                            >
                                <span className={activeTab === item.id ? '' : `text-slate-500 dark:text-slate-400`}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                   </nav>
                </div>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
