import axios from "axios"
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom"
import BriefInfo from "./BriefInfo";
import Brief from "./Brief";
import CardInfo from "./CardInfo";
import CardInfoFile from "./CardInfoFile";

import { DeveloperBadge } from './index'

import { ExpandIcon } from "./Icons";








 

// const colorCode = {
//     confirmed: {active: '#0066CC', off: '#E5F0FF'},
//     registerd: {active: '#0E7F41', off: '#E5FFE5'},
//     pending: {active: '#EBC600', off: '#FFFACD'},
//     canceled: {active: '#CC0000', off: '#FFE5E5'},
// } 

const colorCode = {
    Confirmed: 'bg-[#E5F0FF] text-[#0066CC]',
    Registered: 'bg-[#E5FFE5] text-[#0E7F41]',
    Pending: 'bg-[#FFFACD] text-[#EBC600]',
    Canceled: 'bg-[#FFE5E5] text-[#CC0000]',
}



const Row = ({number, name, ticketId, uniId, email, phoneNumber, studyLevel, major, gpa, nationality, experience, attended, shortlistedBy, rejectedBy, age, portfolio, languages, file, qrCode, status='Registered', userType, companyName, companyEmail, companyRepresentatives, companyFields, companyStatus, numebrOfApplicants, companySector, companyCity, numberOfPositions, skills, city, expectedToGraduate, flags, user, cv, preferredMajors, opportunityTypes, preferredQualities, link, onDelete}) => {
    const expandApplicantDiv = useRef();
    const expandApplicantBtn = useRef();
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [ isClicked, setIsClicked ] = useState(false)

    // Handle applicant deletion
    const handleDelete = async () => {
        if (!ticketId || !link) return;

        try {
            setIsDeleting(true);
            await axios.delete(`${link}/applicants/${ticketId}`, {
                headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
            });
            setIsClicked(false);
            setShowDeleteConfirm(false);
            // Trigger parent refresh if callback provided
            if (onDelete) onDelete(ticketId);
            // Reload the page if no callback
            else window.location.reload();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete applicant. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    


    
const ApplicantModal = ({visible, onClose, children}) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender && !isClosing) {
            // Start closing animation
            setIsClosing(true);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [visible, shouldRender, isClosing]);

    if (!shouldRender) return null;

    const animationClass = isClosing ? 'modal-close' : 'modal-open';
    const backdropClass = isClosing ? 'backdrop-close' : 'backdrop-open';

    return createPortal(
        <div className="fixed inset-0 z-[99999]">
            {/* Backdrop */}
            <div
                className={`expandDetails-backdrop absolute inset-0 bg-black/30 ${backdropClass}`}
                onClick={onClose}
            />
            {/* Modal */}
            <div ref={expandApplicantDiv}
                className={`expandDetails ${animationClass} parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[64rem] h-[42rem] max-h-[45rem] overflow-y-scroll md:overflow-y-auto absolute top-1/2 left-1/2`}>
                {React.Children.map(children, child =>
                    React.isValidElement(child)
                        ? React.cloneElement(child, { onCloseModal: onClose })
                        : child
                )}
            </div>
        </div>,
        document.body
    )

    

}



    useEffect(() => {
        if (expandApplicantDiv.current && isClicked) {
            setIsVisible(true); // Use state to handle visibility
        }
 
    }, [isClicked])


    // Note: Click outside handling is now managed by ApplicantModal's backdrop onClick
    // The modal handles its own closing animation when onClose is called


    if(email == 'casto@sharjah.ac.ae'){ number -= 1; return '';}
    else{
        return userType != 'manager'
        ?
            <div id={ticketId} className={`row relative overflow-hidden grid py-2 pl-7 pr-6 h-[52px] ${shortlistedBy?.length ? 'border-2 border-blue-500' : rejectedBy?.length ? 'border-2 border-red-600' : ''} ${flags?.includes(user?.companyName) ? "border-2 border-green-500 bg-white" :'bg-white'} rounded-xl items-center mb-2 text-xs xl:text-sm`}>
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate">{name}</h2>
                <h2 className="flex items-center truncate">{uniId == "" || uniId?.length != 8 || uniId == 18000000 ? '00000000' : uniId}</h2>
                <h2 className="flex items-center truncate">{nationality}</h2>
                <h2 className="flex items-center truncate">{gpa == 0 || Number.isNaN(gpa)  ? 'XX' : parseFloat(gpa)?.toFixed(2)}</h2>
                <div className="flex items-center truncate">
                    <span>{studyLevel?.startsWith('Master') ? "" : studyLevel}</span>
                    <span>{studyLevel?.startsWith('Master') ? "" : ' of'} {major}</span>
                </div>
                <h2 className="flex items-center truncate">{cv? 'Uploaded' : 'None'}</h2>
                <h2 className={`flex items-center justify-center text-[10px] xl:text-xs px-1.5 py-1 rounded-md font-semibold ${status ? `${colorCode.Confirmed}` : `${colorCode.Registered}`}`}>{status ? 'Confirmed' : 'Registered'}</h2>
    
                <div className="flex items-center justify-end">
                    {uniId == 22105176 && <DeveloperBadge />}
                    <button className="flex items-center justify-center w-5 h-5" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}}>
                        <ExpandIcon size="small" />
                    </button>
                        
                        
                        
                        
                        
                        {/* <div ref={expandApplicantDiv} className={`expandDetails parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[64rem] h-[36rem] max-h-[40rem] overflow-y-scroll md:overflow-y-auto fixed top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}> */}
                        <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)} >

                            <div className="card-info flex flex-col md:flex-row gap-6">
                                <Brief onCloseModal={() => setIsClicked(false)}>
                                    <BriefInfo
                                        ticketId={ticketId}
                                        id={uniId}
                                        shortName={name}
                                        ticketQrCodeSrc={qrCode}
                                        emailRec = {email}
                                        status={status}
                                        graduationYear={expectedToGraduate}
                                        flag={flags}
                                        shortlistedByStatus={shortlistedBy}
                                        rejectedByStatus={rejectedBy}
                                    />
                                </Brief>
                                <div className="details md:w-8/12 flex flex-col gap-3 overflow-y-auto">
                                    {/* Personal Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Personal Information</h3>
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                            <CardInfo infoHeader={"Full name"} infoText={name} />
                                            <CardInfo infoHeader={"University ID"} infoText={uniId} />
                                            <CardInfo infoHeader={"Age"} infoText={age} />
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <CardInfo infoHeader={"Email"} infoText={email} />
                                            <CardInfo infoHeader={"Phone number"} infoText={phoneNumber} />
                                        </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Academic Information</h3>
                                        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
                                            <CardInfo infoHeader={"Study program"} infoText={studyLevel} />
                                            <div className="col-span-2">
                                                <CardInfo infoHeader={"Major"} infoText={major} />
                                            </div>
                                            <CardInfo infoHeader={"CGPA"} infoText={gpa ? parseFloat(gpa).toFixed(2) : ''} />
                                        </div>
                                    </div>

                                    {/* Skills - full width for multi-line content */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Skills</h3>
                                        <div className="flex flex-col gap-3">
                                            <CardInfo infoHeader={"Technical Skills"} infoText={skills?.tech} multiline />
                                            <CardInfo infoHeader={"Non-technical Skills"} infoText={skills?.nontech} multiline />
                                        </div>
                                    </div>

                                    {/* Background */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Background</h3>
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                            <CardInfo infoHeader={"Nationality"} infoText={nationality} />
                                            <CardInfo infoHeader={"City"} infoText={city} />
                                            <CardInfo infoHeader={"Languages"} infoText={languages} />
                                        </div>
                                    </div>

                                    {/* Experience - full width for multi-line content */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Experience</h3>
                                        <CardInfo infoHeader={""} infoText={experience} multiline />
                                    </div>

                                    {/* Links & Documents */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links & Documents</h3>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <CardInfo infoHeader={"LinkedIn"} infoText={portfolio} />
                                            <CardInfoFile file={file} />
                                        </div>
                                    </div>

                                    {/* Delete Applicant Section - Only show for admin users */}
                                    {user?.email === 'casto@sharjah.ac.ae' && (
                                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Danger Zone</h3>
                                            {!showDeleteConfirm ? (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                                >
                                                    Delete Applicant
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm text-red-600">Are you sure? This cannot be undone.</p>
                                                    <button
                                                        onClick={handleDelete}
                                                        disabled={isDeleting}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(false)}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* <hr className="my-4" /> */}
                            {/* <EmailToSection /> */}
                        </ApplicantModal>
                </div>
            </div>
        :
            <div className="row-manager grid py-2 pl-7 pr-6 h-[52px] bg-white rounded-xl items-center mb-2 text-xs xl:text-sm">
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate font-medium">{companyName}</h2>
                <h2 className="flex items-center truncate">
                    <a href={`mailto:${companyEmail}`} className="hover:text-blue-600 transition-colors">{companyEmail}</a>
                </h2>
                <h2 className="flex items-center truncate">{companyRepresentatives}</h2>
                <h2 className="flex items-center truncate">{companyCity}</h2>
                <h2 className="flex items-center truncate">{companySector}</h2>
                <h2 className="flex items-center truncate">{numebrOfApplicants}</h2>
                <h2 className={`flex items-center justify-center text-[10px] xl:text-xs px-1.5 py-1 rounded-md font-semibold ${companyStatus == 'Confirmed' ? `${colorCode.Confirmed}` : `${colorCode.Canceled}`}`}>{companyStatus == 'Confirmed' ? 'Confirmed' : 'Canceled'}</h2>

                <div className="flex items-center justify-end">
                    <button className="flex items-center justify-center w-5 h-5" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}}>
                        <ExpandIcon size="small" />
                    </button>

                    <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)}>
                        <div className="flex flex-col gap-6 relative">
                            {/* Close Button for Company Modal */}
                            <button
                                onClick={() => setIsClicked(false)}
                                className="absolute -top-6 -left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Company Header */}
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                    {companyName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{companyName}</h2>
                                    <p className="text-sm text-gray-500">{companySector} • {companyCity}</p>
                                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${companyStatus == 'Confirmed' ? colorCode.Confirmed : colorCode.Canceled}`}>
                                        {companyStatus == 'Confirmed' ? 'Confirmed' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contact Information */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
                                    <div className="flex flex-col gap-3">
                                        <CardInfo infoHeader="Email" infoText={companyEmail} />
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <CardInfo infoHeader="Sector" infoText={companySector} />
                                        <CardInfo infoHeader="City" infoText={companyCity} />
                                        <CardInfo infoHeader="Open Positions" infoText={numberOfPositions} />
                                        <CardInfo infoHeader="Applicants" infoText={numebrOfApplicants} />
                                    </div>
                                </div>

                                {/* Representatives */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Representatives</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {companyRepresentatives?.split(',').map((rep, idx) => (
                                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                {rep.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry Fields */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Industry Fields</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {companyFields?.split(',').map((field, idx) => (
                                            <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                {field.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Opportunity Types */}
                                {opportunityTypes?.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Opportunity Types</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {opportunityTypes.map((type, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Majors */}
                                {preferredMajors?.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preferred Majors</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {preferredMajors.map((major, idx) => (
                                                <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                                    {major}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Qualities */}
                                {preferredQualities && (
                                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ideal Candidate Qualities</h3>
                                        <p className="text-sm text-gray-700">{preferredQualities}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ApplicantModal>
                </div>


            </div>
        
    }

}

export default React.memo(Row);
