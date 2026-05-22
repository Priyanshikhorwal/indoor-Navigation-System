import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { User, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = ({ mode = 'login' }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(mode === 'register' ? 'register' : 'user');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync tab with route mode changes (e.g. from navbar clicks)
    useEffect(() => {
        setActiveTab(mode === 'register' ? 'register' : 'user');
        setError('');
        setSuccess('');
    }, [mode]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        if (tab === 'register') {
            navigate('/register');
        } else {
            navigate('/login');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic registration checks
        if (activeTab === 'register') {
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                setLoading(false);
                return;
            }
        }

        try {
            if (activeTab === 'register') {
                // Call backend signup API for standard users (ROLE_USER)
                const response = await api.post('/auth/register', { email, password, role: 'ROLE_USER' });
                
                setSuccess('Account created successfully! Logging you in...');
                
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role || 'ROLE_USER');
                localStorage.setItem('email', email);
                
                setTimeout(() => {
                    navigate('/user-dashboard');
                }, 1500);
            } else {
                // Call backend login API
                const response = await api.post('/auth/login', { email, password });
                
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('email', email);

                const userRole = response.data.role || 'ROLE_USER';
                localStorage.setItem('role', userRole);

                if (userRole === 'ROLE_ADMIN') {
                    setSuccess('Admin authenticated! Redirecting to Dashboard...');
                    setTimeout(() => {
                        navigate('/admin/dashboard');
                    }, 1200);
                } else {
                    setSuccess('Login successful! Welcome to Indoor Nav.');
                    setTimeout(() => {
                        navigate('/user-dashboard');
                    }, 1200);
                }
            }
        } catch (err) {
            console.error('Authentication Error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-secondary to-secondary-dark dark:from-darkBg dark:to-darkBg px-4 py-12 relative overflow-hidden">
            {/* Elegant glassmorphism backdrop circles */}
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-primary to-primary-light/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-to-r from-accent to-accent-light/10 blur-3xl pointer-events-none"></div>

            <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft-lg dark:shadow-none w-full max-w-lg border border-gray-100 dark:border-darkHover overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
                {/* Header Graphic */}
                <div className="bg-gradient-to-r from-primary to-primary-light dark:from-darkCard dark:to-darkBg text-white p-8 text-center relative dark:border-b dark:border-darkHover">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur shadow-inner">
                        {activeTab === 'register' ? (
                            <UserPlus className="w-8 h-8 text-white" />
                        ) : (
                            <User className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {activeTab === 'register' ? 'Create User Account' : 'Welcome to Indoor Nav'}
                    </h2>
                    <p className="text-gray-300 text-xs mt-1">
                        {activeTab === 'register' ? 'Sign up to unlock personalized routing features' : 'Enter details to access your personal navigation terminal'}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-gray-100 dark:border-darkHover bg-gray-50/50 dark:bg-darkBg p-2">
                    <button
                        onClick={() => handleTabChange('user')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'user'
                                ? 'bg-white dark:bg-darkCard text-primary dark:text-white shadow-soft dark:shadow-none'
                                : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'
                        }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        User Login
                    </button>
                    <button
                        onClick={() => handleTabChange('register')}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'register'
                                ? 'bg-white dark:bg-darkCard text-primary dark:text-white shadow-soft dark:shadow-none'
                                : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'
                        }`}
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Sign Up
                    </button>
                </div>

                <div className="p-8">
                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-50 text-accent p-4 rounded-2xl mb-6 text-xs font-semibold border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light animate-ping shrink-0"></span>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-xs font-semibold border border-green-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Standard Credentials Fields */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-primary/80 dark:text-gray-300 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3.5 border border-gray-200 dark:border-darkHover dark:bg-darkBg dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm placeholder:text-gray-400"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-primary/80 dark:text-gray-300 uppercase tracking-wider mb-2 flex justify-between items-center">
                                <span>Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3.5 pr-12 border border-gray-200 dark:border-darkHover dark:bg-darkBg dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary dark:hover:text-white transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Sign Up Password Confirmation */}
                        {activeTab === 'register' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-bold text-primary/80 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3.5 border border-gray-200 dark:border-darkHover dark:bg-darkBg dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary-light dark:from-accent dark:to-accent-light text-white py-4 rounded-2xl font-bold hover:bg-opacity-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 group shadow-soft-lg shadow-blue-900/10 dark:shadow-none"
                        >
                            <span>
                                {loading
                                    ? 'Processing Securely...'
                                    : activeTab === 'register'
                                    ? 'Create My Free Account'
                                    : 'Authenticate My Account'}
                            </span>
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Bottom Helper */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-50 dark:border-darkHover text-xs text-gray-500 dark:text-gray-400">
                        {activeTab === 'register' ? (
                            <span>
                                Already have an account?{' '}
                                <button
                                    onClick={() => handleTabChange('user')}
                                    className="text-primary dark:text-white font-bold hover:underline"
                                >
                                    Sign In here
                                </button>
                            </span>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <span>
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => handleTabChange('register')}
                                        className="text-primary dark:text-white font-bold hover:underline"
                                    >
                                        Register free today
                                    </button>
                                </span>
                                <div className="pt-2 border-t border-gray-100/50 dark:border-darkHover mt-1 flex justify-center items-center gap-1.5 text-[11px] text-gray-400">
                                    <span>Are you a map administrator?</span>
                                    <Link to="/admin/login" className="text-accent dark:text-accent-light font-bold hover:underline">
                                        Admin Portal Access
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
