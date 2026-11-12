import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StudentPortal } from './components/StudentPortal';
import { AdminPanel } from './components/AdminPanel';
import { PinAuthModal } from './components/PinAuthModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { ActiveView, Participant, ApiConfig } from './types';
import { fetchParticipants, getStoredConfig } from './services/apiService';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('student');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(getStoredConfig());
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchParticipants();
    setParticipants(result.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePinSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsPinModalOpen(false);
    setActiveView('admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#1A73E8] selection:text-white">
      <Header
        activeView={activeView}
        onOpenPinModal={() => {
          if (isAdminAuthenticated) {
            setActiveView('admin');
          } else {
            setIsPinModalOpen(true);
          }
        }}
        onExitAdmin={() => setActiveView('student')}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-4xl mx-auto py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loading Verified Certificate Records...
            </p>
          </div>
        ) : activeView === 'student' ? (
          <StudentPortal
            participants={participants}
            apiConfig={apiConfig}
            onUpdateConfig={newConfig => {
              setApiConfig(newConfig);
              loadData();
            }}
          />
        ) : (
          <AdminPanel
            participants={participants}
            onRefresh={loadData}
            onOpenSettings={() => setIsApiModalOpen(true)}
            apiConfig={apiConfig}
          />
        )}
      </main>

      <Footer />

      {/* Organizer PIN Unlock Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Google Apps Script Endpoint Configuration Modal */}
      <ApiConfigModal
        config={apiConfig}
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSaved={newConfig => {
          setApiConfig(newConfig);
          loadData();
        }}
      />
    </div>
  );
}
