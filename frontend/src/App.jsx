import "./style.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react"
import ErrorBoundary from "./components/ErrorBoundary";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Managers, Statistics, Survey, MainBanner, NavBar, SurveyResults, ConfirmAttendance, CompanyStatus, NotFound } from "./pages/index";
import { MobileNav, MobileRegisterFAB } from "./components/index";
import { useAuthContext } from "./Hooks/useAuthContext";
import { PrimeReactProvider } from 'primereact/api';
import { API_URL as link } from "./config/api";

const AnimatedRoutes = ({ children }) => {
    const location = useLocation();
    const containerRef = useRef(null);
    const prevPathRef = useRef(location.pathname);

    useEffect(() => {
        if (prevPathRef.current !== location.pathname && containerRef.current) {
            containerRef.current.style.opacity = '0';
            containerRef.current.style.transform = 'translateY(6px)';
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (containerRef.current) {
                        containerRef.current.style.transition = 'opacity 0.22s ease-out, transform 0.22s ease-out';
                        containerRef.current.style.opacity = '1';
                        containerRef.current.style.transform = 'translateY(0)';
                    }
                });
            });
            prevPathRef.current = location.pathname;
            return () => cancelAnimationFrame(raf);
        }
    }, [location.pathname]);

    return (
        <div ref={containerRef} className="flex flex-1 min-w-0 h-full" style={{ opacity: 1 }}>
            {children}
        </div>
    );
};

const ConditionalNavBar = ({ link }) => {
    const location = useLocation();
    const hideNavBarRoutes = ['/login', '/signup', '/confirm-attendance'];
    const shouldHideNavBar = hideNavBarRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );
    if (shouldHideNavBar) return null;
    return <NavBar link={link} />;
};

function App() {
    const { user } = useAuthContext();
    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    return (
        <PrimeReactProvider>
            <div className="App flex relative gap-x-6 xl:gap-x-8 p-0  h-[100vh] pb-14 md:pb-0 overflow-hidden">
                <BrowserRouter>
                    <ConditionalNavBar link={link} />
                    <AnimatedRoutes>
                        <ErrorBoundary>
                            <Routes>
                                <Route path="/" element={user ? <MainBanner link={link} /> : <Navigate to="/login" replace />} />
                                <Route path="/managers" element={isCASTO ? <Managers link={link} /> : <Navigate to="/" replace />} />
                                <Route path="/survey" element={<Survey />} />
                                <Route path="/surveyResults" element={isCASTO ? <SurveyResults /> : <Navigate to="/" replace />} />
                                <Route path="/statistics" element={isCASTO ? <Statistics link={link} /> : <Navigate to="/" replace />} />
                                <Route path="/company-status" element={user && !isCASTO ? <CompanyStatus /> : <Navigate to="/" replace />} />
                                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
                                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
                                <Route path="/confirm-attendance/:token" element={<ConfirmAttendance />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </ErrorBoundary>
                    </AnimatedRoutes>
                    <MobileNav />
                    <MobileRegisterFAB />
                </BrowserRouter>
            </div>
        </PrimeReactProvider>
    )
}

export default App;
