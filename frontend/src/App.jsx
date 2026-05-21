import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Navigation from './pages/Navigation';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/navigate" element={<Navigation />} />
              <Route path="/login" element={<Login mode="login" />} />
              <Route path="/register" element={<Login mode="register" />} />
              <Route path="/admin-login" element={<AdminLogin mode="login" />} />
              <Route path="/admin-register" element={<AdminLogin mode="register" />} />
              <Route 
                path="/user-dashboard" 
                element={
                  <ProtectedRoute requiredRole="ROLE_USER">
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute requiredRole="ROLE_ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
