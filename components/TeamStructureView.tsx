import React, { useState, useMemo } from 'react';
import { Header } from './Header';
import { TeamModal } from './TeamModal';
import { ConfirmationModal } from './ConfirmationModal';
import type { Team, User, Notification, Client } from '../types';
import { ClientStatus } from '../types';
import { PlusIcon, EditIcon, TrashIcon, TeamIcon as TeamIconComponent, UsersIcon, ConversionRateIcon, RupeeIcon } from './common/icons';
import { formatCurrency } from '../utils';
import { Permissions } from '../permissions';

interface TeamStructureViewProps {
    teams: Team[];
    users: User[];
    clients: Client[];
    onSaveTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
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
}

const TeamCard: React.FC<{ team: Team; users: User[]; clients: Client[]; onEdit: (team: Team) => void; onDelete: (team: Team) => void; canManage: boolean; }> = ({ team, users, clients, onEdit, onDelete, canManage }) => {
    const teamLead = users.find(u => u.id === team.teamLeadId);
    const members = users.filter(u => team.memberIds.includes(u.id));

    const teamMembersIds = useMemo(() => new Set([team.teamLeadId, ...team.memberIds]), [team]);
    const teamClients = useMemo(() => clients.filter(c => c.assignedTo && teamMembersIds.has(c.assignedTo)), [clients, teamMembersIds]);

    const totalLeads = teamClients.length;
    const convertedLeads = teamClients.filter(c => c.status === ClientStatus.Approved || c.status === ClientStatus.Active).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalDisbursed = teamClients.reduce((sum, c) => sum + (c.loanDetails?.disbursedAmount || 0), 0);


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{team.name}</h3>
                    {teamLead && <p className="text-sm text-slate-500 dark:text-slate-400">Lead: {teamLead.name}</p>}
                </div>
                {canManage && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(team)} className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => onDelete(team)} className="p-1.5 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                )}
            </div>
            <div className="flex-grow">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Members ({members.length})</h4>
                <div className="flex flex-wrap gap-2">
                    {members.length > 0 ? members.map(member => (
                        <div key={member.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                            <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-200">{member.name}</span>
                        </div>
                    )) : <p className="text-sm text-slate-500 dark:text-slate-400">No members assigned.</p>}
                </div>
            </div>

             <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Team Performance</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400 flex-1">Total Leads</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalLeads}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ConversionRateIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400 flex-1">Conversion Rate</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <RupeeIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400 flex-1">Total Disbursed</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(totalDisbursed)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const TeamStructureView: React.FC<TeamStructureViewProps> = (props) => {
    const { teams, users, clients, onSaveTeam, onDeleteTeam, notifications, onMarkAllAsRead, currentUser, can, onToggleSidebar, ...shiftTrackerProps } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

    const handleOpenAddModal = () => {
        setTeamToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (team: Team) => {
        setTeamToEdit(team);
        setIsModalOpen(true);
    };

    const handleDelete = (team: Team) => {
        setTeamToDelete(team);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (teamToDelete) {
            onDeleteTeam(teamToDelete.id);
            setIsConfirmModalOpen(false);
            setTeamToDelete(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header
                title="Team Structure"
                subtitle="Manage your teams and view their performance at a glance."
                notifications={notifications}
                onMarkAllAsRead={onMarkAllAsRead}
                currentUser={currentUser}
                onToggleSidebar={onToggleSidebar}
                {...shiftTrackerProps}
            >
                {can(Permissions.MANAGE_TEAMS) && (
                    <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        Create Team
                    </button>
                )}
            </Header>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {teams.map(team => (
                    <TeamCard key={team.id} team={team} users={users} clients={clients} onEdit={handleOpenEditModal} onDelete={handleDelete} canManage={can(Permissions.MANAGE_TEAMS)} />
                ))}
            </div>

            {teams.length === 0 && (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <TeamIconComponent className="w-12 h-12 mx-auto text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold">No Teams Found</h3>
                    <p className="mt-1 text-sm">Get started by creating your first team.</p>
                </div>
            )}

            <TeamModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveTeam}
                teamToEdit={teamToEdit}
                users={users}
                teams={teams}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Team"
                message={`Are you sure you want to delete the team "${teamToDelete?.name}"? This action cannot be undone.`}
                confirmText="Yes, Delete"
            />
        </div>
    );
};
