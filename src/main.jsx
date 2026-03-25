import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RuntimeConfigProvider } from './context/RuntimeConfigProvider.jsx'

createRoot(document.getElementById('root')).render(
  <RuntimeConfigProvider>
    <App />
  </RuntimeConfigProvider>
)
