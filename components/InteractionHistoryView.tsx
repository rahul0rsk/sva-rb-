
import React, { useMemo, useState } from 'react';
import { Header } from './Header';
import type { Notification, Interaction, Client, User } from '../types';
import { CallDisposition } from '../types';
import { formatDuration } from '../utils';

interface InteractionHistoryViewProps {
  interactions: Interaction[];
  clients: Client[];
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  can: (permission: string) => boolean;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
}

const getDispositionClass = (disposition?: CallDisposition) => {
    if (!disposition) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    switch(disposition) {
        case CallDisposition.Interested: return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
        case CallDisposition.Callback: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
        case CallDisposition.FollowUp: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
        case CallDisposition.NoRequirement: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
        case CallDisposition.Invalid: return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
}

const getTypeClass = (type: Interaction['type']) => {
    switch(type) {
        case 'Call': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
        case 'Email': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
        case 'Meeting': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
        case 'WhatsApp': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
}

export const InteractionHistoryView: React.FC<InteractionHistoryViewProps> = ({ interactions, clients, notifications, onMarkAllAsRead, currentUser, ...shiftTrackerProps }) => {
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const interactionLogs = useMemo(() => {
    return interactions
      .filter(log => {
        const dispositionMatch = typeFilter !== 'Call' || dispositionFilter === 'All' || log.disposition === dispositionFilter;
        const clientMatch = clientFilter === 'All' || log.clientId === clientFilter;
        const typeMatch = typeFilter === 'All' || log.type === typeFilter;
        
        const logDate = new Date(log.date);
        const dateFrom = dateFromFilter ? new Date(dateFromFilter) : null;
        const dateTo = dateToFilter ? new Date(dateToFilter) : null;

        if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
        if (dateTo) dateTo.setHours(23, 59, 59, 999);
        
        const dateMatch = (!dateFrom || logDate >= dateFrom) && (!dateTo || logDate <= dateTo);

        return dispositionMatch && clientMatch && typeMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [interactions, dateFromFilter, dateToFilter, dispositionFilter, clientFilter, typeFilter]);

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Unknown Number';
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const resetFilters = () => {
    setDateFromFilter('');
    setDateToFilter('');
    setDispositionFilter('All');
    setClientFilter('All');
    setTypeFilter('All');
  };

  return (
    <div className="p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
      <Header 
        title="Interaction History"
        subtitle="Review all client communications and interactions."
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        {...shiftTrackerProps}
      />
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="lg:col-span-2">
                <label htmlFor="clientFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client</label>
                <select id="clientFilter" value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="All">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select id="typeFilter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="All">All Types</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="WhatsApp">WhatsApp</option>
                </select>
            </div>
            {typeFilter === 'Call' && (
              <div>
                  <label htmlFor="dispositionFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Disposition</label>
                  <select id="dispositionFilter" value={dispositionFilter} onChange={e => setDispositionFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                      <option value="All">All Dispositions</option>
                      {Object.values(CallDisposition).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
              </div>
            )}
            <div>
                <label htmlFor="dateFromFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                <input id="dateFromFilter" type="date" value={dateFromFilter} onChange={e => setDateFromFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"/>
            </div>
            <div>
                <label htmlFor="dateToFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                <input id="dateToFilter" type="date" value={dateToFilter} onChange={e => setDateToFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"/>
            </div>
            <div className="self-end lg:col-start-6">
                <button onClick={resetFilters} className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Reset</button>
            </div>
        </div>
      
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Type</th>
                <th scope="col" className="px-6 py-3">Duration</th>
                <th scope="col" className="px-6 py-3">Disposition</th>
                <th scope="col" className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {interactionLogs.length > 0 ? interactionLogs.map(log => (
                <tr key={log.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{getClientName(log.clientId)}</td>
                  <td className="px-6 py-4">{new Date(log.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeClass(log.type)}`}>
                        {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatDuration(log.duration)}</td>
                  <td className="px-6 py-4">
                    {log.disposition ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDispositionClass(log.disposition)}`}>
                            {log.disposition}
                        </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{log.notes || 'No notes'}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        <p>No interaction history found for the selected filters.</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};