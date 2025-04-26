import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

import CardInfo from './CardInfo';


import QRCode from 'qrcode.react';

// const link = "https://jobfair-7zaa.onrender.com"
// const link = "http://localhost:2000"
const link = "https://jobfair-production.up.railway.app"
import { useAuthContext } from "../Hooks/useAuthContext"
import Flagged from './Flagged';
import Action from './Action';



const BriefInfo = ({ticketId, id, shortName, position="student", ticketQrCodeSrc, emailRec, status, graduationYear, flag}) => {
    const [nextStep, setNextStep] = useState(null);
    const interviewButton = useRef();
    const rejectionButton = useRef();
    const otherButton = useRef();

    
    
    const [ isFlagging, setIsFlagging ] = useState(false)
    
    
    const { user } = useAuthContext();
    
    
    const tickedIdRef = useRef()
    const [ isFlagged, setIsFlagged ] = useState(false)
    
    
    const applicant_id = tickedIdRef.current?.textContent.trim()
    
    const flagApplicant = async (e) => {
        
        console.log('====================================');
        console.log(e.target.parentElement.parentElement.parentElement.children[1].lastElementChild.textContent);
        const ticketId = e.target.parentElement.parentElement.parentElement.children[1].lastElementChild.textContent
        console.log('====================================');
        document.getElementById(ticketId).classList.add('border')
        document.getElementById(ticketId).classList.add('border-2')
        document.getElementById(ticketId).classList.add('border-green-500')



        // e.target.parentElement.parentElement.classList.add('border')
        // e.target.parentElement.parentElement.classList.add('border-2')
        // e.target.parentElement.parentElement.classList.add('border-green-500')
    
        try {
            
            setIsFlagging(true)
            const flagResponse = await axios.patch(link+"/applicants/flag/"+ticketId.replace(/[^a-zA-Z0-9]/g,''), {
                flags: [user?.companyName]
            })



            

        } catch (error) {
            console.log('Failed to flag the applicant', error);
            
        }
        finally{
            setIsFlagged(true)
            setIsFlagging(false)
        }






    }
    // useEffect(() => {
    //     const checkFlag = async () => {
    //         try {
    //             setIsFlagging(true)
    //             const flagResponse = await axios.get(link+"/applicants/flag/"+applicant_id.replace(/[^a-zA-Z0-9]/g,''))
                
    //             console.log(flagResponse);

    //             return flagResponse.data?.flags.includes(user?.companyName)
    
    //         } catch (error) {
    //             console.log('Failed to flag the applicant', error);   
    //         }
    //     }

    //     let a = checkFlag()
    //     setIsFlagged(a ? true : false)


    // }, [])





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


    
    const shortListApplicant = async (e) => {
        const ticketId =e.target.parentElement.parentElement.parentElement.children[1].lastElementChild.textContent
        console.log(ticketId);
        
        try {
            
            const shortlistResponse = await axios.patch(link+'/applicants/shortlist/'+ticketId?.replace(/[^a-zA-Z0-9]/g,''), {
                shortlistedBy: [user?.companyName]
            })
            


        } catch (error) {
            console.log('Failed to shortlist the applicant', error);
        }

        finally{
            console.log(ticketId, 'is Shortlisted');
            
        }


    }


    const rejectApplicant = async (e) => {
        const ticketId = e.target.parentElement.parentElement.children[1].lastElementChild.textContent == 'Reject' ? e.target.parentElement.parentElement.parentElement.children[1].lastElementChild.textContent : e.target.parentElement.parentElement.children[1].lastElementChild.textContent
        console.log(ticketId);
        
        try {
            
            const rejectResponse = await axios.patch(link+'/applicants/reject/'+ticketId?.replace(/[^a-zA-Z0-9]/g,''), {
                rejectedBy: [user?.companyName]
            })
            


        } catch (error) {
            console.log('Failed to shortlist the applicant', error);
        }

        finally{
            console.log(ticketId, 'is rejected');
            
        }


    }







    return (
        <div className="brief-info flex flex-col gap-y-5 text-left w-full md:px-8">

            <div className='flex flex-col items-center gap-4 px-5 py-8 text-center border bg-white shadow-md shadow-gray-200 hover:shadow-xl rounded-xl'>
                <div className="qr-code w-full  flex flex-col items-center">
                    {/* <img src={qrCodeSrc} className="w-full" alt="" /> */}
                    {ticketQrCodeSrc && <QRCode value={ticketQrCodeSrc} />}
                    {!ticketQrCodeSrc && <h2>Loading the QR code...</h2>}
                </div>


                <div className="applicant-id max-w-full">
                    <h6 className="text-lg font-bold  underline">Ticket no:</h6>
                    <h6 ref={tickedIdRef} className='break-words whitespace-normal overflow-hidden text-ellipsis w-full max-w-full'>{ticketId}</h6>
                </div>

                <div className="flag flex items-center justify-center gap-2">
                    {
                        flag.includes(user?.companyName)
                        ?
                        <>
                            {/* <input checked={isFlagged} onChange={flagApplicant} className='w-4 h-4' type="checkbox" name="" id="" /> */}
                            <Flagged />
                        </>
                        
                        :
                        isFlagging
                            ?
                            <>
                                <p>Flagging...</p>
                            </>
                            :
                                isFlagged 
                                ?
                                <>
                                    <Flagged />
                                </>
                                :
                                <div id='FlagCheckboxContainer' className='flex gap-2 items-center z-[9999]'>
                                    <input checked={isFlagged} onChange={flagApplicant} className='w-4 h-4 flag-checkbox' type="checkbox" name="flag-checkbox" id="FlagCheckbox" />
                                    <label className='' htmlFor="FlagCheckbox">Flag Applicant</label>
                                </div>
                    }
                </div>
                <CardInfo infoHeader={''} infoText={status ? `Confirmed` : `Registered`} />

                <div className="next-action flex gap-2">
                    <Action type='shortlist' handleClick={shortListApplicant} />
                    <Action type='reject' handleClick={rejectApplicant} />
                </div>


            </div>


            <div className='flex flex-col gap-y-4'>
                <div>
                    {/* <h2 className="text-2xl font-bold font-uppercase">
                        {shortName}
                    </h2> */}
                    <h6 className="text-base font-regular font-uppercase mb-2">Educational Status: <span className='font-bold'>{graduationYear && graduationYear != '' && parseInt(graduationYear?.split('-')[0]) >= 2025 ? `Expected to graduate by ${graduationYear}` : "Graduated"}</span></h6>
                </div>
                
            </div>
            
           
        </div>
    )
}

export default BriefInfo;