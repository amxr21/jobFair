import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "../hooks/useAuthContext"
import Success from "./Success";
import Modal from "./Modal";


const BarButtons = ({link}) => {
    const { t } = useTranslation();
    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCameraOn2, setIsCameraOn2] = useState(false);
    // Button labels are React state now (not imperative textContent writes),
    // so they translate correctly and react to language switches.
    const [registerLabel, setRegisterLabel] = useState(() => t("barButtons.registerAnApplicant"));
    const [confirmLabel, setConfirmLabel] = useState(() => t("barButtons.confirmAttendance"));

    const openCamera = useRef("");
    const confirmAttendanceButton = useRef("");

    // Re-sync the idle labels whenever the language changes, but never while
    // a scan is actively in progress (that has its own transient "Scanning…"/
    // "Confirmed" label).
    useEffect(() => {
        if (!isCameraOn) setRegisterLabel(t("barButtons.registerAnApplicant"));
        if (!isCameraOn2) setConfirmLabel(t("barButtons.confirmAttendance"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const { user } = useAuthContext();
    let scanner;
    useEffect(() => {
        let timeout;
        if(isCameraOn){
            // Delay scanner initialization to ensure DOM element exists
            timeout = setTimeout(() => {
                scanner = new Html5QrcodeScanner("reader", {
                    qrbox: { width : 150, height: 150 },
                    fps: 10,
                })

                const success = async (result) => {
                    scanner.clear();
                    setIsCameraOn(false)
                    setScannerResult(result.replace(/[^a-zA-Z0-9]/g,''))
                    try {
                        await axios.patch(link+"/applicants/"+result.replace(/[^a-zA-Z0-9]/g,''), {
                            user_id: [user?.companyName]
                        }, {
                            headers: {
                                Authorization: `Bearer ${user.token}`
                            }
                        })
                    } catch(error) {
                        // Error registering applicant
                    }
                }

                const error = () => {}

                scanner.render(success, error)
            }, 100);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isCameraOn])




    useEffect(() => {
        let timeout;
        if(isCameraOn2){
            // Delay scanner initialization to ensure DOM element exists
            timeout = setTimeout(() => {
                scanner = new Html5QrcodeScanner("reader2", {
                    qrbox: { width : 150, height: 150 },
                    fps: 10,
                })

                const success = async (result) => {
                    scanner.clear();
                    setIsCameraOn2(false)
                    result = result.replace(/[^a-zA-Z0-9]/g, '')
                    setScannerResult(result)
                    try {
                        await axios.patch(`${link}/applicants/confirm/`+result, {
                            attended: true
                        }, {
                            headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
                        })
                        setConfirmLabel(t("barButtons.confirmed"));
                        setTimeout(() => setConfirmLabel(t("barButtons.confirm")), 2000);
                    } catch(error) {
                        // Error confirming attendance
                    }
                }

                const error = () => {}

                scanner.render(success, error)
            }, 100);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isCameraOn2])




const toggleAttendanceScanner = () => {
    setIsCameraOn2(prev => {
        if (!prev) {
            setConfirmLabel(t("barButtons.scanning"));
        } else {
            setConfirmLabel(t("barButtons.confirmAttendance"));
            scanner?.clear();
        }
        return !prev;
    });
};

    const toggleRegisterScanner = () => {
        setIsCameraOn(prev => {
            if (!prev) {
                setRegisterLabel(t("barButtons.scanning"));
            } else {
                setRegisterLabel(t("barButtons.registerAnApplicant"));
                scanner?.clear();
            }
            return !prev;
        });
    };



    // Sync modal visibility with camera states — Modal itself owns the
    // open/close animation timing, this just tells it when to be open
    const isModalVisible = isCameraOn || isCameraOn2;

    const closeModal = () => {
        if (isCameraOn) {
            setIsCameraOn(false);
            scanner?.clear();
            setRegisterLabel(t("barButtons.registerAnApplicant"));
        }
        if (isCameraOn2) {
            setIsCameraOn2(false);
            scanner?.clear();
            setConfirmLabel(t("barButtons.confirmAttendance"));
        }
    };

    return (
        <>
            {/* QR Scanner Modal Overlay */}
            <Modal visible={isModalVisible} onClose={closeModal} maxWidth="max-w-xs" contentClassName="p-4 pb-12">
                <p className="text-sm font-semibold text-center mb-3 text-fg">
                    {isCameraOn ? t("barButtons.registerApplicant") : t("barButtons.confirmAttendance")}
                </p>
                {isCameraOn2 && <div id="reader2"></div>}
                {isCameraOn && (
                    scannerResult
                    ? <Success result={scannerResult} />
                    : <div id="reader"></div>
                )}
                <button
                    onClick={closeModal}
                    aria-label={t("common.close")}
                    className="absolute bottom-2 start-1/2 -translate-x-1/4 w-8 h-8 text-white rounded-xl text-sm flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="black" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </button>
            </Modal>

            <div className="flex md:flex-row flex-col items-center w-fit grow justify-end gap-x-3">
                <div className="flex text-black w-fit gap-x-2">
                    <button ref={openCamera} onClick={toggleRegisterScanner} className="text-xs h-7 md:h-8 border border-primary text-primary font-medium px-2.5 rounded-lg hover:bg-primary hover:text-primary-contrast transition-all duration-200">{registerLabel}</button>
                    {user?.email === "casto@sharjah.ac.ae" && (
                        <button ref={confirmAttendanceButton} onClick={toggleAttendanceScanner} className="text-xs h-7 md:h-8 border border-primary bg-primary text-primary-contrast font-medium px-2.5 rounded-lg hover:bg-primary-hover transition-all duration-200">{confirmLabel}</button>
                    )}
                </div>
            </div>
        </>
    )
}

export default BarButtons;