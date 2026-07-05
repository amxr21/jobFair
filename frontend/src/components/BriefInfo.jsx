import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { API_URL as link } from "../config/api";
import { useAuthContext } from "../hooks/useAuthContext";
import { ApplicantsContext } from '../context/ApplicantsContext';
import { useNotifications } from '../context/NotificationsContext';

const BriefInfo = ({ ticketId, id, shortName, ticketQrCodeSrc, emailRec, status, graduationYear, flag, shortlistedByStatus, rejectedByStatus, sidebarMode = false, isOtherTab = false, onTake }) => {
    const { user } = useAuthContext();
    const { dispatch } = useContext(ApplicantsContext);
    const { notify } = useNotifications();

    // The applicant's display name for notification copy — falls back to the
    // short ticket id when a name isn't passed down to this instance.
    const applicantLabel = shortName || (ticketId ? ticketId.slice(0, 8) : "an applicant");

    const [isProcessing, setIsProcessing] = useState(false);
    const [isTaking, setIsTaking] = useState(false);
    const [isTaken, setIsTaken] = useState(false);

    const safeFlag = Array.isArray(flag) ? flag : [];
    const safeShortlisted = Array.isArray(shortlistedByStatus) ? shortlistedByStatus : [];
    const safeRejected = Array.isArray(rejectedByStatus) ? rejectedByStatus : [];

    const [localFlags, setLocalFlags] = useState(safeFlag);
    const [localShortlistedBy, setLocalShortlistedBy] = useState(safeShortlisted);
    const [localRejectedBy, setLocalRejectedBy] = useState(safeRejected);

    const isFlagged = localFlags.includes(user?.companyName);
    const isShortlisted = localShortlistedBy.includes(user?.companyName);
    const isRejected = localRejectedBy.includes(user?.companyName);

    const cleanId = ticketId ? ticketId.replace(/[^a-zA-Z0-9]/g, '') : '';

    const updateRowBorder = (type) => {
        const row = document.getElementById(ticketId);
        if (!row) return;
        row.classList.remove('border-blue-400', 'border-red-400', 'border-green-400', 'border-transparent');
        if (type === 'shortlist') row.classList.add('border-blue-400');
        else if (type === 'reject') row.classList.add('border-red-400');
        else if (type === 'flag') row.classList.add('border-green-400');
        else row.classList.add('border-transparent');
    };

    const handleShortlist = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/shortlist/${cleanId}`, { shortlistedBy: [user?.companyName] });
            const updated = [...localShortlistedBy, user?.companyName];
            setLocalShortlistedBy(updated);
            setLocalRejectedBy(prev => prev.filter(c => c !== user?.companyName));
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, shortlistedBy: updated } });
            updateRowBorder('shortlist');
            notify(`${user?.companyName || "You"} shortlisted ${applicantLabel}`, { type: 'shortlist', detail: `Added to ${user?.companyName || "your"} shortlist` });
        } catch (err) { console.error('Shortlist error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleUnshortlist = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/unshortlist/${cleanId}`, { company: user?.companyName });
            const updated = localShortlistedBy.filter(c => c !== user?.companyName);
            setLocalShortlistedBy(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, shortlistedBy: updated } });
            updateRowBorder(null);
        } catch (err) { console.error('Unshortlist error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleReject = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/reject/${cleanId}`, { rejectedBy: [user?.companyName] });
            const updated = [...localRejectedBy, user?.companyName];
            setLocalRejectedBy(updated);
            setLocalShortlistedBy(prev => prev.filter(c => c !== user?.companyName));
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, rejectedBy: updated } });
            updateRowBorder('reject');
            notify(`${user?.companyName || "You"} rejected ${applicantLabel}`, { type: 'reject', detail: `Removed from ${user?.companyName || "your"} consideration` });
        } catch (err) { console.error('Reject error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleUnreject = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/unreject/${cleanId}`, { company: user?.companyName });
            const updated = localRejectedBy.filter(c => c !== user?.companyName);
            setLocalRejectedBy(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, rejectedBy: updated } });
            updateRowBorder(null);
        } catch (err) { console.error('Unreject error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleFlag = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            await axios.patch(`${link}/applicants/flag/${cleanId}`, { flags: [user?.companyName] });
            const updated = [...localFlags, user?.companyName];
            setLocalFlags(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, flags: updated } });
            updateRowBorder('flag');
            notify(`${user?.companyName || "You"} flagged ${applicantLabel}`, { type: 'flag', detail: `Marked for follow-up by ${user?.companyName || "you"}` });
        } catch (err) { console.error('Flag error:', err); }
    };

    const handleUnflag = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            await axios.patch(`${link}/applicants/unflag/${cleanId}`, { company: user?.companyName });
            const updated = localFlags.filter(c => c !== user?.companyName);
            setLocalFlags(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, flags: updated } });
            updateRowBorder(null);
        } catch (err) { console.error('Unflag error:', err); }
    };

    const graduatedOrExpected = (() => {
        try {
            if (!graduationYear || graduationYear === '') return 'Graduated';
            const year = parseInt(graduationYear.split('-')[0]);
            return year >= 2025 ? `Graduates ${graduationYear}` : 'Graduated';
        } catch { return '—'; }
    })();

    // Spec-style button for sidebar mode
    const SpecBtn = ({ onClick, border, color, hoverBg, icon, label, active, activeBg, activeColor, onUndo }) => {
        const [hovered, setHovered] = React.useState(false);
        if (active) {
            return (
                <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: activeBg, color: activeColor, fontSize: 13, fontWeight: 500 }}>
                        {icon} {label}
                    </div>
                    <button onClick={onUndo} style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E2E8F0', background: 'transparent', fontSize: 11, color: '#4A5568', cursor: 'pointer' }}>Undo</button>
                </div>
            );
        }
        return (
            <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `0.5px solid ${border}`, background: hovered ? hoverBg : 'transparent', color, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s', width: '100%' }}>
                {icon} {label}
            </button>
        );
    };

    if (sidebarMode) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isOtherTab && (
                    isTaken ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, background: '#EAF3DE', border: '0.5px solid #C0DD97', fontSize: 13, fontWeight: 500, color: '#27500A' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Added to my list
                        </div>
                    ) : (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (!cleanId || !user?.companyName || isTaking) return;
                                try {
                                    setIsTaking(true);
                                    await axios.patch(`${link}/applicant/apply/${cleanId}`, { user_id: [user.companyName] }, {
                                        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
                                    });
                                    setIsTaken(true);
                                    if (onTake) onTake(ticketId);
                                } catch (err) { console.error('Take error:', err); }
                                finally { setIsTaking(false); }
                            }}
                            disabled={isTaking}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #B5D4F4', background: isTaking ? '#E6F1FB' : 'transparent', color: '#185FA5', fontSize: 13, fontWeight: 500, cursor: isTaking ? 'not-allowed' : 'pointer', transition: 'background 0.15s', width: '100%' }}
                            onMouseEnter={e => { if (!isTaking) e.currentTarget.style.background = '#E6F1FB'; }}
                            onMouseLeave={e => { if (!isTaking) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {isTaking ? (<><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Adding…</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Add to my list</>)}
                        </button>
                    )
                )}
                {isOtherTab && <div style={{ borderTop: '0.5px solid #E2E8F0', margin: '2px 0' }} />}
                {isProcessing && <p style={{ fontSize: 11, color: '#8A94A6', textAlign: 'center' }}>Processing…</p>}
                {!isProcessing && (
                    <>
                        <SpecBtn onClick={handleShortlist} onUndo={handleUnshortlist} active={isShortlisted} activeBg="#E6F1FB" activeColor="#185FA5" border="#B5D4F4" color="#185FA5" hoverBg="#E6F1FB"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>}
                            label={isShortlisted ? 'Shortlisted' : 'Shortlist'} />
                        <SpecBtn onClick={handleFlag} onUndo={handleUnflag} active={isFlagged} activeBg="#EAF3DE" activeColor="#27500A" border="#C0DD97" color="#27500A" hoverBg="#EAF3DE"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/></svg>}
                            label={isFlagged ? 'Flagged' : 'Flag'} />
                        <SpecBtn onClick={handleReject} onUndo={handleUnreject} active={isRejected} activeBg="#FCEBEB" activeColor="#A32D2D" border="#F09595" color="#A32D2D" hoverBg="#FCEBEB"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>}
                            label={isRejected ? 'Rejected' : 'Reject'} />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="brief-info flex flex-col gap-2 text-left w-full sticky top-0 self-start">
            <div className="relative flex flex-col items-center gap-2 px-3 py-3 text-center border bg-white shadow-sm rounded-lg overflow-hidden">
                {(isShortlisted || isRejected) && (
                    <div className={`absolute top-0 left-0 w-full py-1 text-[10px] font-bold uppercase tracking-widest text-center ${isShortlisted ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {isShortlisted ? 'Shortlisted' : 'Rejected'}
                    </div>
                )}
                <div className={`qr-code flex flex-col items-center ${isShortlisted || isRejected ? 'mt-5' : 'mt-0'}`}>
                    {ticketQrCodeSrc ? <QRCode value={ticketQrCodeSrc} size={110} /> : <div className="w-[110px] h-[110px] bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">Loading…</div>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{status ? 'Confirmed' : 'Registered'}</span>
                <p className="text-[9px] text-gray-400 break-all leading-tight px-1">{ticketId}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Graduation</span>
                <span className="text-xs font-medium text-gray-700">{graduatedOrExpected}</span>
            </div>
            <div className="flex flex-col gap-1.5">
                {isProcessing ? (
                    <div className="flex items-center justify-center h-9 rounded-lg bg-gray-100 text-xs text-gray-500">Processing…</div>
                ) : isShortlisted ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                            Shortlisted
                        </div>
                        <button onClick={handleUnshortlist} className="h-9 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors">Undo</button>
                    </div>
                ) : isRejected ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            Rejected
                        </div>
                        <button onClick={handleUnreject} className="h-9 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors">Undo</button>
                    </div>
                ) : (
                    <div className="flex gap-1.5">
                        <button onClick={handleShortlist} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                            Shortlist
                        </button>
                        <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            Reject
                        </button>
                    </div>
                )}
                {isFlagged ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            Flagged
                        </div>
                        <button onClick={handleUnflag} className="h-8 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors">Undo</button>
                    </div>
                ) : (
                    <button onClick={handleFlag} className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                        Flag Applicant
                    </button>
                )}
            </div>
        </div>
    );
};

export default BriefInfo;
