import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Client, Document } from '../types';
import { XIcon, SaveIcon, UploadIcon, TrashIcon, EyeIcon } from './common/icons';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface EducationLoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Client>) => void;
  client: Client;
  documents: Document[];
  onUploadDocument: (doc: Omit<Document, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
}

const studentKycDocumentList = [
    { name: 'Student Aadhaar Card', desc: 'Identity verification', needsPassword: true },
    { name: 'Student PAN Card', desc: 'Tax identification', needsPassword: true },
    { name: 'Academic Marksheets', desc: '10th, 12th, Graduation' },
    { name: 'Admission Letter', desc: 'From the university/college' },
];

const coApplicantKycDocumentList = [
    { name: 'Co-Applicant Aadhaar Card', desc: 'Identity verification', needsPassword: true },
    { name: 'Co-Applicant PAN Card', desc: 'Tax identification', needsPassword: true },
    { name: 'Co-Applicant Income Proof', desc: 'Salary slips or ITR' },
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
    const [password, setPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const document = clientDocs.find(d => d.fileName.startsWith(`${docName}_`));

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            onUpload(files[0], docName, password);
        }
    };

    return (
        <div className="flex flex-wrap justify-between items-center">
            <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{docName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{docDesc}</p>
                {needsPassword && !document && (
                    <div className="mt-2">
                        <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (if any)" className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 w-48 focus:ring-2 focus:ring-blue-500 shadow-sm" />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {document ? (
                    <>
                        <span className="text-xs font-semibold text-green-300 px-2 py-1 bg-green-900/50 rounded-full">Uploaded</span>
                        <button type="button" onClick={() => onPreview(document)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700" title="Preview"><EyeIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => onDelete(document.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-900/50" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                    </>
                ) : <span className="text-xs font-semibold text-yellow-300 px-2 py-1 bg-yellow-900/50 rounded-full">Pending</span>}
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-blue-700">
                    <UploadIcon className="w-4 h-4" />
                    {document ? 'Replace' : 'Upload'}
                </button>
            </div>
        </div>
    );
};

const inputStyles = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export const EducationLoanFormModal: React.FC<EducationLoanFormModalProps> = ({ isOpen, onClose, onSave, client, documents, onUploadDocument, onDeleteDocument }) => {
  const [formData, setFormData] = useState(client.generalInformation || {});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(client.generalInformation || {});
    }
  }, [isOpen, client.generalInformation]);

  const handleDocUpload = useCallback((file: File, docName: string, password?: string) => {
    onUploadDocument({ clientId: client.id, fileName: `${docName}_${file.name}`, fileType: file.type, size: file.size, uploadDate: new Date().toISOString(), creationDate: new Date().toISOString(), url: URL.createObjectURL(file), password: password || undefined });
  }, [client.id, onUploadDocument]);
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ generalInformation: formData });
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Education Loan Application Form</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
          </div>
          <form id="education-loan-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-4">
              <AccordionSection title="1. Student & Course Details" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="studentName" value={formData.studentName || ''} onChange={handleChange} placeholder="Student Name" className={inputStyles} />
                  <input type="text" name="courseName" value={formData.courseName || ''} onChange={handleChange} placeholder="Course Name" className={inputStyles} />
                  <input type="text" name="universityName" value={formData.universityName || ''} onChange={handleChange} placeholder="University/College Name" className={inputStyles} />
                  <input type="number" name="courseFees" value={formData.courseFees || ''} onChange={handleChange} placeholder="Total Course Fees (₹)" className={inputStyles} />
                   <select name="admissionStatus" value={formData.admissionStatus || ''} onChange={handleChange} className={inputStyles}>
                        <option value="">Select Admission Status</option>
                        <option value="Applied">Applied</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Awaiting Results">Awaiting Results</option>
                   </select>
                </div>
              </AccordionSection>
              
              <AccordionSection title="2. Student Documents">
                {studentKycDocumentList.map(item => (
                  <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <DocumentUploadItem docName={item.name} docDesc={item.desc} needsPassword={item.needsPassword} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                  </div>
                ))}
              </AccordionSection>

              <AccordionSection title="3. Co-Applicant Documents">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Co-applicant is typically a parent or guardian. Their KYC and income documents are required.</p>
                {coApplicantKycDocumentList.map(item => (
                  <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <DocumentUploadItem docName={item.name} docDesc={item.desc} needsPassword={item.needsPassword} clientDocs={documents} onUpload={handleDocUpload} onDelete={onDeleteDocument} onPreview={handlePreview} />
                  </div>
                ))}
              </AccordionSection>
            </div>
          </form>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-lg flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" form="education-loan-form" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              <SaveIcon className="w-5 h-5" /> Save Application
            </button>
          </div>
        </div>
      </div>
      <DocumentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} document={docToPreview} />
    </>
  );
};