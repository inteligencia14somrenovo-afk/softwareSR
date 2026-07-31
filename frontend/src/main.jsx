import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './components/Login/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import Header from './components/Header/Header.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
