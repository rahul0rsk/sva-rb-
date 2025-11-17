
import React, { useState, useEffect, useRef } from 'react';
import { CallDisposition } from '../types';
import { formatDurationForDisplay } from '../utils';
import { 
    PhoneIcon, 
    XIcon, 
    EndCallIcon,
    BackspaceIcon
} from './common/icons';

interface DialPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCall: (callData: { phoneNumber: string; duration: number; notes: string; disposition?: CallDisposition }) => void;
}

const KeypadButton: React.FC<{ digit: string; letters?: string; onClick: (digit: string) => void; className?: string; }> = ({ digit, letters, onClick, className }) => (
    <button 
        onClick={() => onClick(digit)} 
        className={`flex flex-col items-center justify-center h-20 w-20 rounded-full bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
        <span className="text-3xl font-light text-slate-800 dark:text-slate-100">{digit}</span>
        {letters && <span className="text-xs text-slate-400 dark:text-slate-400 tracking-widest -mt-1">{letters}</span>}
    </button>
);

const keypadLayout = [
    { digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' },
];

export const DialPadModal: React.FC<DialPadModalProps> = ({ isOpen, onClose, onSaveCall }) => {
    const [view, setView] = useState<'dialing' | 'in-call'>('dialing');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // In-call state
    const [duration, setDuration] = useState(0);
    const [notes, setNotes] = useState('');
    const [disposition, setDisposition] = useState<CallDisposition | ''>('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setView('dialing');
            setPhoneNumber('');
            setDuration(0);
            setNotes('');
            setDisposition('');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [isOpen]);

    useEffect(() => {
        if (view === 'in-call') {
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setDuration(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) };
    }, [view]);

    const handleKeyPress = (digit: string) => {
        setPhoneNumber(prev => prev + digit);
    };

    const handleBackspace = () => {
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    const handleStartCall = () => {
        if (phoneNumber.length > 0) {
            setView('in-call');
        }
    };

    const handleEndCall = () => {
        onSaveCall({
            phoneNumber,
            duration,
            notes,
            disposition: disposition || undefined,
        });
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
            </div>
            
            {view === 'dialing' && (
                <div className="p-6 flex flex-col items-center">
                    <div className="h-16 w-full mb-4 flex items-center justify-center">
                        <span className="text-3xl font-light text-slate-700 dark:text-slate-200 tracking-wider truncate">{phoneNumber || 'Enter number'}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {keypadLayout.map(key => (
                            <KeypadButton key={key.digit} {...key} onClick={handleKeyPress} />
                        ))}
                    </div>

                    <div className="flex items-center justify-between w-full mt-6 px-6">
                       <div className="w-20"></div> {/* Spacer */}
                       <button onClick={handleStartCall} className="w-20 h-20 flex items-center justify-center bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ring-offset-2">
                           <PhoneIcon className="w-8 h-8"/>
                       </button>
                       <div className="w-20 flex items-center justify-center">
                          {phoneNumber.length > 0 && 
                            <button onClick={handleBackspace} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                                <BackspaceIcon className="w-7 h-7" />
                            </button>
                          }
                       </div>
                    </div>
                </div>
            )}
            
            {view === 'in-call' && (
                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-3">
                            <PhoneIcon className="w-8 h-8 text-green-600"/>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">Calling: <span className="font-semibold text-slate-800 dark:text-slate-100">{phoneNumber}</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Duration: {formatDurationForDisplay(duration)}</p>
                        <div className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-bold rounded-full">
                            CONNECTED
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="callNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Call Notes</label>
                            <textarea id="callNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700" placeholder="Add notes about the call..."></textarea>
                        </div>
                        <div>
                            <label htmlFor="callDisposition" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Call Disposition</label>
                            <select id="callDisposition" value={disposition} onChange={(e) => setDisposition(e.target.value as CallDisposition)} className="mt-1 block w-full bg-white dark:bg-slate-700 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Select disposition</option>
                                {Object.values(CallDisposition).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button onClick={handleEndCall} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                            <EndCallIcon className="w-5 h-5" />
                            End Call & Save
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
};
