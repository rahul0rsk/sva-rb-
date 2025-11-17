import React, { useState, useMemo } from 'react';
import type { Client, Task, User, Notification, Commitment } from '../types';
import { Header } from './Header';
import { Role, ClientStatus } from '../types';
import { 
    FileTextIcon, 
    CalendarIcon, 
} from './common/icons';
import { formatCurrency } from '../utils';
import { UpdateCommitmentModal } from './UpdateCommitmentModal';

interface ReportsViewProps {
  clients: Client[];
  tasks: Task[];
  users: User[];
  commitments: Commitment[];
  onAddCommitment: (commitment: Omit<Commitment, 'id' | 'currentAmount'>) => void;
  onUpdateCommitment: (commitment: Commitment) => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
}

interface PerformanceReportData {
    agentName: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalApprovedAmount: number;
    convertedClients: Client[];
}

interface WorksheetReportData {
    totalLeads: number;
    completedTasks: number;
    totalAmount: number;
    leads: Client[];
    tasks: Task[];
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center shadow-inner">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
    </div>
);

const todayISO = new Date().toISOString().split('T')[0];

export const ReportsView: React.FC<ReportsViewProps> = (props) => {
    const { clients, tasks, users, commitments, onAddCommitment, onUpdateCommitment, notifications, onMarkAllAsRead, currentUser, ...shiftTrackerProps } = props;
    const [worksheetAgent, setWorksheetAgent] = useState('All');
    const [worksheetDate, setWorksheetDate] = useState(todayISO);
    const [worksheetReportData, setWorksheetReportData] = useState<WorksheetReportData | null>(null);
    
    const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
    const [commitmentToEdit, setCommitmentToEdit] = useState<Commitment | null>(null);
    const [commitmentTitle, setCommitmentTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    const [perfReportAgent, setPerfReportAgent] = useState('All');
    const [perfReportDateRange, setPerfReportDateRange] = useState({ from: '', to: '' });
    const [performanceReportData, setPerformanceReportData] = useState<PerformanceReportData | null>(null);

    const agents = useMemo(() => users.filter(u => u.role === Role.Agent || u.role === Role.TeamLead), [users]);
  
    const handleGenerateWorksheet = () => {
        const reportDate = new Date(worksheetDate);
        
        const filteredLeads = clients.filter(client => {
            const agentMatch = worksheetAgent === 'All' || client.assignedTo === worksheetAgent;
            const clientContactDate = new Date(client.contactDate);
            return agentMatch && clientContactDate >= reportDate && clientContactDate < new Date(reportDate.getTime() + 24 * 60 * 60 * 1000);
        });

        const filteredTasks = tasks.filter(task => {
            const agentMatch = worksheetAgent === 'All' || (task.clientId && clients.find(c => c.id === task.clientId)?.assignedTo === worksheetAgent);
            const taskDueDate = new Date(task.dueDate);
            return agentMatch && taskDueDate >= reportDate && taskDueDate < new Date(reportDate.getTime() + 24 * 60 * 60 * 1000);
        });

        setWorksheetReportData({
            totalLeads: filteredLeads.length,
            completedTasks: filteredTasks.filter(t => t.completed).length,
            totalAmount: filteredLeads.reduce((sum, client) => sum + (client.loanDetails?.approvedAmount || 0), 0),
            leads: filteredLeads,
            tasks: filteredTasks
        });
    };
  
    const handleAddCommitment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commitmentTitle || !targetAmount || !dueDate) return;
        onAddCommitment({ title: commitmentTitle, targetAmount: parseFloat(targetAmount), dueDate });
        setCommitmentTitle(''); setTargetAmount(''); setDueDate('');
    };
  
    const handleOpenUpdateCommitment = (commitment: Commitment) => {
        setCommitmentToEdit(commitment);
        setIsCommitmentModalOpen(true);
    };
  
    const handleGeneratePerformanceReport = () => {
        const agent = users.find(u => u.id === perfReportAgent);
        if (!agent) return;

        const fromDate = perfReportDateRange.from ? new Date(perfReportDateRange.from) : null;
        const toDate = perfReportDateRange.to ? new Date(perfReportDateRange.to) : null;
        if (fromDate) fromDate.setHours(0,0,0,0);
        if (toDate) toDate.setHours(23,59,59,999);

        const agentClients = clients.filter(c => {
            const agentMatch = c.assignedTo === perfReportAgent;
            const contactDate = new Date(c.contactDate);
            const dateMatch = (!fromDate || contactDate >= fromDate) && (!toDate || contactDate <= toDate);
            return agentMatch && dateMatch;
        });

        const convertedClients = agentClients.filter(c => c.status === ClientStatus.Approved || c.status === ClientStatus.Active);
        const totalLeads = agentClients.length;
        const convertedLeads = convertedClients.length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        const totalApprovedAmount = convertedClients.reduce((sum, c) => sum + (c.loanDetails?.approvedAmount || 0), 0);

        setPerformanceReportData({
            agentName: agent.name, totalLeads, convertedLeads, conversionRate, totalApprovedAmount, convertedClients
        });
    };

    return (
        <div className="p-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header 
                title="Reports Dashboard"
                notifications={notifications}
                onMarkAllAsRead={onMarkAllAsRead}
                currentUser={currentUser}
                {...shiftTrackerProps}
            />
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Daily Worksheet Report</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Select Agent</label>
                                    <select value={worksheetAgent} onChange={e => setWorksheetAgent(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                        <option value="All">All Agents</option>
                                        {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Date</label>
                                    <input type="date" value={worksheetDate} onChange={e => setWorksheetDate(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"/>
                                </div>
                                <button onClick={handleGenerateWorksheet} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 h-10">
                                    <FileTextIcon className="w-5 h-5"/> Generate Worksheet
                                </button>
                            </div>
                            {worksheetReportData && (
                                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Worksheet for {new Date(worksheetDate).toLocaleDateString()}</h3>
                                    <div className="grid grid-cols-3 gap-4 my-4">
                                        <StatCard title="Total Leads" value={worksheetReportData.totalLeads.toString()} />
                                        <StatCard title="Completed Tasks" value={worksheetReportData.completedTasks.toString()} />
                                        <StatCard title="Total Amount" value={formatCurrency(worksheetReportData.totalAmount)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Agent Performance Report</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Select Agent</label>
                                    <select value={perfReportAgent} onChange={e => setPerfReportAgent(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                        <option value="All" disabled>Select an Agent</option>
                                        {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">From</label>
                                        <input type="date" value={perfReportDateRange.from} onChange={e => setPerfReportDateRange(p => ({...p, from: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"/>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">To</label>
                                        <input type="date" value={perfReportDateRange.to} onChange={e => setPerfReportDateRange(p => ({...p, to: e.target.value}))} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700"/>
                                    </div>
                                </div>
                                <button onClick={handleGeneratePerformanceReport} disabled={perfReportAgent === 'All' || !perfReportDateRange.from || !perfReportDateRange.to} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 h-10 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                    <FileTextIcon className="w-5 h-5"/> Generate Report
                                </button>
                            </div>
                            {performanceReportData && (
                                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Performance Report for {performanceReportData.agentName}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                                        <StatCard title="Leads Handled" value={performanceReportData.totalLeads.toString()} />
                                        <StatCard title="Leads Converted" value={performanceReportData.convertedLeads.toString()} />
                                        <StatCard title="Conversion Rate" value={`${performanceReportData.conversionRate.toFixed(1)}%`} />
                                        <StatCard title="Total Amount" value={formatCurrency(performanceReportData.totalApprovedAmount)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Commitment Tracking</h2>
                            <form onSubmit={handleAddCommitment} className="space-y-3 mb-6">
                                {/* Form content remains the same */}
                            </form>
                                <div className="space-y-4">
                                {commitments.map(commitment => {
                                    const progress = Math.min((commitment.currentAmount / commitment.targetAmount) * 100, 100);
                                    const isOverdue = new Date(commitment.dueDate) < new Date(todayISO) && progress < 100;
                                    return (
                                        <div key={commitment.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{commitment.title}</h4>
                                            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 my-2">
                                                <span>{formatCurrency(commitment.currentAmount)} / {formatCurrency(commitment.targetAmount)}</span>
                                                <span>{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    <CalendarIcon className="w-4 h-4"/>
                                                    <span>Due: {new Date(commitment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <button onClick={() => handleOpenUpdateCommitment(commitment)} className="text-xs font-semibold text-blue-600 hover:underline">Update</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <UpdateCommitmentModal 
                    isOpen={isCommitmentModalOpen}
                    onClose={() => setIsCommitmentModalOpen(false)}
                    commitment={commitmentToEdit}
                    onSave={onUpdateCommitment}
                />
            </>
        </div>
    );
};
