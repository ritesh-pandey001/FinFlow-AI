import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import EmailsPage from './pages/EmailsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditPage from './pages/AuditPage';
import SecurityPage from './pages/SecurityPage';
import ToastContainer from './components/ToastContainer';
import { workspaceSeed } from './data/seedData';
import { clearWorkspaceState, loadWorkspaceState, saveWorkspaceState } from './utils/storage';
import { deriveLegalQueue, deriveNotifications, normalizeWorkspaceState } from './utils/workspace';

export const AppContext = createContext();

const initialWorkspaceState = normalizeWorkspaceState(loadWorkspaceState(workspaceSeed));
const PROFILE_STORAGE_KEY = 'finflow-profile';

const defaultProfile = {
  name: 'Ritesh Pandey',
  title: 'Financial controller',
  email: 'riteshpandey.2143@gmail.com',
  workspace: 'FinFlow AI — Enterprise',
};

const loadProfile = () => {
  if (typeof window === 'undefined') return defaultProfile;

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;

    const parsed = JSON.parse(raw);
    const isLegacyDemoProfile = parsed?.name === 'Ritesh Pandey' || parsed?.email === 'riteshpandey.2143@gmail.com';
    if (isLegacyDemoProfile) return defaultProfile;

    return {
      ...defaultProfile,
      ...parsed,
      name: parsed?.name || defaultProfile.name,
      title: parsed?.title || defaultProfile.title,
      email: parsed?.email || '',
      workspace: parsed?.workspace || defaultProfile.workspace,
    };
  } catch {
    return defaultProfile;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('finflow-auth') === '1');
  const [profile, setProfile] = useState(loadProfile);
  const [invoices, setInvoices] = useState(initialWorkspaceState.invoices);
  const [emails, setEmails] = useState(initialWorkspaceState.emails);
  const [auditLogs, setAuditLogs] = useState(initialWorkspaceState.auditLogs);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem('finflow-auth', isAuthenticated ? '1' : '0');
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage failures so the workspace still renders.
    }
  }, [profile]);

  useEffect(() => {
    saveWorkspaceState({ invoices, emails, auditLogs });
  }, [auditLogs, emails, invoices]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAuditLog = (entry) => {
    const record = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'success',
      tone: '-',
      invoice_no: '-',
      client_name: '-',
      source: 'system',
      eventType: 'activity',
      escalation: 'general',
      ...entry,
    };

    setAuditLogs((prev) => [record, ...prev].slice(0, 400));
    return record;
  };

  const resetWorkspace = () => {
    clearWorkspaceState();
    setInvoices(workspaceSeed.invoices);
    setEmails(workspaceSeed.emails);
    setAuditLogs(workspaceSeed.auditLogs);
    addToast('Workspace reset to the seeded starter state', 'info');
  };

  const workspaceSummary = {
    totalInvoices: invoices.length,
    totalEmails: emails.length,
    totalAuditLogs: auditLogs.length,
    totalExposure: invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0),
    legalQueueCount: deriveLegalQueue(invoices).length,
    notificationCount: deriveNotifications(auditLogs).length,
    lastUpdatedAt: [...auditLogs].find(Boolean)?.timestamp || new Date().toISOString(),
  };

  const legalQueue = deriveLegalQueue(invoices);
  const notifications = deriveNotifications(auditLogs);
  const recentActivity = auditLogs.slice(0, 8);

  return (
    <AppContext.Provider value={{
      invoices,
      setInvoices,
      emails,
      setEmails,
      auditLogs,
      setAuditLogs,
      addAuditLog,
      legalQueue,
      notifications,
      recentActivity,
      resetWorkspace,
      workspaceSummary,
      profile,
      setProfile,
      addToast,
      isAuthenticated,
      setIsAuthenticated,
    }}>
      <BrowserRouter>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
          } />
          <Route path="/" element={
            isAuthenticated ? <MainLayout /> : <Navigate to="/login" />
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="emails" element={<EmailsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
