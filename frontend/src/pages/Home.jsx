import React from 'react';
import { Map, Zap, Lock, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="bg-secondary min-h-screen">
            {/* Hero Section */}
            <div className="bg-primary text-white py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <h1 className="text-5xl font-bold mb-6 relative z-10">Smart Indoor Navigation</h1>
                <p className="text-xl max-w-2xl mx-auto mb-10 text-gray-200 relative z-10">
                    Locate rooms, labs, offices, and departments inside buildings effortlessly using shortest path algorithms and interactive routing.
                </p>
                <Link to="/navigate" className="bg-accent text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg relative z-10">
                    Start Navigating
                </Link>
            </div>

            {/* Features */}
            <div className="container mx-auto py-16 px-4">
                <h2 className="text-3xl font-bold text-center text-primary mb-12">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: <Map className="w-8 h-8"/>, title: "Interactive Maps", desc: "View building layouts and locations clearly." },
                        { icon: <Compass className="w-8 h-8"/>, title: "A* Algorithm", desc: "Finds the mathematically shortest path." },
                        { icon: <Zap className="w-8 h-8"/>, title: "Fast & Responsive", desc: "Works seamlessly on mobile and desktop." },
                        { icon: <Lock className="w-8 h-8"/>, title: "Secure Admin", desc: "JWT secured dashboard for map management." }
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 flex flex-col items-center text-center">
                            <div className="text-accent mb-4 bg-red-50 p-4 rounded-full">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-primary mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* About & Stack */}
            <div className="bg-white py-16 px-4">
                <div className="container mx-auto flex flex-col md:flex-row gap-12">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-primary mb-6">About the Project</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Indoor Navigation System for Buildings is a web-based platform designed to resolve the complexity of finding specific locations inside large infrastructures like college campuses. 
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            It leverages the A* search algorithm to compute the shortest possible route between a source and a destination, providing a highly optimized pathfinding solution.
                        </p>
                    </div>
                    <div className="flex-1 glass p-8 rounded-2xl shadow-sm border border-gray-100 bg-gray-50">
                        <h2 className="text-2xl font-bold text-primary mb-6">Technology Stack</h2>
                        <div className="flex flex-wrap gap-3">
                            {['React', 'Tailwind CSS', 'Spring Boot', 'Java', 'PostgreSQL', 'Spring Security', 'JWT', 'A* Algorithm'].map((tech) => (
                                <span key={tech} className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-primary shadow-sm border border-gray-200">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
