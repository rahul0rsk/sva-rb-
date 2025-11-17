
import React, { useState, useEffect } from 'react';
import type { Commitment } from '../types';
import { XIcon, SaveIcon, RupeeIcon } from './common/icons';

interface UpdateCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: Commitment) => void;
  commitment: Commitment | null;
}

export const UpdateCommitmentModal: React.FC<UpdateCommitmentModalProps> = ({ isOpen, onClose, onSave, commitment }) => {
  const [currentAmount, setCurrentAmount] = useState('');

  useEffect(() => {
    if (isOpen && commitment) {
      setCurrentAmount(commitment.currentAmount.toString());
    }
  }, [isOpen, commitment]);

  if (!isOpen || !commitment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...commitment, currentAmount: parseFloat(currentAmount) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Update Commitment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <h3 className="font-medium text-slate-700 dark:text-slate-300">{commitment.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Target: ₹{commitment.targetAmount.toLocaleString('en-IN')}</p>
                <div>
                    <label htmlFor="currentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Amount (₹)</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <RupeeIcon className="h-5 w-5" />
                        </span>
                        <input 
                            type="number"
                            id="currentAmount"
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    <SaveIcon className="w-5 h-5"/>
                    Save Progress
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
