
import type { User, Task, Interaction, Client, ActivityLog, Commitment, Team, Document } from '../types';
import { Role, ClientStatus, LoanType, LeadSource, ApplicationStatus } from '../types';

export const mockUsers: User[] = [
  { 
    id: 'user-admin', 
    name: 'Rahul Kumar', 
    username: 'admin', 
    password: 'admin123', 
    role: Role.Admin, 
    email: 'rahulkumarbaliji@yopmail.com', 
    phone: '7731004638', 
    status: 'Active', 
    dob: '2000-11-22', 
    shiftStartTime: '10:00', 
    shiftEndTime: '19:00' 
  },
  { 
    id: 'user-subadmin', 
    name: 'Sub Admin', 
    username: 'subadmin', 
    password: 'password123', 
    role: Role.Agent, 
    email: 'subadmin@example.com', 
    phone: '+919876543211', 
    status: 'Active', 
    dob: '1985-05-15',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30'
  },
];

export const mockInteractions: Interaction[] = [];

export const mockClients: Client[] = [
  {
    id: 'cli-sample-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 9876543210',
    pan: 'ABCDE1234F',
    dob: '1990-05-20',
    contactDate: '2025-11-10',
    riskProfile: 'Moderate',
    financialGoals: [],
    portfolio: [],
    interactions: [],
    status: ClientStatus.Lead,
    loanType: LoanType.Home,
    leadSource: LeadSource.Website,
    createdBy: 'user-admin',
    assignedTo: 'user-subadmin',
    loanDetails: {
      requestedAmount: 5000000,
      approvedAmount: 0,
      disbursedAmount: 0,
    },
    applicationStatus: ApplicationStatus.Pending,
  }
];

export const mockTasks: Task[] = [
    {
        id: 'task-sample-1',
        clientId: 'cli-sample-1',
        title: 'Follow up with Priya Sharma',
        description: 'Initial follow-up call to discuss home loan requirements.',
        dueDate: '2025-11-17',
        completed: false,
        priority: 'High',
    }
];

export const mockActivityLogs: ActivityLog[] = [];

export const mockCommitments: Commitment[] = [];

export const mockTeams: Team[] = [];

export const mockDocuments: Document[] = [];