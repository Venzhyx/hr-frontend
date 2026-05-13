import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './assets/routes/AppRoutes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;