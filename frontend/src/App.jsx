import "./style.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Managers, Statistics, Survey, MainBanner, NavBar, SurveyResults, ConfirmAttendance, CompanyStatus } from "./pages/index";
import { MobileNav, MobileRegisterFAB } from "./components/index";
import { useAuthContext } from "./Hooks/useAuthContext";
import { PrimeReactProvider } from 'primereact/api';
import { API_URL as link } from "./config/api";

// Component to conditionally render NavBar
const ConditionalNavBar = ({ link }) => {
    const location = useLocation();
    const hideNavBarRoutes = ['/login', '/signup', '/confirm-attendance'];

    // Check if current path should hide navbar
    const shouldHideNavBar = hideNavBarRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );

    if (shouldHideNavBar) return null;
    return <NavBar link={link} />;
};

function App() {
    const { user } = useAuthContext();
    const isCASTO = user?.companyName === "CASTO Office";

    return (
        <PrimeReactProvider>
            <div className="App flex relative gap-x-6 xl:gap-x-8 p-0 md:p-6 h-[100vh] pb-14 md:pb-0 overflow-hidden">
                <BrowserRouter>
                    <ConditionalNavBar link={link} />
                    <Routes>
                        <Route path="/" element={<MainBanner link={link} />} />
                        <Route path="/managers" element={isCASTO ? <Managers link={link} /> : <Navigate to="/" />} />
                        <Route path="/survey" element={<Survey />} />
                        <Route path="/surveyResults" element={isCASTO ? <SurveyResults /> : <Navigate to="/" />} />
                        <Route path="/statistics" element={isCASTO ? <Statistics link={link} /> : <Navigate to="/" />} />
                        <Route path="/company-status" element={user && !isCASTO ? <CompanyStatus /> : <Navigate to="/" />} />
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                        <Route path="/confirm-attendance/:token" element={<ConfirmAttendance />} />
                    </Routes>
                    {/* Mobile Navigation */}
                    <MobileNav />
                    <MobileRegisterFAB />
                </BrowserRouter>
            </div>
        </PrimeReactProvider>
    )
}

export default App;
