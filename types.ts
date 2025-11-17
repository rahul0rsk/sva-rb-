
export enum ProductType {
  Stock = 'Stocks',
  MutualFund = 'Mutual Funds',
  Insurance = 'Insurance',
  FixedDeposit = 'Fixed Deposits',
  RealEstate = 'Real Estate',
}

export interface FinancialProduct {
  id: string;
  type: ProductType;
  name: string;
  value: number; // in INR
  details: { [key: string]: string | number };
}

export enum CallDisposition {
    Interested = 'Interested - Will Apply',
    Callback = 'Callback Scheduled',
    FollowUp = 'Follow up',
    AskExecutive = 'Ask Executive',
    NoRequirement = 'No Requirement',
    Invalid = 'Number Invalid',
}

export interface Interaction {
  id: string;
  clientId?: string;
  date: string;
  type: 'Call' | 'Meeting' | 'Email' | 'WhatsApp';
  notes: string;
  subject?: string;
  duration?: number; // in seconds
  disposition?: CallDisposition;
  attachments?: { name: string }[];
  participantIds?: string[];
}

export interface Task {
  id: string;
  clientId?: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export enum ClientStatus {
  Lead = 'Lead',
  FollowUp = 'Follow-up',
  Approved = 'Approved',
  Active = 'Active',
  Rejected = 'Rejected',
}

export enum LoanType {
    Personal = 'Personal Loan',
    Home = 'Home Loan',
    Business = 'Business Loan',
    Car = 'Car Loan',
    Education = 'Education Loan',
}

export enum LeadSource {
    Website = 'Website',
    Referral = 'Referral',
    Advertisement = 'Advertisement',
    ColdCall = 'Cold Call',
}

export enum ApplicationStatus {
    Pending = 'Documents Pending',
    Verification = 'Verification in Progress',
    Sanctioned = 'Loan Sanctioned',
    Disbursed = 'Loan Disbursed',
}

export interface PartnerDetails {
  fullName: string;
  panNumber: string;
  aadhaarNumber: string;
  email: string;
  phone: string;
  ownershipPercentage: string;
}

export interface CoApplicantDetails {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  relationship: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  dob?: string;
  contactDate: string;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  financialGoals: string[];
  portfolio: FinancialProduct[];
  interactions: Interaction[];
  status: ClientStatus;
  loanType: LoanType;
  leadSource: LeadSource;
  referralName?: string;
  referralNumber?: string;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  applicationId?: string;
  bankName?: string;
  notes?: string;
  notesTags?: string[];
  followUpDate?: string;
  loanDetails?: {
    requestedAmount?: number;
    approvedAmount?: number;
    disbursedAmount?: number;
    approvalDate?: string;
  };
  generalInformation?: {
    // Business Loan Fields
    companyName?: string;
    turnover?: string;
    officeEmail?: string;
    loanDuration?: number; // in months
    officeAddress?: string;
    presentAddress?: string;
    entityType?: string;
    businessNature?: string[];
    otherBusinessNature?: string;
    industry?: string[];
    otherIndustry?: string;
    partners?: PartnerDetails[];
    bankStatementFrom?: string;
    bankStatementTo?: string;
    itrFrom?: string;
    itrTo?: string;
    
    // Home Loan Fields
    monthlyIncome?: string;
    permanentAddress?: string;
    coApplicants?: CoApplicantDetails[];

    // Personal Loan Fields
    loanPurpose?: string;
    personalLoanType?: 'fresh' | 'balance-transfer';

    // Car Loan Fields
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    vehiclePrice?: number;

    // Education Loan Fields
    studentName?: string;
    courseName?: string;
    universityName?: string;
    courseFees?: number;
    admissionStatus?: 'Applied' | 'Admitted' | 'Awaiting Results';
  };
  applicationStatus?: ApplicationStatus;
}

export enum Role {
  Admin = 'Admin',
  SubAdmin = 'Sub-Admin',
  TeamLead = 'Team Lead',
  Agent = 'Agent',
  Trainee = 'Trainee',
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // In a real app, this would be a hash
  role: Role;
  email?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  dob?: string;
  shiftStartTime?: string; // Format: HH:mm
  shiftEndTime?: string; // Format: HH:mm
}

export interface Team {
  id: string;
  name: string;
  teamLeadId: string;
  memberIds: string[];
}

export const activityLogCategories = ['Authentication', 'Lead Management', 'Task Management', 'User Management', 'Team Management', 'Reporting', 'General'] as const;
export type ActivityLogCategory = typeof activityLogCategories[number];

export type RelatedEntityType = 'client' | 'task';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: ActivityLogCategory;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  relatedEntityName?: string;
}

export enum View {
  Login = 'Login',
  Dashboard = 'Dashboard',
  LeadsManagement = 'Leads Management',
  TaskManagement = 'Task Management',
  InteractionHistory = 'Interaction History',
  AdminPanel = 'Admin Dashboard',
  Reports = 'Reports',
  Analysis = 'Analysis',
  Profile = 'Profile',
  Settings = 'Settings',
  ClientDetail = 'Client Detail',
  TeamStructure = 'Team Structure',
  Files = 'Documents',
  ActivityLog = 'Activity Log',
  SearchResults = 'Search Results',
}

export enum NotificationType {
    TaskDue = 'Task Due',
    FollowUp = 'Follow Up',
    StatusChange = 'Status Change',
    Info = 'Info',
}

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    relatedId: string; // e.g., clientId or taskId
    timestamp: string;
    read: boolean;
}

export interface Commitment {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
}

export interface Document {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadDate: string;
  creationDate: string;
  url: string;
  password?: string;
}