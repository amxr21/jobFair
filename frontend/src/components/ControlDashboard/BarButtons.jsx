import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { useAuthContext } from "../../Hooks/useAuthContext"


const link = "https://jobfair-1.onrender.com"

const BarButtons = () => {
    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isCameraOn2, setIsCameraOn2] = useState(false);

    const openCamera = useRef("");
    const confirmAttendanceButton = useRef("");


    const { user } = useAuthContext();
    let scanner;
    useEffect(() => {
        if(isCameraOn){
            scanner = new Html5QrcodeScanner("reader", {
                qrbox: { width : 150, height: 150 },
                fps: 10,
            })

            const success = async (result) => {
                scanner.clear();

                setIsCameraOn(false)
                setScannerResult(result.slice(1, 25))
                // const aaa = async () => {
                try {

                    // console.log("---------------------------\n\n\n\n\n\n",result,"---------------------------\n\n\n\n\n\n");
                    const patchResponse = await axios.patch(link+"/"+result.slice(1, 25), {
                        user_id:
                        [user?.email]
                    }, {
                        headers: {
                            Authorization: `Bearer ${user.token}`
                        }
                    })

                    console.log(patchResponse);
                    // const postResponse = await axios.post(link + result, applicant);
                    
                    // await axios.post(link, patchResponse.data.applicantDetails, {
                    //     headers: {
                    //         Authorization: `Bearer ${user.token}`
                    //     }
                    // })



                    // const json = scannedApplicant.json()
                } catch(error){
                    console.log("Failed to fetch data", error);
                }
                // }
                // aaa()
            }

            const error = (err) => {
                // console.warn("");
            }

    
            scanner.render(success, error)
        }
    }, [isCameraOn])




    useEffect(() => {
        if(isCameraOn2){
            scanner = new Html5QrcodeScanner("reader", {
                qrbox: { width : 150, height: 150 },
                fps: 10,
            })

            const success = async (result) => {
                scanner.clear();

                setIsCameraOn2(false)
                let length = result.length;

                if(result[0] == '\"') setScannerResult(result.slice(1, length-2))
                setScannerResult(result)

                // const aaa = async () => {
                try {

                    // console.log("---------------------------\n\n\n\n\n\n",result,"---------------------------\n\n\n\n\n\n");
                    const patchResponse = await axios.patch(`${link}/applicants/confirm/`+result, {
                        attended: true
                    }, {
                        headers: {
                            Authorization: `Bearer ${user.token}`
                        }
                    })

                    console.log(patchResponse);

                    // const json = scannedApplicant.json()
                } catch(error){
                    console.log("Failed to fetch data", error);
                }

            }

            const error = (err) => {
                // console.warn("");
            }

    
            scanner.render(success, error)
        }
    }, [isCameraOn2])




const aaa2 = () => {
    setIsCameraOn2(prev => {
        if(!prev){
            confirmAttendanceButton.current.textContent = "Confirmed";
        }
        else{
            confirmAttendanceButton.current.textContent = "Confirm attendant";
            scanner?.clear();
        }

        return !prev;
    })
}




    const aaa = () => {
        setIsCameraOn(prev => {
            if(!prev){
                openCamera.current.textContent = "Camera ON" 
            }
            else{
                openCamera.current.textContent = "Camera OFF";
                scanner?.clear();
            }

            return !prev;
        })
    }



    return (
        <>
            <div className="flex md:flex-row flex-col items-center my-2 md:my-0 w-fit max-w-[35em] gap-x-6">
                <div>
                    <h1>QR Code scanner</h1>
                    {
                        scannerResult && !isCameraOn
                        ? <div>Success: <span>{scannerResult}</span> </div>
                        : (<div id="reader"></div>)
                    }
                </div>
            <div className="buttons disabled text-gray-300 flex gap-x-2 md:gap-x-2 md:my-0 mt-4">
                <button ref={openCamera} onClick={aaa} className="h-fit border border-gray-300 py-1.5 px-2 md:mx-2 rounded-md">Camera off</button>
                <button ref={confirmAttendanceButton} onClick={aaa2} className="h-fit border border-gray-300 py-1.5 px-2 md:mx-2 rounded-md">Confirm attendant</button>
                {/* <button className="border border-gray-300 py-1.5 px-2 mx-2 rounded-md">Reject</button>
                <button className="border border-gray-300 py-1.5 px-2 mx-2 rounded-md">Approve</button> */}
            </div>
            </div>
        </>
    )
}

export default BarButtons;