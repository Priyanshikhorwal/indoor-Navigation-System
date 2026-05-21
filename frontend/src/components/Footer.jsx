import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-primary to-primary-light dark:from-slate-900 dark:to-slate-800 text-secondary p-8 mt-auto shadow-inner transition-colors duration-300">
            <div className="container mx-auto text-center">
                <h3 className="text-xl font-bold mb-4 hover:scale-105 transition-transform inline-block cursor-default">Indoor Navigation System for Buildings</h3>
                <p className="text-secondary/80 mb-4 hover:text-white transition-colors cursor-default">Minor Project 2026 | Acropolis Institute of Technology and Research, Indore</p>
                
                <div className="flex flex-wrap justify-center items-center gap-4 mb-4 text-sm text-secondary/70">
                    <span className="hover:text-accent hover:-translate-y-1 transition-all cursor-pointer inline-block">Prabhat Kumar Ahirwar</span>
                    <span className="text-secondary/30">•</span>
                    <span className="hover:text-accent hover:-translate-y-1 transition-all cursor-pointer inline-block">Priyanshi Khorwal</span>
                    <span className="text-secondary/30">•</span>
                    <span className="hover:text-accent hover:-translate-y-1 transition-all cursor-pointer inline-block">Nital Agrawal</span>
                    <span className="text-secondary/30">•</span>
                    <span className="hover:text-accent hover:-translate-y-1 transition-all cursor-pointer inline-block">Nitin Patidar</span>
                </div>
                
                <p className="text-sm text-secondary/60 hover:text-secondary transition-colors cursor-default group">
                    Guide: <span className="group-hover:text-accent font-semibold transition-colors">Prof. Ritika Bhatt</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
