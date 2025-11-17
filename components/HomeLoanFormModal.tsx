import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Client, Document, CoApplicantDetails } from '../types';
import { XIcon, SaveIcon, UploadIcon, TrashIcon, EyeIcon, PlusIcon, UserIcon, PhoneIcon, EmailIcon } from './common/icons';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface HomeLoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Client>) => void;
  client: Client;
  documents: Document[];
  onUploadDocument: (doc: Omit<Document, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
}

const applicantKycDocumentList = [
    { name: 'Aadhaar Card', desc: 'Required for identity verification', needsPassword: true },
    { name: 'PAN Card', desc: 'Required for tax identification', needsPassword: true },
    { name: 'Passport-size Photo', desc: 'Recent photograph' },
];

const incomeDocumentList = [
    { name: 'Salary Slips (Last 3 months)', desc: 'Proof of income' },
    { name: 'Bank Statement (6 months)', desc: 'Last 6 months bank statements' },
    { name: 'Form 16', desc: 'Income tax document' },
];

const propertyDocumentList = [
    { name: 'Property Agreement', desc: 'Sale agreement or builder agreement' },
    { name: 'Property Tax Receipt', desc: 'Latest property tax receipt' },
];

const AccordionSection: React.FC<{ title: string; children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
                <svg className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && <div className="p-4 bg-white dark:bg-slate-800">{children}</div>}
        </div>
    );
};

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

const inputStyles = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const readOnlyInputStyles = "w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed";

export const HomeLoanFormModal: React.FC<HomeLoanFormModalProps> = (props) => {
  const { isOpen, onClose, onSave, client, documents, onUploadDocument, onDeleteDocument } = props;

  const [formData, setFormData] = useState(client.generalInformation || {});
  const [coApplicants, setCoApplicants] = useState<CoApplicantDetails[]>(client.generalInformation?.coApplicants || []);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(client.generalInformation || {});
      setCoApplicants(client.generalInformation?.coApplicants || []);
    }
  }, [isOpen, client.generalInformation]);

  const handleDocUpload = useCallback((file: File, docName: string, password?: string) => {
    onUploadDocument({
        clientId: client.id,
        fileName: `${docName}_${file.name}`,
        fileType: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        creationDate: new Date().toISOString(),
        url: URL.createObjectURL(file),
        password: password || undefined,
    });
  }, [client.id, onUploadDocument]);
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCoApplicantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newCoApplicants = [...coApplicants];
    const field = e.target.name as keyof CoApplicantDetails;
    newCoApplicants[index] = { ...newCoApplicants[index], [field]: e.target.value };
    setCoApplicants(newCoApplicants);
  };

  const addCoApplicant = () => {
    setCoApplicants([...coApplicants, { id: `coapp-${Date.now()}`, fullName: '', mobileNumber: '', email: '', relationship: '' }]);
  };

  const removeCoApplicant = (index: number) => {
    setCoApplicants(coApplicants.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ generalInformation: { ...formData, coApplicants } });
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Home Loan Application Form</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
        </div>
        <form id="home-loan-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-4">
              <AccordionSection title="1. Personal Information" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input type="text" value={client.name} readOnly className={readOnlyInputStyles} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mobile Number</label>
                    <input type="text" value={client.phone} readOnly className={readOnlyInputStyles} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                    <input type="email" value={client.email} readOnly className={readOnlyInputStyles} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Loan Amount</label>
                    <input type="text" value={client.loanDetails?.requestedAmount || ''} readOnly className={readOnlyInputStyles} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Monthly Income</label>
                    <input type="text" name="monthlyIncome" value={formData.monthlyIncome || ''} onChange={handleChange} placeholder="Enter monthly income" className={inputStyles} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Loan Duration (months)</label>
                    <input type="number" name="loanDuration" value={formData.loanDuration || ''} onChange={handleChange} placeholder="Enter duration" className={inputStyles} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Permanent Address</label>
                  <textarea name="permanentAddress" value={formData.permanentAddress || ''} onChange={handleChange} rows={2} placeholder="Enter permanent address" className={inputStyles}></textarea>
                </div>
              </AccordionSection>
              
              <AccordionSection title="2. Applicant KYC Documents">
                <div className="space-y-4">
                  {applicantKycDocumentList.map(item => (
                    <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                      <DocumentUploadItem docName={item.name} docDesc={item.desc} needsPassword={item.needsPassword} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                    </div>
                  ))}
                </div>
              </AccordionSection>

              <AccordionSection title="3. Co-applicant Details & Documents">
                <div className="space-y-6 pt-2">
                  {coApplicants.map((coApp, index) => (
                    <div key={coApp.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 relative">
                      <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-600 pb-2 mb-4">
                        <h5 className="font-semibold text-slate-800 dark:text-slate-200">Co-applicant {index + 1}</h5>
                        <button type="button" onClick={() => removeCoApplicant(index)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400" title="Remove Co-applicant"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" name="fullName" value={coApp.fullName} onChange={(e) => handleCoApplicantChange(index, e)} placeholder="Full Name" required className={`${inputStyles} pl-10`} />
                        </div>
                        <div className="relative">
                            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" name="mobileNumber" value={coApp.mobileNumber} onChange={(e) => handleCoApplicantChange(index, e)} placeholder="Mobile Number" required className={`${inputStyles} pl-10`} />
                        </div>
                        <div className="relative">
                            <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="email" name="email" value={coApp.email} onChange={(e) => handleCoApplicantChange(index, e)} placeholder="Email" className={`${inputStyles} pl-10`} />
                        </div>
                        <input type="text" name="relationship" value={coApp.relationship} onChange={(e) => handleCoApplicantChange(index, e)} placeholder="Relationship to Applicant" required className={inputStyles} />
                      </div>
                       <div className="mt-4">
                          <h6 className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-2">CO-APPLICANT DOCUMENTS</h6>
                          {applicantKycDocumentList.map(docItem => (
                            <div key={`coapp_${index}_${docItem.name}`} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                              <DocumentUploadItem docName={`Co-applicant ${index + 1} ${docItem.name}`} docDesc={docItem.desc} needsPassword={docItem.needsPassword} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                   <button type="button" onClick={addCoApplicant} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"><PlusIcon className="w-4 h-4" /> Add Co-applicant</button>
                </div>
              </AccordionSection>
              
              <AccordionSection title="4. Income Documents">
                <div className="space-y-4">
                  {incomeDocumentList.map(item => (
                    <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                      <DocumentUploadItem docName={item.name} docDesc={item.desc} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                    </div>
                  ))}
                </div>
              </AccordionSection>

              <AccordionSection title="5. Property Documents">
                <div className="space-y-4">
                  {propertyDocumentList.map(item => (
                    <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                      <DocumentUploadItem docName={item.name} docDesc={item.desc} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                    </div>
                  ))}
                </div>
              </AccordionSection>

            </div>
            </form>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-lg flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
              <button type="submit" form="home-loan-form" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                <SaveIcon className="w-5 h-5" /> Save Application
              </button>
            </div>
        </div>
      </div>
      <DocumentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} document={docToPreview} />
    </>
  );
};