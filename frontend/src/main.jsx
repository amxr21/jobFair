import React from 'react';
import ReactDOM from 'react-dom'

import App from './App.jsx'
import { AuthContextProvidor } from './Context/UserAuthContext.jsx'
import { ApplicantsContextProvider } from './Context/ApplicantsContext.jsx'

// React 17, the one compatible with render hosting
const app = document.getElementById("root");
ReactDOM.render(
      <AuthContextProvidor>
        <ApplicantsContextProvider>
          <App/>
        </ApplicantsContextProvider>
      </AuthContextProvidor>
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