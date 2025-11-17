
import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { LoanType, ClientStatus, LeadSource } from '../types';
import { XIcon, SaveIcon } from './common/icons';

type AddLeadModalData = Omit<Client, 'id' | 'pan' | 'dob' | 'riskProfile' | 'financialGoals' | 'portfolio' | 'interactions' | 'assignedTo' | 'contactDate' | 'createdBy'>;

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: AddLeadModalData | Client) => void;
  clientToEdit?: Client | null;
}

const initialFormData = {
    name: '',
    email: '',
    phone: '',
    requestedAmount: '',
    approvedAmount: '',
    disbursedAmount: '',
    loanType: LoanType.Home,
    status: ClientStatus.Lead,
    leadSource: LeadSource.Website,
    referralName: '',
    referralNumber: '',
    applicationId: '',
    bankName: '',
    notes: '',
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSave, clientToEdit }) => {
  const [formData, setFormData] = useState(initialFormData);

  const isEditMode = !!clientToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            setFormData({
                name: clientToEdit.name,
                email: clientToEdit.email,
                phone: clientToEdit.phone.replace('+91 ', ''),
                requestedAmount: clientToEdit.loanDetails?.requestedAmount?.toString() || '',
                approvedAmount: clientToEdit.loanDetails?.approvedAmount?.toString() || '',
                disbursedAmount: clientToEdit.loanDetails?.disbursedAmount?.toString() || '',
                loanType: clientToEdit.loanType,
                status: clientToEdit.status,
                leadSource: clientToEdit.leadSource,
                referralName: clientToEdit.referralName || '',
                referralNumber: clientToEdit.referralNumber || '',
                applicationId: clientToEdit.applicationId || '',
                bankName: clientToEdit.bankName || '',
                notes: clientToEdit.notes || '',
            });
        } else {
            setFormData(initialFormData);
        }
    }
  }, [isOpen, clientToEdit, isEditMode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && clientToEdit) {
        const mergedClient: Client = {
            ...clientToEdit,
            name: formData.name,
            email: formData.email,
            phone: `+91 ${formData.phone}`,
            loanType: formData.loanType,
            status: formData.status,
            leadSource: formData.leadSource,
            referralName: formData.leadSource === LeadSource.Referral ? formData.referralName : undefined,
            referralNumber: formData.leadSource === LeadSource.Referral ? formData.referralNumber : undefined,
            applicationId: formData.applicationId,
            bankName: formData.bankName,
            notes: formData.notes,
            loanDetails: {
                ...clientToEdit.loanDetails,
                requestedAmount: parseFloat(formData.requestedAmount) || 0,
                approvedAmount: parseFloat(formData.approvedAmount) || 0,
                disbursedAmount: parseFloat(formData.disbursedAmount) || 0,
            }
        };
        onSave(mergedClient);
    } else {
        const newClientData: AddLeadModalData = {
            name: formData.name,
            email: formData.email,
            phone: `+91 ${formData.phone}`,
            loanType: formData.loanType,
            status: formData.status,
            leadSource: formData.leadSource,
            referralName: formData.leadSource === LeadSource.Referral ? formData.referralName : undefined,
            referralNumber: formData.leadSource === LeadSource.Referral ? formData.referralNumber : undefined,
            applicationId: formData.applicationId,
            bankName: formData.bankName,
            notes: formData.notes,
            loanDetails: {
                requestedAmount: parseFloat(formData.requestedAmount) || 0,
                approvedAmount: parseFloat(formData.approvedAmount) || 0,
                disbursedAmount: parseFloat(formData.disbursedAmount) || 0,
            }
        };
        onSave(newClientData);
    }

    onClose();
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400";
  const phoneInputStyles = "block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all mb-8">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{isEditMode ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Customer Name <span className="text-red-500">*</span></label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Optional" className={inputStyles} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Phone <span className="text-red-500">*</span></label>
                        <div className="flex mt-1">
                             <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-sm">
                                India (+91)
                            </span>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={phoneInputStyles} placeholder="Enter phone number"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="requestedAmount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Loan Amount (₹) <span className="text-red-500">*</span></label>
                        <input type="number" id="requestedAmount" name="requestedAmount" value={formData.requestedAmount} onChange={handleChange} required className={inputStyles} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="approvedAmount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Approval Amount</label>
                        <input type="number" id="approvedAmount" name="approvedAmount" value={formData.approvedAmount} onChange={handleChange} placeholder="Optional" className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="disbursedAmount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Disbursement Amount</label>
                        <input type="number" id="disbursedAmount" name="disbursedAmount" value={formData.disbursedAmount} onChange={handleChange} placeholder="Optional" className={inputStyles} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="loanType" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Loan Type</label>
                        <select id="loanType" name="loanType" value={formData.loanType} onChange={handleChange} className={inputStyles}>
                           {Object.values(LoanType).map(lt => <option key={lt} value={lt}>{lt}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
                         <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputStyles}>
                           {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                     <label htmlFor="leadSource" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Lead Source</label>
                     <select id="leadSource" name="leadSource" value={formData.leadSource} onChange={handleChange} className={`${inputStyles} md:w-1/2`}>
                       {Object.values(LeadSource).map(ls => <option key={ls} value={ls}>{ls}</option>)}
                    </select>
                </div>

                {formData.leadSource === LeadSource.Referral && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="referralName" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Referral Name</label>
                            <input type="text" id="referralName" name="referralName" value={formData.referralName} onChange={handleChange} className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="referralNumber" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Referral Number</label>
                            <input type="text" id="referralNumber" name="referralNumber" value={formData.referralNumber} onChange={handleChange} className={inputStyles} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="applicationId" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Application ID</label>
                        <input type="text" id="applicationId" name="applicationId" value={formData.applicationId} onChange={handleChange} placeholder="Optional" className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Bank Name</label>
                        <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="Optional" className={inputStyles} />
                    </div>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className={inputStyles} placeholder="Add any additional notes..."></textarea>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg sticky bottom-0">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    <SaveIcon className="w-5 h-5"/>
                    {isEditMode ? 'Save Changes' : 'Save Lead'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
