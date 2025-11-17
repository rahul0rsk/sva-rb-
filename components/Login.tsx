
import React, { useState } from 'react';
import { HomeIcon, UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './common/icons';

interface LoginProps {
    onLogin: (username: string, password: string) => 'success' | 'invalid_credentials' | 'inactive_account';
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = onLogin(username, password);
        if (result !== 'success') {
            if (result === 'invalid_credentials') {
                setError('Invalid username or password. Please try again.');
            } else if (result === 'inactive_account') {
                setError('Your account is inactive. Please contact an administrator.');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="bg-blue-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-500/20">
                       <HomeIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight sm:text-4xl">SVA Loan CRM</h1>
                    <p className="text-slate-400 mt-2">Professional Management System</p>
                </div>

                <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-blue-400 mb-1">Username</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-100"
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="password"className="block text-sm font-medium text-blue-400 mb-1">Password</label>
                            <div className="relative">
                                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LockIcon className="h-5 w-5 text-slate-400" />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        
                        {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md transition-transform transform hover:scale-105"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};