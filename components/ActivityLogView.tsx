

import React, { useState, useMemo } from 'react';
import type { ActivityLog, User, Client, Notification, ActivityLogCategory } from '../types';
import { activityLogCategories } from '../types';
import { timeSince } from '../utils';
import { Header } from './Header';
import { ArrowLeftIcon, ArrowRightIcon } from './common/icons';

interface ActivityLogViewProps {
    activityLogs: ActivityLog[];
    users: User[];
    clients: Client[];
    onSelectClient: (client: Client) => void;
    notifications: Notification[];
    onMarkAllAsRead: () => void;
    currentUser: User;
    sessionStartTime: number | null;
    isOnBreak: boolean;
    breakStartTime: number | null;
    totalBreakDuration: number;
    onToggleBreak: () => void;
}

const categoryColors: { [key in ActivityLogCategory]: string } = {
    'Authentication': 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    'Lead Management': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'Task Management': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    'User Management': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    'Team Management': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    'Reporting': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'General': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const LOGS_PER_PAGE = 20;

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activityLogs, users, clients, onSelectClient, ...headerProps }) => {
    const [userFilter, setUserFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredLogs = useMemo(() => {
        return activityLogs.filter(log => {
            const userMatch = userFilter === 'All' || log.userId === userFilter;
            const categoryMatch = categoryFilter === 'All' || log.category === categoryFilter;
            
            const logDate = new Date(log.timestamp);
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;
            if (fromDate) fromDate.setHours(0,0,0,0);
            if (toDate) toDate.setHours(23,59,59,999);
            const dateMatch = (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
            
            const actionMatch = !actionFilter || 
                log.action.toLowerCase().includes(actionFilter.toLowerCase()) || 
                (log.relatedEntityName || '').toLowerCase().includes(actionFilter.toLowerCase());

            return userMatch && categoryMatch && dateMatch && actionMatch;
        });
    }, [activityLogs, userFilter, categoryFilter, dateFrom, dateTo, actionFilter]);
    
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

    const resetFilters = () => {
        setUserFilter('All');
        setCategoryFilter('All');
        setDateFrom('');
        setDateTo('');
        setActionFilter('');
        setCurrentPage(1);
    };

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900 min-h-screen">
            <Header title="Activity Log" subtitle="Track all actions and system events." {...headerProps} />
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">User</label>
                        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm">
                            <option value="All">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm">
                            <option value="All">All Categories</option>
                            {activityLogCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Action Details</label>
                        <input type="text" value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="Search in action..." className="w-full mt-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:col-span-2 items-end">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm"/>
                        </div>
                        <div className="col-span-2">
                            <button onClick={resetFilters} className="w-full p-2 bg-slate-200 dark:bg-slate-600 rounded-md text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">Reset Filters</button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Details</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map(log => (
                                <tr key={log.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{log.userName}</td>
                                    <td className="px-6 py-4 max-w-sm truncate">{log.action}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[log.category]}`}>{log.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.relatedEntityType === 'client' && log.relatedEntityId && log.relatedEntityName ? (
                                            <button onClick={() => {
                                                const client = clients.find(c => c.id === log.relatedEntityId);
                                                if (client) onSelectClient(client);
                                            }} className="font-semibold text-blue-600 hover:underline">
                                                {log.relatedEntityName}
                                            </button>
                                        ) : log.relatedEntityName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4" title={new Date(log.timestamp).toLocaleString()}>{timeSince(log.timestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        <p>No activity logs found for the selected filters.</p>
                    </div>
                )}
                
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700">
                                <ArrowLeftIcon />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700">
                                <ArrowRightIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};