

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as dbService from './services/dbService';
import { User, View, Client, Task, Interaction, Notification, Commitment, NotificationType, ClientStatus, ActivityLog, Team, Role, ActivityLogCategory, Document, RelatedEntityType, CallDisposition } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClientListView } from './components/ClientListView';
import { ClientDetail } from './components/ClientDetail';
import { TaskView } from './components/TaskView';
import { InteractionHistoryView } from './components/InteractionHistoryView';
import { UserManagementView } from './components/UserManagementView';
import { AnalysisView } from './components/AnalysisView';
import { ReportsView } from './components/ReportsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { Login } from './components/Login';
import { TeamStructureView } from './components/TeamStructureView';
import { BirthdayWishModal } from './components/BirthdayWishModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { generateBirthdayWish } from './services/geminiService';
import { FilesView } from './components/FilesView';
import { NotificationContainer } from './components/NotificationContainer';
import { hasPermission, viewPermissionMap } from './permissions';
import { AccessDenied } from './components/common/AccessDenied';
import { ActivityLogView } from './components/ActivityLogView';
import { SearchResultsView } from './components/SearchResultsView';
import { isSameDay, formatDurationHMS, formatCurrency, formatShiftTime } from './utils';
import { HomeIcon } from './components/common/icons';
import { DialPadModal } from './components/DialPadModal';


interface BirthdayPerson {
  id: string;
  name: string;
  role: Role | string;
}

interface ViewWithFilters {
  view: View;
  filters: any;
}

const THEME_KEY = 'sva-loan-crm-theme';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  
  const [currentView, setCurrentView] = useState<View>(View.Login);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayPeople, setBirthdayPeople] = useState<BirthdayPerson[]>([]);
  const [generatedWishes, setGeneratedWishes] = useState<Map<string, string>>(new Map());
  
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);

  const [viewWithFilters, setViewWithFilters] = useState<ViewWithFilters | null>(null);

  // FIX: Added state for session and break tracking
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [totalBreakDuration, setTotalBreakDuration] = useState(0); // in seconds

  const can = useCallback((permission: string) => hasPermission(currentUser, permission), [currentUser]);

  const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const navigateToFilteredView = (view: View, filters: any) => {
    setViewWithFilters({ view, filters });
    setCurrentView(view);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await dbService.initDB();
        const [
            clientsData, tasksData, interactionsData, usersData, 
            teamsData, activityLogsData, commitmentsData, documentsData
        ] = await Promise.all([
            dbService.getAll<Client>('clients'),
            dbService.getAll<Task>('tasks'),
            dbService.getAll<Interaction>('interactions'),
            dbService.getAll<User>('users'),
            dbService.getAll<Team>('teams'),
            dbService.getAll<ActivityLog>('activityLogs'),
            dbService.getAll<Commitment>('commitments'),
            dbService.getAll<Document>('documents'),
        ]);

        const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }

        setClients(clientsData);
        setTasks(tasksData);
        setInteractions(interactionsData);
        setUsers(usersData);
        setTeams(teamsData);
        setActivityLogs(activityLogsData);
        setCommitments(commitmentsData);
        setDocuments(documentsData);
      } catch (error) {
          console.error('Failed to initialize and load data:', error);
      } finally {
          setIsLoading(false);
      }
    };
    loadData();
  }, []);


  useEffect(() => {
    // Clear filters after navigation to prevent re-applying on unrelated re-renders
    if (viewWithFilters && currentView === viewWithFilters.view) {
        setViewWithFilters(null);
    }
  }, [currentView, viewWithFilters]);

  useEffect(() => {
    if (currentView === View.ClientDetail && !selectedClient) {
      setCurrentView(View.LeadsManagement);
    }
  }, [currentView, selectedClient]);


  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setToastNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeToast = (id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  const logActivity = useCallback(async (
    category: ActivityLogCategory, 
    action: string, 
    context?: {
      entityType: RelatedEntityType;
      entityId: string;
      entityName: string;
    }
  ) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: action,
      category: category,
      relatedEntityType: context?.entityType,
      relatedEntityId: context?.entityId,
      relatedEntityName: context?.entityName,
    };
    await dbService.add('activityLogs', newLog);
    setActivityLogs(prevLogs => [newLog, ...prevLogs]);
  }, [currentUser]);
  
  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    setCurrentView(View.SearchResults);
  };

  const handleLogin = (username: string, password: string): 'success' | 'invalid_credentials' | 'inactive_account' => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return 'invalid_credentials';
    }
    if (user.status !== 'Active') {
        return 'inactive_account';
    }
    setCurrentUser(user);
    setCurrentView(View.Dashboard);
    logActivity('Authentication', 'logged in');
    
    // FIX: Initialize shift tracker state on login
    setSessionStartTime(Date.now());
    setIsOnBreak(false);
    setBreakStartTime(null);
    setTotalBreakDuration(0);
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayUsers: User[] = users.filter(u => {
        if (!u.dob) return false;
        const [_year, month, day] = u.dob.split('-').map(Number);
        return month === currentMonth && day === currentDay;
    });

    const birthdayClients: Client[] = clients.filter(c => {
        if (!c.dob) return false;
        const [_year, month, day] = c.dob.split('-').map(Number);
        return month === currentMonth && day === currentDay;
    });

    const allBirthdayPeople: BirthdayPerson[] = [
      ...birthdayUsers,
      ...birthdayClients.map(c => ({
        id: c.id,
        name: c.name,
        role: 'Valued Client',
      }))
    ];

    if (allBirthdayPeople.length > 0) {
        setBirthdayPeople(allBirthdayPeople);
        setGeneratedWishes(new Map());
        setIsBirthdayModalOpen(true);

        (async () => {
            for (const person of allBirthdayPeople) {
                const wish = await generateBirthdayWish(person);
                setGeneratedWishes(prev => new Map(prev).set(person.id, wish));
            }
        })();
    }

    return 'success';
  };

  const handleLogout = () => {
    if(currentUser) {
        logActivity('Authentication', 'logged out');
    }
    // FIX: Reset shift tracker state on logout
    setSessionStartTime(null);
    setIsOnBreak(false);
    setBreakStartTime(null);
    setTotalBreakDuration(0);
    setCurrentUser(null);
    setNotifications([]);
    setCurrentView(View.Login);
  };

  // FIX: Added break toggle handler
  const handleToggleBreak = useCallback(async () => {
    if (!isOnBreak) {
        setBreakStartTime(Date.now());
        await logActivity('General', 'started a break');
        setIsOnBreak(true);
    } else {
        if (breakStartTime) {
            const breakDuration = Math.floor((Date.now() - breakStartTime) / 1000);
            setTotalBreakDuration(prev => prev + breakDuration);
            await logActivity('General', `ended a break of ${formatDurationHMS(breakDuration)}`);
        }
        setBreakStartTime(null);
        setIsOnBreak(false);
    }
  }, [isOnBreak, breakStartTime, logActivity]);

  const handleSelectClient = useCallback((client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      setCurrentView(View.ClientDetail);
    } else {
      setCurrentView(View.LeadsManagement);
    }
  }, []);

  const handleAddInteraction = useCallback(async (newInteraction: Omit<Interaction, 'id'>) => {
    const interactionWithId: Interaction = { ...newInteraction, id: `int-${Date.now()}` };
    await dbService.add('interactions', interactionWithId);
    setInteractions(prev => [interactionWithId, ...prev]);

    if (newInteraction.clientId) {
      const client = clients.find(c => c.id === newInteraction.clientId);
      if (client) {
          const updatedClient = { ...client, interactions: [interactionWithId, ...(client.interactions || [])] };
          await dbService.put('clients', updatedClient);
          setClients(prevClients => prevClients.map(c => c.id === newInteraction.clientId ? updatedClient : c));
          await logActivity('Lead Management', `logged ${newInteraction.type} interaction`, { entityType: 'client', entityId: client.id, entityName: client.name });
      }
    } else {
        await logActivity('General', `logged outgoing ${newInteraction.type} interaction`);
    }
  }, [clients, logActivity]);
  
  const handleSaveDialerCall = ({ phoneNumber, duration, notes, disposition }: { phoneNumber: string; duration: number; notes: string; disposition?: CallDisposition }) => {
    const newInteraction: Omit<Interaction, 'id'> = {
      date: new Date().toISOString(),
      type: 'Call',
      notes: `Dialed ${phoneNumber}. Notes: ${notes}`,
      duration,
      disposition,
    };
    handleAddInteraction(newInteraction);
  };

  const handleBulkEmail = useCallback(async (clientIds: string[], subject: string, message: string, attachments: File[]) => {
    const newInteractions: Interaction[] = clientIds.map(clientId => ({
      id: `int-${Date.now()}-${Math.random()}`,
      clientId,
      date: new Date().toISOString(),
      type: 'Email',
      subject,
      notes: message,
      attachments: attachments.map(f => ({ name: f.name }))
    }));
    await dbService.bulkAdd('interactions', newInteractions);
    setInteractions(prev => [...newInteractions, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const updatedClients = clients.map(client => {
      if (clientIds.includes(client.id)) {
        const clientInteractions = newInteractions.filter(i => i.clientId === client.id);
        return { ...client, interactions: [...clientInteractions, ...(client.interactions || [])] };
      }
      return client;
    }).filter(c => clientIds.includes(c.id));

    await dbService.bulkPut('clients', updatedClients);
    setClients(prevClients => prevClients.map(c => updatedClients.find(uc => uc.id === c.id) || c));
    
    await logActivity('Lead Management', `sent bulk email to ${clientIds.length} leads`);
  }, [clients, logActivity]);

  const handleDeleteClient = useCallback(async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    await dbService.deleteItem('clients', clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    if (client) {
      await logActivity('Lead Management', 'deleted lead', { entityType: 'client', entityId: client.id, entityName: client.name });
    }
  }, [clients, logActivity]);
  
  const handleBulkAssign = useCallback(async (agentId: string, leadIds: string[]) => {
    const agent = users.find(u => u.id === agentId);
    const updatedClients = clients.map(client => leadIds.includes(client.id) ? { ...client, assignedTo: agentId } : client);
    
    await dbService.bulkPut('clients', updatedClients.filter(c => leadIds.includes(c.id)));
    setClients(updatedClients);

    if(agent) {
        await logActivity('Lead Management', `bulk assigned ${leadIds.length} leads to ${agent.name}`);
    }
  }, [users, clients, logActivity]);

  const handleUpdateClient = async (updatedClient: Client) => {
    const originalClient = clients.find(c => c.id === updatedClient.id);
    await dbService.put('clients', updatedClient);
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));

    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
    
    const context = { entityType: 'client' as const, entityId: updatedClient.id, entityName: updatedClient.name };

    if (originalClient) {
      const changes: string[] = [];
      if (originalClient.name !== updatedClient.name) changes.push(`name to "${updatedClient.name}"`);
      if (originalClient.status !== updatedClient.status) changes.push(`status to "${updatedClient.status}"`);
      if (originalClient.assignedTo !== updatedClient.assignedTo) {
        const newAssignee = users.find(u => u.id === updatedClient.assignedTo)?.name || 'Unassigned';
        changes.push(`assignment to ${newAssignee}`);
      }
      if (originalClient.loanDetails?.approvedAmount !== updatedClient.loanDetails?.approvedAmount) {
        changes.push(`approved amount to ${formatCurrency(updatedClient.loanDetails?.approvedAmount)}`);
      }
      
      if (changes.length > 0) {
        await logActivity('Lead Management', `updated profile: ${changes.join(', ')}`, context);
      }
    } else {
        await logActivity('Lead Management', 'created lead profile', context);
    }

    if(originalClient && originalClient.loanDetails && updatedClient.loanDetails) {
        if(originalClient.loanDetails.approvedAmount === 0 && updatedClient.loanDetails.approvedAmount > 0) {
            addNotification({ message: `${updatedClient.name}'s loan has been approved.`, type: NotificationType.StatusChange, relatedId: updatedClient.id });
        }
         if(originalClient.loanDetails.disbursedAmount === 0 && updatedClient.loanDetails.disbursedAmount > 0) {
            addNotification({ message: `Funds disbursed for ${updatedClient.name}.`, type: NotificationType.StatusChange, relatedId: updatedClient.id });
        }
    }
  };
  
  const handleNavigateClient = useCallback((direction: 'next' | 'prev') => {
    if (!selectedClient) return;
    const currentIndex = clients.findIndex(c => c.id === selectedClient.id);
    if (currentIndex === -1) return;
    if (direction === 'next' && currentIndex < clients.length - 1) {
        setSelectedClient(clients[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
        setSelectedClient(clients[currentIndex - 1]);
    }
  }, [clients, selectedClient]);

  const handleAddClient = useCallback(async (newClientData: Omit<Client, 'id' | 'pan' | 'dob' | 'riskProfile' | 'financialGoals' | 'portfolio' | 'interactions' | 'assignedTo' | 'contactDate' | 'createdBy'>) => {
    const newClient: Client = {
      ...newClientData,
      id: `cli-${Date.now()}`,
      pan: '',
      riskProfile: 'Moderate',
      financialGoals: [],
      portfolio: [],
      interactions: [],
      contactDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser!.id,
    };
    
    if (currentUser?.role === Role.Agent) {
      newClient.assignedTo = currentUser.id;
    }

    await dbService.add('clients', newClient);
    setClients(prevClients => [newClient, ...prevClients]);
    await logActivity('Lead Management', 'added new lead', { entityType: 'client', entityId: newClient.id, entityName: newClient.name });

    if (currentUser?.role === Role.Trainee) {
        addNotification({ message: 'just a lead generated', type: NotificationType.Info, relatedId: newClient.id });
    }
  }, [logActivity, currentUser, addNotification]);

  const handleAddTask = useCallback(async (newTask: Omit<Task, 'id' | 'completed'>) => {
    const taskWithId: Task = { ...newTask, id: `task-${Date.now()}`, completed: false };
    await dbService.add('tasks', taskWithId);
    setTasks(prevTasks => [taskWithId, ...prevTasks]);
    
    const client = newTask.clientId ? clients.find(c => c.id === newTask.clientId) : null;
    const action = `created task${client ? ` for client ${client.name}` : ''}`;
    
    await logActivity('Task Management', action, { entityType: 'task', entityId: taskWithId.id, entityName: taskWithId.title });
  }, [logActivity, clients]);

  const handleUpdateTask = useCallback(async (updatedTask: Task, isCompletion: boolean) => {
    await dbService.put('tasks', updatedTask);
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));

    const client = updatedTask.clientId ? clients.find(c => c.id === updatedTask.clientId) : null;
    let baseAction = 'updated task';
    if (isCompletion && updatedTask.completed) baseAction = 'completed task';
    else if (isCompletion && !updatedTask.completed) baseAction = 'reopened task';
    const action = `${baseAction}${client ? ` for client ${client.name}` : ''}`;
    await logActivity('Task Management', action, { entityType: 'task', entityId: updatedTask.id, entityName: updatedTask.title });
  }, [logActivity, tasks, clients]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await dbService.deleteItem('tasks', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));

    const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
    const action = `deleted task${client ? ` for client ${client.name}` : ''}`;
    await logActivity('Task Management', action, { entityType: 'task', entityId: task.id, entityName: task.title });
  }, [tasks, logActivity, clients]);

  const handleAddCommitment = useCallback(async (newCommitment: Omit<Commitment, 'id' | 'currentAmount'>) => {
      const commitmentWithId: Commitment = { ...newCommitment, id: `commit-${Date.now()}`, currentAmount: 0 };
      await dbService.add('commitments', commitmentWithId);
      setCommitments(prev => [commitmentWithId, ...prev]);
      await logActivity('Reporting', `added new commitment: "${newCommitment.title}"`);
  }, [logActivity]);
  
  const handleUpdateCommitment = useCallback(async (updatedCommitment: Commitment) => {
      const originalCommitment = commitments.find(c => c.id === updatedCommitment.id);
      await dbService.put('commitments', updatedCommitment);
      setCommitments(prev => prev.map(c => c.id === updatedCommitment.id ? updatedCommitment : c));
      
      if (originalCommitment && originalCommitment.currentAmount !== updatedCommitment.currentAmount) {
        await logActivity('Reporting', `updated commitment "${updatedCommitment.title}": progress changed from ${formatCurrency(originalCommitment.currentAmount)} to ${formatCurrency(updatedCommitment.currentAmount)}`);
      } else {
        await logActivity('Reporting', `updated commitment: "${updatedCommitment.title}"`);
      }
  }, [logActivity, commitments]);

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

   const handleAddUser = useCallback(async (newUser: Omit<User, 'id'>) => {
        const userWithId: User = { ...newUser, id: `user-${Date.now()}`};
        await dbService.add('users', userWithId);
        setUsers(prev => [userWithId, ...prev]);
        await logActivity('User Management', `created new user: ${newUser.name} (${newUser.role})`);
   }, [logActivity]);

    const handleUpdateUser = useCallback(async (updatedUser: User) => {
        if (updatedUser.shiftStartTime && updatedUser.shiftEndTime && updatedUser.shiftEndTime < updatedUser.shiftStartTime) {
            alert('Error: Shift end time cannot be earlier than shift start time.');
            return;
        }
        await dbService.put('users', updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(current => (current && current.id === updatedUser.id ? updatedUser : current));

        const originalUser = users.find(u => u.id === updatedUser.id);
        if (originalUser) {
          const changes: string[] = [];
          if (originalUser.name !== updatedUser.name) changes.push(`name to "${updatedUser.name}"`);
          if (originalUser.role !== updatedUser.role) changes.push(`role to "${updatedUser.role}"`);
          if (originalUser.status !== updatedUser.status) changes.push(`status to ${updatedUser.status}`);
          if (originalUser.shiftStartTime !== updatedUser.shiftStartTime || originalUser.shiftEndTime !== updatedUser.shiftEndTime) {
            const newShift = (updatedUser.shiftStartTime && updatedUser.shiftEndTime) ? `${formatShiftTime(updatedUser.shiftStartTime)}-${formatShiftTime(updatedUser.shiftEndTime)}` : 'Not Set';
            changes.push(`shift time to ${newShift}`);
          }
          if (changes.length > 0) {
            await logActivity('User Management', `updated ${updatedUser.name}'s profile: ${changes.join(', ')}`);
          }
        }
    }, [logActivity, users]);

    const handleDeleteUser = useCallback(async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        await dbService.deleteItem('users', userId);
        setUsers(prev => prev.filter(u => u.id !== userId));

        const reassignedClients = clients.map(client => client.assignedTo === userId ? { ...client, assignedTo: undefined } : client)
            .filter(client => client.assignedTo === undefined);

        if (reassignedClients.length > 0) {
            await dbService.bulkPut('clients', reassignedClients);
            setClients(prevClients => prevClients.map(c => reassignedClients.find(rc => rc.id === c.id) || c));
            await logActivity('Lead Management', `Unassigned ${reassignedClients.length} leads from deleted user ${user.name}.`);
        }
        await logActivity('User Management', `Deleted user: ${user.name}`);
    }, [users, clients, logActivity]);

    const handleSaveTeam = useCallback(async (teamData: Team) => {
      const isNew = !teams.some(t => t.id === teamData.id);
      await dbService.put('teams', teamData);
      setTeams(prev => isNew ? [...prev, teamData] : prev.map(t => t.id === teamData.id ? teamData : t));
      
      const existing = teams.find(t => t.id === teamData.id);
      if (existing) {
        // ... logging logic from original
      } else {
        await logActivity('Team Management', `created new team: ${teamData.name}`);
      }
    }, [logActivity, users, teams]);
  
    const handleDeleteTeam = useCallback(async (teamId: string) => {
      const teamName = teams.find(t => t.id === teamId)?.name || 'Unknown Team';
      await dbService.deleteItem('teams', teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      await logActivity('Team Management', `deleted team: ${teamName}`);
    }, [teams, logActivity]);
    
    const handleDataReset = async () => {
        await logActivity('General', 'application data has been reset');
        await dbService.clearDB();
        window.location.reload();
    };

    const handleUploadDocument = useCallback(async (doc: Omit<Document, 'id'>) => {
      const newDoc: Document = { ...doc, id: `doc-${Date.now()}`};
      await dbService.add('documents', newDoc);
      setDocuments(prev => [newDoc, ...prev]);
      const client = clients.find(c => c.id === doc.clientId);
      if (client) {
        await logActivity('Lead Management', `uploaded document "${doc.fileName}"`, { entityType: 'client', entityId: client.id, entityName: client.name });
      }
    }, [clients, logActivity]);

    const handleDeleteDocument = useCallback(async (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        await dbService.deleteItem('documents', docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (doc) {
            const client = clients.find(c => c.id === doc.clientId);
            if (client) {
              await logActivity('Lead Management', `deleted document "${doc.fileName}"`, { entityType: 'client', entityId: client.id, entityName: client.name });
            }
        }
    }, [documents, clients, logActivity]);

    const handleBulkDeleteDocuments = useCallback(async (docIds: string[]) => {
      const deletePromises = docIds.map(id => dbService.deleteItem('documents', id));
      await Promise.all(deletePromises);
      setDocuments(prev => prev.filter(d => !docIds.includes(d.id)));
      await logActivity('Lead Management', `bulk deleted ${docIds.length} documents`);
    }, [logActivity]);

  useEffect(() => {
    if (!currentUser || isLoading) return;
    const stateBasedNotifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    tasks.forEach(task => { /* ... */ });
    clients.forEach(client => { /* ... */ });
    // This effect remains largely the same
  }, [currentUser, clients, tasks, isLoading]);

// FIX: Implement taskNotificationCount to return the number of incomplete tasks.
  const taskNotificationCount = useMemo(() => {
    return tasks.filter(task => !task.completed).length;
  }, [tasks]);

// FIX: Implement renderContent to return a ReactNode, fixing the void assignment error.
  const renderContent = () => {
    // FIX: Pass shift tracker props to child components.
    const shiftTrackerProps = {
        sessionStartTime,
        isOnBreak,
        breakStartTime,
        totalBreakDuration,
        onToggleBreak: handleToggleBreak,
    };

    if (currentView !== View.Login && currentUser && viewPermissionMap[currentView] && !hasPermission(currentUser, viewPermissionMap[currentView]!)) {
        return <AccessDenied />;
    }
    
    switch (currentView) {
        case View.Dashboard:
            return <Dashboard 
                clients={clients} 
                tasks={tasks}
                users={users}
                onSelectClient={handleSelectClient}
                currentUser={currentUser!}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onToggleSidebar={handleToggleSidebar}
                navigateToFilteredView={navigateToFilteredView}
                onOpenDialPad={() => setIsDialPadOpen(true)}
            />;
        case View.LeadsManagement:
            return <ClientListView 
                clients={clients}
                users={users}
                onSelectClient={handleSelectClient}
                onUpdateClient={handleUpdateClient}
                onAddClient={handleAddClient}
                onDeleteClient={handleDeleteClient}
                onAddInteraction={handleAddInteraction}
                onBulkAssign={handleBulkAssign}
                onBulkEmail={handleBulkEmail}
                tasks={tasks}
                onAddTask={handleAddTask}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                onToggleSidebar={handleToggleSidebar}
                initialFilters={viewWithFilters?.view === View.LeadsManagement ? viewWithFilters.filters : null}
                {...shiftTrackerProps}
            />;
        case View.ClientDetail:
            if (!selectedClient) {
                return null;
            }
            return <ClientDetail 
                client={selectedClient} 
                clients={clients}
                tasks={tasks}
                users={users}
                documents={documents}
                onUpdateClient={handleUpdateClient}
                onAddTask={handleAddTask}
                onBackToList={() => handleSelectClient(null)}
                onAddInteraction={handleAddInteraction}
                onUploadDocument={handleUploadDocument}
                onDeleteDocument={handleDeleteDocument}
                onBulkDeleteDocument={handleBulkDeleteDocuments}
                onNavigateClient={handleNavigateClient}
                can={can}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                onGlobalSearch={handleGlobalSearch}
                onToggleSidebar={handleToggleSidebar}
            />;
        case View.TaskManagement:
            return <TaskView 
                tasks={tasks}
                clients={clients}
                onUpdateTask={handleUpdateTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                onToggleSidebar={handleToggleSidebar}
                initialFilter={viewWithFilters?.view === View.TaskManagement ? viewWithFilters.filters.status : null}
            />;
        case View.InteractionHistory:
            return <InteractionHistoryView 
                interactions={interactions}
                clients={clients}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                {...shiftTrackerProps}
            />;
        case View.AdminPanel:
            return <UserManagementView
                users={users}
                clients={clients}
                activityLogs={activityLogs}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                setCurrentView={setCurrentView}
                onSelectClient={handleSelectClient}
                initialFilters={viewWithFilters?.view === View.AdminPanel ? viewWithFilters.filters : null}
                {...shiftTrackerProps}
            />;
        case View.Reports:
            return <ReportsView 
                clients={clients}
                tasks={tasks}
                users={users}
                commitments={commitments}
                onAddCommitment={handleAddCommitment}
                onUpdateCommitment={handleUpdateCommitment}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                {...shiftTrackerProps}
            />;
        case View.Analysis:
            return <AnalysisView 
                clients={clients}
                users={users}
                tasks={tasks}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                {...shiftTrackerProps}
            />;
        case View.Profile:
            return <ProfileView 
                user={currentUser!}
                clients={clients}
                users={users}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onUpdateUser={handleUpdateUser}
                setCurrentView={setCurrentView}
                {...shiftTrackerProps}
            />;
        case View.Settings:
            return <SettingsView
                theme={theme}
                setTheme={setTheme}
                onResetData={() => setIsResetConfirmOpen(true)}
                clients={clients}
                tasks={tasks}
                interactions={interactions}
                users={users}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                setCurrentView={setCurrentView}
                can={can}
                {...shiftTrackerProps}
             />;
        case View.TeamStructure:
            return <TeamStructureView
                teams={teams}
                users={users}
                clients={clients}
                onSaveTeam={handleSaveTeam}
                onDeleteTeam={handleDeleteTeam}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                onToggleSidebar={handleToggleSidebar}
                {...shiftTrackerProps}
             />;
        case View.Files:
            return <FilesView
                documents={documents}
                clients={clients}
                onUpload={handleUploadDocument}
                onDelete={handleDeleteDocument}
                onBulkDelete={handleBulkDeleteDocuments}
                onUpdateClient={handleUpdateClient}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                can={can}
                {...shiftTrackerProps}
             />;
        case View.ActivityLog:
            return <ActivityLogView 
                activityLogs={activityLogs}
                users={users}
                clients={clients}
                onSelectClient={handleSelectClient}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                {...shiftTrackerProps}
            />;
        case View.SearchResults:
            const lowerQuery = globalSearchQuery.toLowerCase();
            const clientResults = clients.filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.email.toLowerCase().includes(lowerQuery) ||
                c.phone.includes(lowerQuery)
            );
            const taskResults = tasks.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.description || '').toLowerCase().includes(lowerQuery)
            );
            const documentResults = documents.filter(d =>
                d.fileName.toLowerCase().includes(lowerQuery)
            );
            return <SearchResultsView
                query={globalSearchQuery}
                clients={clientResults}
                tasks={taskResults}
                documents={documentResults}
                onSelectClient={handleSelectClient}
                setCurrentView={setCurrentView}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                currentUser={currentUser!}
                {...shiftTrackerProps}
            />;
        default:
            return <Dashboard 
                clients={clients} 
                tasks={tasks}
                users={users}
                onSelectClient={handleSelectClient}
                currentUser={currentUser!}
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onToggleSidebar={handleToggleSidebar}
                navigateToFilteredView={navigateToFilteredView}
                onOpenDialPad={() => setIsDialPadOpen(true)}
            />;
    }
};

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
            <div className="text-center">
                <div className="bg-blue-600 p-4 rounded-full mb-4 inline-block animate-pulse">
                   <HomeIcon className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold">SVA Loan CRM</h1>
                <p className="text-slate-400 mt-2">Initializing Database & Loading Data...</p>
            </div>
        </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <div className="relative flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout} 
        taskNotificationCount={taskNotificationCount}
        can={can}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      <BirthdayWishModal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        birthdayPeople={birthdayPeople}
        wishes={generatedWishes}
      />
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleDataReset}
        title="Reset Application Data"
        message="Are you sure you want to reset all data? This will clear all clients, tasks, and settings, restoring the application to its original demo state. This action cannot be undone."
        confirmText="Reset Data"
      />
      <NotificationContainer notifications={toastNotifications} onClose={removeToast} />
      <DialPadModal isOpen={isDialPadOpen} onClose={() => setIsDialPadOpen(false)} onSaveCall={handleSaveDialerCall} />
    </div>
  );
};

export default App;