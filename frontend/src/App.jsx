import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import WebGLBackground from './components/WebGLBackground';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Providers from './pages/Providers';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProviders from './pages/AdminProviders';
import AdminServices from './pages/AdminServices';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAudit from './pages/AdminAudit';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen relative">
          <WebGLBackground />
          <Header />
          <main className="relative z-10">
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/admin/signin" element={<AdminLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                {/* Placeholders for additional admin pages */}
                <Route path="users" element={<AdminUsers />} />
                <Route path="providers" element={<AdminProviders />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="audit" element={<AdminAudit />} />
              </Route>
            </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
