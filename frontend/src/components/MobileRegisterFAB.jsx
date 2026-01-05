import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { useAuthContext } from "../Hooks/useAuthContext";
import { useLocation } from "react-router-dom";
import Success from "./Success";
import { API_URL as link } from "../config/api";

const MobileRegisterFAB = () => {
    const { user } = useAuthContext();
    const location = useLocation();

    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCameraOn2, setIsCameraOn2] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Hide on certain routes
    const hideRoutes = ['/login', '/signup', '/confirm-attendance', '/survey'];
    const shouldHide = hideRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );

    const isCASTO = user?.email === "casto@sharjah.ac.ae";

    // Register applicant scanner
    useEffect(() => {
        if (!user || shouldHide) return; // Don't run if hidden

        let timeout;
        let scanner;
        if (isCameraOn) {
            timeout = setTimeout(() => {
                scanner = new Html5QrcodeScanner("mobile-reader", {
                    qrbox: { width: 200, height: 200 },
                    fps: 10,
                });

                const success = async (result) => {
                    scanner.clear();
                    setIsCameraOn(false);
                    setScannerResult(result.replace(/[^a-zA-Z0-9]/g, ''));
                    try {
                        await axios.patch(link + "/applicants/" + result.replace(/[^a-zA-Z0-9]/g, ''), {
                            user_id: [user?.companyName]
                        }, {
                            headers: {
                                Authorization: `Bearer ${user.token}`
                            }
                        });
                    } catch (error) {
                        // Error registering applicant
                    }
                };

                const error = () => {};
                scanner.render(success, error);
            }, 100);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isCameraOn, user, shouldHide]);

    // Confirm attendance scanner
    useEffect(() => {
        if (!user || shouldHide) return; // Don't run if hidden

        let timeout;
        let scanner;
        if (isCameraOn2) {
            timeout = setTimeout(() => {
                scanner = new Html5QrcodeScanner("mobile-reader2", {
                    qrbox: { width: 200, height: 200 },
                    fps: 10,
                });

                const success = async (result) => {
                    scanner.clear();
                    setIsCameraOn2(false);
                    result = result.replace(/[^a-zA-Z0-9]/g, '');
                    setScannerResult(result);
                    try {
                        await axios.patch(`${link}/applicants/confirm/` + result, {
                            attended: true
                        });
                    } catch (error) {
                        // Error confirming attendance
                    }
                };

                const error = () => {};
                scanner.render(success, error);
            }, 100);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isCameraOn2, user, shouldHide]);

    const isModalVisible = isCameraOn || isCameraOn2 || isClosing;

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsCameraOn(false);
            setIsCameraOn2(false);
            setScannerResult(null);
            setIsClosing(false);
        }, 300);
    };

    const handleRegister = () => {
        setShowMenu(false);
        setScannerResult(null);
        setIsCameraOn(true);
    };

    const handleConfirm = () => {
        setShowMenu(false);
        setScannerResult(null);
        setIsCameraOn2(true);
    };

    // Hide component on certain routes or when not logged in
    if (shouldHide || !user) return null;

    return (
        <>
            {/* QR Scanner Modal */}
            {isModalVisible && (
                <div className="md:hidden fixed inset-0 z-[99999] flex items-center justify-center">
                    <div
                        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                        onClick={closeModal}
                    />
                    <div className={`relative bg-white rounded-2xl p-4 shadow-2xl z-10 w-[90vw] max-w-[320px] transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold">
                                {isCameraOn ? "Register Applicant" : "Confirm Attendance"}
                            </p>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {isCameraOn2 && <div id="mobile-reader2"></div>}
                        {isCameraOn && (
                            scannerResult
                                ? <Success result={scannerResult} />
                                : <div id="mobile-reader"></div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Action Button Menu */}
            {showMenu && (
                <div className="md:hidden fixed bottom-20 right-4 z-[9998] flex flex-col gap-2 animate-fadeIn">
                    <button
                        onClick={handleRegister}
                        className="flex items-center gap-2 bg-white text-[#0E7F41] border border-[#0E7F41] px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        </svg>
                        Register Applicant
                    </button>
                    {isCASTO && (
                        <button
                            onClick={handleConfirm}
                            className="flex items-center gap-2 bg-[#0E7F41] text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirm Attendance
                        </button>
                    )}
                </div>
            )}

            {/* Backdrop for menu */}
            {showMenu && (
                <div
                    className="md:hidden fixed inset-0 z-[9997]"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`md:hidden fixed bottom-[4.5rem] right-4 z-[9998] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    showMenu
                        ? 'bg-gray-600 rotate-45'
                        : 'bg-[#0E7F41]'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </>
    );
};

export default MobileRegisterFAB;
