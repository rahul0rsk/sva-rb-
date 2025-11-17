
import { Role, View } from './types';
import type { User } from './types';

export const Permissions = {
  // View Permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_LEADS_MANAGEMENT: 'view_leads_management',
  VIEW_TASK_MANAGEMENT: 'view_task_management',
  VIEW_DOCUMENTS: 'view_documents',
  VIEW_INTERACTIONS: 'view_interactions',
  VIEW_ADMIN_PANEL: 'view_admin_panel',
  VIEW_TEAM_STRUCTURE: 'view_team_structure',
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYSIS: 'view_analysis',
  VIEW_PROFILE: 'view_profile',
  VIEW_SETTINGS: 'view_settings',
  VIEW_ACTIVITY_LOG: 'view_activity_log',
  VIEW_SEARCH_RESULTS: 'view_search_results',

  // Lead/Client Permissions
  VIEW_ALL_LEADS: 'view_all_leads',
  ADD_LEAD: 'add_lead',
  EDIT_LEAD: 'edit_lead',
  DELETE_LEAD: 'delete_lead',
  ASSIGN_LEADS: 'assign_leads',
  EXPORT_LEADS: 'export_leads',
  BULK_ACTIONS_LEADS: 'bulk_actions_leads',

  // User/Admin Permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_TEAMS: 'manage_teams',

  // Task Permissions
  ADD_TASK: 'add_task',
  EDIT_TASK: 'edit_task',
  DELETE_TASK: 'delete_task',
  
  // Settings
  RESET_DATA: 'reset_data',
};

const rolePermissions: { [key in Role]: string[] } = {
  [Role.Admin]: [
    ...Object.values(Permissions), // Admin can do everything
  ],
  [Role.SubAdmin]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_LEADS_MANAGEMENT,
    Permissions.VIEW_TASK_MANAGEMENT,
    Permissions.VIEW_DOCUMENTS,
    Permissions.VIEW_INTERACTIONS,
    Permissions.VIEW_REPORTS,
    Permissions.VIEW_ANALYSIS,
    Permissions.VIEW_PROFILE,
    Permissions.VIEW_SETTINGS,
    Permissions.VIEW_TEAM_STRUCTURE,
    Permissions.VIEW_ACTIVITY_LOG,
    Permissions.VIEW_SEARCH_RESULTS,
    Permissions.VIEW_ALL_LEADS,
    Permissions.ADD_LEAD,
    Permissions.EDIT_LEAD,
    Permissions.DELETE_LEAD,
    Permissions.ASSIGN_LEADS,
    Permissions.EXPORT_LEADS,
    Permissions.BULK_ACTIONS_LEADS,
    Permissions.ADD_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
    Permissions.MANAGE_USERS,
    Permissions.MANAGE_TEAMS,
  ],
  [Role.TeamLead]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_LEADS_MANAGEMENT,
    Permissions.VIEW_TASK_MANAGEMENT,
    Permissions.VIEW_DOCUMENTS,
    Permissions.VIEW_INTERACTIONS,
    Permissions.VIEW_REPORTS,
    Permissions.VIEW_ANALYSIS,
    Permissions.VIEW_PROFILE,
    Permissions.VIEW_SETTINGS,
    Permissions.VIEW_TEAM_STRUCTURE,
    Permissions.VIEW_ACTIVITY_LOG,
    Permissions.VIEW_SEARCH_RESULTS,
    Permissions.VIEW_ALL_LEADS,
    Permissions.ADD_LEAD,
    Permissions.EDIT_LEAD,
    Permissions.ASSIGN_LEADS,
    Permissions.EXPORT_LEADS,
    Permissions.BULK_ACTIONS_LEADS,
    Permissions.ADD_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  [Role.Agent]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_LEADS_MANAGEMENT,
    Permissions.VIEW_TASK_MANAGEMENT,
    Permissions.VIEW_DOCUMENTS,
    Permissions.VIEW_INTERACTIONS,
    Permissions.VIEW_PROFILE,
    Permissions.VIEW_SEARCH_RESULTS,
    Permissions.ADD_LEAD,
    Permissions.EDIT_LEAD,
    Permissions.ADD_TASK,
    Permissions.EDIT_TASK,
    Permissions.DELETE_TASK,
  ],
  [Role.Trainee]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_LEADS_MANAGEMENT,
    Permissions.VIEW_TASK_MANAGEMENT,
    Permissions.VIEW_DOCUMENTS,
    Permissions.VIEW_INTERACTIONS,
    Permissions.VIEW_PROFILE,
    Permissions.VIEW_SEARCH_RESULTS,
    Permissions.ADD_LEAD, // Trainees can create leads
  ],
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  return rolePermissions[user.role]?.includes(permission);
};

export const viewPermissionMap: { [key in View]?: string } = {
    [View.Dashboard]: Permissions.VIEW_DASHBOARD,
    [View.LeadsManagement]: Permissions.VIEW_LEADS_MANAGEMENT,
    [View.TaskManagement]: Permissions.VIEW_TASK_MANAGEMENT,
    [View.Files]: Permissions.VIEW_DOCUMENTS,
    [View.InteractionHistory]: Permissions.VIEW_INTERACTIONS,
    [View.AdminPanel]: Permissions.VIEW_ADMIN_PANEL,
    [View.TeamStructure]: Permissions.VIEW_TEAM_STRUCTURE,
    [View.Reports]: Permissions.VIEW_REPORTS,
    [View.Analysis]: Permissions.VIEW_ANALYSIS,
    [View.Profile]: Permissions.VIEW_PROFILE,
    [View.Settings]: Permissions.VIEW_SETTINGS,
    [View.ActivityLog]: Permissions.VIEW_ACTIVITY_LOG,
    [View.SearchResults]: Permissions.VIEW_SEARCH_RESULTS,
};