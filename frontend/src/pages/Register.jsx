import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

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

        try {
            // Call backend signup API for standard users (ROLE_USER)
            const response = await api.post('/auth/register', { email, password, role: 'ROLE_USER' });
            
            // Store registration info
            if (fullName) {
                localStorage.setItem('fullName', fullName);
            }
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role || 'ROLE_USER');
            localStorage.setItem('email', email);

            setSuccess('Account created successfully! Redirecting...');
            
            setTimeout(() => {
                navigate('/user-dashboard');
            }, 1500);
        } catch (err) {
            console.error('Registration Error:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eaf7f7] px-4 py-12 font-sans">
            <div className="bg-white border-[0.5px] border-[#c4eaea] rounded-[12px] p-10 max-w-[440px] w-full shadow-none">
                <div className="text-center mb-8">
                    <h2 className="text-[22px] font-medium text-[#1a4a4a] leading-tight">
                        Create Account
                    </h2>
                    <p className="text-[13px] text-[#5aadad] mt-2 font-normal">
                        Sign up to unlock personalized routing features
                    </p>
                </div>

                {error && (
                    <div className="bg-[#fcf2f2] text-[#d9534f] p-3 rounded-[8px] mb-5 text-[13px] border-[0.5px] border-[#f5c6cb] font-normal">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="bg-[#f4faf4] text-[#2b7a2b] p-3 rounded-[8px] mb-5 text-[13px] border-[0.5px] border-[#c3e6cb] font-normal">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label 
                            htmlFor="fullName" 
                            className="block text-[12px] font-medium text-[#2a6b6b] mb-1.5"
                        >
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full border-[0.5px] border-[#8dd4d4] rounded-[8px] px-[14px] py-[10px] text-[13px] font-normal text-[#1a4a4a] placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-[#c4eaea] focus:border-[#8dd4d4] shadow-none bg-white transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-[12px] font-medium text-[#2a6b6b] mb-1.5"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-[0.5px] border-[#8dd4d4] rounded-[8px] px-[14px] py-[10px] text-[13px] font-normal text-[#1a4a4a] placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-[#c4eaea] focus:border-[#8dd4d4] shadow-none bg-white transition-all"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-[12px] font-medium text-[#2a6b6b] mb-1.5"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border-[0.5px] border-[#8dd4d4] rounded-[8px] pl-[14px] pr-[40px] py-[10px] text-[13px] font-normal text-[#1a4a4a] placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-[#c4eaea] focus:border-[#8dd4d4] shadow-none bg-white transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5aadad] hover:text-[#3d8b8b] transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label 
                            htmlFor="confirmPassword" 
                            className="block text-[12px] font-medium text-[#2a6b6b] mb-1.5"
                        >
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border-[0.5px] border-[#8dd4d4] rounded-[8px] pl-[14px] pr-[40px] py-[10px] text-[13px] font-normal text-[#1a4a4a] placeholder-teal-300 focus:outline-none focus:ring-2 focus:ring-[#c4eaea] focus:border-[#8dd4d4] shadow-none bg-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#3d8b8b] text-[#eaf7f7] rounded-[8px] py-[11px] text-[13px] font-medium shadow-none transition-colors hover:bg-[#2a6b6b] active:bg-[#1a4a4a] disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link 
                        to="/login" 
                        className="text-[13px] font-normal text-[#5aadad] hover:underline"
                    >
                        Already have an account? Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
