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



const Row = ({number, name, ticketId, uniId, email, phoneNumber, studyLevel, major, gpa, nationality, experience, attended, shortlistedBy, rejectedBy, age, portfolio, languages, file, qrCode, status='Registered', userType, companyName, companyEmail, companyRepresentatives, companyFields, companyStatus, numebrOfApplicants, companySector, companyCity, numberOfPositions, skills, city, expectedToGraduate, flags, user, cv, preferredMajors, opportunityTypes, preferredQualities, link, onDelete, companyApplicants = [], companyId, onStatusChange}) => {
    const expandApplicantDiv = useRef();
    const expandApplicantBtn = useRef();
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isDeletingCompany, setIsDeletingCompany] = useState(false);
    const [showDeleteCompanyConfirm, setShowDeleteCompanyConfirm] = useState(false);

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

    // Handle company status change (Mark as Canceled)
    const handleStatusChange = async (newStatus) => {
        if (!companyId || !link) return;

        try {
            setIsUpdatingStatus(true);
            await axios.patch(`${link}/companies/${companyId}/status`,
                { status: newStatus },
                { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} }
            );
            setShowCancelConfirm(false);
            // Trigger parent refresh if callback provided
            if (onStatusChange) onStatusChange(companyId, newStatus);
            // Reload the page if no callback
            else window.location.reload();
        } catch (error) {
            console.error('Status update error:', error);
            alert('Failed to update company status. Please try again.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle company deletion
    const handleDeleteCompany = async () => {
        if (!companyId || !link) return;

        try {
            setIsDeletingCompany(true);
            await axios.delete(`${link}/companies/${companyId}`, {
                headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
            });
            setIsClicked(false);
            setShowDeleteCompanyConfirm(false);
            // Reload the page to reflect deletion
            window.location.reload();
        } catch (error) {
            console.error('Delete company error:', error);
            alert('Failed to delete company. Please try again.');
        } finally {
            setIsDeletingCompany(false);
        }
    };

    


    
const ApplicantModal = ({visible, onClose, children}) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const closingTimerRef = useRef(null);
    const modalContentRef = useRef(null);
    const scrollPositionRef = useRef(0);

    useEffect(() => {
        if (visible) {
            // Clear any pending close timer
            if (closingTimerRef.current) {
                clearTimeout(closingTimerRef.current);
                closingTimerRef.current = null;
            }
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender && !isClosing) {
            // Start closing animation
            setIsClosing(true);
            // Wait for animation to complete before unmounting
            closingTimerRef.current = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
                closingTimerRef.current = null;
            }, 300);
        }

        return () => {
            if (closingTimerRef.current) {
                clearTimeout(closingTimerRef.current);
            }
        };
    }, [visible, shouldRender, isClosing]);

    // Save scroll position before any update
    useEffect(() => {
        if (modalContentRef.current) {
            const saveScroll = () => {
                scrollPositionRef.current = modalContentRef.current?.scrollTop || 0;
            };
            modalContentRef.current.addEventListener('scroll', saveScroll);
            return () => {
                modalContentRef.current?.removeEventListener('scroll', saveScroll);
            };
        }
    }, [shouldRender]);

    // Restore scroll position after render
    useEffect(() => {
        if (modalContentRef.current && scrollPositionRef.current > 0) {
            modalContentRef.current.scrollTop = scrollPositionRef.current;
        }
    });

    if (!shouldRender) return null;

    const animationClass = isClosing ? 'modal-close' : 'modal-open';
    const backdropClass = isClosing ? 'backdrop-close' : 'backdrop-open';

    const handleBackdropClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999]" onMouseDown={(e) => e.stopPropagation()}>
            {/* Backdrop */}
            <div
                className={`expandDetails-backdrop absolute inset-0 bg-black/30 ${backdropClass}`}
                onClick={handleBackdropClick}
            />
            {/* Modal - Responsive sizing */}
            <div
                ref={(el) => { expandApplicantDiv.current = el; modalContentRef.current = el; }}
                className={`expandDetails ${animationClass} parent bg-white shadow-2xl rounded-xl px-4 md:px-8 py-6 md:py-10 w-[95vw] md:w-[90vw] lg:w-[64rem] h-[85vh] md:h-[42rem] max-h-[90vh] md:max-h-[45rem] overflow-y-auto absolute top-1/2 left-1/2`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {React.Children.map(children, child =>
                    React.isValidElement(child)
                        ? React.cloneElement(child, { onCloseModal: onClose })
                        : child
                )}
            </div>
        </div>,
        document.body
    );
}



    useEffect(() => {
        if (expandApplicantDiv.current && isClicked) {
            setIsVisible(true); // Use state to handle visibility
        }
 
    }, [isClicked])


    // Note: Click outside handling is now managed by ApplicantModal's backdrop onClick
    // The modal handles its own closing animation when onClose is called

    // Responsive visibility classes matching TableHeader
    const hideOnTablet = "hidden lg:flex"; // Show only on lg (1024px+)
    const hideOnMobile = "hidden md:flex"; // Show only on md (768px+)

    return userType != 'manager'
        ?
            <div id={ticketId} className={`row relative overflow-hidden grid py-2 pl-3 md:pl-7 pr-3 md:pr-6 h-[52px] ${shortlistedBy?.length ? 'border-2 border-blue-500' : rejectedBy?.length ? 'border-2 border-red-600' : ''} ${flags?.includes(user?.companyName) ? "border-2 border-green-500 bg-white" :'bg-white'} rounded-xl items-center mb-2 text-xs xl:text-sm`}>
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate">{name}</h2>
                <h2 className={`${hideOnMobile} items-center truncate`}>{uniId == "" || uniId?.length != 8 || uniId == 18000000 ? '00000000' : uniId}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{nationality}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{gpa == 0 || Number.isNaN(gpa)  ? 'XX' : parseFloat(gpa)?.toFixed(2)}</h2>
                <div className="flex items-center truncate">
                    <span className="hidden lg:inline">{studyLevel?.startsWith('Master') ? "" : studyLevel}</span>
                    <span className="hidden lg:inline">{studyLevel?.startsWith('Master') ? "" : ' of'} </span>
                    <span>{major}</span>
                </div>
                <h2 className={`${hideOnTablet} items-center truncate`}>{cv? 'Uploaded' : 'None'}</h2>
                <h2 className={`flex items-center justify-center text-[10px] xl:text-xs px-1 md:px-1.5 py-1 rounded-md font-semibold ${status ? `${colorCode.Confirmed}` : `${colorCode.Registered}`}`}>{status ? 'Confirmed' : 'Registered'}</h2>
    
                <div className="flex items-center justify-end">
                    {uniId == 22105176 && <DeveloperBadge />}
                    <button className="flex items-center justify-center w-5 h-5" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}}>
                        <ExpandIcon size="small" />
                    </button>
                        
                        
                        
                        
                        
                        {/* <div ref={expandApplicantDiv} className={`expandDetails parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[64rem] h-[36rem] max-h-[40rem] overflow-y-scroll md:overflow-y-auto fixed top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}> */}
                        <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)} >

                            <div className="card-info flex flex-col md:flex-row gap-4 md:gap-6">
                                
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
                                <div className="details md:w-8/12 flex flex-col gap-2 md:gap-3 overflow-y-auto">

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



                                    {/* Personal Information */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Personal Information</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-3">
                                            <CardInfo infoHeader={"Full name"} infoText={name} />
                                            <CardInfo infoHeader={"University ID"} infoText={uniId} />
                                            <CardInfo infoHeader={"Age"} infoText={age} />
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-3">
                                            <CardInfo infoHeader={"Email"} infoText={email} />
                                            <CardInfo infoHeader={"Phone number"} infoText={phoneNumber} />
                                        </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Academic Information</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-3">
                                            <CardInfo infoHeader={"Study program"} infoText={studyLevel} />
                                            <div className="md:col-span-2">
                                                <CardInfo infoHeader={"Major"} infoText={major} />
                                            </div>
                                            <CardInfo infoHeader={"CGPA"} infoText={gpa ? parseFloat(gpa).toFixed(2) : ''} />
                                        </div>
                                    </div>

                                    {/* Skills - full width for multi-line content */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Skills</h3>
                                        <div className="flex flex-col gap-2 md:gap-3">
                                            <CardInfo infoHeader={"Technical Skills"} infoText={skills?.tech} multiline />
                                            <CardInfo infoHeader={"Non-technical Skills"} infoText={skills?.nontech} multiline />
                                        </div>
                                    </div>

                                    {/* Background */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Background</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-3">
                                            <CardInfo infoHeader={"Nationality"} infoText={nationality} />
                                            <CardInfo infoHeader={"City"} infoText={city} />
                                            <CardInfo infoHeader={"Languages"} infoText={languages} />
                                        </div>
                                    </div>

                                    {/* Experience - full width for multi-line content */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Experience</h3>
                                        <CardInfo infoHeader={""} infoText={experience} multiline />
                                    </div>

                                    {/* Links & Documents */}
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Links & Documents</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-3">
                                            <CardInfo infoHeader={"LinkedIn"} infoText={portfolio} />
                                            <CardInfoFile file={file} />
                                        </div>
                                    </div>


                                </div>
                            </div>
                            {/* <hr className="my-4" /> */}
                            {/* <EmailToSection /> */}
                        </ApplicantModal>
                </div>
            </div>
        :
            <div className="row-manager grid py-2 pl-3 md:pl-7 pr-3 md:pr-6 h-[52px] bg-white rounded-xl items-center mb-2 text-xs xl:text-sm">
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate font-medium">{companyName}</h2>
                <h2 className={`${hideOnMobile} items-center truncate`}>
                    <a href={`mailto:${companyEmail}`} className="hover:text-blue-600 transition-colors">{companyEmail}</a>
                </h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companyRepresentatives}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companyCity}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companySector}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{numebrOfApplicants}</h2>
                <h2 className={`flex items-center justify-center text-[10px] xl:text-xs px-1 md:px-1.5 py-1 rounded-md font-semibold ${companyStatus === 'Confirmed' ? colorCode.Confirmed : companyStatus === 'Pending' ? colorCode.Pending : colorCode.Canceled}`}>{companyStatus || 'Pending'}</h2>

                <div className="flex items-center justify-end">
                    <button className="flex items-center justify-center w-5 h-5" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}}>
                        <ExpandIcon size="small" />
                    </button>

                    <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)}>
                        <div className="flex flex-col gap-4 md:gap-6 relative">
                            {/* Close Button for Company Modal */}
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsClicked(false); }}
                                className="absolute -top-3 md:-top-6 -left-1 md:-left-4 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-gray-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Company Header */}
                            <div className="flex items-center gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-200">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] rounded-xl flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0">
                                    {companyName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-xl font-bold text-gray-800 truncate">{companyName}</h2>
                                    <p className="text-xs md:text-sm text-gray-500">{companySector} • {companyCity}</p>
                                    <span className={`inline-block mt-1 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-semibold ${companyStatus == 'Confirmed' ? colorCode.Confirmed : colorCode.Canceled}`}>
                                        {companyStatus == 'Confirmed' ? 'Confirmed' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                                {/* Admin Actions - Mark as Canceled */}
                                {user?.email === 'casto@sharjah.ac.ae' && companyStatus !== 'Canceled' && (
                                    <div className="flex justify-between items-center bg-gray-100 rounded-lg px-5 py-3 md:col-span-2 border border-gray-300">
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase leading-0.5 tracking-wide ">Admin Actions</h3>
                                        <div className="flex items-center gap-2">
                                            {!showCancelConfirm && !showDeleteCompanyConfirm && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCancelConfirm(true); }}
                                                        className="px-4 py-2 bg-red-500 border border-red-300 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                        Mark as Canceled
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(true); }}
                                                        className="px-4 py-2 bg-red-700 border border-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete Company
                                                    </button>
                                                </>
                                            )}
                                            {showCancelConfirm && (
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-sm text-red-600">Mark this company as canceled?</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange('Canceled'); }}
                                                        disabled={isUpdatingStatus}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isUpdatingStatus ? 'Updating...' : 'Yes, Cancel'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCancelConfirm(false); }}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                                                    >
                                                        No, Keep
                                                    </button>
                                                </div>
                                            )}
                                            {showDeleteCompanyConfirm && (
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-sm text-red-600 font-medium">Permanently delete this company?</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCompany(); }}
                                                        disabled={isDeletingCompany}
                                                        className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
                                                    >
                                                        {isDeletingCompany ? 'Deleting...' : 'Yes, Delete'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(false); }}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                                                    >
                                                        No, Keep
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Revert Canceled Status */}
                                {user?.email === 'casto@sharjah.ac.ae' && companyStatus === 'Canceled' && (
                                    <div className="flex justify-between items-center bg-gray-100 rounded-lg px-5 py-3 md:col-span-2 border border-gray-300">
                                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Admin Actions</h3>
                                        <div className="flex items-center gap-2">
                                            {!showDeleteCompanyConfirm ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange('Pending'); }}
                                                        disabled={isUpdatingStatus}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        {isUpdatingStatus ? 'Updating...' : 'Revert to Pending'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(true); }}
                                                        className="px-4 py-2 bg-red-700 border border-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete Company
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-sm text-red-600 font-medium">Permanently delete this company?</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCompany(); }}
                                                        disabled={isDeletingCompany}
                                                        className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
                                                    >
                                                        {isDeletingCompany ? 'Deleting...' : 'Yes, Delete'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(false); }}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                                                    >
                                                        No, Keep
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {/* Contact Information */}
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Contact Information</h3>
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <CardInfo infoHeader="Email" infoText={companyEmail} />
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Company Details</h3>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        <CardInfo infoHeader="Sector" infoText={companySector} />
                                        <CardInfo infoHeader="City" infoText={companyCity} />
                                        <CardInfo infoHeader="Open Positions" infoText={numberOfPositions} />
                                        <CardInfo infoHeader="Applicants" infoText={numebrOfApplicants} />
                                    </div>
                                </div>

                                {/* Representatives */}
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Representatives</h3>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                        {companyRepresentatives?.split(',').map((rep, idx) => (
                                            <span key={idx} className="bg-blue-100 text-blue-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                {rep.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Industry Fields */}
                                <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Industry Fields</h3>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                        {(Array.isArray(companyFields) ? companyFields : companyFields?.split(','))?.map((field, idx) => (
                                            <span key={idx} className="bg-cyan-100 text-cyan-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                {typeof field === 'string' ? field.trim() : field}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Opportunity Types */}
                                {opportunityTypes?.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Opportunity Types</h3>
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {opportunityTypes.map((type, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Majors */}
                                {preferredMajors?.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Preferred Majors</h3>
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {preferredMajors.map((major, idx) => (
                                                <span key={idx} className="bg-green-100 text-green-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                    {major}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Qualities */}
                                {preferredQualities && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">Ideal Candidate Qualities</h3>
                                        <p className="text-xs md:text-sm text-gray-700">{preferredQualities}</p>
                                    </div>
                                )}

                                {/* Applicants List */}
                                {companyApplicants?.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 md:mb-3">
                                            Applicants ({companyApplicants.length})
                                        </h3>
                                        <div className="max-h-[200px] md:max-h-[280px] overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                            {companyApplicants.map((applicant, idx) => (
                                                <div
                                                    key={applicant._id || idx}
                                                    className={`flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm ${idx !== companyApplicants.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
                                                >
                                                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                                        <span className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-gray-200 text-gray-600 text-[10px] md:text-xs rounded-full font-medium flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-800 truncate">{applicant.applicantDetails?.fullName || 'Unknown'}</p>
                                                            <p className="text-[10px] md:text-xs text-gray-500 truncate">{applicant.applicantDetails?.major || 'No major'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                                        <span className="hidden md:inline text-xs text-gray-500">{applicant.applicantDetails?.uniId || ''}</span>
                                                        {applicant.attended && (
                                                            <span className="px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] md:text-xs rounded-full">Confirmed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {companyApplicants.length > 10 && (
                                            <p className="text-[10px] md:text-xs text-gray-500 mt-2 text-center">Scroll to see all {companyApplicants.length} applicants</p>
                                        )}
                                    </div>
                                )}


                            </div>
                        </div>
                    </ApplicantModal>
                </div>


            </div>

}

export default React.memo(Row);
