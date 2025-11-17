
import React, { useState, useMemo } from 'react';
import { Header } from './Header';
import type { Notification, Document, Client, User } from '../types';
import { UploadDocumentModal } from './UploadDocumentModal';
import { ConfirmationModal } from './ConfirmationModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { UploadIcon, SearchIcon, DownloadIcon, TrashIcon, FileIcon, PdfIcon, ImageIcon, EyeIcon, ExcelIcon, WordIcon } from './common/icons';
import { formatBytes, timeSince } from '../utils';
import { Permissions } from '../permissions';

interface FilesViewProps {
  documents: Document[];
  clients: Client[];
  onUpload: (document: Omit<Document, 'id'>) => void;
  onDelete: (documentId: string) => void;
  onBulkDelete: (documentIds: string[]) => void;
  onUpdateClient: (client: Client) => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  can: (permission: string) => boolean;
  sessionStartTime: number | null;
  isOnBreak: boolean;
  breakStartTime: number | null;
  totalBreakDuration: number;
  onToggleBreak: () => void;
}

export const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
        return <ImageIcon className="w-6 h-6 text-blue-500"/>;
    }
    if (fileType === 'application/pdf') {
        return <PdfIcon className="w-6 h-6 text-red-500"/>;
    }
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
        return <ExcelIcon className="w-6 h-6 text-green-600"/>;
    }
    if (fileType.includes('wordprocessing') || fileType.includes('word')) {
        return <WordIcon className="w-6 h-6 text-blue-600"/>;
    }
    return <FileIcon className="w-6 h-6 text-slate-500"/>;
}

export const FilesView: React.FC<FilesViewProps> = ({ documents, clients, onUpload, onDelete, onBulkDelete, notifications, onMarkAllAsRead, currentUser, can, ...shiftTrackerProps }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isSingleConfirmOpen, setIsSingleConfirmOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown Client';

  const fileTypes = useMemo(() => Array.from(new Set(documents.map(d => d.fileType))), [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
        const searchMatch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        const clientMatch = clientFilter === 'All' || doc.clientId === clientFilter;
        const typeMatch = typeFilter === 'All' || doc.fileType === typeFilter;
        return searchMatch && clientMatch && typeMatch;
    });
  }, [documents, searchQuery, clientFilter, typeFilter]);
  
  const handleDelete = (doc: Document) => {
    setDocToDelete(doc);
    setIsSingleConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
        onDelete(docToDelete.id);
        setIsSingleConfirmOpen(false);
        setDocToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    onBulkDelete(Array.from(selectedDocIds));
    setSelectedDocIds(new Set());
    setIsBulkConfirmOpen(false);
  };
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };

  const handleSelectDoc = (docId: string) => {
    setSelectedDocIds(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(docId)) {
            newSelection.delete(docId);
        } else {
            newSelection.add(docId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedDocIds(new Set(filteredDocuments.map(d => d.id)));
    } else {
        setSelectedDocIds(new Set());
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen">
      <Header 
        title="Client Documents"
        notifications={notifications}
        onMarkAllAsRead={onMarkAllAsRead}
        currentUser={currentUser}
        {...shiftTrackerProps}
      >
        {can(Permissions.EDIT_LEAD) && (
          <>
            {selectedDocIds.size > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">{selectedDocIds.size} selected</span>
                <button 
                  onClick={() => setIsBulkConfirmOpen(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Selected
                </button>
              </div>
            ) : (
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                  <UploadIcon className="w-5 h-5" />
                  Upload Document
              </button>
            )}
          </>
        )}
      </Header>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-200">
             <div className="relative md:col-span-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by file name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                 <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                    <option value="All">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                 <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                    <option value="All">All File Types</option>
                    {fileTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="p-4">
                  <input 
                      type="checkbox" 
                      className="rounded"
                      onChange={handleSelectAll}
                      checked={filteredDocuments.length > 0 && selectedDocIds.size === filteredDocuments.length}
                      ref={el => {
                        if (el) {
                            el.indeterminate = selectedDocIds.size > 0 && selectedDocIds.size < filteredDocuments.length;
                        }
                      }}
                  />
                </th>
                <th scope="col" className="px-6 py-3 w-12"></th>
                <th scope="col" className="px-6 py-3">File Name</th>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Creation Date</th>
                <th scope="col" className="px-6 py-3">Size</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
                <tr key={doc.id} className={`border-b hover:bg-slate-50 ${selectedDocIds.has(doc.id) ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="p-4">
                      <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedDocIds.has(doc.id)}
                          onChange={() => handleSelectDoc(doc.id)}
                      />
                  </td>
                  <td className="px-6 py-4">{getFileIcon(doc.fileType)}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{doc.fileName}</td>
                  <td className="px-6 py-4">{getClientName(doc.clientId)}</td>
                  <td className="px-6 py-4">{timeSince(doc.creationDate)}</td>
                  <td className="px-6 py-4">{formatBytes(doc.size)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePreview(doc)} className="p-1.5 rounded-md bg-slate-600 text-white hover:bg-slate-700 transition-colors" title="Preview">
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        <a href={doc.url} download={doc.fileName} className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors" title="Download">
                            <DownloadIcon className="w-5 h-5" />
                        </a>
                        {can(Permissions.EDIT_LEAD) && (
                            <button onClick={() => handleDelete(doc)} className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors" title="Delete">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                        <p>No documents found.</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UploadDocumentModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        clients={clients}
        onUpload={onUpload}
      />
      <ConfirmationModal
        isOpen={isSingleConfirmOpen}
        onClose={() => setIsSingleConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete the document "${docToDelete?.fileName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
       <ConfirmationModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Documents"
        message={`Are you sure you want to delete ${selectedDocIds.size} selected documents? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={docToPreview}
      />
    </div>
  );
};