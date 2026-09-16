import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import RiskMapPage from './pages/RiskMapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StationMonitoringPage from './pages/StationMonitoringPage';
import AlertsManagementPage from './pages/AlertsManagementPage';
import HistoricalEventsPage from './pages/HistoricalEventsPage';
import ModelIntelligencePage from './pages/ModelIntelligencePage';
import LiveForecastPage from './pages/LiveForecastPage';
import AboutTerrainPage from './pages/AboutTerrainPage';
import FloodSimulationPage from './pages/FloodSimulationPage';
import ImmediateActionsPage from './pages/ImmediateActionsPage';

import AboutPage from './pages/AboutPage';
import ResourcesPage from './pages/ResourcesPage';

import PrivacyPolicyPage from './pages/policies/PrivacyPolicyPage';
import TermsOfServicePage from './pages/policies/TermsOfServicePage';
import AccessibilityPage from './pages/policies/AccessibilityPage';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Routes under AppLayout */}
        <Route element={<AppLayout />}>
          {/* Public Informational Routes */}
          <Route path="about" element={<AboutPage />} />
          <Route path="resources" element={<ResourcesPage />} />

          {/* Policy Routes */}
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsOfServicePage />} />
          <Route path="accessibility" element={<AccessibilityPage />} />

          {/* Protected Operational Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="immediate-actions" element={<ImmediateActionsPage />} />
            <Route path="risk-map" element={<Navigate to="/dashboard" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="monitoring" element={<StationMonitoringPage />} />
            <Route path="live-forecast" element={<LiveForecastPage />} />
            <Route path="flood-simulation" element={<FloodSimulationPage />} />
            <Route path="alerts" element={<AlertsManagementPage />} />
            <Route path="historical-events" element={<HistoricalEventsPage />} />
            <Route path="model-intelligence" element={<Navigate to="/analytics" replace />} />
            <Route path="about-terrain" element={<AboutTerrainPage />} />
          </Route>
        </Route>

        {/* Catch-all redirect to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
