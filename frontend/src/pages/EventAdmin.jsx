import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventOps, formatWhen, MODULE_LABELS } from "../context/EventOpsContext";
import { useToast } from "../components/Toast";
import { useNotifications } from "../context/NotificationsContext";
import CompactSelect from "../components/CompactSelect";
import Modal from "../components/Modal";
import CompanyStatus from "./CompanyStatus";
import { API_URL } from "../config/api";
import ImportCompaniesModal from "../components/ImportCompaniesModal";
import CustomizeSettings from "../components/CustomizeSettings";
import { Badge, StatCard, SubTabBar } from "../components/EventSettingsShared";

// ─── Tab: Post-Event Report ───────────────────────────────────────────────────
// Every number here is computed from real data — applicants/companies fetched
// from the backend, plus the booths/banners/passes already tracked in
// EventOpsContext. Nothing is a static placeholder.

const uniqueApplicants = (applicants) => {
  const seen = new Set();
  return (applicants || []).filter((a) => {
    const id = a.applicantDetails?.uniId;
    if (id && !seen.has(id)) { seen.add(id); return true; }
    return false;
  });
};

const PostEventReporting = ({ applicants, companies }) => {
  const { data } = useEventOps();

  const stats = useMemo(() => {
    const uniqueApps = uniqueApplicants(applicants);
    const checkedInApps = uniqueApps.filter((a) => a.attended).length;
    const checkinRate = uniqueApps.length > 0 ? Math.round((checkedInApps / uniqueApps.length) * 100) : 0;

    const confirmedCompanies = (companies || []).filter((c) => c.status === "Confirmed").length;
    const assignedBooths = data.booths.filter((b) => b.company).length;
    const totalApplications = (applicants || []).length; // every submission, not deduped — mirrors "applications made"

    return {
      totalCompanies: companies?.length || 0,
      confirmedCompanies,
      totalStudents: uniqueApps.length,
      checkinRate,
      totalApplications,
      assignedBooths,
      totalBooths: data.booths.length,
      passesIssued: data.passes.length,
      bannersPlaced: data.banners.filter((b) => b.status === "Placed").length,
      totalBanners: data.banners.length,
    };
  }, [applicants, companies, data]);

  // Ops completion by module — derived from the same live event-ops data
  // shown throughout the rest of this page, not a separate mock feedback score
  const completionBreakdown = useMemo(() => {
    const pct = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);
    const boothPct = pct(stats.assignedBooths, stats.totalBooths);
    const bannerPct = pct(stats.bannersPlaced, stats.totalBanners);
    const reqDone = data.requirements.filter((r) => r.status === "Fulfilled").length;
    const reqPct = pct(reqDone, data.requirements.length);
    const eqDone = data.equipment.filter((e) => e.status === "Fulfilled").length;
    const eqPct = pct(eqDone, data.equipment.length);
    return [
      { label: "Booths Assigned", pct: boothPct, sub: `${stats.assignedBooths} / ${stats.totalBooths}` },
      { label: "Banners Placed", pct: bannerPct, sub: `${stats.bannersPlaced} / ${stats.totalBanners}` },
      { label: "Requirements Fulfilled", pct: reqPct, sub: `${reqDone} / ${data.requirements.length}` },
      { label: "Equipment Fulfilled", pct: eqPct, sub: `${eqDone} / ${data.equipment.length}` },
    ];
  }, [data, stats]);

  const exportCsv = (filename, rows) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCompanies = () => exportCsv("companies.csv", (companies || []).map((c) => ({
    name: c.companyName, email: c.email, status: c.status || "Pending", sector: c.sector, city: c.city,
  })));

  const exportStudents = () => exportCsv("students.csv", uniqueApplicants(applicants).map((a) => ({
    name: a.applicantDetails?.fullName, uniId: a.applicantDetails?.uniId, major: a.applicantDetails?.major, attended: a.attended ? "Yes" : "No",
  })));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Companies" value={stats.totalCompanies} sub={`${stats.confirmedCompanies} confirmed`} />
        <StatCard label="Total Students" value={stats.totalStudents.toLocaleString()} sub="Unique registrations" color="#2959A6" />
        <StatCard label="Check-in Rate" value={`${stats.checkinRate}%`} sub="Of registered students" />
        <StatCard label="Applications Made" value={stats.totalApplications.toLocaleString()} sub="Total submissions" color="#8b5cf6" />
        <StatCard label="Booths Assigned" value={`${stats.assignedBooths}/${stats.totalBooths}`} sub="Companies placed" color="#f59e0b" />
        <StatCard label="Access Passes Issued" value={stats.passesIssued} sub={`${stats.bannersPlaced}/${stats.totalBanners} banners placed`} color="#0891b2" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Operations Completion</p>
        <div className="flex flex-col gap-3">
          {completionBreakdown.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-44 text-xs text-gray-600 text-right flex-shrink-0">{cat.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700" style={{ width: `${Math.max(cat.pct, 4)}%`, background: "#0E7F41" }}>
                  {cat.pct >= 15 && <span className="text-white text-[10px] font-bold">{cat.pct}%</span>}
                </div>
              </div>
              <div className="w-16 text-xs text-gray-400 flex-shrink-0">{cat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Export Reports</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCompanies} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border" style={{ background: "white", color: "#0E7F41", borderColor: "#0E7F41" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Companies CSV
          </button>
          <button onClick={exportStudents} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border" style={{ background: "white", color: "#2959A6", borderColor: "#2959A6" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Students CSV
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Activity panel (audit trail) ─────────────────────────────────────────────

const ActivityPanel = ({ open, onClose }) => {
  const { data } = useEventOps();
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState(open ? "open" : "closed");
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimer.current);
      setMounted(true);
      setPhase("opening");
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("open")));
      return () => cancelAnimationFrame(id);
    } else if (mounted) {
      setPhase("closing");
      closeTimer.current = setTimeout(() => setMounted(false), 240);
    }
    return () => clearTimeout(closeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const backdropState = phase === "open" ? "backdrop-open" : phase === "closing" ? "backdrop-close" : "";
  const drawerState = phase === "open" ? "drawer-open" : phase === "closing" ? "drawer-close" : "";

  return (
    <>
      <div className={`expandDetails-backdrop fixed inset-0 bg-black/30 z-[300] ${backdropState}`} onClick={onClose} />
      <div className={`drawerPanel fixed right-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white z-[301] shadow-2xl flex flex-col ${drawerState}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-800">Recent Activity</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {(data.audit || []).length === 0 && <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>}
          {(data.audit || []).map((a) => (
            <div key={a.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#0E7F41] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {a.by?.[0] || "?"}
                </span>
                <span className="text-xs font-semibold text-gray-700">{a.by}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{formatWhen(a.at)}</span>
              </div>
              <p className="text-xs text-gray-600">{a.message}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{a.section}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── View As panel ─────────────────────────────────────────────────────────────
// Lets Rana preview what each role's world looks like — without swapping her
// real CASTO session (which could break her own login if anything went
// wrong). Company/staff previews are read-only panels built from data
// already loaded here; the student check-in view is genuinely public, so it
// just opens in a new tab.

const ViewAsPanel = ({ open, onClose }) => {
  const { companies, companyIds, data } = useEventOps();
  const [mode, setMode] = useState("manager");
  const [selectedCompany, setSelectedCompany] = useState(companies[0] || "");
  const [selectedStaff, setSelectedStaff] = useState(data.attendanceStaff?.[0]?.id ?? null);

  const staffer = (data.attendanceStaff || []).find((s) => s.id === selectedStaff);
  const stafferLog = staffer ? (data.checkinLog || []).filter((c) => c.byId === staffer.id) : [];
  const selectedCompanyId = companyIds[selectedCompany];

  return (
    <Modal visible={open} onClose={onClose} maxWidth={mode === "manager" ? "max-w-4xl" : "max-w-2xl"} contentClassName="max-h-[85vh]">
      <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">View As</h2>
          <p className="text-xs text-white/80 mt-0.5">Preview what other roles see — read-only, doesn't touch your session</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 overflow-y-auto">
        <SubTabBar tabs={["Manager (Company)", "Attendance Staff", "Student Check-in"]} active={mode === "manager" ? 0 : mode === "staff" ? 1 : 2}
          onChange={(i) => setMode(i === 0 ? "manager" : i === 1 ? "staff" : "student")} />

        {mode === "manager" && (
          <div className="flex flex-col gap-3">
            <CompactSelect value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} options={companies} placeholder="Choose a company…" />
            {!selectedCompany ? (
              <p className="text-xs text-gray-400 text-center py-8">Select a company to preview their full status page.</p>
            ) : !selectedCompanyId ? (
              <p className="text-xs text-gray-400 text-center py-8">
                {selectedCompany} hasn't registered a real account yet — only seed/demo companies without a backend record can't be previewed this way.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden bg-[#F3F6FF] flex flex-col" style={{ height: "55vh" }}>
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
            />
            {!staffer ? (
              <p className="text-xs text-gray-400 text-center py-8">No staff accounts yet — create one in the Manage Staff tab.</p>
            ) : (
              <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-[#F3F6FF]">
                <p className="text-xs font-semibold text-gray-500">This is what {staffer.name} sees at /student-checkin:</p>
                <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{staffer.name}</p>
                    <p className="text-xs text-gray-500">{staffer.email}</p>
                  </div>
                  <Badge label={staffer.status === "active" ? "Active" : "Invited"} color={staffer.status === "active" ? "green" : "yellow"} />
                </div>
                <p className="text-xs text-gray-500">Checked in {stafferLog.length} student{stafferLog.length === 1 ? "" : "s"} today</p>
                {stafferLog.slice(0, 5).map((c) => (
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
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-gray-600 max-w-sm">
              The student check-in page is fully public — it needs a real access code to log in, so the truest preview is opening it directly.
            </p>
            <a href="/student-checkin" target="_blank" rel="noreferrer" className="text-sm font-semibold text-white rounded-lg px-5 py-2.5" style={{ background: "#0E7F41" }}>
              Open /student-checkin in a new tab
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Team & Roles panel ────────────────────────────────────────────────────────
// Shows every team member's responsibilities. Rana (Event Lead) additionally
// gets the ability to reassign who owns which module, gated behind a 2-step
// check: her real CASTO login password, then a one-time code shown on screen
// (there's no per-employee inbox to actually deliver it to).

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

const TeamPanel = ({ open, onClose }) => {
  const { team, employee, updateTeamFocus, inviteTeamMember, removeTeamMember } = useEventOps();
  const toast = useToast();
  const { notify } = useNotifications();
  const canReassign = employee.id === "rana";

  const [reassigning, setReassigning] = useState(null); // member id being edited
  const [draftFocus, setDraftFocus] = useState([]);
  const [verifyStep, setVerifyStep] = useState(null); // null | 'password' | 'code'
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "", focus: [] });
  const [inviting, setInviting] = useState(false);

  const toggleInviteFocus = (id) => {
    setInviteForm((f) => ({ ...f, focus: f.focus.includes(id) ? f.focus.filter((m) => m !== id) : [...f.focus, id] }));
  };

  const submitInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      toast("Name and email are both required", { type: "error" });
      return;
    }
    setInviting(true);
    try {
      await inviteTeamMember(inviteForm.name.trim(), inviteForm.email.trim(), inviteForm.role.trim(), inviteForm.focus, "");
      const mods = inviteForm.focus.map((id) => MODULE_LABELS[id] || id);
      notify(`${inviteForm.name.trim()} joined the CASTO team`, {
        type: "reassign",
        detail: `${inviteForm.role.trim() || "Officer"}${mods.length ? ` · owns ${mods.join(", ")}` : ""} — added by ${employee.name}`,
      });
      toast(`${inviteForm.name.trim()} added to the team — notification email sent`, { type: "success" });
      setInviteForm({ name: "", email: "", role: "", focus: [] });
      setShowInvite(false);
    } catch (err) {
      toast(err.response?.data?.error || "Failed to add team member", { type: "error" });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      const mods = (member.focus || []).map((id) => MODULE_LABELS[id] || id);
      await removeTeamMember(member.id);
      notify(`${member.name} was removed from the CASTO team`, {
        type: "reassign",
        detail: `${mods.length ? `${mods.join(", ")} now need${mods.length === 1 ? "s" : ""} a new owner — ` : ""}removed by ${employee.name}`,
      });
      toast(`${member.name} removed from the team`, { type: "info" });
    } catch (err) {
      toast(err.response?.data?.error || "Failed to remove team member", { type: "error" });
    }
  };

  const resetVerification = () => {
    setVerifyStep(null); setPassword(""); setPasswordError("");
    setSentCode(""); setCodeInput(""); setCodeError("");
  };

  const startReassign = (member) => {
    setReassigning(member.id);
    setDraftFocus(member.focus);
    resetVerification();
  };

  const cancelReassign = () => {
    setReassigning(null);
    resetVerification();
  };

  const toggleModule = (id) => {
    setDraftFocus((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const requestVerification = () => setVerifyStep("password");

  const checkPassword = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!password.trim() || !storedUser?.email) return;
    setCheckingPassword(true);
    setPasswordError("");
    try {
      const res = await axios.post(`${API_URL}/user/login`, {
        email: storedUser.email, password, companyName: storedUser.companyName,
      });
      if (res.status === 200) {
        const code = genCode();
        setSentCode(code);
        setVerifyStep("code");
        toast(`Verification code: ${code} (no real inbox tied to this account — shown here instead)`, { type: "info", duration: 8000 });
      }
    } catch {
      setPasswordError("Incorrect password");
    } finally {
      setCheckingPassword(false);
    }
  };

  const confirmCode = () => {
    if (codeInput.trim() !== sentCode) {
      setCodeError("That code doesn't match");
      return;
    }
    // Work out exactly what changed so the notification carries the detail —
    // which modules this officer gained and which they lost.
    const member = team.find((m) => m.id === reassigning);
    const before = member?.focus || [];
    const added = draftFocus.filter((id) => !before.includes(id)).map((id) => MODULE_LABELS[id] || id);
    const removed = before.filter((id) => !draftFocus.includes(id)).map((id) => MODULE_LABELS[id] || id);

    updateTeamFocus(reassigning, draftFocus);

    if (member && (added.length || removed.length)) {
      const parts = [];
      if (added.length) parts.push(`gained ${added.join(", ")}`);
      if (removed.length) parts.push(`no longer owns ${removed.join(", ")}`);
      notify(`${member.name}'s responsibilities were reassigned`, {
        type: "reassign",
        detail: `${member.name} ${parts.join("; ")} — by ${employee.name}`,
      });
    }

    toast("Role responsibilities updated", { type: "success" });
    setReassigning(null);
    resetVerification();
  };

  const allModules = Object.keys(MODULE_LABELS);

  return (
    <Modal visible={open} onClose={onClose} maxWidth="max-w-xl" contentClassName="max-h-[85vh]">
      <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">Team & Roles</h2>
          <p className="text-xs text-white/80 mt-0.5">Who owns what across Event Operations</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex flex-col gap-3">
        {team.map((m) => {
          const isEditing = reassigning === m.id;
          return (
            <div key={m.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#0E7F41] text-white text-xs font-bold flex items-center justify-center shrink-0">{m.name[0]}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                </div>
                {canReassign && !isEditing && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => startReassign(m)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:border-green-300 hover:text-green-700 transition-colors">
                      Reassign
                    </button>
                    {m.id !== "rana" && (
                      <button onClick={() => handleRemoveMember(m)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mt-2.5">{m.responsibilities}</p>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {m.focus.map((id) => (
                  <span key={id} className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{MODULE_LABELS[id] || id}</span>
                ))}
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                  {!verifyStep && (
                    <>
                      <p className="text-xs font-semibold text-gray-600">Select the modules {m.name} should own:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allModules.map((id) => {
                          const checked = draftFocus.includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleModule(id)}
                              className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${checked ? "bg-[#0E7F41] text-white border-[#0E7F41]" : "bg-white text-gray-500 border-gray-200 hover:border-green-300"}`}>
                              {MODULE_LABELS[id]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={requestVerification} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#0E7F41" }}>
                          Save changes
                        </button>
                      </div>
                    </>
                  )}

                  {verifyStep === "password" && (
                    <div className="bg-[#F3F6FF] rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700">Step 1 of 2 — confirm your admin password</p>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                        placeholder="CASTO account password"
                        autoFocus
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={checkPassword} disabled={checkingPassword || !password.trim()} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                          {checkingPassword ? "Checking…" : "Continue"}
                        </button>
                      </div>
                    </div>
                  )}

                  {verifyStep === "code" && (
                    <div className="bg-[#F3F6FF] rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700">Step 2 of 2 — enter the verification code</p>
                      <p className="text-[11px] text-gray-500">A code was generated for this change — check the notification at the top of the screen.</p>
                      <input
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && confirmCode()}
                        placeholder="6-digit code"
                        maxLength={6}
                        autoFocus
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      {codeError && <p className="text-xs text-red-500">{codeError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={confirmCode} disabled={codeInput.trim().length !== 6} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                          Confirm & Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!canReassign && (
          <p className="text-[11px] text-gray-400 text-center pt-1">Only the Event Lead can reassign team responsibilities.</p>
        )}

        {canReassign && (
          showInvite ? (
            <div className="border border-blue-100 bg-[#F3F6FF] rounded-xl p-4 flex flex-col gap-2.5">
              <p className="text-sm font-semibold text-gray-700">Add an officer</p>
              <input
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email — they'll get a notification here"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <input
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Role / title (optional)"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Modules they'll own</p>
                <div className="flex flex-wrap gap-1.5">
                  {allModules.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => toggleInviteFocus(mod)}
                      className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                        inviteForm.focus.includes(mod) ? "bg-[#0E7F41] text-white border-[#0E7F41]" : "border-gray-200 text-gray-600 hover:border-green-300"
                      }`}
                    >
                      {MODULE_LABELS[mod]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowInvite(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                <button onClick={submitInvite} disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()} className="text-xs font-semibold text-white rounded-lg px-4 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                  {inviting ? "Adding…" : "Add & notify"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowInvite(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors self-start">
              + Add officer
            </button>
          )
        )}
      </div>
    </Modal>
  );
};


// ─── Main component: Event Admin ───────────────────────────────────────────────
// Oversight tools used less often, mostly by the Event Lead — split out of
// the original single EventSettings.jsx into this page plus
// EventOperations.jsx (the 9 day-to-day modules).

const ADMIN_TABS = [
  { id: "report", label: "Post-Event Report" },
  { id: "customize", label: "Customize" },
];

const ADMIN_TAB_KEY = "event_admin_active_tab";

const EventAdmin = ({ link }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(ADMIN_TAB_KEY) || ADMIN_TABS[0].id);
  const [showActivity, setShowActivity] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showImportCompanies, setShowImportCompanies] = useState(false);
  const [reportData, setReportData] = useState({ applicants: [], companies: [] });

  // Remember the open tab across reloads, so refreshing the page reopens
  // wherever the user left off instead of always resetting to the first tab.
  useEffect(() => {
    try { localStorage.setItem(ADMIN_TAB_KEY, activeTab); } catch { /* quota */ }
  }, [activeTab]);

  // Fetch real applicants/companies once, on demand — only the Post-Event
  // Report tab needs them, but fetching here keeps the tab switch instant
  const fetchReportData = useCallback(async () => {
    try {
      const [applicantsRes, companiesRes] = await Promise.all([
        axios.get(`${link}/applicants?limit=10000`),
        axios.get(`${link}/companies`),
      ]);
      setReportData({
        applicants: applicantsRes?.data?.applicants || applicantsRes?.data || [],
        companies: companiesRes?.data || [],
      });
    } catch { /* report tab will show zeros until this succeeds */ }
  }, [link]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  return (
    <PageContainer
      user={user}
      title="Event Admin"
      collapsibleTopBar
      headerRight={
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportCompanies(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Import Companies
          </button>
          <button onClick={() => navigate("/view-as")} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            View As
          </button>
          <button onClick={() => setShowTeamPanel(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Team & Roles
          </button>
          <button onClick={() => setShowActivity(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Activity Log
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 w-fit">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={activeTab === tab.id ? { background: "#0E7F41" } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <a href="/event-settings" className="text-xs font-semibold text-gray-500 hover:text-green-700 transition-colors">
            ← Operations
          </a>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl">
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
            {activeTab === "report" ? <PostEventReporting {...reportData} /> : <CustomizeSettings />}
          </div>
        </div>
      </div>

      <ActivityPanel open={showActivity} onClose={() => setShowActivity(false)} />
      <TeamPanel open={showTeamPanel} onClose={() => setShowTeamPanel(false)} />
      {/* View As now lives on its own /view-as route (see the header button) */}
      <ImportCompaniesModal
        visible={showImportCompanies}
        onClose={() => setShowImportCompanies(false)}
        link={link}
        user={user}
        onImported={fetchReportData}
      />
    </PageContainer>
  );
};

export default EventAdmin;
