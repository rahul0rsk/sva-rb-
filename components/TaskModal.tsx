
import React, { useState, useEffect } from 'react';
import type { Task, Client } from '../types';
import { XIcon } from './common/icons';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'completed'>) => void;
    clients: Client[];
    taskToEdit?: Task | null;
    defaultClientId?: string;
    defaultTitle?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    clients, 
    taskToEdit, 
    defaultClientId,
    defaultTitle
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

    useEffect(() => {
      if(isOpen) {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setClientId(taskToEdit.clientId || '');
            setDueDate(taskToEdit.dueDate.split('T')[0]);
            setDueTime(taskToEdit.dueTime || '');
            setPriority(taskToEdit.priority);
        } else {
            // Reset form for adding new task
            setTitle(defaultTitle || '');
            setDescription('');
            setClientId(defaultClientId || '');
            setDueDate(new Date().toISOString().split('T')[0]);
            setDueTime('');
            setPriority('Medium');
        }
      }
    }, [isOpen, taskToEdit, defaultClientId, defaultTitle])

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, description, clientId: clientId || undefined, dueDate, dueTime, priority });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign to Client (Optional)</label>
                        <select id="client" value={clientId} onChange={e => setClientId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="">No Client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                            <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" />
                        </div>
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                             <select id="priority" value={priority} onChange={e => setPriority(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="dueTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reminder Time (Optional)</label>
                        <input type="time" id="dueTime" value={dueTime} onChange={e => setDueTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                           {taskToEdit ? 'Save Changes' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};