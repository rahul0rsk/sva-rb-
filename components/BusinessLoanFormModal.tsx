import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Client, Document, PartnerDetails } from '../types';
import { XIcon, SaveIcon, UploadIcon, TrashIcon, EyeIcon, PlusIcon } from './common/icons';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface BusinessLoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Client>) => void;
  client: Client;
  documents: Document[];
  onUploadDocument: (doc: Omit<Document, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
}

type EntityType = 'private' | 'proprietorship' | 'partnership' | '';

const applicantKycSection = {
    category: 'APPLICANT KYC',
    items: [
        { name: 'Aadhaar Card', desc: 'Required for identity verification', needsPassword: true },
        { name: 'PAN Card', desc: 'Required for tax identification', needsPassword: true },
        { name: 'Passport-size Photo', desc: 'Recent photograph' },
    ]
};

const directorPartnerDocumentList = [
    { name: 'Aadhaar Card', desc: 'Required for identity verification', needsPassword: true },
    { name: 'PAN Card', desc: 'Required for tax identification', needsPassword: true },
    { name: 'Passport-size Photo', desc: 'Recent photograph' },
];


const documentLists: Record<Exclude<EntityType, ''>, { category: string, items: { name: string, desc: string, needsPassword?: boolean, needsDateRange?: 'bankStatement' | 'itr' }[] }[]> = {
    proprietorship: [
        applicantKycSection,
        { category: 'BANKING', items: [
            { name: 'Bank Statement (1 year)', desc: 'Last 12 months bank statements', needsPassword: true, needsDateRange: 'bankStatement' },
            { name: 'ITR (Last 2 Years)', desc: 'Income Tax Returns', needsPassword: true },
        ] },
        { category: 'GST', items: [{ name: 'GST Registration Certificate', desc: 'GST registration proof', needsPassword: true }] },
        { category: 'UDYAM', items: [{ name: 'Udyam Registration', desc: 'MSME registration certificate' }] },
    ],
    partnership: [
        applicantKycSection,
        { category: 'FIRM DOCUMENTS', items: [
             { name: 'Partnership Deed', desc: 'For partnership firms', needsPassword: true },
             { name: 'Firm PAN Card', desc: 'Required for tax identification', needsPassword: true },
        ]},
        { category: 'BANKING', items: [
            { name: 'Bank Statement (1 year)', desc: 'Last 12 months bank statements', needsPassword: true, needsDateRange: 'bankStatement' },
            { name: 'ITR (Last 2 Years)', desc: 'Income Tax Returns', needsPassword: true },
        ] },
        { category: 'GST', items: [{ name: 'GST Registration Certificate', desc: 'GST registration proof', needsPassword: true }] },
    ],
    private: [
        applicantKycSection,
        { category: 'COMPANY DOCUMENTS', items: [
            { name: 'Company PAN Card', desc: 'For business entities', needsPassword: true },
            { name: 'Certificate of Incorporation', desc: 'Company registration certificate', needsPassword: true },
            { name: 'MOA & AOA', desc: 'Memorandum and Articles of Association', needsPassword: true },
        ]},
        { category: 'BANKING', items: [
            { name: 'Company Bank Statement (1 year)', desc: 'Last 12 months statements', needsPassword: true, needsDateRange: 'bankStatement' },
            { name: 'ITR (Last 2 Years)', desc: 'Income Tax Returns', needsPassword: true },
        ] },
        { category: 'GST', items: [{ name: 'GST Registration Certificate', desc: 'GST registration proof', needsPassword: true }] },
    ],
};

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


const businessNatures = ["Importer", "Trader", "Exporter", "Service", "Manufacturer", "Retailer", "Distributor", "Online Seller", "Offline Seller", "CSC/VLE", "Others"];
const industries = [
    "Apparels, Clothing & Accessories", "Aqua and marines", "Automobiles & Accessories", "Building supplies and accessories",
    "Computers, Mobile & related Accessories", "Consultancy", "Education", "FMCG", "Financial Services",
    "Food grains and other related products", "Health, Wellness, Medicine & Pharma products", "Home, Furnishing and Decor",
    "Imitation, Jewels & Metal alloys", "Industrial Supplies & Solutions", "Logistics", "Manpower Services",
    "Other Service Activities", "Petrol Pump", "Restaurant & Hospitality", "Software Services", "Telecom Distributor",
    "Textile/Manufacturing/Yarn/Fabric/Grey Cloth", "Travel Agents", "White goods-Electronic Appliances", "Other Industry"
];

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 20;

const inputStyles = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";


export const BusinessLoanFormModal: React.FC<BusinessLoanFormModalProps> = (props) => {
  const { isOpen, onClose, onSave, client, documents, onUploadDocument, onDeleteDocument } = props;
  const [formData, setFormData] = useState(client.generalInformation || { partners: [] });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);

  useEffect(() => {
    if (isOpen) {
      const generalInfo = client.generalInformation || {};
      const partners = generalInfo.partners || [];
      const entityType = generalInfo.entityType as EntityType;
      
      let initialPartners = partners;
      if ((entityType === 'private' || entityType === 'partnership') && partners.length < MIN_MEMBERS) {
          initialPartners = [...partners];
          for(let i = partners.length; i < MIN_MEMBERS; i++) {
              initialPartners.push({ fullName: '', panNumber: '', aadhaarNumber: '', email: '', phone: '', ownershipPercentage: '' });
          }
      }

      const formattedInfo = {
        ...generalInfo,
        partners: initialPartners,
        businessNature: Array.isArray(generalInfo.businessNature) ? generalInfo.businessNature : (generalInfo.businessNature ? [generalInfo.businessNature] : []),
        industry: Array.isArray(generalInfo.industry) ? generalInfo.industry : (generalInfo.industry ? [generalInfo.industry] : []),
      };

      setFormData(formattedInfo);
    }
  }, [isOpen, client.generalInformation]);

  const handleDocUpload = (file: File, docName: string, password?: string) => {
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
  };
  
  const handlePreview = (doc: Document) => {
    setDocToPreview(doc);
    setIsPreviewOpen(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: 'businessNature' | 'industry', value: string) => {
    setFormData(prev => {
        const currentValues = prev[field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        return { ...prev, [field]: newValues };
    });
  };

  const handleAddMember = (memberType: 'Director' | 'Partner') => {
      const partners = formData.partners || [];
      if (partners.length >= MAX_MEMBERS) return;
      const newMember: PartnerDetails = { fullName: '', panNumber: '', aadhaarNumber: '', email: '', phone: '', ownershipPercentage: '' };
      setFormData(prev => ({ ...prev, partners: [...partners, newMember] }));
  };

  const handleRemoveMember = (index: number, memberType: 'Director' | 'Partner') => {
      const partners = formData.partners || [];
      if (partners.length <= MIN_MEMBERS) {
          alert(`A ${memberType === 'Director' ? 'Private Limited Company' : 'Partnership'} must have at least ${MIN_MEMBERS} ${memberType.toLowerCase()}s.`);
          return;
      }
      setFormData(prev => ({ ...prev, partners: partners.filter((_, i) => i !== index) }));
  };

  const handlePartnerChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newPartners = [...(formData.partners || [])];
    const partnerToUpdate = { ...newPartners[index] } as any;
    partnerToUpdate[name] = value;
    newPartners[index] = partnerToUpdate;
    setFormData(prev => ({ ...prev, partners: newPartners }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ generalInformation: formData });
    onClose();
  };
  
  if (!isOpen) return null;

  const entityType = formData.entityType as EntityType;
  
  const renderMembersSection = (memberType: 'Director' | 'Partner') => {
      const partners = formData.partners || [];
      return (
          <AccordionSection title={`${memberType.toUpperCase()} MEMBERS`} defaultOpen>
              <div className="space-y-6 pt-2">
                  {partners.map((partner, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 relative">
                          <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-600 pb-2 mb-4">
                            <h5 className="font-semibold text-slate-800 dark:text-slate-200">{memberType} {index + 1}</h5>
                            <button type="button" onClick={() => handleRemoveMember(index, memberType)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400" title={`Remove ${memberType}`}>
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                                  <input type="text" name="fullName" value={partner.fullName} onChange={(e) => handlePartnerChange(index, e)} placeholder="Enter full name" required className={`mt-1 ${inputStyles}`} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">PAN Number <span className="text-red-500">*</span></label>
                                  <input type="text" name="panNumber" value={partner.panNumber} onChange={(e) => handlePartnerChange(index, e)} placeholder="Enter PAN number" required className={`mt-1 ${inputStyles}`} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Aadhaar Number <span className="text-red-500">*</span></label>
                                  <input type="text" name="aadhaarNumber" value={partner.aadhaarNumber} onChange={(e) => handlePartnerChange(index, e)} placeholder="Enter Aadhaar number" required className={`mt-1 ${inputStyles}`} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
                                  <input type="email" name="email" value={partner.email} onChange={(e) => handlePartnerChange(index, e)} placeholder="Enter email" className={`mt-1 ${inputStyles}`} />
                              </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Phone</label>
                                  <input type="tel" name="phone" value={partner.phone} onChange={(e) => handlePartnerChange(index, e)} placeholder="Enter phone number" className={`mt-1 ${inputStyles}`} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{memberType === 'Director' ? 'Director ID (DIN)' : 'Ownership %'}</label>
                                  <input type="text" name="ownershipPercentage" value={partner.ownershipPercentage} onChange={(e) => handlePartnerChange(index, e)} placeholder={memberType === 'Director' ? 'Enter Director ID' : 'Percentage'} className={`mt-1 ${inputStyles}`} />
                              </div>
                          </div>
                          <div className="mt-4">
                              <h6 className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-2">{memberType.toUpperCase()} DOCUMENTS</h6>
                              {directorPartnerDocumentList.map(docItem => (
                                <div key={`member_${index}_${docItem.name}`} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                  <DocumentUploadItem
                                      docName={`${memberType} ${index + 1} ${docItem.name}`}
                                      docDesc={docItem.desc}
                                      needsPassword={docItem.needsPassword}
                                      clientDocs={documents}
                                      onUpload={handleDocUpload}
                                      onDelete={onDeleteDocument}
                                      onPreview={handlePreview}
                                  />
                                </div>
                              ))}
                          </div>
                      </div>
                  ))}
                  <div className="flex gap-2">
                      <button type="button" onClick={() => handleAddMember(memberType)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          <PlusIcon className="w-4 h-4" /> Add {memberType}
                      </button>
                  </div>
              </div>
          </AccordionSection>
      );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Business Loan Application Form</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
          </div>
          <form id="business-loan-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-4">
              <AccordionSection title="1. General Information" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} placeholder="Company Name" className={inputStyles} />
                  <input type="text" name="turnover" value={formData.turnover || ''} onChange={handleChange} placeholder="Turnover" className={inputStyles} />
                  <input type="email" name="officeEmail" value={formData.officeEmail || ''} onChange={handleChange} placeholder="Office Email" className={inputStyles} />
                  <input type="number" name="loanDuration" value={formData.loanDuration || ''} onChange={handleChange} placeholder="Loan Duration (months)" className={inputStyles} />
                  <textarea name="officeAddress" value={formData.officeAddress || ''} onChange={handleChange} placeholder="Office Address" rows={2} className={`md:col-span-2 ${inputStyles}`}></textarea>
                  <textarea name="presentAddress" value={formData.presentAddress || ''} onChange={handleChange} placeholder="Present Address" rows={2} className={`md:col-span-2 ${inputStyles}`}></textarea>
                </div>
              </AccordionSection>
              
              <AccordionSection title="2. Entity & Document Requirements">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Your Entity Type</label>
                  <select name="entityType" value={entityType || ''} onChange={handleChange} className={inputStyles} required>
                    <option value="" disabled>Select Entity Type</option>
                    <option value="proprietorship">Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="private">Private Limited Company</option>
                  </select>
                </div>
                {entityType && (
                    <>
                        {entityType === 'private' && renderMembersSection('Director')}
                        {entityType === 'partnership' && renderMembersSection('Partner')}

                        {documentLists[entityType] && (
                          <div className="space-y-4">
                            {documentLists[entityType].map(category => (
                              <div key={category.category}>
                                <h5 className="font-medium text-slate-500 dark:text-slate-400 mt-4">{category.category}</h5>
                                {category.items.map(item => (
                                  <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <DocumentUploadItem
                                      docName={item.name}
                                      docDesc={item.desc}
                                      needsPassword={item.needsPassword}
                                      clientDocs={documents}
                                      onUpload={handleDocUpload}
                                      onDelete={onDeleteDocument}
                                      onPreview={handlePreview}
                                    />
                                    {item.needsDateRange && (
                                      <div className="flex items-center gap-2 mt-2 pl-0">
                                          <input type="month" name={`${item.needsDateRange}From`} value={(formData as any)[`${item.needsDateRange}From`] || ''} onChange={handleChange} className="text-xs p-1.5 border dark:border-slate-600 dark:bg-slate-700 rounded" aria-label={`${item.name} from date`} />
                                          <span className="text-xs text-slate-500 dark:text-slate-400">to</span>
                                          <input type="month" name={`${item.needsDateRange}To`} value={(formData as any)[`${item.needsDateRange}To`] || ''} onChange={handleChange} className="text-xs p-1.5 border dark:border-slate-600 dark:bg-slate-700 rounded" aria-label={`${item.name} to date`} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                )}
              </AccordionSection>

              <AccordionSection title="3. Nature of Business">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {businessNatures.map(nature => (
                          <label key={nature} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm ${(formData.businessNature || []).includes(nature) ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                              <input type="checkbox" name="businessNature" value={nature} checked={(formData.businessNature || []).includes(nature)} onChange={() => handleCheckboxChange('businessNature', nature)} className="form-checkbox text-blue-600 rounded dark:bg-slate-600 dark:border-slate-500 dark:checked:bg-blue-500" />
                              <span className="text-slate-700 dark:text-slate-300">{nature}</span>
                          </label>
                      ))}
                  </div>
                  {(formData.businessNature || []).includes('Others') && <input type="text" name="otherBusinessNature" value={formData.otherBusinessNature || ''} onChange={handleChange} placeholder="Please specify other business nature" className={`mt-2 ${inputStyles}`} />}
              </AccordionSection>

              <AccordionSection title="4. Industry">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {industries.map(industry => (
                           <label key={industry} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm ${(formData.industry || []).includes(industry) ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                              <input type="checkbox" name="industry" value={industry} checked={(formData.industry || []).includes(industry)} onChange={() => handleCheckboxChange('industry', industry)} className="form-checkbox text-blue-600 rounded dark:bg-slate-600 dark:border-slate-500 dark:checked:bg-blue-500" />
                              <span className="text-slate-700 dark:text-slate-300">{industry}</span>
                          </label>
                      ))}
                  </div>
                  {(formData.industry || []).includes('Other Industry') && <input type="text" name="otherIndustry" value={formData.otherIndustry || ''} onChange={handleChange} placeholder="Please specify other industry" className={`mt-2 ${inputStyles}`} />}
              </AccordionSection>
            </div>
            </form>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-lg flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
              <button type="submit" form="business-loan-form" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                <SaveIcon className="w-5 h-5" /> Save Application
              </button>
            </div>
        </div>
      </div>
      <DocumentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} document={docToPreview} />
    </>
  );
};