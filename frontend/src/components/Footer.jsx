import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white p-8 mt-auto">
            <div className="container mx-auto text-center">
                <h3 className="text-xl font-bold mb-4">Indoor Navigation System for Buildings</h3>
                <p className="text-gray-400 mb-4">Minor Project 2026 | Acropolis Institute of Technology and Research, Indore</p>
                
                <div className="flex justify-center space-x-4 mb-4 text-sm text-gray-500">
                    <span>Prabhat Kumar Ahirwar</span>
                    <span>•</span>
                    <span>Priyanshi Khorwal</span>
                    <span>•</span>
                    <span>Nital Agrawal</span>
                    <span>•</span>
                    <span>Nitin Patidar</span>
                </div>
                
                <p className="text-sm text-gray-500">Guide: Prof. Ritika Bhatt</p>
            </div>
        </footer>
    );
};

export default Footer;
