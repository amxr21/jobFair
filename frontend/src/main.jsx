import React from 'react';
import ReactDOM from 'react-dom'

import App from './App.jsx'
import { AuthContextProvidor } from './Context/UserAuthContext.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvidor>
      <App />

    </AuthContextProvidor>
  </React.StrictMode>,
)
