import axios from "axios";
import { useState, useEffect, useRef, useContext } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { IdContext } from "../../Context/IdContext";

const linkUrl = 'https://jobfair-1.onrender.com';

const QrScanner = () => {

    const [applicant, setApplicant] = useState({});
    const [company, setCompany] = useState({});


    const { inputValue, setInputValue } = useContext(IdContext);

    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

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
                if(result[0] == "\"") setScannerResult(result.slice(1, 25))
                setScannerResult(result);
                // const aaa = async () => {
                try {

                    // here is the request to apply for the company
                    await axios.get(`${linkUrl}/companies/${result}`)
                    .then((response)=>{
                        if(response) {
                            console.log(response.data);
                            // console.log(company);
                            setScannerResult(response.data.email.split("@")[0])
                            setCompany(response.data)
                        }
                    })


                    axios.get(`${linkUrl}applicants/${document.getElementById('applicantId').value}`)
                    .then((response) => {
                        setApplicant(response.data);
                    })

                } catch(error){
                    console.log("Failed to fetch data", error);
                }
            }

            const error = (err) => {
                // console.warn("");
            }

    
            scanner.render(success, error)
        }
    }, [isCameraOn])
    
    
    useEffect(() => {
        const applyApplicant = async () => {
            if(company && applicant){
                console.log(applicant._id);
                try{
                    if(applicant?._id && company){
                        const patchRes =  await axios.patch(`${linkUrl}/applicant/apply/${applicant?._id}`, {user_id: [company.email.split("@")[0]]});
                        console.log(patchRes);
                    }
                } catch(error){
                    console.log("failed");

                }
            }

        }
        applyApplicant();
    }, [company, applicant])











    const aaa = () => {
        setIsCameraOn(prev => {
            if(!prev){
                openCamera.current.textContent = "Camera ON";
            }
            else{
                openCamera.current.textContent = "Camera OFF";
                scanner?.clear();
            }

            return !prev;
        })
    }

    const openCamera = useRef("");

    useEffect(() => {
        if(!scannerResult && isCameraOn ){
            let a = openCamera.current.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
            a.classList.replace("h-64", "h-[30em]")
            // console.log(openCamera.current.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement);
        }
        else{
            let a = openCamera.current.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
            a.classList.replace("h-[30em]", "h-64")
            // console.log(openCamera.current.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement);
    
        }

    }, [isCameraOn])




    return (
        <div className="flex justify-between w-full max-w-[30em] gap-x-6">
            <div className="">
                {
                    scannerResult && !isCameraOn
                    ? <div>Success: <span>{scannerResult}</span> </div>
                    : (<div id="reader">Nothing scanned...</div>)
                }
                
            </div>
            <div className="buttons disabled">
                <button ref={openCamera} onClick={aaa} className="h-fit bg-green-600 text-white py-1.5 px-2 rounded-md">Camera off</button>
            </div>
        </div>
    )
}

export default QrScanner;