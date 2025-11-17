
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { XIcon, SaveIcon } from './common/icons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: User) => void;
  user: User;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    shiftStartTime: user.shiftStartTime || '',
    shiftEndTime: user.shiftEndTime || '',
  });

  useEffect(() => {
    if (isOpen) {
        setFormData({
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            shiftStartTime: user.shiftStartTime || '',
            shiftEndTime: user.shiftEndTime || '',
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedUser = { ...user, ...formData };
    if (!formData.password) {
      updatedUser.password = user.password;
    }
    
    onSave(updatedUser);
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyles} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" className={inputStyles} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shift Start Time</label>
                        <input type="time" name="shiftStartTime" value={formData.shiftStartTime} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shift End Time</label>
                        <input type="time" name="shiftEndTime" value={formData.shiftEndTime} onChange={handleChange} className={inputStyles} />
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    <SaveIcon className="w-5 h-5"/>
                    Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
