import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, LogOut, Moon, Sun } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        navigate('/');
    };

    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <nav className="bg-gradient-to-r from-primary to-primary-light dark:bg-none dark:bg-darkBg text-white p-4 shadow-soft dark:shadow-none dark:border-b dark:border-darkHover sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
                    <Map className="w-6 h-6 animate-pulse text-accent" />
                    <span>Indoor Nav</span>
                </Link>
                <div className="flex items-center space-x-6">
                    <Link to="/" className="hover:text-accent transition-colors text-sm font-semibold">Home</Link>
                    <Link to="/navigate" className="hover:text-accent transition-colors text-sm font-semibold">Navigation</Link>
                    
                    {token ? (
                        <>
                            {role === 'ROLE_ADMIN' ? (
                                <Link to="/admin-dashboard" className="hover:text-accent transition-colors text-sm font-semibold">Admin Panel</Link>
                            ) : (
                                <Link to="/user-dashboard" className="hover:text-accent transition-colors text-sm font-semibold">My Dashboard</Link>
                            )}
                            
                            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 text-xs font-bold select-none">
                                <span className={`w-2 h-2 rounded-full ${role === 'ROLE_ADMIN' ? 'bg-gradient-to-r from-accent to-accent-light animate-pulse' : 'bg-green-400'}`}></span>
                                <span className="max-w-[120px] truncate text-gray-200" title={email}>{email}</span>
                            </div>

                            <button onClick={handleLogout} className="flex items-center space-x-1.5 bg-gradient-to-r from-accent to-accent-light text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-soft shadow-red-200">
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-white hover:text-accent dark:text-gray-300 dark:hover:text-accent transition-colors text-sm font-semibold">
                                Sign In
                            </Link>
                            <Link to="/register" className="bg-white dark:bg-none dark:bg-darkCard text-primary dark:text-white px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-darkHover transition-all text-xs font-black shadow-soft dark:shadow-none border dark:border-darkHover">
                                Register
                            </Link>
                            <span className="text-white/20 dark:text-slate-600">|</span>
                            <Link to="/admin-login" className="text-gray-200 dark:text-gray-400 hover:text-accent dark:hover:text-white hover:border-accent/40 border border-white/10 dark:border-darkHover px-3 py-1.5 rounded-xl transition-all text-xs font-bold bg-white/5 dark:bg-none dark:bg-darkCard dark:hover:bg-darkHover">
                                Admin Portal
                            </Link>
                        </div>
                    )}
                    
                    <button 
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-darkHover transition-colors ml-4"
                        aria-label="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
