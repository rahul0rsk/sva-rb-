
import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Task, User, Notification, Interaction } from '../types';
import { ClientStatus, LoanType, LeadSource, Role } from '../types';
import { Header } from './Header';
import { AddLeadModal } from './AddLeadModal';
import { IVRCallModal } from './IVRCallModal';
import { BulkAssignModal } from './BulkAssignModal';
import { ConfirmationModal } from './ConfirmationModal';
import { BulkEmailModal } from './BulkEmailModal';
import { formatCurrency } from '../utils';
import { 
    SearchIcon, 
    PlusIcon, 
    BulkAssignIcon,
    WhatsAppIcon,
    PhoneIcon,
    EmailIcon,
    EditIcon,
    TrashIcon,
} from './common/icons';
import { Permissions } from '../permissions';

interface ClientListViewProps {
  clients: Client[];
  users: User[];
  onSelectClient: (client: Client | null) => void;
  onUpdateClient: (client: Client) => void;
  onAddClient: (client: Omit<Client, 'id' | 'pan' | 'dob' | 'riskProfile' | 'financialGoals' | 'portfolio' | 'interactions' | 'assignedTo' | 'contactDate' | 'createdBy'>) => void;
  onDeleteClient: (clientId: string) => void;
  onAddInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  onBulkAssign: (agentId: string, leadIds: string[]) => void;
  onBulkEmail: (clientIds: string[], subject: string, message: string, attachments: File[]) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  tasks: Task[];
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  can: (permission: string) => boolean;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
  onToggleSidebar?: () => void;
  initialFilters: { status: string | string[] } | null;
}

const statusColors: { [key in ClientStatus]: { bg: string, text: string, border: string } } = {
    [ClientStatus.Lead]: { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-700' },
    [ClientStatus.FollowUp]: { bg: 'bg-amber-900/50', text: 'text-amber-300', border: 'border-amber-700' },
    [ClientStatus.Approved]: { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-700' },
    [ClientStatus.Active]: { bg: 'bg-indigo-900/50', text: 'text-indigo-300', border: 'border-indigo-700' },
    [ClientStatus.Rejected]: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-700' },
};


export const ClientListView: React.FC<ClientListViewProps> = (props) => {
  const { 
    clients, users, onSelectClient, onUpdateClient, onAddTask, 
    tasks, notifications, onMarkAllAsRead, onAddClient, onDeleteClient, 
    onAddInteraction, onBulkAssign, onBulkEmail, currentUser, can, onToggleSidebar, initialFilters, ...shiftTrackerProps
  } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | string[]>('All');
  const [assignedToFilter, setAssignedToFilter] = useState('All');
  
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Client | null>(null);
  
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  
  const [isIvrModalOpen, setIsIvrModalOpen] = useState(false);
  const [callingClient, setCallingClient] = useState<Client | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    if (initialFilters) {
        setStatusFilter(initialFilters.status || 'All');
    }
  }, [initialFilters]);

  const agents = useMemo(() => users.filter(u => u.role === Role.Agent || u.role === Role.TeamLead), [users]);
  
  const visibleClients = useMemo(() => {
    if (can(Permissions.VIEW_ALL_LEADS)) {
      return clients;
    }
    if (currentUser.role === Role.Trainee) {
      return clients.filter(client => client.createdBy === currentUser.id);
    }
    return clients.filter(client => client.assignedTo === currentUser.id);
  }, [clients, currentUser, can]);


  const filteredClients = useMemo(() => {
    return visibleClients.filter(client => {
      const lowercasedQuery = searchQuery.toLowerCase();
      const searchMatch = client.name.toLowerCase().includes(lowercasedQuery) ||
        client.email.toLowerCase().includes(lowercasedQuery) ||
        client.phone.includes(searchQuery);
        
      const statusMatch = statusFilter === 'All' || 
          (Array.isArray(statusFilter) ? statusFilter.includes(client.status) : client.status === statusFilter);
      
      const assignedToMatch = (() => {
        if (!can(Permissions.VIEW_ALL_LEADS)) return true;
        if (assignedToFilter === 'All') return true;
        if (assignedToFilter === '_unassigned_') return !client.assignedTo;
        return client.assignedTo === assignedToFilter;
      })();
      
      return searchMatch && statusMatch && assignedToMatch;
    });
  }, [visibleClients, searchQuery, statusFilter, assignedToFilter, can]);

  const resetFilters = () => {
      setSearchQuery('');
      setStatusFilter('All');
      setAssignedToFilter('All');
      setSelectedLeadIds(new Set());
  };

  const handleSelectLead = (leadId: string) => {
    const newSelection = new Set(selectedLeadIds);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeadIds(newSelection);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(new Set(filteredClients.map(c => c.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };
  
  const handleOpenAddModal = () => {
    setLeadToEdit(null);
    setIsAddLeadModalOpen(true);
  };
  
  const handleOpenEditModal = (client: Client) => {
    setLeadToEdit(client);
    setIsAddLeadModalOpen(true);
  };
  
  const handleSaveLead = (clientData: any) => {
    if (leadToEdit) {
      onUpdateClient({ ...leadToEdit, ...clientData });
    } else {
      onAddClient(clientData);
    }
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if(clientToDelete){
      onDeleteClient(clientToDelete.id);
      setIsConfirmModalOpen(false);
      setClientToDelete(null);
    }
  };

  const handleCall = (client: Client) => {
    setCallingClient(client);
    setIsIvrModalOpen(true);
  };

  const handleBulkAssign = (agentId: string) => {
    onBulkAssign(agentId, Array.from(selectedLeadIds));
    setSelectedLeadIds(new Set());
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'All') {
        setStatusFilter('All');
    } else {
        setStatusFilter(value);
    }
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen">
      <Header 
        title="Leads Management" 
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        onToggleSidebar={onToggleSidebar}
        {...shiftTrackerProps}
      />
      
      <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-200">All Leads</h2>
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-slate-700"
                    />
                </div>
                {can(Permissions.ADD_LEAD) && (
                    <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5" /> Add Lead
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-4">
            <div>
                <label htmlFor="statusFilter" className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select id="statusFilter" value={Array.isArray(statusFilter) ? 'All' : statusFilter} onChange={handleStatusFilterChange} className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-slate-300">
                    <option value="All">All Statuses</option>
                    {Object.values(ClientStatus).map((s: ClientStatus) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {can(Permissions.VIEW_ALL_LEADS) && (
                <div>
                    <label htmlFor="assignedToFilter" className="block text-xs font-medium text-slate-400 mb-1">Assigned Agent</label>
                    <select id="assignedToFilter" value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)} className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-slate-300">
                        <option value="All">All Agents</option>
                        <option value="_unassigned_">Unassigned</option>
                        {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                    </select>
                </div>
            )}
            <div className="flex items-center gap-2 lg:col-start-4 justify-self-end">
                 <button onClick={resetFilters} className="px-4 py-2 bg-slate-600 text-slate-200 font-semibold rounded-md hover:bg-slate-500">Reset</button>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Improve search function in leads managements</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                  type="checkbox"
                  className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                  onChange={handleSelectAll}
                  checked={filteredClients.length > 0 && selectedLeadIds.size === filteredClients.length}
                  ref={el => { if (el) el.indeterminate = selectedLeadIds.size > 0 && selectedLeadIds.size < filteredClients.length; }}
              />
              <label className="text-sm font-medium text-slate-300">
                  Select All ({selectedLeadIds.size} of {filteredClients.length} selected)
              </label>
            </div>
            {can(Permissions.BULK_ACTIONS_LEADS) && (
            <div className="flex items-center gap-2">
              <button 
                  onClick={() => setIsBulkAssignModalOpen(true)}
                  disabled={selectedLeadIds.size === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white font-semibold rounded-md shadow-sm hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                  <BulkAssignIcon className="w-4 h-4" /> Assign
              </button>
              <button 
                  onClick={() => setIsBulkEmailModalOpen(true)}
                  disabled={selectedLeadIds.size === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                  <EmailIcon className="w-4 h-4" /> Email
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredClients.map(client => (
            <div key={client.id} className={`bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border ${selectedLeadIds.has(client.id) ? 'border-blue-600' : 'border-slate-700'}`}>
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <input 
                            type="checkbox" 
                            className="rounded flex-shrink-0 bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
                            checked={selectedLeadIds.has(client.id)}
                            onChange={() => handleSelectLead(client.id)}
                        />
                        <div>
                            <button onClick={() => onSelectClient(client)} className="font-semibold text-lg text-blue-400 hover:underline">{client.name}</button>
                            <p className="text-sm text-slate-400">{client.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[client.status].bg} ${statusColors[client.status].text}`}>
                            {client.status}
                        </span>
                        <div className="flex items-center gap-1">
                            <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="WhatsApp"><WhatsAppIcon className="w-5 h-5 text-green-500" /></a>
                            <button onClick={() => handleCall(client)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Call"><PhoneIcon className="w-5 h-5 text-sky-500" /></button>
                            <a href={`mailto:${client.email}`} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Email"><EmailIcon className="w-5 h-5 text-blue-500" /></a>
                            {can(Permissions.EDIT_LEAD) && (
                                <button onClick={() => handleOpenEditModal(client)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Edit"><EditIcon className="w-5 h-5" /></button>
                            )}
                            {can(Permissions.DELETE_LEAD) && (
                                <button onClick={() => handleDelete(client)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Delete"><TrashIcon className="w-5 h-5 text-red-500" /></button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-slate-700 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Loan Type</p>
                        <p className="font-medium text-slate-200">{client.loanType}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Requested</p>
                        <p className="font-medium text-slate-200">{formatCurrency(client.loanDetails?.requestedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Approved</p>
                        <p className="font-medium text-slate-200">{formatCurrency(client.loanDetails?.approvedAmount)}</p>
                    </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Disbursed</p>
                        <p className="font-medium text-slate-200">{formatCurrency(client.loanDetails?.disbursedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Assigned To</p>
                        <p className="font-medium text-slate-200">{users.find(u => u.id === client.assignedTo)?.name || 'Unassigned'}</p>
                    </div>
                </div>
            </div>
        ))}
    </div>

      {isAddLeadModalOpen && (
        <AddLeadModal 
            isOpen={isAddLeadModalOpen}
            onClose={() => setIsAddLeadModalOpen(false)}
            onSave={handleSaveLead}
            clientToEdit={leadToEdit}
        />
      )}
       <IVRCallModal
        isOpen={isIvrModalOpen}
        onClose={() => setIsIvrModalOpen(false)}
        client={callingClient}
        onSaveInteraction={onAddInteraction}
      />
      {can(Permissions.BULK_ACTIONS_LEADS) && isBulkAssignModalOpen && (
        <BulkAssignModal
            isOpen={isBulkAssignModalOpen}
            onClose={() => setIsBulkAssignModalOpen(false)}
            users={users}
            selectedLeads={clients.filter(c => selectedLeadIds.has(c.id))}
            onAssign={handleBulkAssign}
        />
      )}
      {can(Permissions.BULK_ACTIONS_LEADS) && isBulkEmailModalOpen && (
        <BulkEmailModal
            isOpen={isBulkEmailModalOpen}
            onClose={() => setIsBulkEmailModalOpen(false)}
            recipients={clients.filter(c => selectedLeadIds.has(c.id))}
            onSend={(subject, message, attachments) => {
                onBulkEmail(Array.from(selectedLeadIds), subject, message, attachments);
                setIsBulkEmailModalOpen(false);
                setSelectedLeadIds(new Set());
            }}
        />
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete the lead "${clientToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};
