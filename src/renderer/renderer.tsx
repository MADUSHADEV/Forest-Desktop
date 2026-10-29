import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { forestStore } from './state/forestStore';
import { AppShell } from './components/layout/AppShell';
import './index.css';

const RootApp: React.FC = () => {
  useEffect(() => {
    forestStore.init();
  }, []);

  return <AppShell />;
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <RootApp />
    </React.StrictMode>,
  );
}
