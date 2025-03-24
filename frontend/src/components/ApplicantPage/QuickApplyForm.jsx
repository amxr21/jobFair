import axios from "axios";
import { useState, useEffect, useRef, useContext } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";


import { CheckId, QrScanner, IdContext } from "./index"

const linkUrl = 'https://jobfair-91pd.onrender.com'

const QuickApplyForm = () => {
    const [applicant, setApplicant] = useState({id: "", name: "Ammar"});
    const [checked, setChecked] = useState(false);
    
    const { inputValue, setInputValue } = useContext(IdContext);


    const [scannerResult, setScannerResult] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

    
    useEffect(() => {
        axios.get(`${linkUrl}/applicants/${document.getElementById("applicantId").value}`)
        .then((response) => {
            setApplicant(response.data);
        })

        console.log(inputValue);
    }, [inputValue])


    return (
        <div className="w-1/2 bg-white w-1/2 h-64 rounded-lg px-8 py-6 shadow-2xl opacity-90 overflow-hidden">
            <CheckId value= {checked}/>
            {inputValue &&
            <div className="welcome-div">
                <h2 className="text-2xl font-bold">Welcome back {applicant?.applicantDetails?.fullName.split(" ")[0]}</h2>
                <div>
                    <h2>Apply using QR code !</h2>
                    <div className="flex gap-x-8 my-4">
                            <QrScanner />
                    </div>
                </div>

            </div>}
        </div>
    )
}

export default QuickApplyForm;