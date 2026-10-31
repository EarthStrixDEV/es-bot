import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { PreviewRouter } from './lib/PreviewRouter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.VITE_PREVIEW ? (
      <PreviewRouter>
        <App />
      </PreviewRouter>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
