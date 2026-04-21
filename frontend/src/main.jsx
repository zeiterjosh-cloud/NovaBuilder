import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

// Use locally bundled Monaco instead of CDN
loader.config({ monaco })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
