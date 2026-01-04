import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { useAuthContext } from "../Hooks/useAuthContext"
import Success from "./Success";


const BarButtons = ({link}) => {
    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCameraOn2, setIsCameraOn2] = useState(false);

    const openCamera = useRef("");
    const confirmAttendanceButton = useRef("");


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
                        })
                        confirmAttendanceButton.current.textContent = "Confirmed";
                        setTimeout(()=>{confirmAttendanceButton.current.textContent = "Confirm";}, 2000)
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




const aaa2 = () => {
    setIsCameraOn2(prev => {
        if(!prev){
            confirmAttendanceButton.current.textContent = "Scanning...";
        }
        else{
            confirmAttendanceButton.current.textContent = "Confirm Attendance";
            scanner?.clear();
        }

        return !prev;
    })
}




    const aaa = () => {
        setIsCameraOn(prev => {
            if(!prev){
                openCamera.current.textContent = "Scanning..."
            }
            else{
                openCamera.current.textContent = "Register an Applicant";
                scanner?.clear();
            }

            return !prev;
        })
    }



    const [isClosing, setIsClosing] = useState(false);

    // Sync modal visibility with camera states
    const isModalVisible = isCameraOn || isCameraOn2 || isClosing;

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            if (isCameraOn) {
                setIsCameraOn(false);
                scanner?.clear();
                openCamera.current.textContent = "Register an Applicant";
            }
            if (isCameraOn2) {
                setIsCameraOn2(false);
                scanner?.clear();
                confirmAttendanceButton.current.textContent = "Confirm Attendance";
            }
            setIsClosing(false);
        }, 300);
    };

    return (
        <>
            {/* QR Scanner Modal Overlay */}
            {isModalVisible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                    <div
                        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                        onClick={closeModal}
                    />
                    <div className={`relative bg-white rounded-xl p-4 pb-12 shadow-2xl z-10 min-w-[280px] transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <p className="text-sm font-semibold text-center mb-3">
                            {isCameraOn ? "Register Applicant" : "Confirm Attendance"}
                        </p>
                        {isCameraOn2 && <div id="reader2"></div>}
                        {isCameraOn && (
                            scannerResult
                            ? <Success result={scannerResult} />
                            : <div id="reader"></div>
                        )}
                        <button
                            onClick={closeModal}
                            className="absolute bottom-2 left-1/2 -translate-x-1/4 w-8 h-8 text-white rounded-xl text-sm flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="black" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="flex md:flex-row flex-col items-center w-fit grow justify-end gap-x-3">
                <div className="flex text-black w-fit gap-x-2">
                    <button ref={openCamera} onClick={aaa} className="text-sm h-fit border border-[#0E7F41] text-green-800 font-medium px-2 py-1.5 rounded-md">Register an Applicant</button>
                    {
                        user?.email == "casto@sharjah.ac.ae" &&
                        <button ref={confirmAttendanceButton} onClick={aaa2} className="text-sm h-fit border border-[#0E7F41] bg-[#0E7F41] text-white font-medium px-2 py-1.5 rounded-md">Confirm Attendance</button>
                    }
                </div>
            </div>
        </>
    )
}

export default BarButtons;