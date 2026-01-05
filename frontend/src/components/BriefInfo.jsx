import { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';

import CardInfo from './CardInfo';


import QRCode from 'qrcode.react';

import { API_URL as link } from "../config/api";
import { useAuthContext } from "../Hooks/useAuthContext"
import { ApplicantsContext } from '../Context/ApplicantsContext';
import Flagged from './Flagged';
import Action from './Action';
import ApplicantStatus from './ApplicantStatus';



const BriefInfo = ({ticketId, id, shortName, position="student", ticketQrCodeSrc, emailRec, status, graduationYear, flag, shortlistedByStatus, rejectedByStatus}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const interviewButton = useRef();
    const rejectionButton = useRef();
    const otherButton = useRef();

    const [ isFlagging, setIsFlagging ] = useState(false)

    const { user } = useAuthContext();
    const { dispatch } = useContext(ApplicantsContext);

    const nextAction = useRef()
    const tickedIdRef = useRef()
    const [ isFlagged, setIsFlagged ] = useState(false)

    // Local state for shortlist/reject status to handle UI updates
    const [localShortlistedBy, setLocalShortlistedBy] = useState(shortlistedByStatus || []);
    const [localRejectedBy, setLocalRejectedBy] = useState(rejectedByStatus || []);
    const [localFlags, setLocalFlags] = useState(flag || []);

    const applicant_id = tickedIdRef.current?.textContent.trim()

    const flagApplicant = async (e) => {
        e.stopPropagation(); // Prevent modal from closing
        const cleanTicketId = ticketId.replace(/[^a-zA-Z0-9]/g, '');

        // Update DOM for immediate visual feedback
        const rowElement = document.getElementById(ticketId);
        if (rowElement) {
            rowElement.classList.add('border', 'border-2', 'border-green-500');
        }

        try {
            setIsFlagging(true);
            const flagResponse = await axios.patch(link + "/applicants/flag/" + cleanTicketId, {
                flags: [user?.companyName]
            });

            // Update local state
            const newFlags = [...localFlags, user?.companyName];
            setLocalFlags(newFlags);

            // Update context for persistence across re-renders
            dispatch({
                type: 'UPDATE_APPLICANT',
                payload: {
                    _id: ticketId,
                    flags: newFlags
                }
            });

        } catch (error) {
            console.error('Error flagging applicant:', error);
            // Revert visual change on error
            if (rowElement) {
                rowElement.classList.remove('border', 'border-2', 'border-green-500');
            }
        } finally {
            setIsFlagged(true);
            setIsFlagging(false);
        }
    }

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
        e.stopPropagation(); // Prevent modal from closing
        const cleanTicketId = ticketId.replace(/[^a-zA-Z0-9]/g, '');

        try {
            setIsProcessing(true);
            const shortlistResponse = await axios.patch(link + '/applicants/shortlist/' + cleanTicketId, {
                shortlistedBy: [user?.companyName]
            });

            // Update local state for immediate UI feedback
            const newShortlistedBy = [...localShortlistedBy, user?.companyName];
            setLocalShortlistedBy(newShortlistedBy);

            // Update context for persistence
            dispatch({
                type: 'UPDATE_APPLICANT',
                payload: {
                    _id: ticketId,
                    shortlistedBy: newShortlistedBy
                }
            });

            // Update row visual
            const rowElement = document.getElementById(ticketId);
            if (rowElement) {
                rowElement.classList.add('border-2', 'border-blue-500');
            }

        } catch (error) {
            console.error('Error shortlisting applicant:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const rejectApplicant = async (e) => {
        e.stopPropagation(); // Prevent modal from closing
        const cleanTicketId = ticketId.replace(/[^a-zA-Z0-9]/g, '');

        try {
            setIsProcessing(true);
            const rejectResponse = await axios.patch(link + '/applicants/reject/' + cleanTicketId, {
                rejectedBy: [user?.companyName]
            });

            // Update local state for immediate UI feedback
            const newRejectedBy = [...localRejectedBy, user?.companyName];
            setLocalRejectedBy(newRejectedBy);

            // Update context for persistence
            dispatch({
                type: 'UPDATE_APPLICANT',
                payload: {
                    _id: ticketId,
                    rejectedBy: newRejectedBy
                }
            });

            // Update row visual
            const rowElement = document.getElementById(ticketId);
            if (rowElement) {
                rowElement.classList.add('border-2', 'border-red-600');
            }

        } catch (error) {
            console.error('Error rejecting applicant:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="brief-info flex flex-col gap-y-4 text-left w-full md:px-4 sticky top-0 self-start">

            <div className='relative flex flex-col items-center gap-4 px-5 py-6 text-center border bg-white shadow-md shadow-gray-200 rounded-xl overflow-hidden'>
                <div className="qr-code w-full flex flex-col items-center">
                    {ticketQrCodeSrc && <QRCode value={ticketQrCodeSrc} size={140} />}
                    {!ticketQrCodeSrc && <h2>Loading the QR code...</h2>}
                </div>

                <div className="applicant-id max-w-full">
                    <h6 className="text-xs font-semibold text-gray-500 uppercase">Ticket ID</h6>
                    <h6 ref={tickedIdRef} className='text-xs break-words whitespace-normal overflow-hidden text-ellipsis w-full max-w-full'>{ticketId}</h6>
                </div>

                <div className="flag flex items-center justify-center gap-2">
                    {
                        (flag.includes(user?.companyName) || localFlags.includes(user?.companyName))
                        ?
                        <Flagged />
                        :
                        isFlagging
                            ?
                            <p className="text-sm">Flagging...</p>
                            :
                                isFlagged
                                ?
                                <Flagged />
                                :
                                <div id='FlagCheckboxContainer' className='flex gap-2 items-center z-[9999]'>
                                    <input checked={isFlagged} onChange={flagApplicant} className='w-4 h-4 flag-checkbox' type="checkbox" name="flag-checkbox" id="FlagCheckbox" />
                                    <label className='text-sm' htmlFor="FlagCheckbox">Flag Applicant</label>
                                </div>
                    }
                </div>

                <CardInfo infoHeader={''} infoText={status ? `Confirmed` : `Registered`} />

                <div ref={nextAction} className="next-action flex w-full">
                    {
                        isProcessing
                        ?
                        <h2 className="text-sm">Processing</h2>
                        :
                            (shortlistedByStatus?.includes(user?.companyName) || localShortlistedBy?.includes(user?.companyName))
                            ?
                            <ApplicantStatus
                                type="shortlisted"
                                status={(shortlistedByStatus?.length || 0) + (localShortlistedBy?.length || 0)}
                            />
                            :
                            (rejectedByStatus?.includes(user?.companyName) || localRejectedBy?.includes(user?.companyName))
                            ?
                            <ApplicantStatus
                                type="rejected"
                                status={(rejectedByStatus?.length || 0) + (localRejectedBy?.length || 0)}
                            />
                            :
                            <div className='w-full flex justify-between items-center gap-2'>
                                <Action type='shortlist' handleClick={shortListApplicant} />
                                <Action type='reject' handleClick={rejectApplicant} />
                            </div>
                    }
                </div>
            </div>

            <div className='bg-gray-50 rounded-lg p-3'>
                <h6 className="text-xs font-semibold text-gray-500 uppercase mb-1">Educational Status</h6>
                <p className='text-sm font-medium'>{graduationYear && graduationYear != '' && parseInt(graduationYear?.split('-')[0]) >= 2025 ? `Expected to graduate by ${graduationYear}` : "Graduated"}</p>
            </div>
        </div>
    )
}

export default BriefInfo;
