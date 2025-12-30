import '@/assets/App.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import Routes from './Routes.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Routes />
  </StrictMode>,
)
