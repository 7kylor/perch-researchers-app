import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/theme.css';
import './ui/components/Sidebar';
import './ui/components/NotesPanel';

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');
createRoot(container).render(<App />);
