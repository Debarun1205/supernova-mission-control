import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { LandingPage } from './features/landing/LandingPage.tsx';
import { SatelliteExplorer } from './features/explorer/SatelliteExplorer.tsx';
import { SatelliteDetailPage } from './features/satellite/SatelliteDetailPage.tsx';
import { AlertCenter } from './features/alerts/AlertCenter.tsx';
import { ChaosPanel } from './features/scenarios/ChaosPanel.tsx';
import { MissionAiPage } from './features/ai/MissionAiPage.tsx';
import { ShiftReportPage } from './features/reports/ShiftReportPage.tsx';
import { SkyViewPage } from './features/sky/SkyViewPage.tsx';
import { SettingsPage } from './features/settings/SettingsPage.tsx';
import { PublicStatusPage } from './features/status/PublicStatusPage.tsx';
import { CosmicUniverseExplorerPage } from './features/space/CosmicUniverseExplorerPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/console" element={<App />} />
        <Route path="/satellites" element={<SatelliteExplorer />} />
        <Route path="/satellites/:id" element={<SatelliteDetailPage />} />
        <Route path="/universe" element={<CosmicUniverseExplorerPage />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/sky" element={<SkyViewPage />} />
        <Route path="/scenarios" element={<ChaosPanel />} />
        <Route path="/ai" element={<MissionAiPage />} />
        <Route path="/reports" element={<ShiftReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/status-page" element={<PublicStatusPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
