import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css'; 
import './i18n';
import { ThemeColorProvider } from './contexts/ThemeColorContext.tsx';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeColorProvider>
        <App />
      </ThemeColorProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
