




import React, { useMemo } from 'react';
import type { Client, Task, User, Notification } from '../types';
import { ClientStatus, Role, View } from '../types';
import { Header } from './Header';
import { formatCurrencyForStats, daysBetween } from '../utils';
import {
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    RupeeIcon,
    LoanIcon,
    ConversionRateIcon,
    ActiveAgentIcon,
    CheckSquareIcon,
    AlertTriangleIcon,
    AdminPanelIcon,
    TeamIcon,
    UserIcon,
} from './common/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';


interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  users: User[];
  onSelectClient: (client: Client) => void;
  currentUser: User;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
  onToggleSidebar?: () => void;
  navigateToFilteredView: (view: View, filters: any) => void;
  onOpenDialPad: () => void;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, onClick }) => {
  const content = (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex items-center justify-between ${onClick ? 'hover:shadow-lg transition-shadow duration-300' : ''}`}>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  );
  
  return onClick ? <button onClick={onClick} className="text-left w-full">{content}</button> : content;
};

const ActiveUsersCard: React.FC<{
  total: number;
  admins: number;
  subAdmins: number;
  teamLeads: number;
  agents: number;
  trainees: number;
  onClick: () => void;
}> = ({ total, admins, subAdmins, teamLeads, agents, trainees, onClick }) => (
  <button onClick={onClick} className="text-left w-full bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 col-span-1 sm:col-span-2">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Users</p>
        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-1">{total}</p>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/20">
        <UsersIcon className="w-6 h-6 text-cyan-600"/>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
      <div title="Admins">
        <AdminPanelIcon className="w-6 h-6 mx-auto text-purple-500" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{admins || 0}</p>
      </div>
       <div title="Sub-Admins">
        <AdminPanelIcon className="w-6 h-6 mx-auto text-fuchsia-500" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{subAdmins || 0}</p>
      </div>
      <div title="Team Leads">
        <TeamIcon className="w-6 h-6 mx-auto text-sky-500" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{teamLeads || 0}</p>
      </div>
      <div title="Agents">
        <ActiveAgentIcon className="w-6 h-6 mx-auto text-green-500" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{agents || 0}</p>
      </div>
      <div title="Trainees">
        <UserIcon className="w-6 h-6 mx-auto text-yellow-500" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{trainees || 0}</p>
      </div>
    </div>
  </button>
);


const trendData = [
  { month: 'Feb', approved: 4, rejected: 1 },
  { month: 'Mar', approved: 5, rejected: 2 },
  { month: 'Apr', approved: 7, rejected: 1 },
  { month: 'May', approved: 6, rejected: 3 },
  { month: 'Jun', approved: 9, rejected: 2 },
  { month: 'Jul', approved: 11, rejected: 4 },
];

const pipelineColors: { [key in ClientStatus]: string } = {
  [ClientStatus.Lead]: '#3b82f6',
  [ClientStatus.FollowUp]: '#f59e0b',
  [ClientStatus.Approved]: '#22c55e',
  [ClientStatus.Active]: '#4f46e5',
  [ClientStatus.Rejected]: '#ef4444',
};


export const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, users, onSelectClient, currentUser, notifications, onMarkAllAsRead, onToggleSidebar, navigateToFilteredView, onOpenDialPad, ...shiftTrackerProps }) => {

    const { visibleClients, visibleTasks } = useMemo(() => {
        const canViewAll = [Role.Admin, Role.SubAdmin, Role.TeamLead].includes(currentUser.role);
        if (canViewAll) {
            return { visibleClients: clients, visibleTasks: tasks };
        }

        let userClients: Client[] = [];
        if (currentUser.role === Role.Agent) {
            userClients = clients.filter(c => c.assignedTo === currentUser.id);
        } else if (currentUser.role === Role.Trainee) {
            userClients = clients.filter(c => c.createdBy === currentUser.id);
        } else {
            userClients = clients.filter(c => c.assignedTo === currentUser.id || c.createdBy === currentUser.id);
        }
        
        const userClientIds = new Set(userClients.map(c => c.id));
        const userTasks = tasks.filter(t => t.clientId && userClientIds.has(t.clientId));

        return { visibleClients: userClients, visibleTasks: userTasks };
    }, [clients, tasks, currentUser]);

    const totalLeads = visibleClients.length;
    const approvalCount = visibleClients.filter(c => c.status === ClientStatus.Approved).length;
    const rejectionCount = visibleClients.filter(c => c.status === ClientStatus.Rejected).length;
    const pendingFollowups = visibleClients.filter(c => c.status === ClientStatus.Lead || c.status === ClientStatus.FollowUp).length;
    const activeLoans = visibleClients.filter(c => c.status === ClientStatus.Active).length;
    
    const approvalAmount = visibleClients
        .filter(c => c.status === ClientStatus.Approved || c.status === ClientStatus.Active)
        .reduce((sum, c) => sum + (c.loanDetails?.approvedAmount || 0), 0);
        
    const disbursementAmount = visibleClients
        .filter(c => c.status === ClientStatus.Active)
        .reduce((sum, c) => sum + (c.loanDetails?.disbursedAmount || 0), 0);

    const conversionRate = totalLeads > 0 ? ((approvalCount + activeLoans) / totalLeads) * 100 : 0;

    const pipelineData = Object.values(ClientStatus).map(status => ({
        name: status,
        value: visibleClients.filter(c => c.status === status).length
    })).filter(item => item.value > 0);

    const approvalTimes = visibleClients
        .map(c => daysBetween(c.contactDate, c.loanDetails?.approvalDate))
        .filter((days): days is number => days !== null && days >= 0);
    const averageApprovalTime = approvalTimes.length > 0
        ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
        : 0;

    const { activeUserCounts, totalActiveUsers } = useMemo(() => {
        const counts = users.filter(u => u.status === 'Active').reduce((acc: Record<Role, number>, user: User) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<Role, number>);
        const total = Object.values(counts).reduce((sum: number, count: number) => sum + count, 0);
        return { activeUserCounts: counts, totalActiveUsers: total };
    }, [users]);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const overdueTasks = visibleTasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;


  return (
    <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900 min-h-screen">
        <Header 
            title="Dashboard" 
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            currentUser={currentUser}
            onToggleSidebar={onToggleSidebar}
            onOpenDialPad={onOpenDialPad}
            {...shiftTrackerProps}
        />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
        <StatCard title="Total Leads" value={totalLeads.toString()} icon={<UsersIcon className="w-6 h-6 text-blue-600"/>} color="bg-blue-100 dark:bg-blue-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: 'All' })} />
        <StatCard title="Pending/Followups" value={pendingFollowups.toString()} icon={<ClockIcon className="w-6 h-6 text-yellow-600"/>} color="bg-yellow-100 dark:bg-yellow-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Lead, ClientStatus.FollowUp] })} />
        <StatCard title="Approval Count" value={approvalCount.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-green-600"/>} color="bg-green-100 dark:bg-green-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Approved] })} />
        <StatCard title="Active Loans" value={activeLoans.toString()} icon={<LoanIcon className="w-6 h-6 text-indigo-600"/>} color="bg-indigo-100 dark:bg-indigo-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Active] })} />
        <StatCard title="Rejection Count" value={rejectionCount.toString()} icon={<XCircleIcon className="w-6 h-6 text-red-600"/>} color="bg-red-100 dark:bg-red-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Rejected] })} />
        <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={<ConversionRateIcon className="w-6 h-6 text-teal-600"/>} color="bg-teal-100 dark:bg-teal-900/20" />
        
        <StatCard title="Approval Amount" value={formatCurrencyForStats(approvalAmount)} icon={<RupeeIcon className="w-6 h-6 text-green-600"/>} color="bg-green-100 dark:bg-green-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Approved, ClientStatus.Active] })}/>
        <StatCard title="Disbursement Amount" value={formatCurrencyForStats(disbursementAmount)} icon={<RupeeIcon className="w-6 h-6 text-purple-600"/>} color="bg-purple-100 dark:bg-purple-900/20" onClick={() => navigateToFilteredView(View.LeadsManagement, { status: [ClientStatus.Active] })}/>
        <StatCard title="Avg. Approval Time" value={`${averageApprovalTime.toFixed(1)} days`} icon={<ClockIcon className="w-6 h-6 text-orange-600"/>} color="bg-orange-100 dark:bg-orange-900/20" />
        <ActiveUsersCard
            total={totalActiveUsers}
            admins={activeUserCounts[Role.Admin] || 0}
            subAdmins={activeUserCounts[Role.SubAdmin] || 0}
            teamLeads={activeUserCounts[Role.TeamLead] || 0}
            agents={activeUserCounts[Role.Agent] || 0}
            trainees={activeUserCounts[Role.Trainee] || 0}
            onClick={() => navigateToFilteredView(View.AdminPanel, { status: 'Active', role: 'All' })}
        />
        <StatCard title="Overdue Tasks" value={overdueTasks.toString()} icon={<AlertTriangleIcon className="w-6 h-6 text-red-600"/>} color="bg-red-100 dark:bg-red-900/20" onClick={() => navigateToFilteredView(View.TaskManagement, { status: 'Overdue' })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm lg:col-span-3">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Lead Conversion Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: 'none', color: 'white', borderRadius: '4px' }}/>
                <Legend iconType="circle" iconSize={10} />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#22c55e" fillOpacity={1} fill="url(#colorApproved)" />
                <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" fillOpacity={1} fill="url(#colorRejected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm lg:col-span-2">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Lead Pipeline</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={pipelineData}
                          cx="40%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="80%"
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                      >
                          {pipelineData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pipelineColors[entry.name as ClientStatus]} />
                          ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: 'none', color: 'white', borderRadius: '4px' }}/>
                      <Legend iconType="circle" iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <button className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 hover:underline">
            Improve pipeline
          </button>
        </div>
      </div>
    </div>
  );
};