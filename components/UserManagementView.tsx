
import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import type { User, Notification, Client, ActivityLog } from '../types';
import { Role, View, activityLogCategories } from '../types';
import { Header } from './Header';
import { AddAgentModal } from './AddAgentModal';
import { ConfirmationModal } from './ConfirmationModal';
import { UsersIcon, EditIcon, TrashIcon, AddAgentIcon, SearchIcon, ActiveAgentIcon, RupeeIcon, AlertTriangleIcon, TeamIcon, LogIcon, SettingsIcon, DashboardIcon, AnalysisIcon, LogOutIcon, CheckSquareIcon, AdminPanelIcon, ReportsIcon, FileTextIcon } from './common/icons';
import { formatShiftTime, formatCurrencyForStats, timeSince } from '../utils';
import { Permissions } from '../permissions';

interface UserManagementViewProps {
  users: User[];
  clients: Client[];
  activityLogs: ActivityLog[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  can: (permission: string) => boolean;
  setCurrentView: (view: View) => void;
  onSelectClient: (client: Client) => void;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
  initialFilters: { status: string; role: Role[] } | null;
}

const getRoleClass = (role: Role) => {
    switch(role) {
        case Role.Admin: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
        case Role.SubAdmin: return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300';
        case Role.TeamLead: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
        case Role.Agent: return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
        case Role.Trainee: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
};

const getIconForCategory = (category: ActivityLog['category']) => {
    const className = "w-5 h-5 text-slate-500 dark:text-slate-400";
    switch(category) {
        case 'Authentication': return <LogOutIcon className={className} />;
        case 'Lead Management': return <UsersIcon className={className} />;
        case 'Task Management': return <CheckSquareIcon className={className} />;
        case 'User Management': return <AdminPanelIcon className={className} />;
        case 'Team Management': return <TeamIcon className={className} />;
        case 'Reporting': return <ReportsIcon className={className} />;
        case 'General': return <SettingsIcon className={className} />;
        default: return <FileTextIcon className={className} />;
    }
};

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        className={`${
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
    >
        <span
            aria-hidden="true"
            className={`${
                checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

const ROLE_COLORS: { [key in Role]: string } = {
    [Role.Admin]: '#8b5cf6',
    [Role.SubAdmin]: '#d946ef',
    [Role.TeamLead]: '#0ea5e9',
    [Role.Agent]: '#22c55e',
    [Role.Trainee]: '#f59e0b',
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
    </div>
);

type AdminTab = 'overview' | 'management' | 'distribution';

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm transition-colors ${isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
        {icon}
        {label}
    </button>
);


export const UserManagementView: React.FC<UserManagementViewProps> = (props) => {
  const { users, clients, activityLogs, onAddUser, onUpdateUser, onDeleteUser, notifications, onMarkAllAsRead, currentUser, can, setCurrentView, onSelectClient, initialFilters, ...shiftTrackerProps } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialFilters ? 'management' : 'overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | string[]>('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  useEffect(() => {
    if (initialFilters) {
        setStatusFilter(initialFilters.status || 'All');
        setRoleFilter(initialFilters.role || 'All');
    }
  }, [initialFilters]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
        const searchMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const roleMatch = roleFilter === 'All' || 
          (Array.isArray(roleFilter) ? roleFilter.includes(user.role) : user.role === roleFilter);
        const statusMatch = statusFilter === 'All' || user.status === statusFilter;
        return searchMatch && roleMatch && statusMatch;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const roleDistributionData = useMemo(() => {
    const counts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<Role, number>);
    return Object.entries(counts).map(([name, value]) => ({ name: name as Role, value }));
  }, [users]);
  
  const handleOpenAddModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (userData: Omit<User, 'id'> | User) => {
    if ('id' in userData) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
        onDeleteUser(userToDelete.id);
        setIsConfirmModalOpen(false);
        setUserToDelete(null);
    }
  };

  const systemStats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Active').length,
    unassignedLeads: clients.filter(c => !c.assignedTo).length,
    totalDisbursed: clients.reduce((sum, c) => sum + (c.loanDetails?.disbursedAmount || 0), 0),
  }), [users, clients]);

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRoleFilter(value);
  }

  const renderContent = () => {
    switch (activeTab) {
        case 'overview':
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard title="Total Users" value={systemStats.totalUsers.toString()} icon={<UsersIcon className="w-6 h-6 text-purple-600"/>} color="bg-purple-100 dark:bg-purple-900/20" />
                        <StatCard title="Active Users" value={systemStats.activeUsers.toString()} icon={<ActiveAgentIcon className="w-6 h-6 text-green-600"/>} color="bg-green-100 dark:bg-green-900/20" />
                        <StatCard title="Unassigned Leads" value={systemStats.unassignedLeads.toString()} icon={<AlertTriangleIcon className="w-6 h-6 text-yellow-600"/>} color="bg-yellow-100 dark:bg-yellow-900/20" />
                        <StatCard title="Total Disbursed" value={formatCurrencyForStats(systemStats.totalDisbursed)} icon={<RupeeIcon className="w-6 h-6 text-blue-600"/>} color="bg-blue-100 dark:bg-blue-900/20" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-700 dark:text-slate-200">System Activity</h3>
                                <button onClick={() => setCurrentView(View.ActivityLog)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                    View Full Log →
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Track all user actions, system events, and data modifications. Use the activity log to audit changes and monitor user activity.
                            </p>
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-2">Last Activity</h4>
                                {activityLogs.length > 0 ? (
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700">
                                            {getIconForCategory(activityLogs[0].category)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{activityLogs[0].userName}</span> {activityLogs[0].action}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(activityLogs[0].timestamp)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
                                )}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                              <button onClick={() => setCurrentView(View.TeamStructure)} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                                <TeamIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                <span className="font-medium text-slate-700 dark:text-slate-200">Manage Teams</span>
                              </button>
                              <button onClick={() => setCurrentView(View.Reports)} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                                <LogIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                <span className="font-medium text-slate-700 dark:text-slate-200">View Reports</span>
                              </button>
                               <button onClick={() => setCurrentView(View.Settings)} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                                <SettingsIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                <span className="font-medium text-slate-700 dark:text-slate-200">Application Settings</span>
                              </button>
                            </div>
                          </div>
                    </div>
                </div>
            );
        case 'management':
            return (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <div className="p-4 flex flex-wrap gap-4 justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">User Management</h2>
                         {can(Permissions.MANAGE_USERS) && (
                            <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                                <AddAgentIcon className="w-5 h-5" /> Add User
                            </button>
                         )}
                    </div>

                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <select value={Array.isArray(roleFilter) ? 'All' : roleFilter} onChange={handleRoleFilterChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                                    <option value="All">All Roles</option>
                                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200">
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700">
                          <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Shift Time</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            {can(Permissions.MANAGE_USERS) && <th scope="col" className="px-6 py-3">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                          {filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
                                            <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs font-semibold ${getRoleClass(user.role)} rounded-full px-2 py-0.5 inline-block`}>{user.role}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {user.shiftStartTime && user.shiftEndTime
                                        ? `${formatShiftTime(user.shiftStartTime)} - ${formatShiftTime(user.shiftEndTime)}`
                                        : <span className="text-slate-400">Not Set</span>
                                    }
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Toggle
                                            checked={user.status === 'Active'}
                                            onChange={(isActive) => onUpdateUser({ ...user, status: isActive ? 'Active' : 'Inactive' })}
                                            disabled={!can(Permissions.MANAGE_USERS) || user.id === currentUser.id}
                                        />
                                        <span className={`text-xs font-semibold ${user.status === 'Active' ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </td>
                                {can(Permissions.MANAGE_USERS) && (
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                            <button onClick={() => handleOpenEditModal(user)} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Edit">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(user)} disabled={user.id === currentUser.id} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {filteredUsers.length === 0 && <div className="text-center py-10 text-slate-500 dark:text-slate-400">No users found.</div>}
                    </div>
                </div>
            );
        case 'distribution':
            return (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Role Distribution</h2>
                   <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius="80%"
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {roleDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: 'none', color: 'white', borderRadius: '4px' }}/>
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                   </div>
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900 min-h-screen">
      <Header 
        title="Admin Dashboard"
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        {...shiftTrackerProps}
      />
      
       <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <TabButton icon={<DashboardIcon className="w-5 h-5" />} label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton icon={<UsersIcon className="w-5 h-5" />} label="User Management" isActive={activeTab === 'management'} onClick={() => setActiveTab('management')} />
              <TabButton icon={<AnalysisIcon className="w-5 h-5" />} label="Role Distribution" isActive={activeTab === 'distribution'} onClick={() => setActiveTab('distribution')} />
          </nav>
      </div>

      <div>
        {renderContent()}
      </div>

      <AddAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        currentUser={currentUser}
      />
       <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};