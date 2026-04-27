import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <nav className="bg-primary text-white p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
                    <Map className="w-6 h-6" />
                    <span>Indoor Nav</span>
                </Link>
                <div className="flex items-center space-x-6">
                    <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                    <Link to="/navigate" className="hover:text-accent transition-colors">Navigation</Link>
                    
                    {token ? (
                        <>
                            <Link to="/admin-dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
                            <button onClick={handleLogout} className="flex items-center space-x-1 bg-accent px-4 py-2 rounded hover:bg-opacity-80 transition-all">
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/admin-login" className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 transition-all font-semibold">
                            Admin Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
