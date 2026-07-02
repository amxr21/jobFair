import { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL } from "../config/api";
import SectionCard from "../components/SectionCard";
import TagPill from "../components/TagPill";
import StatCard from "../components/StatCard";
import { useEventOps, formatWhen } from "../context/EventOpsContext";

const BANNER_STEPS = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];

const MiniBadge = ({ label, tone = "gray" }) => {
    const tones = {
        green: "bg-green-100 text-green-700", yellow: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-600", gray: "bg-gray-100 text-gray-500",
        blue: "bg-blue-100 text-blue-700", purple: "bg-purple-100 text-purple-700",
    };
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${tones[tone] || tones.gray}`}>{label}</span>;
};

const passTone = (t) => (t === "VIP" ? "purple" : t === "Parking" ? "yellow" : "blue");
const statusTone = (s) => ({
    Placed: "green", Printed: "green", Approved: "green", Submitted: "yellow", "Not Submitted": "gray",
    Fulfilled: "green", "In Progress": "blue", Open: "yellow", Partial: "yellow", Pending: "gray",
    Active: "green", Used: "gray", Revoked: "red", Present: "green", Absent: "red",
}[s] || "gray");

// Everything CASTO manages for this company in Event Settings, mirrored live here
const EventDaySection = ({ companyName }) => {
    const { companyView } = useEventOps();
    const view = companyView(companyName);
    if (!view) return null;

    const { booth, banners, requirements, equipment, attendance, passes } = view;
    const hasAnything = booth || banners.length || requirements.length || equipment.length || passes.length;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mt-1">
                <h2 className="text-sm font-bold text-gray-800">Event Day</h2>
                <span className="text-[10px] text-gray-400">Managed by the CASTO office — updates appear here automatically</span>
            </div>

            {!hasAnything && (
                <div className="bg-white rounded-lg p-4 border border-gray-100 text-xs text-gray-400">
                    No event-day records yet. Booth, branding, and passes will appear here once the CASTO office assigns them.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {booth && (
                    <SectionCard title="My Booth">
                        <div className="flex items-center gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-2 shrink-0">
                                <QRCodeSVG value={`jobfair:attendance:${booth.number}`} size={84} fgColor="#111827" />
                            </div>
                            <div className="flex flex-col gap-1 text-xs min-w-0">
                                <p className="text-base font-bold text-gray-800">{booth.number} · Zone {booth.zone}</p>
                                <p className="text-gray-500">{booth.type} booth · {booth.ring === "center" ? "Center island" : "Outer ring"}</p>
                                {attendance ? (
                                    <div className="flex items-center gap-1.5">
                                        <MiniBadge label={attendance.status} tone={statusTone(attendance.status)} />
                                        {attendance.time !== "—" && <span className="text-gray-400">since {attendance.time}</span>}
                                    </div>
                                ) : <MiniBadge label="Attendance pending" tone="gray" />}
                                <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
                                    This QR code is printed at your booth. Scan it on arrival to confirm your attendance.
                                </p>
                            </div>
                        </div>
                    </SectionCard>
                )}

                {banners.length > 0 && (
                    <SectionCard title="Banners & Branding">
                        <div className="flex flex-col gap-2.5">
                            {banners.map((b) => {
                                const si = BANNER_STEPS.indexOf(b.status);
                                return (
                                    <div key={b.id} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-gray-700 truncate">{b.material} · {b.size} · ×{b.quantity}</p>
                                            <MiniBadge label={b.status} tone={statusTone(b.status)} />
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {BANNER_STEPS.map((s, i) => (
                                                <div key={s} className={`h-1 flex-1 rounded-full ${i <= si ? "bg-green-500" : "bg-gray-200"}`} title={s} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400">Deadline {b.deadline} · Last update by {b.updatedBy} · {formatWhen(b.updatedAt)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                )}

                {equipment.length > 0 && (
                    <SectionCard title="Logistics & Equipment">
                        <div className="flex flex-col gap-1.5">
                            {equipment.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-700 truncate">{r.item}</span>
                                    <span className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono text-gray-500">{r.qtyFul}/{r.qtyReq}</span>
                                        <MiniBadge label={r.status} tone={statusTone(r.status)} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {requirements.length > 0 && (
                    <SectionCard title="Special Requirements">
                        <div className="flex flex-col gap-1.5">
                            {requirements.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-700 truncate">{r.description}</span>
                                    <MiniBadge label={r.status} tone={statusTone(r.status)} />
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {passes.length > 0 && (
                    <SectionCard title="My Access Passes" className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {passes.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                                    <div className="bg-white rounded p-1 shrink-0">
                                        <QRCodeSVG value={`jobfair:pass:${p.code}`} size={44} fgColor="#111827" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-700 truncate">{p.delegate}</p>
                                        <p className="text-[10px] font-mono text-gray-400">{p.code}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <MiniBadge label={p.type} tone={passTone(p.type)} />
                                        <MiniBadge label={p.status} tone={statusTone(p.status)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </div>
    );
};

const STATUS_CONFIG = {
    Confirmed: {
        card: 'bg-green-50 border-green-200', text: 'text-green-800', sub: 'text-green-600',
        badge: 'bg-green-100 text-green-700 border-green-200',
        msg: 'Your attendance is confirmed! We look forward to seeing you at the Job Fair.',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
    Pending: {
        card: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', sub: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        msg: 'Please check your email for the confirmation link, or contact the event coordinator if you have not received it.',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
    Canceled: {
        card: 'bg-red-50 border-red-200', text: 'text-red-800', sub: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border-red-200',
        msg: 'Your participation has been canceled. Please contact the event coordinator if you believe this is an error.',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
};

const CompanyStatus = () => {
    const { user } = useAuthContext();
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState(null);
    const [applicantsCount, setApplicantsCount] = useState(0);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.user_id;

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/companies/${userId}`);
                if (res?.data) setCompanyData(res.data);
            } catch (err) {
                setError("Failed to load company information");
            } finally {
                setLoading(false);
            }
        };

        const fetchApplicantsCount = async () => {
            try {
                const companyName = storedUser?.companyName;
                if (!companyName) return;
                const res = await axios.get(
                    `${API_URL}/applicants?company=${encodeURIComponent(companyName)}&limit=1`,
                    { headers: storedUser?.token ? { Authorization: `Bearer ${storedUser.token}` } : {} }
                );
                if (res?.data?.pagination) setApplicantsCount(res.data.pagination.totalItems);
            } catch { /* silently ignore */ }
        };

        if (userId) { fetchCompanyData(); fetchApplicantsCount(); }
    }, [userId]);

    const handleConfirmAttendance = async () => {
        try {
            setIsConfirming(true);
            setConfirmError(null);
            await axios.patch(`${API_URL}/companies/${userId}/status`, { status: 'Confirmed' },
                { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} }
            );
            setCompanyData(prev => ({ ...prev, status: 'Confirmed' }));
        } catch (err) {
            setConfirmError("Failed to confirm attendance. Please try again.");
        } finally {
            setIsConfirming(false);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0E7F41]" />
        </div>
    );

    if (error) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-700">{error}</p>
            </div>
        </div>
    );

    const status = companyData?.status || 'Pending';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    const reps = companyData?.representitives?.split(',').filter(Boolean) || [];
    const fields = (Array.isArray(companyData?.fields) ? companyData.fields : companyData?.fields?.split(',') || []).map(f => (typeof f === 'string' ? f.trim() : f)).filter(Boolean);

    return (
        <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-auto p-3 md:p-4 animate-fadeIn">
            <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] rounded-lg flex items-center justify-center text-white text-base font-bold shrink-0">
                            {companyData?.companyName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm md:text-base font-bold text-gray-800 truncate">{companyData?.companyName}</h1>
                            <p className="text-xs text-gray-500 truncate">{companyData?.sector} · {companyData?.city}</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs shrink-0 ${cfg.badge}`}>
                        {cfg.icon}<span className="font-semibold">{status}</span>
                    </div>
                </div>
            </div>

            <div className={`rounded-lg p-3 md:p-4 border ${cfg.card}`}>
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${cfg.sub}`}>{cfg.icon}</div>
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${cfg.text} mb-1`}>
                            {status === 'Confirmed' && 'Attendance confirmed'}
                            {status === 'Pending' && 'Awaiting confirmation'}
                            {status === 'Canceled' && 'Participation canceled'}
                        </p>
                        <p className={`text-xs ${cfg.sub}`}>{cfg.msg}</p>
                        {status === 'Pending' && (
                            <div className="mt-2.5">
                                <button onClick={handleConfirmAttendance} disabled={isConfirming}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7F41] text-white rounded-lg text-xs font-medium hover:bg-[#0a5f31] transition-colors disabled:opacity-50">
                                    {isConfirming ? (<><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Confirming…</>) : (<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Confirm My Attendance</>)}
                                </button>
                                {confirmError && <p className="mt-1.5 text-xs text-red-600">{confirmError}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Applicants" value={applicantsCount} iconBg="bg-green-100" iconColor="text-green-600"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatCard label="Open Positions" value={companyData?.noOfPositions || 0} iconBg="bg-purple-100" iconColor="text-purple-600"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                <StatCard label="Representatives" value={reps.length} iconBg="bg-blue-100" iconColor="text-blue-600"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SectionCard title="Contact Information">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <a href={`mailto:${companyData?.email}`} className="text-blue-600 hover:underline truncate">{companyData?.email}</a>
                    </div>
                </SectionCard>
                <SectionCard title="Representatives">
                    <div className="flex flex-wrap gap-1.5">{reps.map((rep, i) => <TagPill key={i} label={rep.trim()} variant="blue" />)}</div>
                </SectionCard>
                <SectionCard title="Industry Fields">
                    <div className="flex flex-wrap gap-1.5">{fields.map((f, i) => <TagPill key={i} label={f} variant="cyan" />)}</div>
                </SectionCard>
                <SectionCard title="Opportunity Types">
                    <div className="flex flex-wrap gap-1.5">
                        {companyData?.opportunityTypes?.length > 0
                            ? companyData.opportunityTypes.map((t, i) => <TagPill key={i} label={t} variant="purple" />)
                            : <span className="text-xs text-gray-400">Not specified</span>}
                    </div>
                </SectionCard>
                {companyData?.preferredMajors?.length > 0 && (
                    <SectionCard title="Preferred Majors" className="md:col-span-2">
                        <div className="flex flex-wrap gap-1.5">{companyData.preferredMajors.map((m, i) => <TagPill key={i} label={m} variant="green" />)}</div>
                    </SectionCard>
                )}
                {companyData?.preferredQualities && (
                    <SectionCard title="Ideal Candidate Qualities" className="md:col-span-2">
                        <p className="text-xs text-gray-700 leading-relaxed">{companyData.preferredQualities}</p>
                    </SectionCard>
                )}
            </div>

            <EventDaySection companyName={companyData?.companyName} />

            {companyData?.surveyResult?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-3">
                    <div className="p-1.5 bg-green-100 rounded-full shrink-0"><svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                    <div><p className="text-xs font-medium text-green-800">Survey Completed</p><p className="text-[10px] text-green-600">Thank you for completing the post-event survey!</p></div>
                </div>
            )}
        </div>
    );
};

export default CompanyStatus;
