
import React from 'react';
import { CakeIcon, XIcon } from './common/icons';

interface BirthdayPerson {
  id: string;
  name: string;
  role: string;
}

interface BirthdayWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdayPeople: BirthdayPerson[];
  wishes: Map<string, string>;
}

export const BirthdayWishModal: React.FC<BirthdayWishModalProps> = ({ isOpen, onClose, birthdayPeople, wishes }) => {
  if (!isOpen || birthdayPeople.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg m-4 transform transition-all relative overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_#f0f9ff,_#1e293b)] dark:bg-[radial-gradient(circle_at_top,_#1e293b,_#0f172a)] -z-10"></div>
        
        <div className="p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XIcon />
          </button>
          
          <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg">
              <CakeIcon className="w-10 h-10 text-blue-500" />
          </div>

          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-6">Birthday Wishes!</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Happy birthday to our valued team members & clients!</p>
          
          <div className="mt-6 text-left space-y-6 max-h-[50vh] overflow-y-auto px-2 -mx-2">
            {birthdayPeople.map(person => (
              <div key={person.id} className="border-t border-slate-200 dark:border-slate-700 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{person.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{person.role}</p>
                    </div>
                </div>
                <div className="mt-2 text-slate-600 dark:text-slate-300 text-base leading-relaxed pl-12 min-h-[48px] flex items-center">
                    {wishes.get(person.id) ? (
                        <p>"{wishes.get(person.id)}"</p>
                    ) : (
                        <div className="space-y-2 animate-pulse w-full">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md transition-transform transform hover:scale-105"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};
