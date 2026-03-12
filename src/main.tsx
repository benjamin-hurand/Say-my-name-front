// src/main.tsx (ou équivalent)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import './i18n/i18n.ts';
import { ThemeColorProvider } from './contexts/ThemeColorContext.tsx';

// 👇 Ajouts pour MUI X Date Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { frFR } from '@mui/x-date-pickers/locales';
import 'dayjs/locale/fr';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeColorProvider>
        {/* 👇 Wrapper des pickers (FR + dayjs) */}
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="fr"
          localeText={frFR.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <App />
        </LocalizationProvider>
      </ThemeColorProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
