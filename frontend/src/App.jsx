import "./style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { NavBar, MainBanner } from "./components/index";

import Managers from "./pages/Managers";
import Statistics from "./pages/Statistics";

import { useAuthContext } from "./Hooks/useAuthContext";


import { useState } from "react";

const link = "https://jobfairform-backend.onrender.com"


function App() {
  const { user } = useAuthContext();



  useEffect(() => {
    const user = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(user);
      if (parsed && !parsed.companyName) {
        // Legacy structure, clear it
        localStorage.removeItem("user");
      }
    } catch (err) {
      localStorage.removeItem("user");
    }
  }, []);
  





  

  const [list, setList] = useState([])

  return (

    <div className="App grid grid-cols-12 relative gap-x-12 px-10 py-20 h-[100vh] px-10 md:py-8">
      {/* <Intro /> */}
      <BrowserRouter>
      <NavBar/>
        <Routes>
          <Route path="/" element={<MainBanner link={link}/>} />
          <Route path="/managers" element={<Managers link={link} />} />
          <Route path="/statistics" element={<Statistics link={link} />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
