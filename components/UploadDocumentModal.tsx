

import React, { useState, useCallback, useEffect } from 'react';
import type { Client, Document } from '../types';
import { XIcon, UploadIcon, FileIcon } from './common/icons';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onUpload: (document: Omit<Document, 'id'>) => void;
  defaultClientId?: string;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ isOpen, onClose, clients, onUpload, defaultClientId }) => {
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId || '');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(defaultClientId || '');
      setFile(null);
      setIsDragging(false);
    }
  }, [isOpen, defaultClientId]);

  if (!isOpen) return null;

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !file) {
      alert('Please select a client and a file.');
      return;
    }

    const newDocument: Omit<Document, 'id'> = {
      clientId: selectedClientId,
      fileName: file.name,
      fileType: file.type,
      size: file.size,
      uploadDate: new Date().toISOString(),
      creationDate: new Date().toISOString(),
      url: URL.createObjectURL(file), // For demo purposes
    };
    
    onUpload(newDocument);
    onClose();
    setFile(null);
    setSelectedClientId('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Upload Document</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Assign to Client <span className="text-red-500">*</span></label>
            <select 
              value={selectedClientId} 
              onChange={e => setSelectedClientId(e.target.value)} 
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700">File <span className="text-red-500">*</span></label>
             <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'} border-dashed rounded-md`}
             >
                <div className="space-y-1 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => handleFileChange(e.target.files)} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
                </div>
             </div>
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
                <FileIcon className="w-8 h-8 text-slate-500 flex-shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
};