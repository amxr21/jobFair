import "./style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
 

import { Managers, Statistics, Survey, MainBanner, NavBar, SurveyResults } from "./pages/index";

import { useAuthContext } from "./Hooks/useAuthContext";


import { useState } from "react";

const link = "https://jobfair-production.up.railway.app"
// const link = "https://jobfair-7zaa.onrender.com"
// const link = "http://localhost:2000"

 
function App() {
  
  const { user } = useAuthContext();

  const [list, setList] = useState([])

  return (

    <div className="App grid grid-cols-12 relative gap-x-8 xl:gap-x-8 p-0 md:p-8 h-[100vh] overflow-hidden">
      {/* <Intro /> */}
      <BrowserRouter>
      <NavBar link={link}/>
        <Routes>
          <Route path="/" element={<MainBanner link={link}/>} />
          <Route path="/managers" element={<Managers link={link} />} />
          <Route path="/survey" element={<Survey/>} />
          <Route path="/surveyResults" element={<SurveyResults/>} />
          <Route path="/statistics" element={<Statistics link={link} />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
