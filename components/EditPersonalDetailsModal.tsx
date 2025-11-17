import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Client, Document } from '../types';
import { XIcon, SaveIcon, UploadIcon, TrashIcon, EyeIcon } from './common/icons';
import { DocumentPreviewModal } from './DocumentPreviewModal';


interface EditPersonalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Client>) => void;
  client: Client;
  documents: Document[];
  onUploadDocument: (doc: Omit<Document, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
}

const initialFormData = {
    pan: '',
    dob: '',
    financialGoals: '',
    presentAddress: '',
    companyName: '',
    officeEmail: '',
};

const applicantKycDocumentList = [
    { name: 'Aadhaar Card', desc: 'Required for identity verification', needsPassword: true },
    { name: 'PAN Card', desc: 'Required for tax identification', needsPassword: true },
    { name: 'Passport-size Photo', desc: 'Recent photograph' },
];

const DocumentUploadItem: React.FC<{
    docName: string;
    docDesc: string;
    needsPassword?: boolean;
    clientDocs: Document[];
    onUpload: (file: File, docName: string, password?: string) => void;
    onDelete: (docId: string) => void;
    onPreview: (doc: Document) => void;
}> = ({ docName, docDesc, needsPassword, clientDocs, onUpload, onDelete, onPreview }) => {
    type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<UploadStatus>('pending');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileToUploadRef = useRef<File | null>(null);

    const document = clientDocs.find(d => d.fileName.startsWith(`${docName}_`));

    useEffect(() => {
        setStatus(document ? 'uploaded' : 'pending');
    }, [document]);

    const simulateUpload = (file: File) => {
        setStatus('uploading');
        setProgress(0);
        setError('');
        fileToUploadRef.current = file;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + Math.random() * 20;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    if (Math.random() < 0.1) { // 10% chance of error
                        setError('Upload failed. Please try again.');
                        setStatus('error');
                    } else {
                        onUpload(file, docName, password);
                        setStatus('uploaded');
                    }
                    return 100;
                }
                return newProgress;
            });
        }, 300);
    };

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            simulateUpload(files[0]);
        }
    };
    
    const handleRetry = () => {
        if (fileToUploadRef.current) {
            simulateUpload(fileToUploadRef.current);
        }
    };

    return (
        <div className="flex flex-wrap justify-between items-center">
            <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{docName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{docDesc}</p>
                 {needsPassword && status !== 'uploaded' && status !== 'uploading' && (
                    <div className="mt-2">
                        <input
                            type="text"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password (if any) or NA"
                            className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 w-48 focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {status === 'uploaded' && document ? (
                    <>
                        <span className="text-xs font-semibold text-green-300 px-2 py-1 bg-green-900/50 rounded-full">Uploaded</span>
                        <button type="button" onClick={() => onPreview(document)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Preview"><EyeIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => onDelete(document.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-900/50" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                    </>
                ) : status === 'pending' ? (
                    <span className="text-xs font-semibold text-yellow-300 px-2 py-1 bg-yellow-900/50 rounded-full">Pending</span>
                ) : status === 'uploading' ? (
                     <div className="w-24">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 text-center">{Math.round(progress)}%</p>
                    </div>
                ) : status === 'error' ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-400 px-2 py-1 bg-red-900/50 rounded-full">Error</span>
                        <button onClick={handleRetry} className="text-xs text-blue-400 hover:underline">Retry</button>
                    </div>
                ) : null}

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                 {status !== 'uploading' && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-blue-700"
                    >
                        <UploadIcon className="w-4 h-4" />
                        {status === 'uploaded' ? 'Replace' : 'Upload'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const EditPersonalDetailsModal: React.FC<EditPersonalDetailsModalProps> = ({ isOpen, onClose, onSave, client, documents, onUploadDocument, onDeleteDocument }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        pan: client.pan || '',
        dob: client.dob || '',
        financialGoals: client.financialGoals.join(', ') || '',
        presentAddress: client.generalInformation?.presentAddress || '',
        companyName: client.generalInformation?.companyName || '',
        officeEmail: client.generalInformation?.officeEmail || '',
      });
    }
  }, [isOpen, client]);

  const handleDocUpload = useCallback((file: File, docName: string, password?: string) => {
    const prefixedFileName = `${docName}_${client.id}_${file.name}`;
    onUploadDocument({
        clientId: client.id,
        fileName: prefixedFileName,
        fileType: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        creationDate: new Date().toISOString(),
        url: URL.createObjectURL(file), // For demo
        password: password || undefined,
    });
  }, [client.id, onUploadDocument]);
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: Partial<Client> = {
        pan: formData.pan,
        dob: formData.dob,
        financialGoals: formData.financialGoals.split(',').map(g => g.trim()).filter(g => g),
        generalInformation: {
            ...client.generalInformation,
            presentAddress: formData.presentAddress,
            companyName: formData.companyName,
            officeEmail: formData.officeEmail,
        }
    };
    onSave(updatedDetails);
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200";

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all mb-8">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Edit Personal Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <section>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pan" className="block text-sm font-medium text-slate-700 dark:text-slate-300">PAN</label>
                    <input type="text" name="pan" value={formData.pan} onChange={handleChange} className={inputStyles} />
                  </div>
                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <input 
                        type="date" 
                        name="dob" 
                        value={formData.dob} 
                        onChange={handleChange} 
                        disabled={!!client.dob} 
                        title={client.dob ? "Date of birth cannot be changed after it has been set." : ""}
                        className={`${inputStyles} disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-600`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="financialGoals" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Financial Goals</label>
                  <input type="text" name="financialGoals" value={formData.financialGoals} onChange={handleChange} placeholder="Separated by comma" className={inputStyles} />
                </div>
                <div>
                  <label htmlFor="presentAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Present Address</label>
                  <textarea name="presentAddress" value={formData.presentAddress} onChange={handleChange} rows={3} className={inputStyles} />
                </div>
            </section>
             <section>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Employer Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                      <label htmlFor="officeEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Office Email</label>
                      <input type="email" name="officeEmail" value={formData.officeEmail} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
            </section>
             <section>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Applicant KYC</h3>
                 <div className="space-y-4">
                    {applicantKycDocumentList.map(item => (
                      <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                        <DocumentUploadItem
                          docName={item.name}
                          docDesc={item.desc}
                          needsPassword={item.needsPassword}
                          clientDocs={documents.filter(d => d.clientId === client.id)}
                          onUpload={handleDocUpload}
                          onDelete={onDeleteDocument}
                          onPreview={handlePreview}
                        />
                      </div>
                    ))}
                </div>
            </section>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              <SaveIcon className="w-5 h-5"/> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
    <DocumentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} document={docToPreview} />
    </>
  );
};