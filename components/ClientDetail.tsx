
import React, { useState, useCallback, useRef } from 'react';
import type { Client, Task, Interaction, User, Document, Notification } from '../types';
import { LoanType, ApplicationStatus } from '../types';
import { EditIcon, ArrowLeftIcon, WhatsAppIcon, EmailIcon, PhoneIcon, PlusIcon, UploadIcon, EyeIcon, DownloadIcon, TrashIcon, IdCardIcon, FileTextIcon, CheckSquareIcon, HistoryIcon, ArrowRightIcon, SaveIcon, PdfIcon, SendIcon } from './common/icons';
import { CommunicationModal } from './CommunicationModal';
import { IVRCallModal } from './IVRCallModal';
import { EditLoanApplicationModal } from './EditLoanApplicationModal';
import { TaskModal } from './TaskModal';
import { formatCurrency, formatDuration, formatBytes, timeSince } from '../utils';
import { BusinessLoanFormModal } from './BusinessLoanFormModal';
import { EditPersonalDetailsModal } from './EditPersonalDetailsModal';
import { HomeLoanFormModal } from './HomeLoanFormModal';
import { PersonalLoanFormModal } from './PersonalLoanFormModal';
import { CarLoanFormModal } from './CarLoanFormModal';
import { EducationLoanFormModal } from './EducationLoanFormModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { ConfirmationModal } from './ConfirmationModal';
import { getFileIcon } from './FilesView';
import { UploadDocumentModal } from './UploadDocumentModal';
import { Permissions } from '../permissions';
import { Header } from './Header';

interface ClientDetailProps {
  client: Client;
  clients: Client[];
  tasks: Task[];
  users: User[];
  documents: Document[];
  onUpdateClient: (client: Client) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onBackToList: () => void;
  onAddInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  onUploadDocument: (doc: Omit<Document, 'id'>) => void;
  onDeleteDocument: (docId: string) => void;
  onBulkDeleteDocument: (docIds: string[]) => void;
  onNavigateClient: (direction: 'next' | 'prev') => void;
  can: (permission: string) => boolean;
  // Header props
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  currentUser: User;
  onGlobalSearch: (query: string) => void;
  onToggleSidebar?: () => void;
}

const getTaskStatus = (task: Task) => {
    if (task.completed) return { text: "Completed", color: "bg-green-100 text-green-700" };
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dueDate < today) return { text: "Overdue", color: "bg-red-100 text-red-700" };
    return { text: "Pending", color: "bg-yellow-100 text-yellow-700" };
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, action, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-300">
            <button
                type="button"
                className="w-full flex justify-between items-center p-4 text-left border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
                <div className="flex items-center gap-4">
                  <div onClick={e => e.stopPropagation()}>{action}</div>
                  <svg className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </button>
            {isOpen && <div className="p-4 sm:p-6">{children}</div>}
        </div>
    );
};

const Detail: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <strong className="text-slate-500 dark:text-slate-400 font-medium block mb-1">{label}</strong>
        <span className="text-slate-800 dark:text-slate-200 text-base">{value || 'N/A'}</span>
    </div>
);

const applicationStatusColors: { [key in ApplicationStatus]: string } = {
    [ApplicationStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ApplicationStatus.Verification]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ApplicationStatus.Sanctioned]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    [ApplicationStatus.Disbursed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const ApplicationStatusBadge: React.FC<{ status?: ApplicationStatus }> = ({ status }) => {
    if (!status) return <span className="text-slate-800 dark:text-slate-200 text-base">N/A</span>;
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${applicationStatusColors[status]}`}>
            {status}
        </span>
    );
};

type Tab = 'details' | 'documents' | 'tasks' | 'history';

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm transition-colors ${isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:hover:border-slate-600'}`}
    >
        {icon}
        {label}
    </button>
);

const ApplicationProgress: React.FC<{ status?: ApplicationStatus }> = ({ status }) => {
    const steps = ['Documents Collection', 'Under Review', 'Decision'];
    let activeStep = 0;
    if (status === ApplicationStatus.Verification) activeStep = 1;
    else if (status === ApplicationStatus.Sanctioned || status === ApplicationStatus.Disbursed) activeStep = 2;

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-slate-200 dark:border-slate-700 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
                {steps.map((step, index) => (
                    <div key={index} className="p-4 flex items-center justify-center">
                        {index === activeStep ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-blue-600 text-white">
                                    {index + 1}
                                </div>
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{step}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-2xl font-light text-slate-400 dark:text-slate-500">{index + 1}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{step}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ClientDetail: React.FC<ClientDetailProps> = (props) => {
  const { client, clients, tasks, users, documents, onUpdateClient, onAddTask, onBackToList, onAddInteraction, onUploadDocument, onDeleteDocument, onBulkDeleteDocument, onNavigateClient, can, ...headerProps } = props;

  // State for modals
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commModalMode, setCommModalMode] = useState<'WhatsApp' | 'Email' | null>(null);
  const [isIvrModalOpen, setIsIvrModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBusinessLoanModalOpen, setIsBusinessLoanModalOpen] = useState(false);
  const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
  const [isHomeLoanModalOpen, setIsHomeLoanModalOpen] = useState(false);
  const [isPersonalLoanModalOpen, setIsPersonalLoanModalOpen] = useState(false);
  const [isCarLoanModalOpen, setIsCarLoanModalOpen] = useState(false);
  const [isEducationLoanModalOpen, setIsEducationLoanModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // State for document handling
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docToPreview, setDocToPreview] = useState<Document | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [docsToAttach, setDocsToAttach] = useState<File[]>([]);

  // State for UI tabs and editing
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [notesContent, setNotesContent] = useState(client.notes || '');

  const clientDocuments = documents.filter(doc => doc.clientId === client.id);
  const clientTasks = tasks.filter(task => task.clientId === client.id);

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
  
  // Handlers for notes
  const handleEditNotes = () => {
    setNotesContent(client.notes || '');
    setIsNotesEditing(true);
  };

  const handleSaveNotes = () => {
    onUpdateClient({ ...client, notes: notesContent });
    setIsNotesEditing(false);
  };
  
  const handleCancelEditNotes = () => {
    setIsNotesEditing(false);
  };

  // Handlers for communication modals
  const openCommModal = (mode: 'WhatsApp' | 'Email') => {
    setCommModalMode(mode);
    setIsCommModalOpen(true);
  };

  const handleSendMessage = (subject: string, message: string, attachments: File[]) => {
    if (!client || !commModalMode) return;
    onAddInteraction({
        clientId: client.id,
        date: new Date().toISOString(),
        type: commModalMode,
        subject: commModalMode === 'Email' ? subject : undefined,
        notes: message,
        attachments: attachments.map(f => ({ name: f.name })),
    });
    setIsCommModalOpen(false);
  };
  
  // Handlers for other modals
  const handleSaveApplicationDetails = (details: Partial<Client>) => {
    onUpdateClient({ ...client, ...details });
  };
  
  const handleSaveTask = (task: Omit<Task, 'id'|'completed'>) => {
    onAddTask(task);
  };
  
  const handleSaveLoanDetails = (details: Partial<Client>) => {
    onUpdateClient({ ...client, ...details });
  };
  
  // Handlers for document deletion
  const handleDeleteClick = (doc: Document) => {
    setDocToDelete(doc);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      onDeleteDocument(docToDelete.id);
      setIsConfirmOpen(false);
      setDocToDelete(null);
    }
  };
  
  const confirmBulkDelete = () => {
    onBulkDeleteDocument(Array.from(selectedDocIds));
    setSelectedDocIds(new Set());
    setIsBulkConfirmOpen(false);
  };

  // Handlers for document selection
  const handleSelectDoc = (docId: string) => {
    const newSelection = new Set(selectedDocIds);
    if (newSelection.has(docId)) {
        newSelection.delete(docId);
    } else {
        newSelection.add(docId);
    }
    setSelectedDocIds(newSelection);
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedDocIds(new Set(clientDocuments.map(d => d.id)));
    } else {
        setSelectedDocIds(new Set());
    }
  };

  // Handlers for drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        console.log('Dropped files:', files);
        setIsUploadModalOpen(true); // Open upload modal on drop
    }
  };
  
  const handleAttachDocuments = (mode: 'Email' | 'WhatsApp') => {
      console.log(`Attaching ${selectedDocIds.size} documents to ${mode}`);
      openCommModal(mode);
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
    canManage: boolean;
  }> = ({ docName, docDesc, needsPassword, clientDocs, onUpload, onDelete, onPreview, canManage }) => {
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
                  {needsPassword && !document && canManage && (
                      <div className="mt-2">
                          <input
                              type="text"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              placeholder="Password (if any) or NA"
                              className="text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 w-48 focus:ring-2 focus:ring-blue-500 shadow-sm"
                          />
                      </div>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  {document ? (
                      <>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-300 px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded-full">Uploaded</span>
                          <button type="button" onClick={() => onPreview(document)} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Preview">
                              <EyeIcon className="w-5 h-5" />
                          </button>
                          {canManage && <button type="button" onClick={() => onDelete(document.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete">
                              <TrashIcon className="w-5 h-5" />
                          </button>}
                      </>
                  ) : (
                      <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-300 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">Pending</span>
                  )}
                  {canManage && <>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-blue-700"
                    >
                        <UploadIcon className="w-4 h-4" />
                        {document ? 'Replace' : 'Upload'}
                    </button>
                  </>}
              </div>
          </div>
      );
  };
  
  const clientIndex = clients.findIndex(c => c.id === client.id);
  const canGoPrev = clientIndex > 0;
  const canGoNext = clientIndex < clients.length - 1;

  const renderCreateFormButton = () => {
    if (!can(Permissions.EDIT_LEAD)) return null;

    const buttonTextMap: { [key in LoanType]?: string } = {
        [LoanType.Business]: "Create Business Loan Form",
        [LoanType.Home]: "Create Home Loan Application Form",
        [LoanType.Personal]: "Create Personal Loan Application Form",
        [LoanType.Car]: "Create Car Loan Application Form",
        [LoanType.Education]: "Create Education Loan Application Form",
    };

    const openModalMap: { [key in LoanType]?: () => void } = {
        [LoanType.Business]: () => setIsBusinessLoanModalOpen(true),
        [LoanType.Home]: () => setIsHomeLoanModalOpen(true),
        [LoanType.Personal]: () => setIsPersonalLoanModalOpen(true),
        [LoanType.Car]: () => setIsCarLoanModalOpen(true),
        [LoanType.Education]: () => setIsEducationLoanModalOpen(true),
    };

    const buttonText = buttonTextMap[client.loanType];
    const openModal = openModalMap[client.loanType];

    if (!buttonText || !openModal) return null;

    return (
        <button 
            onClick={openModal}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2">
            {buttonText}
        </button>
    );
};


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
       <Header
          title={client.name}
          subtitle={`${client.email} • ${client.phone}`}
          {...headerProps}
        >
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  client.riskProfile === 'Aggressive' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                  client.riskProfile === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              }`}>
                  {client.riskProfile} Risk Profile
              </span>
              {renderCreateFormButton()}
              <button onClick={() => setIsIvrModalOpen(true)} className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" title="Call Client">
                  <PhoneIcon className="w-5 h-5" />
              </button>
              <button onClick={() => openCommModal('WhatsApp')} className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" title="Send WhatsApp">
                  <WhatsAppIcon className="w-5 h-5" />
              </button>
              <button onClick={() => openCommModal('Email')} className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" title="Send Email">
                  <EmailIcon className="w-5 h-5" />
              </button>
          </div>
        </Header>

      <div className="flex justify-between items-center -mt-4">
        <button onClick={onBackToList} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">
            <ArrowLeftIcon />
            Back to Leads
        </button>
        <div className="flex items-center gap-2">
            <button onClick={() => onNavigateClient('prev')} disabled={!canGoPrev} className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowLeftIcon />
            </button>
             <button onClick={() => onNavigateClient('next')} disabled={!canGoNext} className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowRightIcon />
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-6">
              <div className="flex-grow">
                  <ApplicationProgress status={client.applicationStatus} />
              </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600">
                    <FileTextIcon className="w-5 h-5" /> Generate Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600">
                    <SendIcon className="w-5 h-5" /> Send Reminder
                </button>
                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-md shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600">
                    Close
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 w-full sm:w-auto justify-center">
                  <SaveIcon className="w-5 h-5" /> Save All Data
              </button>
          </div>
      </div>


      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <TabButton icon={<IdCardIcon className="w-5 h-5" />} label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
              <TabButton icon={<FileTextIcon className="w-5 h-5" />} label="Documents" isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
              <TabButton icon={<CheckSquareIcon className="w-5 h-5" />} label="Tasks" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
              <TabButton icon={<HistoryIcon className="w-5 h-5" />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          </nav>
      </div>
      
      <div className="mt-6">
        {activeTab === 'details' && (
            <div className="space-y-4">
                <AccordionSection 
                    title="Personal Details"
                    defaultOpen
                    action={ can(Permissions.EDIT_LEAD) && <button onClick={() => setIsEditDetailsModalOpen(true)} className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-1 rounded transition-colors"><EditIcon className="w-4 h-4 mr-1"/> Edit Details</button> }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                        <Detail label="PAN" value={client.pan} />
                        <Detail label="Date of Birth" value={client.dob ? new Date(client.dob).toLocaleDateString('en-GB') : 'N/A'} />
                        <Detail label="Financial Goals" value={client.financialGoals.join(', ')} className="md:col-span-2" />
                        <Detail label="Present Address" value={client.generalInformation?.presentAddress} className="md:col-span-2" />
                    </div>
                </AccordionSection>

                 <AccordionSection title="Employer Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                        <Detail label="Company Name" value={client.generalInformation?.companyName} />
                        <Detail label="Office Email" value={client.generalInformation?.officeEmail} />
                        <Detail label="Office Address" value={client.generalInformation?.officeAddress} className="md:col-span-2" />
                    </div>
                </AccordionSection>

                <AccordionSection 
                    title="Loan Application Details"
                    action={ can(Permissions.EDIT_LEAD) && <button onClick={() => setIsAppModalOpen(true)} className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-1 rounded transition-colors"><EditIcon className="w-4 h-4 mr-1"/> Edit Application</button> }
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <Detail label="Requested Amount" value={formatCurrency(client.loanDetails?.requestedAmount)} />
                        <Detail label="Approved Amount" value={formatCurrency(client.loanDetails?.approvedAmount)} />
                        <Detail label="Disbursed Amount" value={formatCurrency(client.loanDetails?.disbursedAmount)} />
                        <Detail label="Loan Type" value={client.loanType} />
                        <Detail label="Approval Date" value={client.loanDetails?.approvalDate ? new Date(client.loanDetails.approvalDate).toLocaleDateString() : 'N/A'} />
                        <Detail label="Application Status" value={<ApplicationStatusBadge status={client.applicationStatus} />} />
                        <Detail label="Application ID" value={client.applicationId} />
                        <Detail label="Bank Name" value={client.bankName} />
                    </div>
                </AccordionSection>

                <AccordionSection title="Applicant KYC Documents">
                    <div className="space-y-4">
                        {applicantKycDocumentList.map(item => (
                            <div key={item.name} className="py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <DocumentUploadItem
                                    docName={item.name}
                                    docDesc={item.desc}
                                    clientDocs={clientDocuments}
                                    onUpload={handleDocUpload}
                                    onDelete={onDeleteDocument}
                                    onPreview={handlePreview}
                                    canManage={can(Permissions.EDIT_LEAD)}
                                />
                            </div>
                        ))}
                    </div>
                </AccordionSection>

                <AccordionSection 
                    title="Client Notes"
                    action={
                        !isNotesEditing ? (
                           can(Permissions.EDIT_LEAD) && <button onClick={handleEditNotes} className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-1 rounded transition-colors">
                                <EditIcon className="w-4 h-4 mr-1"/> Edit Notes
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCancelEditNotes} className="px-3 py-1 text-sm bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                                <button onClick={handleSaveNotes} className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                                    <SaveIcon className="w-4 h-4" /> Save
                                </button>
                            </div>
                        )
                    }
                >
                    {isNotesEditing ? (
                        <textarea
                            value={notesContent}
                            onChange={(e) => setNotesContent(e.target.value)}
                            rows={5}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                            placeholder="Add notes about the client..."
                        />
                    ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap min-h-[5rem]">
                            {client.notes || <span className="text-slate-400 dark:text-slate-500">No notes added yet.</span>}
                        </p>
                    )}
                </AccordionSection>

            </div>
        )}
        
        {activeTab === 'documents' && (
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 gap-4">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Client Documents</h3>
                     {selectedDocIds.size > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedDocIds.size} selected</span>
                             <button onClick={() => handleAttachDocuments('Email')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-blue-700">
                                <EmailIcon className="w-4 h-4" /> Attach to Email
                            </button>
                            <button onClick={() => handleAttachDocuments('WhatsApp')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-green-700">
                                <WhatsAppIcon className="w-4 h-4" /> Attach to WhatsApp
                            </button>
                            {can(Permissions.EDIT_LEAD) && (
                                <button onClick={() => setIsBulkConfirmOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-red-700">
                                    <TrashIcon className="w-4 h-4" /> Delete
                                </button>
                            )}
                        </div>
                    ) : (
                        can(Permissions.EDIT_LEAD) && <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium p-1 rounded transition-colors">
                            <UploadIcon className="w-4 h-4 mr-1"/> Upload Document
                        </button>
                    )}
                </div>

                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`transition-colors rounded-lg ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    {clientDocuments.length > 0 ? (
                        <div className="space-y-3">
                           <div className="flex items-center py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                <input 
                                    type="checkbox" 
                                    className="rounded mr-2 bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500" 
                                    onChange={handleSelectAll}
                                    checked={clientDocuments.length > 0 && selectedDocIds.size === clientDocuments.length}
                                    ref={el => { if (el) el.indeterminate = selectedDocIds.size > 0 && selectedDocIds.size < clientDocuments.length; }}
                                />
                                Select All
                            </div>
                            {clientDocuments.map(doc => (
                                <div key={doc.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg transition-colors border ${selectedDocIds.has(doc.id) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                    <div className="flex items-center gap-3 flex-grow overflow-hidden w-full">
                                        <input 
                                            type="checkbox" 
                                            className="rounded flex-shrink-0 bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500"
                                            checked={selectedDocIds.has(doc.id)}
                                            onChange={() => handleSelectDoc(doc.id)}
                                        />
                                        <div className="text-2xl flex-shrink-0">{getFileIcon(doc.fileType)}</div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={doc.fileName}>{doc.fileName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(doc.size)} &bull; {timeSince(doc.creationDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 ml-auto sm:ml-4 mt-2 sm:mt-0 self-end">
                                        <button onClick={() => handlePreview(doc)} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Preview"><EyeIcon className="w-5 h-5" /></button>
                                        <a href={doc.url} download={doc.fileName} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Download"><DownloadIcon className="w-5 h-5" /></a>
                                        {can(Permissions.EDIT_LEAD) && (
                                            <button onClick={() => handleDeleteClick(doc)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                            <UploadIcon className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500"/>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">No documents uploaded.</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">Drag and drop files here or use the upload button.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {activeTab === 'tasks' && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Related Tasks</h3>
                    {can(Permissions.ADD_TASK) && (
                        <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium p-1 rounded transition-colors"><PlusIcon className="w-4 h-4 mr-1"/> Add Task</button>
                    )}
                </div>
                  <div className="space-y-2">
                      {clientTasks.length > 0 ? clientTasks.map(task => (
                          <div key={task.id} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                              <div>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTaskStatus(task).color}`}>
                                  {getTaskStatus(task).text}
                              </span>
                          </div>
                      )) : <p className="text-sm text-slate-500 dark:text-slate-400">No tasks for this client.</p>}
                  </div>
              </div>
        )}

        {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Interaction History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                  {client.interactions.map(i => (
                      <div key={i.id} className="text-sm">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{i.type} on {new Date(i.date).toLocaleDateString()}
                            {i.type === 'Call' && i.duration && <span className="font-normal text-slate-600 dark:text-slate-400"> ({formatDuration(i.duration)})</span>}
                          </p>
                          {i.disposition && <p className="text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full inline-block my-1">Disposition: {i.disposition}</p>}
                          <p className="text-slate-800 dark:text-slate-300 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-1 mt-1 whitespace-pre-wrap">{i.notes}</p>
                          {i.attachments && i.attachments.length > 0 && (
                            <div className="mt-2 pl-3">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attachments:</p>
                                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                                    {i.attachments.map((att, index) => <li key={index}>{att.name}</li>)}
                                </ul>
                            </div>
                          )}
                      </div>
                  ))}
                   {client.interactions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No interactions logged for this client.</p>}
              </div>
          </div>
        )}
      </div>


       <CommunicationModal 
        isOpen={isCommModalOpen} 
        onClose={() => {
            setIsCommModalOpen(false);
            setDocsToAttach([]); // Clear attachments when closing
        }}
        client={client} 
        mode={commModalMode} 
        onSend={handleSendMessage}
        initialAttachments={docsToAttach}
       />
       <IVRCallModal isOpen={isIvrModalOpen} onClose={() => setIsIvrModalOpen(false)} client={client} onSaveInteraction={onAddInteraction} />
      <EditLoanApplicationModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} onSave={handleSaveApplicationDetails} client={client} />
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} clients={clients} defaultClientId={client.id} />
      <BusinessLoanFormModal isOpen={isBusinessLoanModalOpen} onClose={() => setIsBusinessLoanModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <EditPersonalDetailsModal isOpen={isEditDetailsModalOpen} onClose={() => setIsEditDetailsModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <HomeLoanFormModal isOpen={isHomeLoanModalOpen} onClose={() => setIsHomeLoanModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <PersonalLoanFormModal isOpen={isPersonalLoanModalOpen} onClose={() => setIsPersonalLoanModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <CarLoanFormModal isOpen={isCarLoanModalOpen} onClose={() => setIsCarLoanModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <EducationLoanFormModal isOpen={isEducationLoanModalOpen} onClose={() => setIsEducationLoanModalOpen(false)} onSave={handleSaveLoanDetails} client={client} documents={documents} onUploadDocument={onUploadDocument} onDeleteDocument={onDeleteDocument} />
      <DocumentPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} document={docToPreview} />
      <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Document" message={`Are you sure you want to delete "${docToDelete?.fileName}"?`} confirmText="Yes, Delete" />
      <ConfirmationModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Bulk Delete Documents"
        message={`Are you sure you want to delete ${selectedDocIds.size} selected documents? This action cannot be undone.`}
        confirmText="Yes, Delete"
      />
      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        clients={clients} 
        onUpload={onUploadDocument} 
        defaultClientId={client.id}
      />
    </div>
  );
};
