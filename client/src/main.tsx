import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AlertCenter } from './features/alerts/AlertCenter.tsx';
import { ChaosPanel } from './features/scenarios/ChaosPanel.tsx';
import { MissionAiPage } from './features/ai/MissionAiPage.tsx';
import { ShiftReportPage } from './features/reports/ShiftReportPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/scenarios" element={<ChaosPanel />} />
        <Route path="/ai" element={<MissionAiPage />} />
        <Route path="/reports" element={<ShiftReportPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
