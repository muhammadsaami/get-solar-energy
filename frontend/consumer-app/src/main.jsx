import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles/design-system.css'
import './styles/dashboard.css'
import './styles/satellite-roof.css'
import './styles/auth.css'
import './styles/landing.css'
import './styles/chat.css'
import './styles/enterprise.css'
import './styles/admin.css'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
