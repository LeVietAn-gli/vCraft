import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/global.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>,
);
