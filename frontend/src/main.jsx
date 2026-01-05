import React from 'react';
import ReactDOM from 'react-dom'

import App from './App.jsx'
import { AuthContextProvidor } from './Context/UserAuthContext.jsx'
import { ApplicantsContextProvider } from './Context/ApplicantsContext.jsx'
import { SocketProvider } from './Context/SocketContext.jsx'

// React 17, the one compatible with render hosting
const app = document.getElementById("root");
ReactDOM.render(
      <AuthContextProvidor>
        <SocketProvider>
          <ApplicantsContextProvider>
            <App/>
          </ApplicantsContextProvider>
        </SocketProvider>
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