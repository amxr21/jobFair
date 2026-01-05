import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../Hooks/useAuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL as link } from "../config/api";

const MobileNav = () => {
    const { user } = useAuthContext();
    const location = useLocation();
    const path = location.pathname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const [surveyPublic, setSurveyPublic] = useState(false);
    const [userData, setUserData] = useState();

    const userId = JSON.parse(localStorage.getItem('user'))?.user_id;

    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await axios.get(link + '/companies/' + userId);
                if (response) {
                    setUserData(response.data);
                }
            } catch (error) {
                // Error fetching company data
            }
        };

        const getSettings = async () => {
            try {
                const response = await axios.get(link + '/settings');
                if (response?.data) {
                    setSurveyPublic(response.data.surveyPublic);
                }
            } catch (error) {
                // Error fetching settings
            }
        };

        if (user) {
            getUserData();
            getSettings();
        }
    }, [user, userId]);

    // Hide on certain routes
    const hideNavBarRoutes = ['/login', '/signup', '/confirm-attendance'];
    const shouldHideNavBar = hideNavBarRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );

    if (shouldHideNavBar || !user) return null;

    const isCASTO = user?.companyName === "CASTO Office";

    // Build navigation items based on user type
    const navItems = [
        { link: '', title: 'Applicants', icon: 'applicants' },
    ];

    // Add Company Status for non-CASTO users
    if (!isCASTO) {
        navItems.push({ link: 'company-status', title: 'Status', icon: 'status' });
    }

    // Add Survey for non-CASTO users if available
    if (surveyPublic && (userData === undefined || userData?.surveyResult?.length === 0) && !isCASTO) {
        navItems.push({ link: 'survey', title: 'Survey', icon: 'survey' });
    }

    // Add CASTO-specific links
    if (isCASTO) {
        navItems.push({ link: 'managers', title: 'Managers', icon: 'managers' });
        navItems.push({ link: 'statistics', title: 'Stats', icon: 'statistics' });
        navItems.push({ link: 'surveyResults', title: 'Survey', icon: 'surveyResults' });
    }

    const isActive = (itemLink) => {
        const cleanedLink = itemLink.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return path === cleanedLink;
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] safe-area-bottom">
            <div className="flex justify-around items-center h-14 px-2">
                {navItems.map((item) => (
                    <Link
                        key={item.link}
                        to={`/${item.link}`}
                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                            isActive(item.link)
                                ? 'text-[#0E7F41]'
                                : 'text-gray-500'
                        }`}
                    >
                        <NavIcon icon={item.icon} active={isActive(item.link)} />
                        <span className="text-[10px] mt-0.5 font-medium">{item.title}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

const NavIcon = ({ icon, active }) => {
    const strokeColor = active ? '#0E7F41' : '#6B7280';

    switch (icon) {
        case 'applicants':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={strokeColor} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            );
        case 'managers':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={strokeColor} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
            );
        case 'statistics':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={strokeColor} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            );
        case 'survey':
        case 'surveyResults':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={strokeColor} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
            );
        case 'status':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={strokeColor} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return null;
    }
};

export default MobileNav;
