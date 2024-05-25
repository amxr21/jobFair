import { useEffect, useRef, useState } from 'react';
import axios from 'axios';


import QRCode from 'qrcode.react';

const link = "https://jobfair-1.onrender.com"



const BriefInfo = ({ticketId, id, shortName, position="student", ticketQrCodeSrc, emailRec}) => {
    const [nextStep, setNextStep] = useState(null);
    const interviewButton = useRef();
    const rejectionButton = useRef();
    const otherButton = useRef();
    // const sendInterviewEmail = () => {
    //     const res = axios.post("http://localhost:2000/email", {
    //             uniId:id,
    //             ticket: ticketId,
    //             fullName: shortName,
    //             email: emailRec
            
    //     })

    //     if(res){
    //         setTimeout(()=>{
    //             interviewButton.current.textContent = "Email sent!";
                
    //         }, 2000)
    //     }
    //     setTimeout(()=>{
    //         interviewButton.current.textContent = "Set an interview"
            
    //     }, 5000)
    // }
    
    const email = (type) => {
        const res = axios.post(`${link}/email`, {
                uniId:id,
                ticket: ticketId,
                fullName: shortName,
                email: emailRec,
                type: type
        })

        if(res){
            setTimeout(()=>{
                switch(type){
                    case "interview":
                        interviewButton.current.textContent = "Email sent";
                        break;
                    case "rejection":
                        rejectionButton.current.textContent = "Email sent!";
                        break;
                    case "other":
                        otherButton.current.textContent = "Email sent!";
                        break;
                }




            }, 2000)
        }
        setTimeout(()=>{
            switch(type){
                case "interview":
                    interviewButton.current.textContent = "Set an interview";
                    break;
                case "rejection":
                    rejectionButton.current.textContent = "Reject applicant";
                    break;
                case "other":
                    otherButton.current.textContent = "Other";
                    break;
            }
        }, 5000)
    }


    return (
        <div className="brief-info text-left w-full md:px-8">

            <div className="qr-code md:w-48 flex flex-col items-center mt-2 mb-4">
                {/* <img src={qrCodeSrc} className="w-full" alt="" /> */}
                {ticketQrCodeSrc && <QRCode value={ticketQrCodeSrc} />}
                {!ticketQrCodeSrc && <h2>Loading the QR code...</h2>}
            </div>

            <div className="applicant-id">
                <h6 className="text-lg font-bold underline">Ticket no:</h6>
                <span>{ticketId}</span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
                University id:
                <span id="applicantId"> {id}</span>
            </p>

            <h2 className="text-2xl font-bold font-uppercase">
                {shortName}
            </h2>
            <h6 className="text-sm font-regular font-uppercase mb-2">{position}</h6>
            <div className="status">
                <p>Status:</p>
                <div className="text-md text-left font-bold text-gray-600 flex">
                    <button ref={interviewButton} onClick={() => {email("interview")}} className='text-sm border border-gray-300 py-1.5 px-2 mr-2 rounded-md'>Set an interview</button>
                    <button ref={rejectionButton} onClick={() => {email("rejection")}} className='text-sm border border-gray-300 py-1.5 px-2 mr-2 rounded-md'>Reject applicant</button>
                    <button ref={otherButton} onClick={() => {email("other")}} className='text-sm border border-gray-300 py-1.5 px-2 mr-2 rounded-md'>Email</button>


                </div>
            </div>
        </div>
    )
}

export default BriefInfo;