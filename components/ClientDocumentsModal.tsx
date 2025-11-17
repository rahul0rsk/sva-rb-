
import React, { useState, useRef } from 'react';
import type { Client, Document } from '../types';
import { ApplicationStatus } from '../types';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { XIcon, UploadIcon, DownloadIcon, TrashIcon, FileIcon, PdfIcon, ImageIcon, EyeIcon } from './common/icons';
import { formatBytes } from '../utils';

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
        return <ImageIcon className="w-6 h-6 text-blue-500"/>;
    }
    if (fileType === 'application/pdf') {
        return <PdfIcon className="w-6 h-6 text-red-500"/>;
    }
    return <FileIcon className="w-6 h-6 text-slate-500"/>;
}

interface ClientDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onUpdateClient: (client: Client) => void;
  documents: Document[];
  onUploadDocument: (document: Omit<Document, 'id'>) => void;
  onDeleteDocument: (documentId: string) => void;
}

export const ClientDocumentsModal: React.FC<ClientDocumentsModalProps> = ({ 
    isOpen, 
    onClose, 
    client, 
    onUpdateClient, 
    documents, 
    onUploadDocument, 
    onDeleteDocument 
}) => {
  const [applicationStatus, setApplicationStatus] = useState(client.applicationStatus || ApplicationStatus.Pending);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  if (!isOpen) return null;

  const clientDocuments = documents.filter(doc => doc.clientId === client.id);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ApplicationStatus;
    setApplicationStatus(newStatus);
    onUpdateClient({ ...client, applicationStatus: newStatus });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDocument: Omit<Document, 'id'> = {
        clientId: client.id,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        creationDate: new Date().toISOString(),
        url: URL.createObjectURL(file), // For demo purposes
      };
      onUploadDocument(newDocument);
      if (e.target) e.target.value = '';
    }
  };
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Client Documents</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{client.name} - {client.loanType}</p>
            </div>
            <div className="flex items-center gap-4">
               <select 
                  value={applicationStatus} 
                  onChange={handleStatusChange}
                  className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                >
                    {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
            </div>
          </div>
          
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <div className="mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                <UploadIcon className="w-5 h-5" /> Upload New Document
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-12"></th>
                    <th scope="col" className="px-4 py-3">File Name</th>
                    <th scope="col" className="px-4 py-3">Upload Date</th>
                    <th scope="col" className="px-4 py-3">Size</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDocuments.length > 0 ? clientDocuments.map(doc => (
                    <tr key={doc.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-2">{getFileIcon(doc.fileType)}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{doc.fileName}</td>
                      <td className="px-4 py-2">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{formatBytes(doc.size)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePreview(doc)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Preview">
                                <EyeIcon className="w-5 h-5" />
                            </button>
                            <a href={doc.url} download={doc.fileName} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Download">
                                <DownloadIcon className="w-5 h-5" />
                            </a>
                            <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-900/50" title="Delete">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">
                            <p>No documents found for this client.</p>
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-lg">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Close</button>
          </div>
        </div>
      </div>
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={docToPreview}
      />
    </>
  );
};
