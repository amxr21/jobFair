import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation, Trans } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL } from "../config/api";
import SectionCard from "../components/SectionCard";
import TagPill from "../components/TagPill";
import StatCard from "../components/StatCard";
import CompanyRequestForm from "../components/CompanyRequestForm";
import { useEventOps, formatWhen, MODULE_LABELS } from "../context/EventOpsContext";
import { SubTabBar } from "../components/EventSettingsShared";
import { useToast } from "../components/Toast";
import { tCity, tSector, translateEnum } from "../i18n/translateEnum";
import i18n from "../i18n";

const BANNER_STEPS = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];

const TONE_CLASSES = {
    green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    yellow: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    gray: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};
const toneClass = (tone) => TONE_CLASSES[tone] || TONE_CLASSES.gray;

// Translate a fixed-option badge value that may belong to any of several enum
// groups (banner/request/attendance/pass/event). DB value stays English; only
// the label shown is localized. Falls back to the raw value if unknown.
const tBadge = (value) => {
    if (value == null || value === "") return value;
    for (const group of ["bannerStatus", "requestStatus", "attendanceState", "passStatus", "eventState"]) {
        const key = `enums.${group}.${value}`;
        const translated = i18n.t(key);
        if (translated !== key) return translated;
    }
    return value;
};

const MiniBadge = ({ label, tone = "gray" }) => (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${toneClass(tone)}`}>{label}</span>
);

// Placeholder shown inside a section the company can see but CASTO hasn't set
// up yet. The company always sees the full set of sections (booth, banners,
// passes, parking, equipment) so they know what's coming and who owns it —
// rather than the section silently disappearing until CASTO assigns something.
// Everything on the company side is view-only; this never implies the company
// can create it themselves — only CASTO can.
const AwaitingCasto = ({ text }) => (
    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
        <svg className="w-3.5 h-3.5 shrink-0 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{text}</span>
    </div>
);

// Parking map preview. Once a mapUrl (a Google Maps share/pin link) is set by
// CASTO, the delegate gets a tappable "Open in Maps" and a placeholder preview
// box. The live embedded map (an <iframe> Google Maps Embed) is deliberately
// NOT wired up yet — it needs a Maps Embed API key + billing — so this renders
// a styled placeholder in its place, ready to swap for the real embed later.
const ParkingMapPreview = ({ mapUrl }) => {
    const { t } = useTranslation();
    if (!mapUrl) return null;
    return (
        <div className="mt-1.5">
            {/* Placeholder for the future embedded map. Replace this block with
                <iframe src={`https://www.google.com/maps/embed/v1/place?key=${KEY}&q=...`} />
                once a Maps Embed API key is available. */}
            <div className="relative h-16 rounded-lg overflow-hidden border border-amber-200 bg-[repeating-linear-gradient(45deg,#fef3c7,#fef3c7_8px,#fde68a_8px,#fde68a_16px)] flex items-center justify-center">
                <span className="text-amber-700/80 text-[10px] font-semibold bg-white/70 rounded px-1.5 py-0.5">{t("common.mapPreview")}</span>
                <span className="absolute text-lg" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }}>📍</span>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-800 hover:underline">
                📍 {t("common.openInMaps")}
            </a>
        </div>
    );
};

// Venue map for the company's booth — a styled Google Maps placeholder showing
// roughly where the booth is on-site. Like ParkingMapPreview, the live embedded
// map (Google Maps Embed <iframe>) needs an API key + billing, so this renders
// a green-tinted map placeholder ready to swap for the real embed. `mapUrl`
// (when CASTO provides one) powers the "Open in Maps" link; otherwise the link
// is hidden and only the placeholder shows.
const VenueMapPreview = ({ label, mapUrl }) => {
    const { t } = useTranslation();
    return (
    <div className="w-full">
        {/* Replace with:
            <iframe src={`https://www.google.com/maps/embed/v1/place?key=${KEY}&q=...`} />
            once a Maps Embed API key is available. */}
        <div className="relative h-28 rounded-xl overflow-hidden border border-green-200 bg-[repeating-linear-gradient(45deg,#ecfdf3,#ecfdf3_10px,#d1fae5_10px,#d1fae5_20px)]">
            {/* faux streets */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-inline-0 top-1/3 h-1.5 bg-white/70" />
                <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white/70" />
            </div>
            {/* pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-2xl" style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}>📍</span>
                {label && <span className="text-[10px] font-bold text-green-800 bg-white/85 rounded-full px-2 py-0.5">{label}</span>}
            </div>
            <span className="absolute top-1.5 start-2 text-[9px] font-semibold text-green-700/70 bg-white/70 rounded px-1.5 py-0.5">{t("companyStatus.venueMap")}</span>
        </div>
        {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:text-green-800 hover:underline">
                📍 {t("companyStatus.openInGoogleMaps")}
            </a>
        )}
    </div>
    );
};

const statusTone = (s) => ({
    Placed: "green", Printed: "green", Approved: "green", Submitted: "yellow", "Not Submitted": "gray",
    Fulfilled: "green", "In Progress": "blue", Open: "yellow", Partial: "yellow", Pending: "gray",
    Active: "green", Used: "gray", Revoked: "red", Present: "green", Absent: "red",
}[s] || "gray");

// Everything CASTO manages for this company in Event Settings, mirrored live here
// Maps a module id (venue/banners/requirements/equipment/...) to whichever
// CASTO officer currently owns it, so a company can see exactly who to
// contact for a given section instead of one generic "CASTO office" line.
const ContactCard = ({ moduleId, team }) => {
    const owner = team?.find((m) => m.focus?.includes(moduleId));
    if (!owner) return null;
    return (
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-2 mt-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-contrast text-[10px] font-bold flex items-center justify-center shrink-0">{owner.name[0]}</span>
            <div className="min-w-0 text-[10px] leading-tight">
                <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{owner.name} · {owner.role}</p>
                {owner.email && <a href={`mailto:${owner.email}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate block bidi-ltr">{owner.email}</a>}
            </div>
        </div>
    );
};

// Everything CASTO manages for this company in Event Settings, mirrored live
// here in full detail — its own tab so it doesn't get lost below the profile.
const EventDaySection = ({ companyName, readOnly = false }) => {
    const { t } = useTranslation();
    const { companyView, team, data, companySelfCheckIn, isCompanyCheckedIn, refetchEventOps, onPersistError } = useEventOps();
    const toast = useToast();
    const view = companyView(companyName);
    const checkedIn = isCompanyCheckedIn(companyName);

    // EventOpsProvider only fetches /event-ops once, on app mount, and never
    // remounts on route changes — so without this, a company that logs in
    // before CASTO assigns a booth / fulfills a requirement / issues a pass
    // would never see it until the 15s background poll catches up (or a hard
    // reload). Refetching on every mount of this tab makes switching into
    // "Event Day" always show what CASTO has entered right now.
    useEffect(() => {
        refetchEventOps();
    }, [refetchEventOps]);

    // Surface a failed background save (self check-in, requirement request) to
    // the company too — update() applies optimistically and the PUT is
    // debounced, so a rejected save (dropped connection, expired session)
    // would otherwise be silent on the company side. EventOperations registers
    // its own handler; company and CASTO views are never mounted at once, so
    // the last-registered-wins single handler is fine here.
    useEffect(() => {
        if (readOnly) return;
        onPersistError((err) => {
            const status = err?.response?.status;
            const reason = status === 401 || status === 403 ? t("companyStatus.saveError.signIn") : t("companyStatus.saveError.retry");
            toast(t("companyStatus.saveError.message", { reason }), { type: "error" });
        });
    }, [onPersistError, toast, readOnly, t]);

    const handleSelfCheckIn = () => {
        companySelfCheckIn(companyName);
        toast(t("companyStatus.checkedInToast"), { type: "success" });
    };

    if (!view) return null;

    const { booth, banners, requirements, equipment, attendance, passes } = view;
    const schedule = [...(data?.schedule || [])].sort((a, b) => a.start.localeCompare(b.start));
    const hasAnything = booth || banners.length || requirements.length || equipment.length || passes.length;
    const parkingPasses = passes.filter((p) => p.type === "Parking");
    const entryPasses = passes.filter((p) => p.type !== "Parking");

    return (
        <div className="flex flex-col gap-3">
            {!hasAnything && (
                <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span><Trans i18nKey="companyStatus.notSetUpYet" components={{ b: <strong /> }} /></span>
                </div>
            )}

            {/* My Booth — redesigned: a location panel (booth id, zone, venue
                map placeholder, check-in) beside a framed check-in QR. Always
                shown; placeholder until CASTO assigns one. */}
            <SectionCard title={t("companyStatus.sections.booth")}>
                {booth ? (
                    <div className="flex flex-col gap-3">
                        {/* Header row — booth badge, zone/type, attendance */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-contrast font-bold text-lg px-3.5 py-1.5 shadow-sm bidi-ltr">
                                {booth.number}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("companyStatus.booth.zone", { zone: booth.zone })}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("companyStatus.booth.typeLine", { type: booth.type, ring: booth.ring === "center" ? t("companyStatus.booth.centerIsland") : t("companyStatus.booth.outerRing") })}</p>
                            </div>
                            {attendance ? (
                                <span className="flex items-center gap-1.5 ms-auto">
                                    <MiniBadge label={tBadge(attendance.status)} tone={statusTone(attendance.status)} />
                                    {attendance.time !== "—" && <span className="text-[11px] text-gray-400">{t("companyStatus.booth.since", { time: attendance.time })}</span>}
                                </span>
                            ) : <span className="ms-auto"><MiniBadge label={t("companyStatus.booth.attendancePending")} tone="gray" /></span>}
                        </div>

                        {/* Map (wide) + QR (compact) side by side, equal height */}
                        <div className="flex items-stretch gap-3">
                            <div className="flex-1 min-w-0">
                                <VenueMapPreview label={`${booth.number} · ${t("companyStatus.booth.zone", { zone: booth.zone })}`} mapUrl={booth.mapUrl} />
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2.5 shrink-0 w-[112px]">
                                <div className="bg-white border border-gray-200 rounded-lg p-1.5">
                                    <QRCodeSVG value={`jobfair:attendance:${booth.number}`} size={72} fgColor="#111827" />
                                </div>
                                <p className="text-[9px] text-gray-400 dark:text-gray-400 text-center leading-tight">{t("companyStatus.booth.scanHint")}</p>
                            </div>
                        </div>

                        {/* Check-in action — full width below */}
                        {!readOnly && (
                            checkedIn ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg px-3 py-2 self-start">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    {t("companyStatus.booth.checkedIn")}
                                </div>
                            ) : (
                                <button
                                    onClick={handleSelfCheckIn}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-contrast rounded-lg px-3.5 py-2 self-start bg-primary hover:bg-primary-hover transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                    {t("companyStatus.booth.arrivedCheckIn")}
                                </button>
                            )
                        )}
                        <ContactCard moduleId="venue" team={team} />
                    </div>
                ) : (
                    <>
                        <AwaitingCasto text={t("companyStatus.empty.booth")} />
                        <ContactCard moduleId="venue" team={team} />
                    </>
                )}
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SectionCard title={t("companyStatus.sections.banners")}>
                    {banners.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {banners.map((b) => {
                                const si = BANNER_STEPS.indexOf(b.status);
                                return (
                                    <div key={b.id} className="flex flex-col gap-1.5 pb-3 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                                        <div className="flex items-start gap-3">
                                            {b.artwork ? (
                                                <a href={b.artwork} target="_blank" rel="noreferrer" className="shrink-0">
                                                    <img src={b.artwork} alt={t("companyStatus.banners.artworkAlt")} className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                                </a>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-[9px] text-gray-400 dark:text-gray-400 text-center shrink-0">
                                                    {t("companyStatus.banners.noArtwork")}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{b.material} · {b.size} · ×{b.quantity}</p>
                                                    <MiniBadge label={tBadge(b.status)} tone={statusTone(b.status)} />
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    {BANNER_STEPS.map((s, i) => (
                                                        <div key={s} className={`h-1 flex-1 rounded-full ${i <= si ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`} title={tBadge(s)} />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-400">{t("companyStatus.banners.meta", { deadline: b.deadline, updatedBy: b.updatedBy, when: formatWhen(b.updatedAt) })}</p>
                                                {b.notes && <p className="text-[10px] text-gray-400 dark:text-gray-400 italic">{b.notes}</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <ContactCard moduleId="banners" team={team} />
                        </div>
                    ) : (
                        <>
                            <AwaitingCasto text={t("companyStatus.empty.banners")} />
                            <ContactCard moduleId="banners" team={team} />
                        </>
                    )}
                </SectionCard>

                <SectionCard title={t("companyStatus.sections.requirements")}>
                    {requirements.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {requirements.map((r) => (
                                <div key={r.id} className="flex flex-col gap-0.5 pb-2 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="text-gray-700 dark:text-gray-300">{r.description}</span>
                                        <MiniBadge label={tBadge(r.status)} tone={statusTone(r.status)} />
                                    </div>
                                    {r.category && <span className="text-[10px] text-gray-400 dark:text-gray-400">{r.category}</span>}
                                    {r.notes && <p className="text-[10px] text-gray-400 dark:text-gray-400 italic">{r.notes}</p>}
                                </div>
                            ))}
                            <ContactCard moduleId="requirements" team={team} />
                        </div>
                    ) : (
                        <>
                            <AwaitingCasto text={t("companyStatus.empty.requirements")} />
                            <ContactCard moduleId="requirements" team={team} />
                        </>
                    )}
                </SectionCard>

                <SectionCard title={t("companyStatus.sections.equipment")}>
                    {equipment.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {equipment.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{r.item}</span>
                                    <span className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono text-gray-500 dark:text-gray-400 bidi-ltr">{r.qtyFul}/{r.qtyReq}</span>
                                        <MiniBadge label={tBadge(r.status)} tone={statusTone(r.status)} />
                                    </span>
                                </div>
                            ))}
                            <ContactCard moduleId="equipment" team={team} />
                        </div>
                    ) : (
                        <>
                            <AwaitingCasto text={t("companyStatus.empty.equipment")} />
                            <ContactCard moduleId="equipment" team={team} />
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Entry Passes">
                    {entryPasses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entryPasses.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                                    <div className="bg-white rounded p-1 shrink-0">
                                        <QRCodeSVG value={`jobfair:pass:${p.code}`} size={44} fgColor="#111827" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-700 truncate">{p.delegate}</p>
                                        <p className="text-[10px] font-mono text-gray-400">{p.code}</p>
                                    </div>
                                    <MiniBadge label={p.status} tone={statusTone(p.status)} />
                                </div>
                            ))}
                            <div className="sm:col-span-2"><ContactCard moduleId="passes" team={team} /></div>
                        </div>
                    ) : (
                        <>
                            <AwaitingCasto text="No entry passes issued yet. Once the CASTO access officer issues them, each delegate's entry QR code will appear here." />
                            <ContactCard moduleId="passes" team={team} />
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Parking">
                    {parkingPasses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parkingPasses.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                    <div className="bg-white rounded p-1 shrink-0">
                                        <QRCodeSVG value={`jobfair:pass:${p.code}`} size={44} fgColor="#111827" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-700 truncate">{p.delegate}</p>
                                        <p className="text-sm font-bold text-amber-700 mt-0.5">Slot {p.slot || "—"}</p>
                                        {p.location && <p className="text-[10px] text-amber-600">{p.location}</p>}
                                        <ParkingMapPreview mapUrl={p.mapUrl} />
                                    </div>
                                    <MiniBadge label={p.status} tone={statusTone(p.status)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <AwaitingCasto text="No parking assigned yet. When the CASTO office allocates a parking slot, your slot number, exact location, and a map link will show here." />
                            <ContactCard moduleId="passes" team={team} />
                        </>
                    )}
                </SectionCard>
            </div>

            {/* Event schedule — mirrored live from what CASTO builds in Event Settings */}
            {schedule.length > 0 && (
                <SectionCard title="Event Schedule">
                    <div className="flex flex-col gap-2">
                        {schedule.map((s) => (
                            <div key={s.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                                s.status === "Live" ? "border-green-200 bg-green-50"
                                : s.status === "Ended" ? "border-gray-100 bg-gray-50"
                                : "border-blue-100 bg-blue-50/50"}`}>
                                <div className="flex flex-col items-center w-14 shrink-0">
                                    <span className="text-xs font-bold text-gray-700">{s.start}</span>
                                    <span className="text-[10px] text-gray-400">{s.end}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-800 truncate">{s.title}</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {[s.host && `Host: ${s.host}`, s.location].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <MiniBadge label={s.status} tone={statusTone(s.status)} />
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            <SectionCard title="Need help?">
                <p className="text-xs text-gray-500 mb-2">Each area below is owned by a CASTO officer — reach out directly if something needs attention.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.keys(MODULE_LABELS).map((id) => {
                        const owner = team?.find((m) => m.focus?.includes(id));
                        if (!owner) return null;
                        return (
                            <div key={id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-primary-contrast text-[10px] font-bold flex items-center justify-center shrink-0">{owner.name[0]}</span>
                                <div className="min-w-0 text-[10px] leading-tight">
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">{t('eventOps.tabs.' + id)}</p>
                                    <p className="text-gray-500 dark:text-gray-400 truncate bidi-ltr">{owner.name}{owner.email ? ` · ${owner.email}` : ""}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>
        </div>
    );
};

// Requests tab — the company's self-service request form plus a recap of what
// they've already asked for and its approval status. Its own tab (beside
// Overview / Event Day) so requesting equipment/logistics/parking is a
// first-class action, not buried at the bottom of Event Day.
const RequestsSection = ({ companyName, readOnly = false }) => {
    const { companyView, refetchEventOps } = useEventOps();

    // Always show CASTO the freshest view of what's been requested/approved.
    useEffect(() => { refetchEventOps(); }, [refetchEventOps]);

    const view = companyView(companyName);
    if (!view) return null;
    const { requirements, equipment } = view;

    const existingRequests = [
        ...requirements.map((r) => ({ id: `req-${r.id}`, label: `${r.category ? `[${r.category}] ` : ""}${r.description}`, status: r.status, tone: toneClass(statusTone(r.status)) })),
        ...equipment.filter((e) => e.requestedBy).map((e) => ({ id: `eq-${e.id}`, label: `${e.qtyReq} × ${e.item}`, status: e.status === "Fulfilled" ? "Approved" : "Awaiting approval", tone: toneClass(e.status === "Fulfilled" ? "green" : "yellow") })),
    ];

    if (readOnly) {
        // CASTO preview of a company: show what they've requested, no form.
        return (
            <div className="flex flex-col gap-3">
                <SectionCard title="Requests submitted by this company">
                    {existingRequests.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {existingRequests.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                                    <span className="text-gray-700 truncate">{r.label}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${r.tone}`}>{r.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-xs text-gray-400">No requests submitted yet.</p>}
                </SectionCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <CompanyRequestForm existingRequests={existingRequests} />
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

// viewCompanyId + readOnly let this page render another company's status
// read-only (used by Event Settings > View As) without touching the real
// logged-in session — defaults to the current user's own company/status
// page when omitted, which is the normal, unchanged behavior.
const STATUS_TABS = ["Overview", "Event Day", "Requests"];

const CompanyStatus = ({ viewCompanyId, readOnly = false }) => {
    const { user } = useAuthContext();
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState(null);
    const [applicantsCount, setApplicantsCount] = useState(0);
    const [activeTab, setActiveTab] = useState(0);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = viewCompanyId || storedUser?.user_id;

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/companies/${userId}`);
                if (res?.data) setCompanyData(res.data);
                return res?.data;
            } catch (err) {
                setError("Failed to load company information");
            } finally {
                setLoading(false);
            }
        };

        // In view-as mode this must resolve to the previewed company's own
        // name, not the CASTO admin's — companyData isn't set yet when this
        // effect starts, so fetch it fresh instead of trusting storedUser
        const fetchApplicantsCount = async (companyName) => {
            try {
                if (!companyName) return;
                const res = await axios.get(
                    `${API_URL}/applicants?company=${encodeURIComponent(companyName)}&limit=1`,
                    { headers: storedUser?.token ? { Authorization: `Bearer ${storedUser.token}` } : {} }
                );
                if (res?.data?.pagination) setApplicantsCount(res.data.pagination.totalItems);
            } catch { /* silently ignore */ }
        };

        if (userId) {
            fetchCompanyData().then((data) => fetchApplicantsCount(readOnly ? data?.companyName : storedUser?.companyName));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const reps = companyData?.representatives?.split(',').filter(Boolean) || [];
    const fields = (Array.isArray(companyData?.fields) ? companyData.fields : companyData?.fields?.split(',') || []).map(f => (typeof f === 'string' ? f.trim() : f)).filter(Boolean);

    return (
        <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto min-h-0 p-3 md:p-4 animate-fadeIn">
            {readOnly && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Preview mode — this is exactly what {companyData?.companyName || "this company"} sees. Nothing here can be changed.
                </div>
            )}
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
                        {status === 'Pending' && !readOnly && (
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

            <SubTabBar tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />

            {/* Keyed so switching tabs fades the panel in — matches the pill
                slide, and the Settings/Operations tab-content transition. */}
            <div key={activeTab} className="flex flex-col gap-3 md:gap-4 animate-panelIn">
            {activeTab === 0 && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Total Applicants" value={applicantsCount} iconBg="bg-green-100" iconColor="text-green-600"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                        <StatCard label="Open Positions" value={companyData?.noOfPositions || 0} iconBg="bg-purple-100" iconColor="text-purple-600"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                        <StatCard label="Representatives" value={reps.length} iconBg="bg-blue-100" iconColor="text-blue-600"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
                    </div>

                    {!readOnly && (
                        <div className="flex items-center justify-between bg-white rounded-lg p-3 md:p-4 border border-gray-100 shadow-sm">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Manage your company settings</p>
                                <p className="text-xs text-gray-500 mt-0.5">Edit your profile, attendance status, login access, and customization.</p>
                            </div>
                            <a href="/company-settings" className="text-xs font-semibold text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity shrink-0" style={{ background: "#0E7F41" }}>
                                Manage Settings →
                            </a>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SectionCard title="Contact Information">
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <a href={`mailto:${companyData?.email}`} className="text-blue-600 hover:underline truncate">{companyData?.email}</a>
                            </div>
                        </SectionCard>
                        <SectionCard title="Representatives">
                            {reps.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                    {reps.map((rep, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0">{rep.trim().charAt(0).toUpperCase()}</span>
                                            <span className="truncate">{rep.trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-gray-400">None listed</p>}
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
                </>
            )}

            {activeTab === 1 && (
                <EventDaySection companyName={companyData?.companyName} readOnly={readOnly} />
            )}

            {activeTab === 2 && (
                <RequestsSection companyName={companyData?.companyName} readOnly={readOnly} />
            )}
            </div>

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
