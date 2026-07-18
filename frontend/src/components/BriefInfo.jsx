import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { API_URL as link } from "../config/api";
import { useAuthContext } from "../hooks/useAuthContext";
import { ApplicantsContext } from '../context/ApplicantsContext';
import { useNotifications } from '../context/NotificationsContext';

const BriefInfo = ({ ticketId, id, shortName, ticketQrCodeSrc, emailRec, status, graduationYear, flag, shortlistedByStatus, rejectedByStatus, sidebarMode = false, isOtherTab = false, onTake }) => {
    const { t } = useTranslation();
    const { user } = useAuthContext();
    const { dispatch } = useContext(ApplicantsContext);
    const { notify } = useNotifications();

    // The applicant's display name for notification copy — falls back to the
    // short ticket id when a name isn't passed down to this instance.
    const applicantLabel = shortName || (ticketId ? ticketId.slice(0, 8) : t("applicantProfile.anApplicant"));

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
            await axios.patch(`${link}/applicants/shortlist/${cleanId}`, { shortlistedBy: [user?.companyName] }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
            const updated = [...localShortlistedBy, user?.companyName];
            setLocalShortlistedBy(updated);
            setLocalRejectedBy(prev => prev.filter(c => c !== user?.companyName));
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, shortlistedBy: updated } });
            updateRowBorder('shortlist');
            notify(t("applicantProfile.notifyShortlisted", { who: user?.companyName || t("applicantProfile.you"), applicant: applicantLabel }), { type: 'shortlist', detail: t("applicantProfile.notifyShortlistedDetail", { who: user?.companyName || t("applicantProfile.your") }) });
        } catch (err) { console.error('Shortlist error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleUnshortlist = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/unshortlist/${cleanId}`, { company: user?.companyName }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
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
            await axios.patch(`${link}/applicants/reject/${cleanId}`, { rejectedBy: [user?.companyName] }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
            const updated = [...localRejectedBy, user?.companyName];
            setLocalRejectedBy(updated);
            setLocalShortlistedBy(prev => prev.filter(c => c !== user?.companyName));
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, rejectedBy: updated } });
            updateRowBorder('reject');
            notify(t("applicantProfile.notifyRejected", { who: user?.companyName || t("applicantProfile.you"), applicant: applicantLabel }), { type: 'reject', detail: t("applicantProfile.notifyRejectedDetail", { who: user?.companyName || t("applicantProfile.your") }) });
        } catch (err) { console.error('Reject error:', err); }
        finally { setIsProcessing(false); }
    };

    const handleUnreject = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            setIsProcessing(true);
            await axios.patch(`${link}/applicants/unreject/${cleanId}`, { company: user?.companyName }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
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
            await axios.patch(`${link}/applicants/flag/${cleanId}`, { flags: [user?.companyName] }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
            const updated = [...localFlags, user?.companyName];
            setLocalFlags(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, flags: updated } });
            updateRowBorder('flag');
            notify(t("applicantProfile.notifyFlagged", { who: user?.companyName || t("applicantProfile.you"), applicant: applicantLabel }), { type: 'flag', detail: t("applicantProfile.notifyFlaggedDetail", { who: user?.companyName || t("applicantProfile.you") }) });
        } catch (err) { console.error('Flag error:', err); }
    };

    const handleUnflag = async (e) => {
        e?.stopPropagation();
        if (!cleanId) return;
        try {
            await axios.patch(`${link}/applicants/unflag/${cleanId}`, { company: user?.companyName }, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
            const updated = localFlags.filter(c => c !== user?.companyName);
            setLocalFlags(updated);
            dispatch({ type: 'UPDATE_APPLICANT', payload: { _id: ticketId, flags: updated } });
            updateRowBorder(null);
        } catch (err) { console.error('Unflag error:', err); }
    };

    const graduatedOrExpected = (() => {
        try {
            if (!graduationYear || graduationYear === '') return t("applicantProfile.graduated");
            const year = parseInt(graduationYear.split('-')[0]);
            return year >= 2025 ? t("applicantProfile.graduatesYear", { year: graduationYear }) : t("applicantProfile.graduated");
        } catch { return '—'; }
    })();

    // Spec-style button for sidebar mode — tone picks the shared color family
    // (blue/green/red) so both the resting and "active" state pick up dark:
    // variants from Tailwind instead of hardcoded hex that ignores the theme.
    const TONE_CLASSES = {
        blue: { border: 'border-blue-200 dark:border-blue-500/30', color: 'text-[#185FA5] dark:text-blue-300', hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10', activeBg: 'bg-blue-50 dark:bg-blue-500/15', activeColor: 'text-[#185FA5] dark:text-blue-300' },
        green: { border: 'border-green-200 dark:border-green-500/30', color: 'text-[#27500A] dark:text-green-300', hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10', activeBg: 'bg-green-50 dark:bg-green-500/15', activeColor: 'text-[#27500A] dark:text-green-300' },
        red: { border: 'border-red-200 dark:border-red-500/30', color: 'text-[#A32D2D] dark:text-red-300', hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10', activeBg: 'bg-red-50 dark:bg-red-500/15', activeColor: 'text-[#A32D2D] dark:text-red-300' },
    };
    const SpecBtn = ({ onClick, tone, icon, label, active, onUndo }) => {
        const c = TONE_CLASSES[tone];
        if (active) {
            return (
                <div className="flex gap-1">
                    <div className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium ${c.activeBg} ${c.activeColor}`}>
                        {icon} {label}
                    </div>
                    <button onClick={onUndo} className="px-2.5 py-2 rounded-lg border border-line bg-transparent text-[11px] text-fg-muted hover:bg-surface-raised transition-colors">{t("applicantProfile.undo")}</button>
                </div>
            );
        }
        return (
            <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-transparent text-[13px] font-medium w-full transition-colors ${c.border} ${c.color} ${c.hoverBg}`}>
                {icon} {label}
            </button>
        );
    };

    if (sidebarMode) {
        return (
            <div className="flex flex-col gap-1.5">
                {isOtherTab && (
                    isTaken ? (
                        <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 text-[13px] font-medium text-[#27500A] dark:text-green-300">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            {t("applicantProfile.addedToMyList")}
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
                            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-500/30 text-[13px] font-medium text-[#185FA5] dark:text-blue-300 w-full transition-colors ${isTaking ? 'bg-blue-50 dark:bg-blue-500/15 cursor-not-allowed' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer'}`}
                        >
                            {isTaking ? (<><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{t("applicantProfile.adding")}</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{t("applicantProfile.addToMyList")}</>)}
                        </button>
                    )
                )}
                {isOtherTab && <div className="border-t border-line my-0.5" />}
                {isProcessing && <p className="text-[11px] text-fg-subtle text-center">{t("applicantProfile.processing")}</p>}
                {!isProcessing && (
                    <>
                        <SpecBtn onClick={handleShortlist} onUndo={handleUnshortlist} active={isShortlisted} tone="blue"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>}
                            label={isShortlisted ? t("applicantProfile.shortlisted") : t("applicantProfile.shortlist")} />
                        <SpecBtn onClick={handleFlag} onUndo={handleUnflag} active={isFlagged} tone="green"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/></svg>}
                            label={isFlagged ? t("applicantProfile.flagged") : t("applicantProfile.flag")} />
                        <SpecBtn onClick={handleReject} onUndo={handleUnreject} active={isRejected} tone="red"
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>}
                            label={isRejected ? t("applicantProfile.rejected") : t("applicantProfile.reject")} />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="brief-info flex flex-col gap-2 text-start w-full sticky top-0 self-start">
            <div className="relative flex flex-col items-center gap-2 px-3 py-3 text-center border border-gray-200 dark:border-gray-700 bg-surface-card shadow-sm rounded-lg overflow-hidden">
                {(isShortlisted || isRejected) && (
                    <div className={`absolute top-0 start-0 w-full py-1 text-[10px] font-bold uppercase tracking-widest text-center ${isShortlisted ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                        {isShortlisted ? t("applicantProfile.shortlisted") : t("applicantProfile.rejected")}
                    </div>
                )}
                <div className={`qr-code flex flex-col items-center ${isShortlisted || isRejected ? 'mt-5' : 'mt-0'}`}>
                    {ticketQrCodeSrc ? <QRCode value={ticketQrCodeSrc} size={110} /> : <div className="w-[110px] h-[110px] bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">{t("common.loading")}</div>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'}`}>{status ? t("enums.status.Confirmed") : t("enums.status.Registered")}</span>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 break-all leading-tight px-1 bidi-ltr">{ticketId}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">{t("applicantProfile.graduation")}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{graduatedOrExpected}</span>
            </div>
            <div className="flex flex-col gap-1.5">
                {isProcessing ? (
                    <div className="flex items-center justify-center h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">{t("applicantProfile.processing")}</div>
                ) : isShortlisted ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                            {t("applicantProfile.shortlisted")}
                        </div>
                        <button onClick={handleUnshortlist} className="h-9 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs transition-colors">{t("applicantProfile.undo")}</button>
                    </div>
                ) : isRejected ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            {t("applicantProfile.rejected")}
                        </div>
                        <button onClick={handleUnreject} className="h-9 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs transition-colors">{t("applicantProfile.undo")}</button>
                    </div>
                ) : (
                    <div className="flex gap-1.5">
                        <button onClick={handleShortlist} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                            {t("applicantProfile.shortlist")}
                        </button>
                        <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            {t("applicantProfile.reject")}
                        </button>
                    </div>
                )}
                {isFlagged ? (
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            {t("applicantProfile.flagged")}
                        </div>
                        <button onClick={handleUnflag} className="h-8 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs transition-colors">{t("applicantProfile.undo")}</button>
                    </div>
                ) : (
                    <button onClick={handleFlag} className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                        {t("applicantProfile.flagApplicant")}
                    </button>
                )}
            </div>
        </div>
    );
};

export default BriefInfo;
