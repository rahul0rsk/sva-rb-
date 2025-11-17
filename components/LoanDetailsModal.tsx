
import React, { useState, useEffect } from 'react';
import { XIcon, RupeeIcon } from './common/icons';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { approvedAmount: number; disbursedAmount: number }) => void;
  loanDetails: {
    approvedAmount: number;
    disbursedAmount: number;
  };
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ isOpen, onClose, onSave, loanDetails }) => {
  const [approvedAmount, setApprovedAmount] = useState(loanDetails.approvedAmount.toString());
  const [disbursedAmount, setDisbursedAmount] = useState(loanDetails.disbursedAmount.toString());

  useEffect(() => {
    if (isOpen) {
        setApprovedAmount(loanDetails.approvedAmount.toString());
        setDisbursedAmount(loanDetails.disbursedAmount.toString());
    }
  }, [isOpen, loanDetails]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const approved = parseFloat(approvedAmount) || 0;
    const disbursed = parseFloat(disbursedAmount) || 0;
    onSave({ approvedAmount: approved, disbursedAmount: disbursed });
    onClose();
  };
  
  const inputStyles = "block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edit Loan Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="approvedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Approved Amount (₹)</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <RupeeIcon className="h-5 w-5 text-slate-400" />
              </span>
              <input 
                type="number" 
                id="approvedAmount" 
                value={approvedAmount} 
                onChange={e => setApprovedAmount(e.target.value)} 
                required 
                className={inputStyles}
                placeholder="e.g., 500000"
              />
            </div>
          </div>
          <div>
            <label htmlFor="disbursedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Disbursed Amount (₹)</label>
             <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <RupeeIcon className="h-5 w-5 text-slate-400" />
              </span>
              <input 
                type="number" 
                id="disbursedAmount" 
                value={disbursedAmount} 
                onChange={e => setDisbursedAmount(e.target.value)} 
                required 
                className={inputStyles}
                placeholder="e.g., 250000"
               />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};
