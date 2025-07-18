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
        if(isCameraOn){
            scanner = new Html5QrcodeScanner("reader", {
                qrbox: { width : 150, height: 150 },
                fps: 10,
            })

            const success = async (result) => {
                scanner.clear();

                setIsCameraOn(false)
                setScannerResult(result.replace(/[^a-zA-Z0-9]/g,''))
                // const aaa = async () => {
                try {

                    // console.log("---------------------------\n\n\n\n\n\n",result,"---------------------------\n\n\n\n\n\n");
                    const patchResponse = await axios.patch(link+"/applicants/"+result.replace(/[^a-zA-Z0-9]/g,''), {
                        user_id:
                        [user?.companyName]
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
            scanner = new Html5QrcodeScanner("reader2", {
                qrbox: { width : 150, height: 150 },
                fps: 10,
            })

            const success = async (result) => {
                scanner.clear();

                setIsCameraOn2(false)

                result = result.replace(/[^a-zA-Z0-9]/g, '')


                setScannerResult(result)
                console.log(result);
                // const aaa = async () => {
                try {

                    // console.log("---------------------------\n\n\n\n\n\n",result,"---------------------------\n\n\n\n\n\n");
                    const patchResponse = await axios.patch(`${link}/applicants/confirm/`+result, {
                        attended: true
                    }
                    // , {
                    //     headers: {
                    //         Authorization: `Bearer ${user.token}`
                    //     }
                    // }
                )

                    confirmAttendanceButton.current.textContent = "Confirmed";
                    setTimeout(()=>{confirmAttendanceButton.current.textContent = "Confirm attendance";}, 2000)


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
            confirmAttendanceButton.current.textContent = "Camera is ON";
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
            <div className="flex md:flex-row flex-col text-sm xl:text-base items-center w-fit grow justify-end gap-x-6">
                <div id="reader2"></div>
                {
                    scannerResult && !isCameraOn
                    ? <Success result={scannerResult} />
                    : (<div id="reader"></div>)
                }
                <div className="disabled flex text-black flex w-fit gap-x-2">
                    <button ref={openCamera} onClick={aaa} className="h-fit border border-[#0E7F41] text-green-800 font-semibold px-3 py-2 rounded-lg">Register an Applicant</button>
                    {
                        user?.email == "casto@sharjah.ac.ae" &&
                        <button ref={confirmAttendanceButton} onClick={aaa2} className="h-fit border border-[#0E7F41] bg-[#0E7F41] text-white px-3 py-2  rounded-md">Confirm attendant</button>
                    }
                    
                    {/* <button className="border border-gray-300 py-1.5 px-2 mx-2 rounded-md">Reject</button>
                    <button className="border border-gray-300 py-1.5 px-2 mx-2 rounded-md">Approve</button> */}
                </div>
            </div>
        </>
    )
}

export default BarButtons;