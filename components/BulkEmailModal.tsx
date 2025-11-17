
import React, { useState, useCallback } from 'react';
import type { Client } from '../types';
import { XIcon, PaperclipIcon, SendIcon, TrashIcon } from './common/icons';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Client[];
  onSend: (subject: string, message: string, attachments: File[]) => void;
}

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ isOpen, onClose, recipients, onSend }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true); }, []);
  const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }, [handleFileChange]);
  
  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(file => file !== fileToRemove));
  };
  
  const handleSend = () => {
    onSend(subject, message, attachments);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl relative" onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}>
        {isDragging && ( <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/50 bg-opacity-80 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none z-10"><p className="text-blue-600 dark:text-blue-300 font-bold text-lg">Drop files to attach</p></div> )}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Bulk Email to {recipients.length} recipients</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recipients:</label>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 max-h-20 overflow-y-auto">
                    {recipients.map(r => r.name).join(', ')}
                </div>
            </div>
            <div>
                <label htmlFor="bulk-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                <input id="bulk-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" />
            </div>
            <div>
                <label htmlFor="bulk-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                <textarea id="bulk-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Attachments</label>
              <div className={`mt-1 flex flex-col items-center justify-center text-center px-6 py-8 border-2 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'} border-dashed rounded-md`}>
                  <label htmlFor="bulk-file-upload" className="cursor-pointer">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">Upload files</span>
                          <span className="pl-1">or drag and drop</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attach multiple files at once.</p>
                      <input id="bulk-file-upload" name="file-upload" type="file" multiple onChange={(e) => handleFileChange(e.target.files)} className="sr-only" />
                  </label>
              </div>

              {attachments.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Attached files:</p>
                      <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                          {attachments.map((file, index) => (
                              <li key={index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded">
                                  <span className="truncate pr-2">{file.name}</span>
                                  <button onClick={() => removeAttachment(file)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                                      <TrashIcon className="w-4 h-4" />
                                  </button>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"><SendIcon className="w-5 h-5"/> Send Email</button>
        </div>
      </div>
    </div>
  );
};
