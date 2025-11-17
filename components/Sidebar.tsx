
import React from 'react';
import {
  DashboardIcon,
  UsersIcon,
  CheckSquareIcon,
  LogOutIcon,
  AdminPanelIcon,
  ReportsIcon,
  UserIcon,
  HomeIcon,
  HistoryIcon,
  SettingsIcon,
  AnalysisIcon,
  TeamIcon,
  FileTextIcon,
  LogIcon
} from './common/icons';
import type { User } from '../types';
import { View } from '../types';
import { Permissions } from '../permissions';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
  taskNotificationCount: number;
  can: (permission: string) => boolean;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  notificationCount?: number;
}> = ({ icon, label, isActive, onClick, notificationCount }) => {
  const baseClasses = "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 group";
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses = "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white";

  return (
    <li>
      <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} w-full text-left`}>
        <span className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{icon}</span>
        <span className="flex-1">{label}</span>
        {notificationCount && notificationCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    </li>
  );
};

const NavHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
);

const CalendarWidget: React.FC = () => {
    const today = new Date();
    const month = today.toLocaleString('en-US', { month: 'long' });
    const year = today.getFullYear();
    const date = today.getDate();
    const day = today.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

    return (
        <div className="px-3 py-4 text-center rounded-lg bg-slate-900 border border-slate-700">
            <p className="text-sm font-semibold text-slate-400">{month} {year}</p>
            <p className="text-5xl font-bold text-white my-1">{date}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{day}</p>
        </div>
    );
};

const navSections = [
    {
        title: 'Main',
        items: [
            { view: View.Dashboard, label: View.Dashboard, icon: <DashboardIcon className="w-5 h-5" />, permission: Permissions.VIEW_DASHBOARD },
            { view: View.LeadsManagement, label: View.LeadsManagement, icon: <UsersIcon className="w-5 h-5" />, permission: Permissions.VIEW_LEADS_MANAGEMENT, activeViews: [View.ClientDetail] },
            { view: View.TaskManagement, label: View.TaskManagement, icon: <CheckSquareIcon className="w-5 h-5" />, permission: Permissions.VIEW_TASK_MANAGEMENT, notificationKey: 'taskNotificationCount' as const },
            { view: View.Files, label: View.Files, icon: <FileTextIcon className="w-5 h-5" />, permission: Permissions.VIEW_DOCUMENTS },
            { view: View.InteractionHistory, label: 'Interactions', icon: <HistoryIcon className="w-5 h-5" />, permission: Permissions.VIEW_INTERACTIONS },
        ]
    },
    {
        title: 'Admin',
        items: [
            { view: View.AdminPanel, label: View.AdminPanel, icon: <AdminPanelIcon className="w-5 h-5" />, permission: Permissions.VIEW_ADMIN_PANEL },
            { view: View.TeamStructure, label: View.TeamStructure, icon: <TeamIcon className="w-5 h-5" />, permission: Permissions.VIEW_TEAM_STRUCTURE },
            { view: View.Reports, label: View.Reports, icon: <ReportsIcon className="w-5 h-5" />, permission: Permissions.VIEW_REPORTS },
            { view: View.Analysis, label: View.Analysis, icon: <AnalysisIcon className="w-5 h-5" />, permission: Permissions.VIEW_ANALYSIS },
        ]
    },
    {
        title: 'Account',
        items: [
            { view: View.Profile, label: View.Profile, icon: <UserIcon className="w-5 h-5" />, permission: Permissions.VIEW_PROFILE },
            { view: View.Settings, label: View.Settings, icon: <SettingsIcon className="w-5 h-5" />, permission: Permissions.VIEW_SETTINGS },
        ]
    }
];


export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, onLogout, taskNotificationCount, can, isOpen }) => {

  const handleNavigation = (view: View) => {
    setCurrentView(view);
  };

  const notificationCounts = {
    taskNotificationCount,
  };

  return (
    <aside className={`w-64 bg-white dark:bg-slate-800 text-slate-800 flex flex-col p-4 border-r border-slate-200 dark:border-slate-700
      fixed inset-y-0 left-0 z-40
      lg:relative lg:translate-x-0
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="bg-blue-600 p-2 rounded-md">
            <HomeIcon className="text-white"/>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">SVA Loan CRM</h1>
      </div>
      
      <nav className="flex-grow mt-6 overflow-y-auto">
        {navSections.map(section => {
            const accessibleItems = section.items.filter(item => can(item.permission));
            
            // Don't render the section if there are no accessible items, unless it's the "Account" section which always shows Logout
            if (accessibleItems.length === 0 && section.title !== 'Account') return null;

            return (
                <ul key={section.title} className="space-y-1 mt-6 first:mt-0">
                    <NavHeader title={section.title} />
                    {accessibleItems.map(item => (
                        <NavItem
                            key={item.view}
                            icon={item.icon}
                            label={item.label}
                            isActive={currentView === item.view || (item.activeViews && item.activeViews.includes(currentView))}
                            onClick={() => handleNavigation(item.view)}
                            notificationCount={item.notificationKey ? notificationCounts[item.notificationKey] : undefined}
                        />
                    ))}
                    {section.title === 'Account' && (
                        <li>
                            <button onClick={onLogout} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 group text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 w-full text-left">
                                <LogOutIcon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"/>
                                Logout
                            </button>
                        </li>
                    )}
                </ul>
            );
        })}
      </nav>

      <div className="mt-auto flex-shrink-0">
        <div className="my-4">
          <CalendarWidget />
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 -mx-4 pt-4 px-4">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
              </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
