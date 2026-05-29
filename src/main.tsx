import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted Inter (bundled by Vite -> served from 'self', no Google Fonts CDN).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import './styles/stitch/tokens.css';
import './styles/stitch/components.css';
import './index.css';

import { App } from './App';
import { ConfigProvider } from './state/ConfigContext';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
