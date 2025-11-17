
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Role } from '../types';
import { XIcon, SaveIcon, UserIcon, IdCardIcon, LockIcon, EmailIcon, PhoneIcon, CakeIcon, ClockIcon } from './common/icons';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'> | User) => void;
  userToEdit?: User | null;
  currentUser: User; // To check for Admin role
}

const initialFormData = {
    name: '',
    username: '',
    password: '',
    role: Role.Agent,
    email: '',
    phone: '',
    dob: '',
    status: 'Active' as 'Active' | 'Inactive',
    shiftStartTime: '',
    shiftEndTime: '',
};

const FormRow: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode; }> = ({ label, id, required, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative mt-1">
            {children}
        </div>
    </div>
);

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-4">
        <h3 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

export const AddAgentModal: React.FC<AddAgentModalProps> = ({ isOpen, onClose, onSave, userToEdit, currentUser }) => {
  const [formData, setFormData] = useState(initialFormData);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && userToEdit) {
            setFormData({
                name: userToEdit.name,
                username: userToEdit.username,
                password: '', // Don't show existing password
                role: userToEdit.role,
                email: userToEdit.email || '',
                phone: userToEdit.phone || '',
                dob: userToEdit.dob || '',
                status: userToEdit.status || 'Active',
                shiftStartTime: userToEdit.shiftStartTime || '',
                shiftEndTime: userToEdit.shiftEndTime || '',
            });
        } else {
            setFormData(initialFormData);
        }
    }
  }, [isOpen, userToEdit, isEditMode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let userData: Omit<User, 'id'> | User;

    if (isEditMode && userToEdit) {
        userData = {
            ...userToEdit,
            ...formData,
            password: formData.password || userToEdit.password, // Keep old password if new one is empty
        };
    } else {
        if (!formData.password) {
            alert("Password is required for new users.");
            return;
        }
        userData = formData as Omit<User, 'id'>;
    }

    onSave(userData);
    onClose();
  };
  
  const availableRoles = Object.values(Role).filter(r => {
      if (currentUser.role === Role.Admin) return true; // Admin can create anyone
      // Others (e.g., TeamLead) cannot create Admin or SubAdmin
      return r !== Role.Admin && r !== Role.SubAdmin;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all mb-8">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <FormSection title="User Information">
                     <FormRow label="Full Name" id="name" required>
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                    <FormRow label="Date of Birth" id="dob">
                        <CakeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="date" 
                            id="dob" 
                            name="dob" 
                            value={formData.dob} 
                            onChange={handleChange} 
                            className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
                        />
                    </FormRow>
                </FormSection>

                <FormSection title="Contact Details">
                    <FormRow label="Email" id="email">
                        <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                    <FormRow label="Phone" id="phone">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                </FormSection>

                <FormSection title="Account & Schedule">
                    <FormRow label="Username" id="username" required>
                        <IdCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                     <FormRow label="Password" id="password" required={!isEditMode}>
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} placeholder={isEditMode ? 'Leave blank to keep current' : ''} className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                    <FormRow label="Role" id="role">
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                           {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </FormRow>
                    <FormRow label="Status" id="status">
                     <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                       <option value="Active">Active</option>
                       <option value="Inactive">Inactive</option>
                    </select>
                    </FormRow>
                     <FormRow label="Shift Start Time" id="shiftStartTime">
                        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="time" id="shiftStartTime" name="shiftStartTime" value={formData.shiftStartTime} onChange={handleChange} className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                    <FormRow label="Shift End Time" id="shiftEndTime">
                        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="time" id="shiftEndTime" name="shiftEndTime" value={formData.shiftEndTime} onChange={handleChange} className="pl-10 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </FormRow>
                </FormSection>

            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 rounded-b-lg sticky bottom-0">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    <SaveIcon className="w-5 h-5"/>
                    {isEditMode ? 'Save Changes' : 'Save User'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};