import axios from "axios"
import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import BriefInfo from "./BriefInfo";
import Brief from "./Brief";
import CardInfo from "./CardInfo";
import CardInfoFile from "./CardInfoFile";
import QRCode from "qrcode.react";
import StatusBadge from "./StatusBadge";

import { DeveloperBadge } from './index'
import { API_URL as rowApiLink } from "../config/api";
import Modal from "./Modal";
import EmailComposeModal from "./EmailComposeModal";

import { ExpandIcon } from "./Icons";








 

// StatusBadge handles all status rendering

const HighlightText = ({ text, query }) => {
    if (!query || !query.trim() || !text) return <>{text}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-200 rounded-[2px] px-[1px]">{part}</mark>
                    : part
            )}
        </>
    );
};



// ─── Design-spec helpers ────────────────────────────────────────────────────

// Two-tier text/link colors via classes (was inline hex with no dark tier).
const InfoItem = ({ label, value, link: href }) => (
    <div className="min-w-0">
        <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: 11, marginBottom: 2 }}>{label}</p>
        {href
            ? <a href={href} target="_blank" rel="noreferrer" className="text-blue-700 dark:text-blue-400 bidi-ltr" style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</a>
            : <p className="text-gray-800 dark:text-gray-100" style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</p>
        }
    </div>
);

const SectionHeader = ({ icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span className="text-gray-400 dark:text-gray-500" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
        <span className="border-gray-200 dark:border-gray-700" style={{ flex: 1, borderBottomWidth: '0.5px', borderBottomStyle: 'solid', marginInlineStart: 6 }} />
    </div>
);

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
};

const splitSkills = (raw) => {
    if (!raw || raw === 'undefined') return [];
    return String(raw).split(',').map(s => s.trim()).filter(Boolean);
};

const CVDownloadButton = ({ file }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = React.useState(false);
    const download = () => {
        setLoading(true);
        axios({ method: 'GET', url: `${rowApiLink}/cv/${file?.id}`, responseType: 'blob' })
            .then(res => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url; a.download = file?.originalname || 'cv';
                document.body.appendChild(a); a.click(); a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };
    return (
        <button onClick={download} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5D4F4] dark:border-blue-500/30 bg-[#E6F1FB] dark:bg-blue-500/15 text-[#185FA5] dark:text-blue-300 text-xs font-medium cursor-pointer transition-opacity"
            style={{ padding: '7px 12px', opacity: loading ? 0.6 : 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            {file?.originalname || t("applicants.columns.cv")}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        </button>
    );
};

const ApplicantDetailModal = ({
    name, uniId, age, status, ticketId, qrCode, expectedToGraduate,
    email, phoneNumber, studyLevel, major, gpa, skills,
    nationality, city, languages, experience, portfolio, file,
    flags, shortlistedBy, rejectedBy, user, isOtherTab, onTake,
    onClose, showDeleteConfirm, setShowDeleteConfirm, isDeleting, handleDelete,
}) => {
    const { t } = useTranslation();
    const initials = getInitials(name).toUpperCase();
    const techSkills = splitSkills(skills?.tech);
    const nonTechSkills = splitSkills(skills?.nontech);
    const gpaVal = gpa && !isNaN(parseFloat(gpa)) ? parseFloat(gpa).toFixed(2) : null;
    const graduationLabel = (() => {
        try {
            if (!expectedToGraduate) return t("applicantProfile.graduated");
            const year = parseInt(expectedToGraduate.split('-')[0]);
            return year >= 2025 ? expectedToGraduate : t("applicantProfile.graduated");
        } catch { return '—'; }
    })();

    return (
        <div className="flex flex-col h-full overflow-hidden bg-surface-card">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-5 py-3.5 border-b border-line">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#0C447C] dark:text-blue-300 flex items-center justify-center text-[13px] font-medium shrink-0">{initials}</div>
                    <div>
                        <p className="text-[15px] font-medium text-fg leading-tight">{name || '—'}</p>
                        <p className="text-xs text-fg-subtle mt-0.5 bidi-ltr">{uniId} · {t("applicantProfile.age", { age })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 ${status ? "bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300" : "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300"}`}>
                        {status && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {status ? t("enums.status.Confirmed") : t("enums.status.Registered")}
                    </span>
                    <button onClick={onClose} className="w-7 h-7 rounded-md border border-line bg-transparent hover:bg-surface-raised flex items-center justify-center transition-colors" aria-label={t("common.close")}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" className="text-fg-muted" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="grid overflow-y-auto" style={{ gridTemplateColumns: '220px 1fr', maxHeight: 'calc(90vh - 70px)' }}>
                {/* Sidebar */}
                <div className="flex flex-col gap-3.5 p-4 border-e border-line">
                    <div className="bg-surface-raised rounded-lg p-3 flex flex-col items-center gap-2">
                        <div className="bg-white rounded p-1.5">
                            {qrCode ? <QRCode value={qrCode} size={80} /> : <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center"><span className="text-[9px] text-gray-400">{t("common.loading")}</span></div>}
                        </div>
                        <p className="text-[9px] text-fg-subtle text-center leading-relaxed bidi-ltr" style={{ wordBreak: 'break-all' }}>{ticketId}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-fg-subtle uppercase tracking-wider mb-0.5">{t("applicantProfile.graduation")}</p>
                        <p className="text-[13px] font-medium text-fg">{graduationLabel}</p>
                    </div>
                    <div className="mt-auto flex flex-col gap-1.5">
                        <BriefInfo ticketId={ticketId} id={uniId} shortName={name} ticketQrCodeSrc={qrCode}
                            emailRec={email} status={status} graduationYear={expectedToGraduate}
                            flag={flags} shortlistedByStatus={shortlistedBy} rejectedByStatus={rejectedBy}
                            sidebarMode isOtherTab={isOtherTab} onTake={onTake} />
                        {user?.email === 'casto@sharjah.ac.ae' && (
                            !showDeleteConfirm
                                ? <button onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 dark:border-red-500/40 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-700 dark:text-red-400 text-[13px] font-medium transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    {t("common.delete")}
                                </button>
                                : <div className="flex flex-col gap-1">
                                    <p className="text-[11px] text-red-700 dark:text-red-400">{t("applicantProfile.cannotBeUndone")}</p>
                                    <div className="flex gap-1">
                                        <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-1.5 rounded-md border-none bg-red-700 dark:bg-red-600 text-white text-[11px] font-medium disabled:opacity-50 transition-opacity">{isDeleting ? '…' : t("common.confirm")}</button>
                                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 rounded-md border border-line bg-transparent text-[11px] text-fg-muted hover:bg-surface-raised transition-colors">{t("common.cancel")}</button>
                                    </div>
                                </div>
                        )}
                    </div>
                </div>

                {/* Detail panel */}
                <div className="flex flex-col gap-5 p-5">
                    <section>
                        <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>} label={t("applicantProfile.contact")} />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <InfoItem label={t("applicantProfile.email")} value={email} link={email ? `mailto:${email}` : undefined} />
                            <InfoItem label={t("applicantProfile.phone")} value={phoneNumber} />
                        </div>
                    </section>
                    <section>
                        <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5z"/></svg>} label={t("applicantProfile.academic")} />
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <InfoItem label={t("applicantProfile.program")} value={studyLevel} />
                            <InfoItem label={t("applicants.columns.major")} value={major} />
                            <div className="min-w-0">
                                <p className="text-[11px] text-fg-subtle mb-0.5">{t("applicants.columns.cgpa")}</p>
                                {gpaVal ? <span className="inline-block text-xs font-medium bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300 rounded-full px-2.5 py-0.5">{gpaVal}</span> : <p className="text-[13px] font-medium text-fg">—</p>}
                            </div>
                        </div>
                    </section>
                    {(techSkills.length > 0 || nonTechSkills.length > 0) && (
                        <section>
                            <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/></svg>} label={t("applicantProfile.skills")} />
                            <div className="flex flex-wrap gap-1.5">
                                {techSkills.map((s, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 text-[#0C447C] dark:text-blue-300">{s}</span>)}
                                {nonTechSkills.map((s, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-[#3C3489] dark:text-purple-300">{s}</span>)}
                            </div>
                        </section>
                    )}
                    <section>
                        <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"/></svg>} label={t("applicantProfile.background")} />
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <InfoItem label={t("applicants.columns.nationality")} value={nationality} />
                            <InfoItem label={t("managers.filters.city")} value={city} />
                            <InfoItem label={t("applicantProfile.languages")} value={languages && languages !== 'undefined' ? languages : null} />
                        </div>
                    </section>
                    {experience && experience !== 'undefined' && experience.trim() && (
                        <section>
                            <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387"/></svg>} label={t("applicantProfile.experience")} />
                            <div className="flex items-start gap-2.5 bg-surface-raised rounded-lg px-3.5 py-2.5 border border-line">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#185FA5] dark:text-blue-300" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                                </div>
                                <p className="text-[13px] font-medium text-fg leading-relaxed">{experience}</p>
                            </div>
                        </section>
                    )}
                    <section>
                        <SectionHeader icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>} label={t("applicantProfile.linksAndDocs")} />
                        <div className="flex flex-wrap gap-2.5">
                            {portfolio && portfolio !== 'undefined' && (
                                <a href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-fg-muted hover:bg-surface-raised no-underline transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    LinkedIn
                                </a>
                            )}
                            {file && <CVDownloadButton file={file} />}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────

const Row = ({number, name, ticketId, uniId, email, phoneNumber, studyLevel, major, gpa, nationality, experience, attended, shortlistedBy, rejectedBy, age, portfolio, languages, file, qrCode, status='Registered', userType, companyName, companyEmail, companyRepresentatives, companyFields, companyStatus, numebrOfApplicants, companySector, companyCity, numberOfPositions, skills, city, expectedToGraduate, flags, user, cv, preferredMajors, opportunityTypes, preferredQualities, link, onDelete, companyApplicants = [], companyId, onStatusChange, searchQuery = '', isOtherTab = false, onTake}) => {
    const { t } = useTranslation();
    const expandApplicantDiv = useRef();
    const expandApplicantBtn = useRef();
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isDeletingCompany, setIsDeletingCompany] = useState(false);
    const [showDeleteCompanyConfirm, setShowDeleteCompanyConfirm] = useState(false);
    const [applicantsOpen, setApplicantsOpen] = useState(false);
    const [showEmailCompose, setShowEmailCompose] = useState(false);

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
    const modalContentRef = useRef(null);
    const scrollPositionRef = useRef(0);

    // Preserve scroll position across re-renders while the modal is open
    // (e.g. when the underlying applicant data refetches mid-view)
    useEffect(() => {
        const el = modalContentRef.current;
        if (!el) return;
        const saveScroll = () => { scrollPositionRef.current = el.scrollTop || 0; };
        el.addEventListener('scroll', saveScroll);
        return () => el.removeEventListener('scroll', saveScroll);
    }, [visible]);

    useEffect(() => {
        if (modalContentRef.current && scrollPositionRef.current > 0) {
            modalContentRef.current.scrollTop = scrollPositionRef.current;
        }
    });

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            zIndex={99999}
            backdropClassName="bg-black/30"
            maxWidth=""
            contentStyle={{ border: '0.5px solid #E2E8F0', maxWidth: 860, width: '95vw', maxHeight: '90vh' }}
            contentClassName="parent"
            contentRef={(el) => { expandApplicantDiv.current = el; modalContentRef.current = el; }}
        >
            {React.Children.map(children, child =>
                React.isValidElement(child)
                    ? React.cloneElement(child, { onCloseModal: onClose })
                    : child
            )}
        </Modal>
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
            <div id={ticketId} className={`row relative overflow-hidden grid py-2 ps-3 md:ps-5 pe-3 md:pe-5 me-1 h-[46px] ${shortlistedBy?.length ? 'border border-blue-400' : rejectedBy?.length ? 'border border-red-400' : 'border border-transparent'} ${flags?.includes(user?.companyName) ? "border border-green-400 bg-white" :'bg-white'} rounded-lg items-center mb-1.5 text-[11px] xl:text-xs`}>
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate"><HighlightText text={name} query={searchQuery} /></h2>
                <h2 className={`${hideOnMobile} items-center truncate`}>{uniId == "" || uniId?.length != 8 || uniId == 18000000 ? '00000000' : uniId}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{nationality}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{gpa == 0 || Number.isNaN(gpa)  ? 'XX' : parseFloat(gpa)?.toFixed(2)}</h2>
                <div className="flex items-center gap-1 truncate">
                    {!studyLevel?.startsWith('Master') && (
                        <span className="hidden lg:inline shrink-0">{studyLevel} of</span>
                    )}
                    <span className="truncate">{major}</span>
                </div>
                <h2 className={`${hideOnTablet} items-center truncate`}>{cv? 'Uploaded' : 'None'}</h2>
                <div className="flex items-center justify-center"><StatusBadge status={status ? 'Confirmed' : 'Registered'} /></div>
    
                <div className="flex items-center justify-end">
                    {uniId == 22105176 && <DeveloperBadge />}
                    <button className="flex items-center justify-center w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-700 transition-colors" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}} title="Expand">
                        <ExpandIcon size="small" />
                    </button>
                        
                        
                        
                        
                        
                        {/* <div ref={expandApplicantDiv} className={`expandDetails parent bg-white shadow-2xl rounded-xl px-8 py-10 w-80 md:w-[64rem] h-[36rem] max-h-[40rem] overflow-y-scroll md:overflow-y-auto fixed top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100 z-[99999]' : 'opacity-0 -z-[9999]'}`}> */}
                        <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)}>
                            <ApplicantDetailModal
                                name={name} uniId={uniId} age={age} status={status}
                                ticketId={ticketId} qrCode={qrCode} expectedToGraduate={expectedToGraduate}
                                email={email} phoneNumber={phoneNumber} studyLevel={studyLevel}
                                major={major} gpa={gpa} skills={skills} nationality={nationality}
                                city={city} languages={languages} experience={experience}
                                portfolio={portfolio} file={file} flags={flags}
                                shortlistedBy={shortlistedBy} rejectedBy={rejectedBy}
                                user={user} isOtherTab={isOtherTab} onTake={onTake}
                                onClose={() => setIsClicked(false)}
                                showDeleteConfirm={showDeleteConfirm}
                                setShowDeleteConfirm={setShowDeleteConfirm}
                                isDeleting={isDeleting} handleDelete={handleDelete}
                            />
                        </ApplicantModal>
                </div>
            </div>
        :
            <div className="row-manager grid py-2 ps-3 md:ps-5 pe-3 md:pe-5 me-1 h-[46px] bg-white border border-transparent rounded-lg items-center mb-1.5 text-[11px] xl:text-xs">
                <h2 className="flex items-center truncate">{number}</h2>
                <h2 className="flex items-center truncate font-medium"><HighlightText text={companyName} query={searchQuery} /></h2>
                <h2 className={`${hideOnMobile} items-center truncate`}>
                    <a href={`mailto:${companyEmail}`} className="hover:text-blue-600 transition-colors">{companyEmail}</a>
                </h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companyRepresentatives}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companyCity}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{companySector}</h2>
                <h2 className={`${hideOnTablet} items-center truncate`}>{numebrOfApplicants}</h2>
                <div className="flex items-center justify-center"><StatusBadge status={companyStatus || 'Pending'} /></div>

                <div className="flex items-center justify-end">
                    <button className="flex items-center justify-center w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-700 transition-colors" ref={expandApplicantBtn} onClick={() => {setIsClicked(true)}} title="Expand">
                        <ExpandIcon size="small" />
                    </button>

                    <ApplicantModal visible={isClicked} onClose={() => setIsClicked(false)}>
                        <div className="flex flex-col gap-3 md:gap-4 p-4 md:p-6 overflow-y-auto flex-1">
                            {/* Company Header — gradient banner with monogram, quick actions and at-a-glance stats */}
                            <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-1 px-4 md:px-6 pt-4 md:pt-5 pb-3 bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] text-white">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                                        <div className="w-11 h-11 md:w-14 md:h-14 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center text-white text-lg md:text-2xl font-bold flex-shrink-0 ring-1 ring-white/25">
                                            {companyName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-base md:text-lg font-bold truncate">{companyName}</h2>
                                            <p className="text-[10px] md:text-xs text-white/70">{companySector || '—'} • {companyCity || '—'}</p>
                                            <div className="mt-1"><StatusBadge status={companyStatus || 'Pending'} /></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmailCompose(true); }} title={t("applicantProfile.emailThisCompany")}
                                            className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button type="button" title={t("applicantProfile.copyEmail")}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (companyEmail) { navigator.clipboard.writeText(companyEmail); } }}
                                            className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsClicked(false); }}
                                            className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" aria-label={t("common.close")}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
                                        </button>
                                    </div>
                                </div>
                                {/* At-a-glance stat strip */}
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {[
                                        [t("applicantProfile.positions"), numberOfPositions ?? '—'],
                                        [t("nav.applicants"), numebrOfApplicants ?? (companyApplicants?.length || 0)],
                                        [t("applicantProfile.fields"), (Array.isArray(companyFields) ? companyFields.length : companyFields?.split(',').filter(Boolean).length) || 0],
                                        [t("managersCols.reps"), companyRepresentatives?.split(',').filter(Boolean).length || 0],
                                    ].map(([label, value]) => (
                                        <div key={label} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                                            <p className="text-base md:text-lg font-bold leading-none">{value}</p>
                                            <p className="text-[9px] md:text-[10px] text-white/70 mt-0.5 uppercase tracking-wide">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                                {/* Admin Actions - Mark as Canceled */}
                                {user?.email === 'casto@sharjah.ac.ae' && companyStatus !== 'Canceled' && (
                                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-5 py-3 md:col-span-2 border border-gray-300 dark:border-gray-600">
                                        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase leading-0.5 tracking-wide ">{t("applicantProfile.adminActions")}</h3>
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
                                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-5 py-3 md:col-span-2 border border-gray-300 dark:border-gray-600">
                                        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t("applicantProfile.adminActions")}</h3>
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
                                                        {isUpdatingStatus ? t("applicantProfile.updating") : t("applicantProfile.revertToPending")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(true); }}
                                                        className="px-4 py-2 bg-red-700 border border-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        {t("applicantProfile.deleteCompany")}
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t("applicantProfile.permanentlyDeleteCompany")}</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCompany(); }}
                                                        disabled={isDeletingCompany}
                                                        className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
                                                    >
                                                        {isDeletingCompany ? t("applicantProfile.deleting") : t("applicantProfile.yesDelete")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteCompanyConfirm(false); }}
                                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        {t("applicantProfile.noKeep")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {/* Contact Information */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("applicantProfile.contactInformation")}</h3>
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <CardInfo infoHeader={t("applicantProfile.email")} infoText={companyEmail} />
                                    </div>
                                </div>

                                {/* Company Details */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("applicantProfile.companyDetails")}</h3>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        <CardInfo infoHeader={t("settings.profile.sector")} infoText={companySector} />
                                        <CardInfo infoHeader={t("managers.filters.city")} infoText={companyCity} />
                                        <CardInfo infoHeader={t("settings.profile.openPositions")} infoText={numberOfPositions} />
                                        <CardInfo infoHeader={t("nav.applicants")} infoText={numebrOfApplicants} />
                                    </div>
                                </div>

                                {/* Representatives — these are people's names, so a
                                    plain readable list reads better than tag pills */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("settings.profile.representatives")}</h3>
                                    <div className="flex flex-col gap-1.5">
                                        {companyRepresentatives?.split(',').map((r) => r.trim()).filter(Boolean).map((rep, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-semibold flex items-center justify-center shrink-0">{rep.charAt(0).toUpperCase()}</span>
                                                <span className="truncate">{rep}</span>
                                            </div>
                                        ))}
                                        {!companyRepresentatives?.trim() && <p className="text-xs text-gray-400 dark:text-gray-500">{t("applicantProfile.noneListed")}</p>}
                                    </div>
                                </div>

                                {/* Industry Fields */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("settings.profile.industryFields")}</h3>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                        {(Array.isArray(companyFields) ? companyFields : companyFields?.split(','))?.map((field, idx) => (
                                            <span key={idx} className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                {typeof field === 'string' ? field.trim() : field}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Opportunity Types */}
                                {opportunityTypes?.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("settings.profile.opportunityTypes")}</h3>
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {opportunityTypes.map((type, idx) => (
                                                <span key={idx} className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Majors */}
                                {preferredMajors?.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("settings.profile.preferredMajors")}</h3>
                                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {preferredMajors.map((major, idx) => (
                                                <span key={idx} className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs">
                                                    {major}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Qualities */}
                                {preferredQualities && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 md:mb-3">{t("settings.profile.idealQualities")}</h3>
                                        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{preferredQualities}</p>
                                    </div>
                                )}

                                {/* Applicants List — collapsible so it doesn't dominate the modal */}
                                {companyApplicants?.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setApplicantsOpen((v) => !v); }}
                                            className="w-full flex items-center justify-between mb-2 md:mb-3"
                                        >
                                            <h3 className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                {t("nav.applicants")} ({companyApplicants.length})
                                            </h3>
                                            <span className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400">
                                                {applicantsOpen ? "Hide" : "Show"}
                                                <svg className={`w-3.5 h-3.5 transition-transform ${applicantsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                            </span>
                                        </button>
                                        {applicantsOpen && (
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
                                                            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{applicant.applicantDetails?.fullName || t("applicantProfile.unknown")}</p>
                                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">{applicant.applicantDetails?.major || t("applicantProfile.noMajor")}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                                        <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 bidi-ltr">{applicant.applicantDetails?.uniId || ''}</span>
                                                        {applicant.attended && (
                                                            <span className="px-1.5 md:px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] md:text-xs rounded-full">{t("enums.status.Confirmed")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        )}
                                        {applicantsOpen && companyApplicants.length > 10 && (
                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">{t("applicantProfile.scrollToSeeAll", { count: companyApplicants.length })}</p>
                                        )}
                                    </div>
                                )}


                            </div>
                        </div>
                    </ApplicantModal>

                    <EmailComposeModal
                        visible={showEmailCompose}
                        onClose={() => setShowEmailCompose(false)}
                        to={companyEmail}
                        companyName={companyName}
                    />
                </div>


            </div>

}

export default React.memo(Row);
