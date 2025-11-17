
import React, { useState } from 'react';
import type { User, Client } from '../types';
import { Role } from '../types';
import { XIcon } from './common/icons';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentId: string) => void;
  users: User[];
  selectedLeads: Client[];
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({ isOpen, onClose, onAssign, users, selectedLeads }) => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  
  // Allow assignment to active agents and team leads only.
  const assignableUsers = users.filter(
    u => u.status === 'Active' && (u.role === Role.Agent || u.role === Role.TeamLead)
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgentId) {
      onAssign(selectedAgentId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bulk Assign Leads</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-2">You have selected <span className="font-bold text-blue-600 dark:text-blue-400">{selectedLeads.length}</span> lead(s):</p>
        <div className="max-h-24 overflow-y-auto bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-600 mb-4">
            <ul className="text-sm text-slate-700 dark:text-slate-200 list-disc list-inside">
                {selectedLeads.map(lead => <li key={lead.id}>{lead.name}</li>)}
            </ul>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="agent" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign to Agent/Team Lead</label>
            <select 
              id="agent" 
              value={selectedAgentId} 
              onChange={e => setSelectedAgentId(e.target.value)} 
              required 
              className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a user</option>
              {assignableUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Assign Leads</button>
          </div>
        </form>
      </div>
    </div>
  );
};
