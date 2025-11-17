import React, { useState, useMemo } from 'react';
import type { User, Notification, Client } from '../types';
import { Header } from './Header';
import { EditProfileModal } from './EditProfileModal';
import { EditIcon, UsersIcon, RupeeIcon, ClockIcon, AdminPanelIcon, ReportsIcon } from './common/icons';
import { Role, View } from '../types';
import { formatCurrencyForStats, formatShiftTime } from '../utils';

interface ProfileViewProps {
    user: User;
    clients: Client[];
    users: User[];
    notifications: Notification[];
    onMarkAllAsRead: () => void;
    onUpdateUser: (user: User) => void;
    setCurrentView: (view: View) => void;
    sessionStartTime: number | null;
    isOnBreak: boolean;
    breakStartTime: number | null;
    totalBreakDuration: number;
    onToggleBreak: () => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex items-center gap-4">
        <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </div>
    </div>
);

export const ProfileView: React.FC<ProfileViewProps> = ({ user, clients, users, notifications, onMarkAllAsRead, onUpdateUser, setCurrentView, ...shiftTrackerProps }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
    const adminStats = useMemo(() => {
        if (user.role !== Role.Admin) return null;
        
        const activeAgents = users.filter(u => u.status === 'Active' && (u.role === Role.Agent || u.role === Role.TeamLead)).length;
        const pendingLeads = clients.filter(c => c.status === 'Lead' || c.status === 'Follow-up').length;
        
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyDisbursement = clients
            .filter(c => {
                const approvalDate = c.loanDetails?.approvalDate ? new Date(c.loanDetails.approvalDate) : null;
                return approvalDate && approvalDate >= firstDayOfMonth && c.loanDetails?.disbursedAmount > 0;
            })
            .reduce((sum, c) => sum + (c.loanDetails?.disbursedAmount || 0), 0);

        return { activeAgents, pendingLeads, monthlyDisbursement };
    }, [user, users, clients]);
    
    return (
    <>
      <div className="p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
        <Header 
          title="Profile"
          subtitle="Manage your account settings."
          notifications={notifications}
          onMarkAllAsRead={onMarkAllAsRead}
          currentUser={user}
          {...shiftTrackerProps}
        />
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-4xl flex-shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{user.role}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-md shadow-sm hover:bg-slate-700 flex-shrink-0">
                        <EditIcon className="w-5 h-5" /> Edit Profile
                    </button>
                </div>
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">{user.username}</p>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {user.status}
                        </span>
                      </p>
                  </div>
                   <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">{user.email || 'Not provided'}</p>
                  </div>
                   <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Shift Start Time</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">{formatShiftTime(user.shiftStartTime) || 'Not set'}</p>
                  </div>
                   <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Shift End Time</label>
                      <p className="text-lg text-slate-800 dark:text-slate-200 mt-1">{formatShiftTime(user.shiftEndTime) || 'Not set'}</p>
                  </div>
              </div>
            </div>
            
            {user.role === Role.Admin && adminStats && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Admin Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title="Active Agents" value={adminStats.activeAgents.toString()} icon={<UsersIcon className="text-blue-600"/>} />
                        <StatCard title="Pending Leads" value={adminStats.pendingLeads.toString()} icon={<ClockIcon className="text-yellow-600"/>} />
                        <StatCard title="Disbursed (Month)" value={formatCurrencyForStats(adminStats.monthlyDisbursement)} icon={<RupeeIcon className="text-green-600"/>} />
                    </div>
                     <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Actions</h4>
                        <div className="flex gap-2">
                           <button onClick={() => setCurrentView(View.AdminPanel)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                               <AdminPanelIcon className="w-4 h-4" /> Manage Users
                           </button>
                            <button onClick={() => setCurrentView(View.Reports)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600">
                               <ReportsIcon className="w-4 h-4" /> View Reports
                           </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onUpdateUser}
        user={user}
      />
    </>
  );
};