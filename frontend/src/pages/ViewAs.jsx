import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
            <PageContainer user={user} title="View As">
                <p className="text-sm text-gray-500 p-6">This preview is only available to the CASTO office.</p>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            user={user}
            title="View As — Preview Mode"
            collapsibleTopBar
            headerRight={
                <button onClick={() => navigate("/event-admin")} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
                    ← Back to Event Admin
                </button>
            }
        >
            <div className={`flex flex-col gap-4 flex-1 min-h-0 ${mode === "manager" ? "overflow-hidden" : "overflow-y-auto"}`}>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Preview only — nothing here changes real data or your session.
                </div>

                <SubTabBar
                    tabs={["Manager (Company)", "Attendance Staff", "Student Check-in"]}
                    active={mode === "manager" ? 0 : mode === "staff" ? 1 : 2}
                    onChange={(i) => setMode(i === 0 ? "manager" : i === 1 ? "staff" : "student")}
                />

                {mode === "manager" && (
                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                        <CompactSelect value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} options={companies} placeholder="Choose a company…" className="sm:max-w-sm" />
                        {!selectedCompany ? (
                            <p className="text-xs text-gray-400 text-center py-8">Select a company to preview their full status page.</p>
                        ) : !selectedCompanyId ? (
                            <p className="text-xs text-gray-400 text-center py-8">
                                {selectedCompany} hasn't registered a real account yet — only seed/demo companies without a backend record can't be previewed this way.
                            </p>
                        ) : (
                            // One bounded scroll area for the embedded preview. The
                            // outer page no longer scrolls in manager mode (see the
                            // wrapper class below), so there's a single scrollbar
                            // instead of two nested ones fighting each other.
                            <div className="border border-gray-100 rounded-xl overflow-hidden bg-[#F3F6FF] flex flex-col flex-1 min-h-0">
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
                            placeholder="Choose a staff account…"
                            className="sm:max-w-sm"
                        />
                        {!staffer ? (
                            <p className="text-xs text-gray-400 text-center py-8">No staff accounts yet — create one in the Manage Staff tab.</p>
                        ) : (
                            <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-[#F3F6FF] max-w-2xl">
                                <p className="text-xs font-semibold text-gray-500">This is what {staffer.name} sees at /student-checkin:</p>
                                <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{staffer.name}</p>
                                        <p className="text-xs text-gray-500">{staffer.email}</p>
                                    </div>
                                    <Badge label={staffer.status === "active" ? "Active" : "Invited"} color={staffer.status === "active" ? "green" : "yellow"} />
                                </div>
                                <p className="text-xs text-gray-500">Checked in {stafferLog.length} student{stafferLog.length === 1 ? "" : "s"} today</p>
                                {stafferLog.slice(0, 8).map((c) => (
                                    <div key={c.id} className="bg-white rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                                        <span className="text-gray-700">{c.name || c.uniId}</span>
                                        <span className="text-gray-400">{formatWhen(c.at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {mode === "student" && (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <p className="text-sm text-gray-600 max-w-sm">
                            The student check-in page is fully public — it needs a real access code to log in, so the truest preview is opening it directly.
                        </p>
                        <a href="/student-checkin" target="_blank" rel="noreferrer" className="text-sm font-semibold text-white rounded-lg px-5 py-2.5" style={{ background: "#0E7F41" }}>
                            Open /student-checkin in a new tab
                        </a>
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default ViewAs;
