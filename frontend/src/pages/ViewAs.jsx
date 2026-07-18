import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventOps, formatWhen } from "../context/EventOpsContext";
import CompactSelect from "../components/CompactSelect";
import CompanyStatus from "./CompanyStatus";
import { Badge, SubTabBar } from "../components/EventSettingsShared";

// Full-page "View As" (demo/preview) — moved out of the EventAdmin modal into
// its own route so CASTO can preview a company's, a staffer's, or the student
// check-in experience with room to breathe. Read-only throughout: it never
// touches the real logged-in session.

const ViewAs = () => {
    const { t } = useTranslation();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const { companies, companyIds, data } = useEventOps();
    const [mode, setMode] = useState("manager");
    const [selectedCompany, setSelectedCompany] = useState(companies[0] || "");
    const [selectedStaff, setSelectedStaff] = useState(data.attendanceStaff?.[0]?.id ?? null);

    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    const staffer = (data.attendanceStaff || []).find((s) => s.id === selectedStaff);
    const stafferLog = staffer ? (data.checkinLog || []).filter((c) => c.byId === staffer.id) : [];
    const selectedCompanyId = companyIds[selectedCompany];

    if (!isCASTO) {
        return (
            <PageContainer user={user} title={t("eventAdmin.viewAs.title")}>
                <p className="text-sm text-gray-500 dark:text-gray-400 p-6">{t("viewAsPage.castoOnly")}</p>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            user={user}
            title={t("viewAsPage.pageTitle")}
            collapsibleTopBar
            headerRight={
                <button onClick={() => navigate("/event-admin")} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                    {t("viewAsPage.backToEventAdmin")}
                </button>
            }
        >
            <div className={`flex flex-col gap-4 flex-1 min-h-0 ${mode === "manager" ? "overflow-hidden" : "overflow-y-auto"}`}>
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {t("viewAsPage.previewOnlyHint")}
                </div>

                <SubTabBar
                    tabs={[t("eventAdmin.viewAs.tabManager"), t("eventAdmin.viewAs.tabStaff"), t("eventAdmin.viewAs.tabStudent")]}
                    active={mode === "manager" ? 0 : mode === "staff" ? 1 : 2}
                    onChange={(i) => setMode(i === 0 ? "manager" : i === 1 ? "staff" : "student")}
                />

                {mode === "manager" && (
                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                        <CompactSelect value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} options={companies} placeholder={t("eventAdmin.viewAs.chooseCompany")} className="sm:max-w-sm" />
                        {!selectedCompany ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">{t("eventAdmin.viewAs.selectCompanyHint")}</p>
                        ) : !selectedCompanyId ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
                                {t("eventAdmin.viewAs.noBackendRecord", { company: selectedCompany })}
                            </p>
                        ) : (
                            // One bounded scroll area for the embedded preview. The
                            // outer page no longer scrolls in manager mode (see the
                            // wrapper class below), so there's a single scrollbar
                            // instead of two nested ones fighting each other.
                            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-surface flex flex-col flex-1 min-h-0">
                                <CompanyStatus viewCompanyId={selectedCompanyId} readOnly />
                            </div>
                        )}
                    </div>
                )}

                {mode === "staff" && (
                    <div className="flex flex-col gap-3">
                        <CompactSelect
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(Number(e.target.value))}
                            options={(data.attendanceStaff || []).map((s) => ({ value: s.id, label: s.name }))}
                            placeholder={t("eventAdmin.viewAs.chooseStaffAccount")}
                            className="sm:max-w-sm"
                        />
                        {!staffer ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">{t("eventAdmin.viewAs.noStaffAccountsYet")}</p>
                        ) : (
                            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 bg-surface max-w-2xl">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("eventAdmin.viewAs.whatTheySee", { name: staffer.name })}</p>
                                <div className="bg-surface-card rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{staffer.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 bidi-ltr">{staffer.email}</p>
                                    </div>
                                    <Badge label={staffer.status === "active" ? t("eventOps.checkinStaff.active") : t("eventOps.checkinStaff.invited")} color={staffer.status === "active" ? "green" : "yellow"} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t("eventOps.checkinStaff.checkedInCount", { count: stafferLog.length })}</p>
                                {stafferLog.slice(0, 8).map((c) => (
                                    <div key={c.id} className="bg-surface-card rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                                        <span className="text-gray-700 dark:text-gray-300">{c.name || c.uniId}</span>
                                        <span className="text-gray-400 dark:text-gray-500">{formatWhen(c.at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {mode === "student" && (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
                            {t("eventAdmin.viewAs.studentPublicHint")}
                        </p>
                        <a href="/student-checkin" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-contrast rounded-lg px-5 py-2.5 bg-primary">
                            {t("eventAdmin.viewAs.openStudentCheckin")}
                        </a>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default ViewAs;
