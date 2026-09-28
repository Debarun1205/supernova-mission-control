import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AlertCenter } from './features/alerts/AlertCenter.tsx';
import { ChaosPanel } from './features/scenarios/ChaosPanel.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/scenarios" element={<ChaosPanel />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
