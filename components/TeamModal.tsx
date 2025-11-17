import React, { useState, useEffect, useMemo } from 'react';
import type { Team, User } from '../types';
import { Role } from '../types';
import { XIcon, SaveIcon } from './common/icons';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (team: Team) => void;
    teamToEdit: Team | null;
    users: User[];
    teams: Team[];
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, onSave, teamToEdit, users, teams }) => {
    const [name, setName] = useState('');
    const [teamLeadId, setTeamLeadId] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);

    const isEditMode = !!teamToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setName(teamToEdit.name);
                setTeamLeadId(teamToEdit.teamLeadId);
                setMemberIds(teamToEdit.memberIds);
            } else {
                setName('');
                setTeamLeadId('');
                setMemberIds([]);
            }
        }
    }, [isOpen, teamToEdit, isEditMode]);

    const availableUsers = useMemo(() => {
        const assignedUserIds = new Set(
            teams.filter(t => t.id !== teamToEdit?.id).flatMap(t => [t.teamLeadId, ...t.memberIds])
        );
        return users.filter(u => u.status === 'Active' && !assignedUserIds.has(u.id));
    }, [users, teams, teamToEdit]);
    
    const availableTeamLeads = availableUsers.filter(u => u.role === Role.TeamLead || u.role === Role.Admin);
    const availableMembers = availableUsers.filter(u => u.role === Role.Agent || u.role === Role.Trainee);

    const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setMemberIds(selectedOptions);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !teamLeadId) {
            alert("Team Name and Team Lead are required.");
            return;
        }

        const teamData: Team = {
            id: teamToEdit?.id || `team-${Date.now()}`,
            name,
            teamLeadId,
            memberIds,
        };
        onSave(teamData);
        onClose();
    };

    if (!isOpen) return null;
    
    const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{isEditMode ? 'Edit Team' : 'Create New Team'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="teamName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Team Name <span className="text-red-500">*</span></label>
                            <input type="text" id="teamName" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="teamLead" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Team Lead <span className="text-red-500">*</span></label>
                            <select id="teamLead" value={teamLeadId} onChange={e => setTeamLeadId(e.target.value)} required className={inputStyles}>
                                <option value="" disabled>Select a Team Lead</option>
                                {availableTeamLeads.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                {isEditMode && users.find(u => u.id === teamToEdit.teamLeadId) && !availableTeamLeads.some(u => u.id === teamToEdit.teamLeadId) &&
                                    <option key={teamToEdit.teamLeadId} value={teamToEdit.teamLeadId}>{users.find(u=>u.id === teamToEdit.teamLeadId)?.name}</option>
                                }
                            </select>
                        </div>
                        <div>
                            <label htmlFor="members" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Team Members</label>
                            <select id="members" multiple value={memberIds} onChange={handleMemberSelect} className={`${inputStyles} h-40`}>
                                {availableMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                {isEditMode && teamToEdit.memberIds.map(id => {
                                    const member = users.find(u => u.id === id);
                                    if(member && !availableMembers.some(u => u.id === id)) {
                                        return <option key={id} value={id}>{member.name}</option>
                                    }
                                    return null;
                                })}
                            </select>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple members.</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            <SaveIcon className="w-5 h-5"/>
                            {isEditMode ? 'Save Changes' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
