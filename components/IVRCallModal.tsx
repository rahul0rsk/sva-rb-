
import React, { useState, useEffect, useRef } from 'react';
import type { Client, Interaction } from '../types';
import { CallDisposition } from '../types';
import { formatDurationForDisplay } from '../utils';
import { 
    PhoneIcon, 
    XIcon, 
    EndCallIcon,
    ClockIcon,
    SmsIcon,
    MuteIcon,
    HoldIcon,
    TransferIcon,
    RecordIcon
} from './common/icons';

interface IVRCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSaveInteraction: (interaction: Omit<Interaction, 'id'>) => void;
}

export const IVRCallModal: React.FC<IVRCallModalProps> = ({ isOpen, onClose, client, onSaveInteraction }) => {
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState<CallDisposition | ''>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDuration(0);
      setNotes('');
      setDisposition('');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen || !client) return null;

  const handleEndCall = () => {
    onSaveInteraction({
        clientId: client.id,
        date: new Date().toISOString(),
        type: 'Call',
        notes: notes,
        duration: duration,
        disposition: disposition || undefined,
    });
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">IVR Call Center</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-3">
                <PhoneIcon className="w-8 h-8 text-green-600"/>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Calling: <span className="font-semibold text-slate-800 dark:text-slate-100">{client.name} ({client.phone})</span></p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Duration: {formatDurationForDisplay(duration)}</p>
            <div className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-bold rounded-full">
                CONNECTED
            </div>
        </div>

        <div className="mt-6 space-y-4">
            <div>
                <label htmlFor="callNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Call Notes</label>
                <textarea 
                    id="callNotes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3} 
                    className={inputStyles} 
                    placeholder="Add notes about the call..."
                ></textarea>
            </div>
            <div>
                <label htmlFor="callDisposition" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Call Disposition</label>
                <select 
                    id="callDisposition" 
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value as CallDisposition)}
                    className={inputStyles}
                >
                    <option value="">Select disposition</option>
                    {Object.values(CallDisposition).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quick Actions</label>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><ClockIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Schedule Callback</button>
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><SmsIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Send SMS</button>
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><MuteIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Mute</button>
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><HoldIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Hold</button>
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><TransferIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Transfer Call</button>
                    <button className="flex items-center justify-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"><RecordIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>Record Call</button>
                </div>
            </div>
        </div>

        <div className="mt-6">
            <button 
                onClick={handleEndCall}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
                <EndCallIcon className="w-5 h-5" />
                End Call
            </button>
        </div>
      </div>
    </div>
  );
};
