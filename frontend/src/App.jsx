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

export default function App() {
  return (
    <Routes>
      {/* Landing Page Entry Portal */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Operational Dashboard Routes */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="immediate-actions" element={<ImmediateActionsPage />} />
        <Route path="risk-map" element={<RiskMapPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="monitoring" element={<StationMonitoringPage />} />
        <Route path="live-forecast" element={<LiveForecastPage />} />
        <Route path="flood-simulation" element={<FloodSimulationPage />} />
        <Route path="alerts" element={<AlertsManagementPage />} />
        <Route path="historical-events" element={<HistoricalEventsPage />} />
        <Route path="model-intelligence" element={<ModelIntelligencePage />} />
        <Route path="about-terrain" element={<AboutTerrainPage />} />
      </Route>

      {/* Catch-all redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


