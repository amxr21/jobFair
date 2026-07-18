import React from 'react';
import ReactDOM from 'react-dom'

import App from './App.jsx'
import { AuthContextProvidor } from './context/UserAuthContext.jsx'
import { ApplicantsContextProvider } from './context/ApplicantsContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './i18n' // initializes i18next (English default, Arabic RTL)

// React 17, the one compatible with render hosting
const app = document.getElementById("root");
ReactDOM.render(
      <ThemeProvider>
        <AuthContextProvidor>
          <ApplicantsContextProvider>
            <App/>
          </ApplicantsContextProvider>
        </AuthContextProvidor>
      </ThemeProvider>
      ,app
    )


// React 18
  // ReactDOM.createRoot(document.getElementById('root')).render(
  //   <React.StrictMode>
  //     <AuthContextProvidor>
  //       <App />
  
  //     </AuthContextProvidor>
  //   </React.StrictMode>,
  // )