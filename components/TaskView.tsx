
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, Client, Notification, User } from '../types';
import { PlusIcon, EditIcon, SearchIcon, CheckSquareIcon, ClockIcon, TrashIcon, CalendarIcon, ArrowLeftIcon, ArrowRightIcon } from './common/icons';
import { Header } from './Header';
import { ConfirmationModal } from './ConfirmationModal';
import { TaskModal } from './TaskModal';
import { isSameDay } from '../utils';
import { Permissions } from '../permissions';

interface TaskViewProps {
  tasks: Task[];
  clients: Client[];
  onUpdateTask: (task: Task, isCompletion: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  can: (permission: string) => boolean;
  onToggleSidebar?: () => void;
  initialFilter: string | null;
}

const StatCard: React.FC<{ title: string; value: number; color?: string; }> = ({ title, value, color = 'text-slate-100' }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-sm text-center">
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-slate-400 font-medium mt-1">{title}</p>
    </div>
);

const CalendarDropdown: React.FC<{
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}> = ({ selectedDate, onDateSelect }) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const getDaysInMonth = () => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const days = [];
        while (date.getMonth() === viewDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const firstDayOfMonth = viewDate.getDay();
    const daysInMonth = getDaysInMonth();
    const blanks = Array(firstDayOfMonth).fill(null);
    const allDays = [...blanks, ...daysInMonth];

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    return (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-20 p-4 w-72">
            <div className="flex justify-between items-center mb-2">
                <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"><ArrowLeftIcon className="w-4 h-4" /></button>
                <span className="font-semibold text-sm">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600"><ArrowRightIcon className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {allDays.map((day, index) => (
                    day ? (
                        <button 
                            key={index} 
                            onClick={() => onDateSelect(day)} 
                            className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                                isSameDay(day, selectedDate) ? 'bg-blue-600 text-white font-bold' : 
                                isSameDay(day, new Date()) ? 'text-blue-500' : ''
                            } hover:bg-slate-100 dark:hover:bg-slate-600`}
                        >
                            {day.getDate()}
                        </button>
                    ) : (
                        <div key={index}></div>
                    )
                ))}
            </div>
        </div>
    );
};


export const TaskView: React.FC<TaskViewProps> = ({ tasks, clients, onUpdateTask, onAddTask, onDeleteTask, notifications, onMarkAllAsRead, currentUser, can, onToggleSidebar, initialFilter }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if(initialFilter) {
        setActiveFilter(initialFilter);
      }
  }, [initialFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
            setIsCalendarOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef]);

  const today = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0,0,0,0);
    return d;
  }, [selectedDate]);

  const tomorrow = useMemo(() => {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return d;
  }, [today]);

  const stats = useMemo(() => ({
    today: tasks.filter(t => !t.completed && isSameDay(new Date(t.dueDate), today)).length,
    tomorrow: tasks.filter(t => !t.completed && isSameDay(new Date(t.dueDate), tomorrow)).length,
    overdue: tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length,
    completed: tasks.filter(t => t.completed).length,
  }), [tasks, today, tomorrow]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    switch(activeFilter) {
      case 'Today':
        filtered = tasks.filter(t => !t.completed && isSameDay(new Date(t.dueDate), today));
        break;
      case 'Tomorrow':
        filtered = tasks.filter(t => !t.completed && isSameDay(new Date(t.dueDate), tomorrow));
        break;
      case 'Completed':
        filtered = tasks.filter(t => t.completed);
        break;
      case 'Overdue':
        filtered = tasks.filter(t => !t.completed && new Date(t.dueDate) < today);
        break;
      default: // All
        break;
    }

    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, activeFilter, searchQuery, today, tomorrow]);
  
  const openAddTaskModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'|'completed'>) => {
    if (taskToEdit) {
      onUpdateTask({ ...taskToEdit, ...taskData }, false);
    } else {
      onAddTask(taskData);
    }
  };
  
  const openDeleteConfirmModal = (task: Task) => {
    setTaskToDelete(task);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
        onDeleteTask(taskToDelete.id);
        setIsConfirmModalOpen(false);
        setTaskToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen">
      <Header 
        title="Task Management" 
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        onToggleSidebar={onToggleSidebar}
      >
        <div className="flex items-center gap-4">
            <div ref={calendarRef} className="relative">
                <button 
                  onClick={() => setIsCalendarOpen(prev => !prev)}
                  className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg shadow-sm"
                >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-medium text-slate-200">{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </button>
                {isCalendarOpen && <CalendarDropdown selectedDate={selectedDate} onDateSelect={(date) => { setSelectedDate(date); setIsCalendarOpen(false); }} />}
            </div>
            {can(Permissions.ADD_TASK) && (
                <button onClick={openAddTaskModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add Task
                </button>
            )}
        </div>
      </Header>

      <div className="mb-