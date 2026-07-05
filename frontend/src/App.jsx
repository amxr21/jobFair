import "./style.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react"
import ErrorBoundary from "./components/ErrorBoundary";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Managers, Statistics, Survey, MainBanner, NavBar, SurveyResults, ConfirmAttendance, CompanyStatus, CompanySettings, NotFound, EventOperations, EventAdmin, StudentCheckin, MyQrCode, ViewAs, DevPanel } from "./pages/index";
import { MobileNav, MobileRegisterFAB } from "./components/index";
import { useAuthContext } from "./hooks/useAuthContext";
import { PrimeReactProvider } from 'primereact/api';
import { API_URL as link } from "./config/api";
import { ToastProvider } from "./components/Toast";
import { EventOpsProvider } from "./context/EventOpsContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { useCheckinReminder } from "./hooks/useCheckinReminder";
import { getSavedCustomization, applyCustomization } from "./utils/customization";

// Crossfade + gentle rise on every route change. The outgoing view fades out
// first; only once it's gone does the new view fade in — avoids the
// double-image flash of animating opacity on both renders of the same node.
const AnimatedRoutes = ({ children }) => {
    const location = useLocation();
    const containerRef = useRef(null);
    const prevPathRef = useRef(location.pathname);
    const timersRef = useRef([]);

    useEffect(() => {
        if (prevPathRef.current === location.pathname || !containerRef.current) return;
        prevPathRef.current = location.pathname;

        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        const el = containerRef.current;
        el.style.transition = 'opacity 0.16s cubic-bezier(0.4,0,1,1), transform 0.16s cubic-bezier(0.4,0,1,1)';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-4px)';

        timersRef.current.push(setTimeout(() => {
            if (!containerRef.current) return;
            containerRef.current.style.transform = 'translateY(8px)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!containerRef.current) return;
                    containerRef.current.style.transition = 'opacity 0.32s cubic-bezier(0.16,1,0.3,1), transform 0.32s cubic-bezier(0.16,1,0.3,1)';
                    containerRef.current.style.opacity = '1';
                    containerRef.current.style.transform = 'translateY(0)';
                });
            });
        }, 160));

        return () => timersRef.current.forEach(clearTimeout);
    }, [location.pathname]);

    return (
        <div ref={containerRef} className="flex flex-1 min-w-0 h-full" style={{ opacity: 1 }}>
            {children}
        </div>
    );
};

const noPaddingRoutes = ['/login', '/signup', '/confirm-attendance', '/student-checkin', '/my-qr-code'];

const ConditionalNavBar = ({ link }) => {
    const location = useLocation();
    const shouldHideNavBar = noPaddingRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );
    if (shouldHideNavBar) return null;
    return <NavBar link={link} />;
};

const AppLayout = ({ user, isCASTO }) => {
    const location = useLocation();
    // Nudges logged-in companies to check in at their booth — once, then hourly,
    // until they have (skips CASTO and logged-out visitors internally).
    useCheckinReminder(user);
    const isNoPadding = noPaddingRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );

    const baseClasses = "App flex relative gap-x-6 xl:gap-x-8 h-[100vh] pb-14 md:pb-0 overflow-hidden";

    return (
        <div className={isNoPadding ? baseClasses : `${baseClasses} p-3 md:p-5`}>
            <ConditionalNavBar link={link} />
            <AnimatedRoutes>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={user ? <MainBanner link={link} /> : <Navigate to="/login" replace />} />
                        <Route path="/managers" element={isCASTO ? <Managers link={link} /> : <Navigate to="/" replace />} />
                        <Route path="/survey" element={<Survey />} />
                        <Route path="/surveyResults" element={isCASTO ? <SurveyResults /> : <Navigate to="/" replace />} />
                        <Route path="/statistics" element={isCASTO ? <Statistics link={link} /> : <Navigate to="/" replace />} />
                        <Route path="/event-settings" element={isCASTO ? <EventOperations link={link} /> : <Navigate to="/" replace />} />
                        <Route path="/event-admin" element={isCASTO ? <EventAdmin link={link} /> : <Navigate to="/" replace />} />
                        <Route path="/view-as" element={isCASTO ? <ViewAs /> : <Navigate to="/" replace />} />
                        <Route path="/dev" element={isCASTO ? <DevPanel /> : <Navigate to="/" replace />} />
                        <Route path="/company-status" element={user && !isCASTO ? <CompanyStatus /> : <Navigate to="/" replace />} />
                        <Route path="/company-settings" element={user && !isCASTO ? <CompanySettings /> : <Navigate to="/" replace />} />
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
                        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
                        <Route path="/confirm-attendance/:token" element={<ConfirmAttendance />} />
                        <Route path="/student-checkin" element={<StudentCheckin />} />
                        <Route path="/my-qr-code" element={<MyQrCode />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </AnimatedRoutes>
            <MobileNav />
            <MobileRegisterFAB />
        </div>
    );
};

function App() {
    const { user } = useAuthContext();
    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    // Re-apply the logged-in user's saved font/size preference on load and
    // whenever the account changes, so it's visible immediately regardless of
    // which page loads first — not only after visiting Event Settings.
    useEffect(() => {
        const { fontId, sizeId } = getSavedCustomization(user);
        applyCustomization(fontId, sizeId);
    }, [user]);

    return (
        <PrimeReactProvider>
            <ToastProvider>
                <NotificationsProvider>
                    <EventOpsProvider>
                        <BrowserRouter>
                            <AppLayout user={user} isCASTO={isCASTO} />
                        </BrowserRouter>
                    </EventOpsProvider>
                </NotificationsProvider>
            </ToastProvider>
        </PrimeReactProvider>
    )
}

export default App;
