
import React from 'react';
import { Header } from './Header';
import type { Notification, Client, User, Task, Document } from '../types';
import { View } from '../types';
import { timeSince } from '../utils';
import { UsersIcon, CheckSquareIcon, FileTextIcon } from './common/icons';

interface SearchResultsViewProps {
    query: string;
    clients: Client[];
    tasks: Task[];
    documents: Document[];
    onSelectClient: (client: Client) => void;
    setCurrentView: (view: View) => void;
    // Header props
    notifications: Notification[];
    onMarkAllAsRead: () => void;
    currentUser: User;
    sessionStartTime: number | null;
    isOnBreak: boolean;
    breakStartTime: number | null;
    totalBreakDuration: number;
    onToggleBreak: () => void;
}

const ResultCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, count: number }> = ({ icon, title, children, count }) => {
    if (count === 0) return null;
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                {icon}
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
                <span className="text-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full">{count} found</span>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
};

export const SearchResultsView: React.FC<SearchResultsViewProps> = (props) => {
    const { query, clients, tasks, documents, onSelectClient, setCurrentView, ...headerProps } = props;

    const lowerQuery = query.toLowerCase();

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

    const totalResults = clientResults.length + taskResults.length + documentResults.length;

    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';
    
    return (
        <div className="p-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
            <Header
                title="Search Results"
                subtitle={`Found ${totalResults} results for "${query}"`}
                {...headerProps}
            />

            <div className="space-y-6">
                {totalResults === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <p className="text-xl text-slate-500 dark:text-slate-400">No results found.</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-2">Try searching for something else.</p>
                    </div>
                ) : (
                    <>
                        <ResultCard title="Leads" count={clientResults.length} icon={<UsersIcon className="w-6 h-6 text-blue-500" />}>
                            {clientResults.map(client => (
                                <div key={client.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => onSelectClient(client)}>
                                    <p className="font-semibold text-blue-600 dark:text-blue-400">{client.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{client.email} &bull; {client.phone}</p>
                                </div>
                            ))}
                        </ResultCard>

                        <ResultCard title="Tasks" count={taskResults.length} icon={<CheckSquareIcon className="w-6 h-6 text-amber-500" />}>
                            {taskResults.map(task => (
                                <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => {
                                    if (task.clientId) {
                                        const client = clients.find(c => c.id === task.clientId);
                                        if (client) onSelectClient(client);
                                    } else {
                                        setCurrentView(View.TaskManagement);
                                    }
                                }}>
                                    <p className="font-semibold text-amber-600 dark:text-amber-400">{task.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                        {task.clientId && ` • Client: ${getClientName(task.clientId)}`}
                                    </p>
                                </div>
                            ))}
                        </ResultCard>

                        <ResultCard title="Documents" count={documentResults.length} icon={<FileTextIcon className="w-6 h-6 text-green-500" />}>
                            {documentResults.map(doc => (
                                <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => {
                                    const client = clients.find(c => c.id === doc.clientId);
                                    if (client) onSelectClient(client);
                                }}>
                                    <p className="font-semibold text-green-600 dark:text-green-400 truncate">{doc.fileName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Client: {getClientName(doc.clientId)} &bull; Uploaded: {timeSince(doc.uploadDate)}
                                    </p>
                                </div>
                            ))}
                        </ResultCard>
                    </>
                )}
            </div>
        </div>
    );
}
