import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DevComponentsPage } from './pages/DevComponentsPage';
import { NewScanPage } from './pages/NewScanPage';
import { AnalyzingPage } from './pages/AnalyzingPage';
import { IncidentResultsPage } from './pages/IncidentResultsPage';
import { EvidenceVaultPage } from './pages/EvidenceVaultPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { ToastProvider } from './components/Toast';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<NewScanPage />} />
            <Route path="/analyzing/:id" element={<AnalyzingPage />} />
            <Route path="/incidents/:id" element={<IncidentResultsPage />} />
            <Route path="/incidents/:id/evidence" element={<EvidenceVaultPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/history" element={<AuditHistoryPage />} />
            <Route path="/status" element={<SystemStatusPage />} />
            <Route path="/dev-components" element={<DevComponentsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
