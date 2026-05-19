import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, LogOut } from 'lucide-react';

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

    return (
        <nav className="bg-primary text-white p-4 shadow-md sticky top-0 z-50">
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
                                <span className={`w-2 h-2 rounded-full ${role === 'ROLE_ADMIN' ? 'bg-accent animate-pulse' : 'bg-green-400'}`}></span>
                                <span className="max-w-[120px] truncate text-gray-200" title={email}>{email}</span>
                            </div>

                            <button onClick={handleLogout} className="flex items-center space-x-1.5 bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-md shadow-red-200">
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-white hover:text-accent transition-colors text-sm font-semibold">
                                Sign In
                            </Link>
                            <Link to="/register" className="bg-white text-primary px-4 py-2 rounded-xl hover:bg-gray-100 transition-all text-xs font-black shadow-sm">
                                Register
                            </Link>
                            <span className="text-white/20">|</span>
                            <Link to="/admin-login" className="text-gray-200 hover:text-accent hover:border-accent/40 border border-white/10 px-3 py-1.5 rounded-xl transition-all text-xs font-bold bg-white/5">
                                Admin Portal
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
