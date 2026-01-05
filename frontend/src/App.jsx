import "./style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Managers, Statistics, Survey, MainBanner, NavBar, SurveyResults, ConfirmAttendance } from "./pages/index";
import { useAuthContext } from "./Hooks/useAuthContext";
import { PrimeReactProvider } from 'primereact/api';
import { API_URL as link } from "./config/api";

function App() {
    const { user } = useAuthContext();

    return (
        <PrimeReactProvider>
            <div className="App flex relative gap-x-6 xl:gap-x-8 p-0 md:p-6 h-[100vh] overflow-hidden">
                <BrowserRouter>
                    <NavBar link={link} />
                    <Routes>
                        <Route path="/" element={<MainBanner link={link} />} />
                        <Route path="/managers" element={<Managers link={link} />} />
                        <Route path="/survey" element={<Survey />} />
                        <Route path="/surveyResults" element={<SurveyResults />} />
                        <Route path="/statistics" element={<Statistics link={link} />} />
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                        <Route path="/confirm-attendance/:token" element={<ConfirmAttendance />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </PrimeReactProvider>
    )
}

export default App;
