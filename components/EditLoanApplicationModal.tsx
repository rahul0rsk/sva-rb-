
import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { LoanType, ApplicationStatus } from '../types';
import { XIcon, SaveIcon } from './common/icons';

interface EditLoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: Partial<Client>) => void;
  client: Client;
}

export const EditLoanApplicationModal: React.FC<EditLoanApplicationModalProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    requestedAmount: client.loanDetails?.requestedAmount?.toString() || '',
    approvedAmount: client.loanDetails?.approvedAmount?.toString() || '',
    disbursedAmount: client.loanDetails?.disbursedAmount?.toString() || '',
    loanType: client.loanType || LoanType.Home,
    approvalDate: client.loanDetails?.approvalDate || '',
    applicationId: client.applicationId || '',
    bankName: client.bankName || '',
    applicationStatus: client.applicationStatus || ApplicationStatus.Pending,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        requestedAmount: client.loanDetails?.requestedAmount?.toString() || '',
        approvedAmount: client.loanDetails?.approvedAmount?.toString() || '',
        disbursedAmount: client.loanDetails?.disbursedAmount?.toString() || '',
        loanType: client.loanType || LoanType.Home,
        approvalDate: client.loanDetails?.approvalDate || '',
        applicationId: client.applicationId || '',
        bankName: client.bankName || '',
        applicationStatus: client.applicationStatus || ApplicationStatus.Pending,
      });
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: Partial<Client> = {
        loanType: formData.loanType,
        applicationId: formData.applicationId,
        bankName: formData.bankName,
        applicationStatus: formData.applicationStatus,
        loanDetails: {
            ...client.loanDetails,
            requestedAmount: parseFloat(formData.requestedAmount) || 0,
            approvedAmount: parseFloat(formData.approvedAmount) || 0,
            disbursedAmount: parseFloat(formData.disbursedAmount) || 0,
            approvalDate: formData.approvalDate,
        }
    };
    onSave(updatedDetails);
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edit Loan Application</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="requestedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Requested Amount (₹)</label>
                <input type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="loanType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Loan Type</label>
                <select name="loanType" value={formData.loanType} onChange={handleChange} className={inputStyles}>
                  {Object.values(LoanType).map(lt => <option key={lt} value={lt}>{lt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="approvedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Approved Amount (₹)</label>
                <input type="number" name="approvedAmount" value={formData.approvedAmount} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="disbursedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Disbursed Amount (₹)</label>
                <input type="number" name="disbursedAmount" value={formData.disbursedAmount} onChange={handleChange} className={inputStyles} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="applicationId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Application ID</label>
                <input type="text" name="applicationId" value={formData.applicationId} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputStyles} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="approvalDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Approval Date</label>
                <input type="date" name="approvalDate" value={formData.approvalDate} onChange={handleChange} className={inputStyles} />
              </div>
              <div>
                  <label htmlFor="applicationStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Application Status</label>
                  <select name="applicationStatus" value={formData.applicationStatus} onChange={handleChange} className={inputStyles}>
                      {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <SaveIcon className="w-5 h-5"/> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
