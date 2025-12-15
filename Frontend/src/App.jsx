import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import VMList from './pages/VMList';
import VMDetails from './pages/VMDetails';
import AWSVMs from './pages/AWSVMs';
import AzureVMs from './pages/AzureVMs';
import GCPVMs from './pages/GCPVMs';
import Snapshots from './pages/Snapshots';
import Monitoring from './pages/Monitoring';
import CostAnalysis from './pages/CostAnalysis';
import Alerts from './pages/Alerts';
import Automation from './pages/Automation';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Layout from './components/Layout';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vms" element={<VMList />} />
            <Route path="vms/:id" element={<VMDetails />} />
            <Route path="aws-vms" element={<AWSVMs />} />
            <Route path="aws-vms/:id" element={<VMDetails />} />
            <Route path="azure-vms" element={<AzureVMs />} />
            <Route path="azure-vms/:id" element={<VMDetails />} />
            <Route path="gcp-vms" element={<GCPVMs />} />
            <Route path="gcp-vms/:id" element={<VMDetails />} />
            <Route path="snapshots" element={<Snapshots />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="costs" element={<CostAnalysis />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="automation" element={<Automation />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
