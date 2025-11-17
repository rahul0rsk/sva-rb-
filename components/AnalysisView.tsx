

import React, { useMemo } from 'react';
import { Header } from './Header';
import type { Notification, Client, User, Task } from '../types';
import { ClientStatus, Role, LoanType } from '../types';
import { formatCurrency, formatCurrencyForStats, daysBetween } from '../utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { UsersIcon, LoanIcon, ConversionRateIcon, ClockIcon, RupeeIcon, CheckSquareIcon } from './common/icons';

interface AnalysisViewProps {
  clients: Client[];
  users: User[];
  tasks: Task[];
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
        <div className="h-80">
            {children}
        </div>
    </div>
);

const AnalysisStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
    </div>
);


const loanTypeColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ clients, users, tasks, notifications, onMarkAllAsRead, currentUser, ...shiftTrackerProps }) => {

  const kpiStats = useMemo(() => {
    const approvedClients = clients.filter(c => c.status === ClientStatus.Approved || c.status === ClientStatus.Active);
    const totalApprovedAmount = approvedClients.reduce((sum, c) => sum + (c.loanDetails?.approvedAmount || 0), 0);
    const averageLoanSize = approvedClients.length > 0 ? totalApprovedAmount / approvedClients.length : 0;
    
    const approvalTimes = clients
        .map(c => daysBetween(c.contactDate, c.loanDetails?.approvalDate))
        .filter((days): days is number => days !== null);
    const avgTimeToApproval = approvalTimes.length > 0 ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length : 0;
    
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return { totalApprovedAmount, averageLoanSize, avgTimeToApproval, taskCompletionRate };
  }, [clients, tasks]);

  const monthlyPerformance = useMemo(() => {
    const monthData: { [key: string]: { month: string, name: string, approvedAmount: number } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    clients.forEach(client => {
        if((client.status === ClientStatus.Approved || client.status === ClientStatus.Active) && client.loanDetails?.approvalDate) {
            const date = new Date(client.loanDetails.approvalDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            if(!monthData[monthKey]) {
                monthData[monthKey] = { month: monthKey, name: `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`, approvedAmount: 0 };
            }
            monthData[monthKey].approvedAmount += client.loanDetails?.approvedAmount || 0;
        }
    });

    return Object.values(monthData).sort((a,b) => a.month.localeCompare(b.month)).slice(-6);
  }, [clients]);

  const loanAmountAnalysis = useMemo(() => {
    const analysis: { [key in LoanType]?: { name: string, requested: number[], approved: number[] } } = {};
    
    clients.forEach(c => {
        if (!analysis[c.loanType]) {
            analysis[c.loanType] = { name: c.loanType, requested: [], approved: [] };
        }
        analysis[c.loanType]!.requested.push(c.loanDetails?.requestedAmount || 0);
        if (c.status === ClientStatus.Approved || c.status === ClientStatus.Active) {
            analysis[c.loanType]!.approved.push(c.loanDetails?.approvedAmount || 0);
        }
    });

    return Object.values(analysis).map(data => ({
        name: data!.name,
        'Avg. Requested': data!.requested.length > 0 ? data!.requested.reduce((a,b) => a+b, 0) / data!.requested.length : 0,
        'Avg. Approved': data!.approved.length > 0 ? data!.approved.reduce((a,b) => a+b, 0) / data!.approved.length : 0,
    }));
  }, [clients]);

  const taskStatusData = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdue = tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - overdue - completed;
    return [
        { name: 'Pending', value: pending, fill: '#3b82f6' },
        { name: 'Overdue', value: overdue, fill: '#ef4444' },
        { name: 'Completed', value: completed, fill: '#22c55e' },
    ];
  }, [tasks]);


  return (
    <div className="p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
      <Header 
        title="Analysis Dashboard"
        subtitle="Deep dive into your CRM data and performance metrics."
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        {...shiftTrackerProps}
      />
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalysisStatCard title="Total Approved Amount" value={formatCurrencyForStats(kpiStats.totalApprovedAmount)} icon={<RupeeIcon className="w-6 h-6 text-green-600"/>} color="bg-green-100 dark:bg-green-900/20" />
            <AnalysisStatCard title="Average Loan Size" value={formatCurrencyForStats(kpiStats.averageLoanSize)} icon={<LoanIcon className="w-6 h-6 text-blue-600"/>} color="bg-blue-100 dark:bg-blue-900/20" />
            <AnalysisStatCard title="Avg. Time to Approval" value={`${kpiStats.avgTimeToApproval.toFixed(1)} days`} icon={<ClockIcon className="w-6 h-6 text-yellow-600"/>} color="bg-yellow-100 dark:bg-yellow-900/20" />
            <AnalysisStatCard title="Task Completion Rate" value={`${kpiStats.taskCompletionRate.toFixed(1)}%`} icon={<CheckSquareIcon className="w-6 h-6 text-purple-600"/>} color="bg-purple-100 dark:bg-purple-900/20" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Monthly Approved Loan Volume">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => formatCurrencyForStats(value as number)} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: 'none', color: 'white' }} />
                        <Legend />
                        <Bar dataKey="approvedAmount" name="Approved Amount" fill="#3b82f6" barSize={30} />
                        <Line type="monotone" dataKey="approvedAmount" stroke="#ff7300" strokeWidth={2} dot={false} name="Trend" />
                    </ComposedChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Task Status Overview">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                            return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>{(percent * 100).toFixed(0)}%</text>;
                        }}>
                           {taskStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} tasks`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>

        <ChartCard title="Loan Amount Analysis by Type (Average)">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanAmountAnalysis} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => formatCurrencyForStats(value as number)} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: 'none', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="Avg. Requested" fill="#8884d8" />
                    <Bar dataKey="Avg. Approved" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};