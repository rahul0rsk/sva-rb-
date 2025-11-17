
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Role } from '../types';
import { XIcon, SparklesIcon, ArrowLeftIcon, ArrowRightIcon, DashboardIcon, UsersIcon, CheckSquareIcon, TeamIcon, ReportsIcon, AnalysisIcon } from './common/icons';

interface OnboardingTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const agentSteps = (name: string) => [
  { 
    icon: <SparklesIcon className="w-8 h-8 text-yellow-400" />,
    title: `Welcome, ${name}!`, 
    content: "You've been promoted to Agent! Let's take a quick tour of your new responsibilities and tools." 
  },
  { 
    icon: <DashboardIcon className="w-8 h-8 text-blue-500" />,
    title: 'Your Dashboard', 
    content: "This is your mission control. Track your leads, upcoming tasks, and overall performance at a glance." 
  },
  { 
    icon: <UsersIcon className="w-8 h-8 text-green-500" />,
    title: 'Leads Management', 
    content: "Here you'll find all leads assigned to you. You can now edit their details, add tasks, and log all your interactions like calls and emails." 
  },
  { 
    icon: <CheckSquareIcon className="w-8 h-8 text-indigo-500" />,
    title: 'Task Management', 
    content: "Stay organized by managing your tasks here. Complete existing tasks and create new ones for yourself or for specific clients." 
  },
  { 
    icon: <SparklesIcon className="w-8 h-8 text-yellow-400" />,
    title: 'You\'re All Set!', 
    content: "Your goal is to nurture these leads and guide them through the loan process. Good luck!" 
  },
];

const teamLeadSteps = (name: string) => [
  { 
    icon: <SparklesIcon className="w-8 h-8 text-yellow-400" />,
    title: `Congratulations, ${name}!`, 
    content: "Welcome to your new role as Team Lead! Let's walk through the powerful new tools at your disposal." 
  },
  { 
    icon: <TeamIcon className="w-8 h-8 text-sky-500" />,
    title: 'Team Structure', 
    content: "From the sidebar, you can now access 'Team Structure' to manage your team members and build a high-performing unit." 
  },
  { 
    icon: <UsersIcon className="w-8 h-8 text-green-500" />,
    title: 'Lead Assignment', 
    content: "In 'Leads Management', you now have an overview of all leads and can use the 'Bulk Assign' feature to distribute them among your team members effectively." 
  },
  { 
    icon: <ReportsIcon className="w-8 h-8 text-purple-500" />,
    title: 'Reports & Analysis', 
    content: "Monitor your team's performance with the 'Reports' and 'Analysis' dashboards. Track KPIs, conversion rates, and overall progress to guide your strategy." 
  },
  { 
    icon: <SparklesIcon className="w-8 h-8 text-yellow-400" />,
    title: 'Lead Your Team!', 
    content: "Your leadership is key to our success. Empower your team, track their progress, and drive results. Let's get started!" 
  },
];


export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({ isOpen, onClose, user }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const steps = user.role === Role.Agent 
        ? agentSteps(user.name) 
        : user.role === Role.TeamLead 
        ? teamLeadSteps(user.name) 
        : [];
        
    const totalSteps = steps.length;
    const stepData = steps[currentStep];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
    
    const handleFinish = () => {
        onClose();
        // Reset after a delay to allow for closing animation
        setTimeout(() => setCurrentStep(0), 300);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md m-4 transform transition-all relative overflow-hidden">
                <div className="p-8 text-center">
                    <button onClick={handleFinish} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XIcon />
                    </button>
                    
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg">
                        {stepData.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-6">{stepData.title}</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 min-h-[72px]">{stepData.content}</p>
                </div>
                
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Step {currentStep + 1} of {totalSteps}</span>
                        <div className="flex items-center gap-2">
                            {steps.map((_, index) => (
                                <div key={index} className={`w-2 h-2 rounded-full transition-colors ${currentStep === index ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button onClick={prevStep} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
                                <ArrowLeftIcon className="w-4 h-4" /> Previous
                            </button>
                        )}
                        {currentStep < totalSteps - 1 ? (
                            <button onClick={nextStep} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                                Next <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleFinish} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                                Finish Tour
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
