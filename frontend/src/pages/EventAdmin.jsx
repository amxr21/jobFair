import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
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
import { Badge, StatCard, SubTabBar, PillTabs } from "../components/EventSettingsShared";

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
  const { t } = useTranslation();
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
      { label: t("eventAdmin.report.boothsAssigned"), pct: boothPct, sub: `${stats.assignedBooths} / ${stats.totalBooths}` },
      { label: t("eventAdmin.report.bannersPlaced"), pct: bannerPct, sub: `${stats.bannersPlaced} / ${stats.totalBanners}` },
      { label: t("eventAdmin.report.requirementsFulfilled"), pct: reqPct, sub: `${reqDone} / ${data.requirements.length}` },
      { label: t("eventAdmin.report.equipmentFulfilled"), pct: eqPct, sub: `${eqDone} / ${data.equipment.length}` },
    ];
  }, [data, stats, t]);

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
        <StatCard label={t("eventAdmin.report.totalCompanies")} value={stats.totalCompanies} sub={t("eventAdmin.report.confirmedCount", { count: stats.confirmedCompanies })} />
        <StatCard label={t("eventAdmin.report.totalStudents")} value={stats.totalStudents.toLocaleString()} sub={t("eventAdmin.report.uniqueRegistrations")} />
        <StatCard label={t("eventAdmin.report.checkinRate")} value={`${stats.checkinRate}%`} sub={t("eventAdmin.report.ofRegisteredStudents")} />
        <StatCard label={t("eventAdmin.report.applicationsMade")} value={stats.totalApplications.toLocaleString()} sub={t("eventAdmin.report.totalSubmissions")} />
        <StatCard label={t("eventAdmin.report.boothsAssigned")} value={`${stats.assignedBooths}/${stats.totalBooths}`} sub={t("eventAdmin.report.companiesPlaced")} />
        <StatCard label={t("eventAdmin.report.accessPassesIssued")} value={stats.passesIssued} sub={t("eventAdmin.report.bannersPlacedSub", { placed: stats.bannersPlaced, total: stats.totalBanners })} />
      </div>

      <div className="bg-surface-card rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("eventAdmin.report.operationsCompletion")}</p>
        <div className="flex flex-col gap-3">
          {completionBreakdown.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-44 text-xs text-gray-600 dark:text-gray-400 text-end flex-shrink-0">{cat.label}</div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                <div className="h-5 rounded-full flex items-center justify-end pe-2 transition-all duration-700 bg-primary" style={{ width: `${Math.max(cat.pct, 4)}%` }}>
                  {cat.pct >= 15 && <span className="text-primary-contrast text-[10px] font-bold">{cat.pct}%</span>}
                </div>
              </div>
              <div className="w-16 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{cat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-card rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("eventAdmin.report.exportReports")}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCompanies} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border bg-surface-card text-primary border-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("eventAdmin.report.exportCompaniesCsv")}
          </button>
          <button onClick={exportStudents} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border bg-surface-card text-secondary border-[#2959A6] dark:border-[#6BA5F0]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("eventAdmin.report.exportStudentsCsv")}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Activity panel (audit trail) ─────────────────────────────────────────────

const ActivityPanel = ({ open, onClose }) => {
  const { t } = useTranslation();
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
      <div className={`drawerPanel fixed end-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-surface-card z-[301] shadow-2xl flex flex-col ${drawerState}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("eventAdmin.activity.recentActivity")}</p>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {(data.audit || []).length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">{t("eventAdmin.activity.noActivityYet")}</p>}
          {(data.audit || []).map((a) => (
            <div key={a.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-contrast text-[10px] font-bold flex items-center justify-center shrink-0">
                  {a.by?.[0] || "?"}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{a.by}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ms-auto">{formatWhen(a.at)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">{a.message}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.section}</p>
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
  const { t } = useTranslation();
  const { companies, companyIds, data } = useEventOps();
  const [mode, setMode] = useState("manager");
  const [selectedCompany, setSelectedCompany] = useState(companies[0] || "");
  const [selectedStaff, setSelectedStaff] = useState(data.attendanceStaff?.[0]?.id ?? null);

  const staffer = (data.attendanceStaff || []).find((s) => s.id === selectedStaff);
  const stafferLog = staffer ? (data.checkinLog || []).filter((c) => c.byId === staffer.id) : [];
  const selectedCompanyId = companyIds[selectedCompany];

  return (
    <Modal visible={open} onClose={onClose} maxWidth={mode === "manager" ? "max-w-4xl" : "max-w-2xl"} contentClassName="max-h-[85vh]">
      <div className="bg-primary text-primary-contrast px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">{t("eventAdmin.viewAs.title")}</h2>
          <p className="text-xs text-white/80 mt-0.5">{t("eventAdmin.viewAs.subtitle")}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label={t("common.close")}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 overflow-y-auto">
        <SubTabBar tabs={[t("eventAdmin.viewAs.tabManager"), t("eventAdmin.viewAs.tabStaff"), t("eventAdmin.viewAs.tabStudent")]} active={mode === "manager" ? 0 : mode === "staff" ? 1 : 2}
          onChange={(i) => setMode(i === 0 ? "manager" : i === 1 ? "staff" : "student")} />

        {mode === "manager" && (
          <div className="flex flex-col gap-3">
            <CompactSelect value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} options={companies} placeholder={t("eventAdmin.viewAs.chooseCompany")} />
            {!selectedCompany ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">{t("eventAdmin.viewAs.selectCompanyHint")}</p>
            ) : !selectedCompanyId ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
                {t("eventAdmin.viewAs.noBackendRecord", { company: selectedCompany })}
              </p>
            ) : (
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-surface flex flex-col" style={{ height: "55vh" }}>
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
            />
            {!staffer ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">{t("eventAdmin.viewAs.noStaffAccountsYet")}</p>
            ) : (
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 bg-surface">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("eventAdmin.viewAs.whatTheySee", { name: staffer.name })}</p>
                <div className="bg-surface-card rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{staffer.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 bidi-ltr">{staffer.email}</p>
                  </div>
                  <Badge label={staffer.status === "active" ? t("eventOps.checkinStaff.active") : t("eventOps.checkinStaff.invited")} color={staffer.status === "active" ? "green" : "yellow"} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("eventOps.checkinStaff.checkedInCount", { count: stafferLog.length })}</p>
                {stafferLog.slice(0, 5).map((c) => (
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
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
              {t("eventAdmin.viewAs.studentPublicHint")}
            </p>
            <a href="/student-checkin" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary-contrast rounded-lg px-5 py-2.5 bg-primary">
              {t("eventAdmin.viewAs.openStudentCheckin")}
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
  const { t } = useTranslation();
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
      toast(t("eventAdmin.team.toastNameEmailRequired"), { type: "error" });
      return;
    }
    setInviting(true);
    try {
      await inviteTeamMember(inviteForm.name.trim(), inviteForm.email.trim(), inviteForm.role.trim(), inviteForm.focus, "");
      const mods = inviteForm.focus.map((id) => t('eventOps.tabs.' + id) || id);
      notify(t("eventAdmin.team.notifyJoined", { name: inviteForm.name.trim() }), {
        type: "reassign",
        detail: t("eventAdmin.team.notifyJoinedDetail", { role: inviteForm.role.trim() || t("eventAdmin.team.officer"), modules: mods.length ? t("eventAdmin.team.ownsModules", { modules: mods.join(", ") }) : "", who: employee.name }),
      });
      toast(t("eventAdmin.team.toastAdded", { name: inviteForm.name.trim() }), { type: "success" });
      setInviteForm({ name: "", email: "", role: "", focus: [] });
      setShowInvite(false);
    } catch (err) {
      toast(err.response?.data?.error || t("eventAdmin.team.toastAddFailed"), { type: "error" });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      const mods = (member.focus || []).map((id) => t('eventOps.tabs.' + id) || id);
      await removeTeamMember(member.id);
      notify(t("eventAdmin.team.notifyRemoved", { name: member.name }), {
        type: "reassign",
        detail: t("eventAdmin.team.notifyRemovedDetail", { modulesNote: mods.length ? t("eventAdmin.team.modulesNeedOwner", { modules: mods.join(", ") }) : "", who: employee.name }),
      });
      toast(t("eventAdmin.team.toastRemoved", { name: member.name }), { type: "info" });
    } catch (err) {
      toast(err.response?.data?.error || t("eventAdmin.team.toastRemoveFailed"), { type: "error" });
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
        toast(t("eventAdmin.team.toastVerificationCode", { code }), { type: "info", duration: 8000 });
      }
    } catch {
      setPasswordError(t("eventAdmin.team.incorrectPassword"));
    } finally {
      setCheckingPassword(false);
    }
  };

  const confirmCode = () => {
    if (codeInput.trim() !== sentCode) {
      setCodeError(t("eventAdmin.team.codeDoesntMatch"));
      return;
    }
    // Work out exactly what changed so the notification carries the detail —
    // which modules this officer gained and which they lost.
    const member = team.find((m) => m.id === reassigning);
    const before = member?.focus || [];
    const added = draftFocus.filter((id) => !before.includes(id)).map((id) => t('eventOps.tabs.' + id) || id);
    const removed = before.filter((id) => !draftFocus.includes(id)).map((id) => t('eventOps.tabs.' + id) || id);

    updateTeamFocus(reassigning, draftFocus);

    if (member && (added.length || removed.length)) {
      const parts = [];
      if (added.length) parts.push(t("eventAdmin.team.gained", { modules: added.join(", ") }));
      if (removed.length) parts.push(t("eventAdmin.team.noLongerOwns", { modules: removed.join(", ") }));
      notify(t("eventAdmin.team.notifyReassigned", { name: member.name }), {
        type: "reassign",
        detail: t("eventAdmin.team.notifyReassignedDetail", { name: member.name, parts: parts.join("; "), who: employee.name }),
      });
    }

    toast(t("eventAdmin.team.toastRolesUpdated"), { type: "success" });
    setReassigning(null);
    resetVerification();
  };

  const allModules = Object.keys(MODULE_LABELS);

  return (
    <Modal visible={open} onClose={onClose} maxWidth="max-w-xl" contentClassName="max-h-[85vh]">
      <div className="bg-primary text-primary-contrast px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">{t("eventAdmin.team.title")}</h2>
          <p className="text-xs text-white/80 mt-0.5">{t("eventAdmin.team.subtitle")}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label={t("common.close")}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex flex-col gap-3">
        {team.map((m) => {
          const isEditing = reassigning === m.id;
          return (
            <div key={m.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-contrast text-xs font-bold flex items-center justify-center shrink-0">{m.name[0]}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(`eventAdmin.team.roles.${m.id}.role`, { defaultValue: m.role })}</p>
                  </div>
                </div>
                {canReassign && !isEditing && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => startReassign(m)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                      {t("eventAdmin.team.reassign")}
                    </button>
                    {m.id !== "rana" && (
                      <button onClick={() => handleRemoveMember(m)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        {t("common.remove")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">{t(`eventAdmin.team.roles.${m.id}.responsibilities`, { defaultValue: m.responsibilities })}</p>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {m.focus.map((id) => (
                  <span key={id} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">{t('eventOps.tabs.' + id) || id}</span>
                ))}
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                  {!verifyStep && (
                    <>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("eventAdmin.team.selectModules", { name: m.name })}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allModules.map((id) => {
                          const checked = draftFocus.includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleModule(id)}
                              className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${checked ? "bg-primary text-primary-contrast border-primary" : "bg-surface-card text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500/40"}`}>
                              {t('eventOps.tabs.' + id)}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5">{t("common.cancel")}</button>
                        <button onClick={requestVerification} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 bg-primary">
                          {t("eventAdmin.team.saveChanges")}
                        </button>
                      </div>
                    </>
                  )}

                  {verifyStep === "password" && (
                    <div className="bg-surface-raised rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("eventAdmin.team.step1")}</p>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                        placeholder={t("eventAdmin.team.castoPasswordPlaceholder")}
                        autoFocus
                        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {passwordError && <p className="text-xs text-red-500 dark:text-red-400">{passwordError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5">{t("common.cancel")}</button>
                        <button onClick={checkPassword} disabled={checkingPassword || !password.trim()} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 disabled:opacity-50 bg-primary">
                          {checkingPassword ? t("eventAdmin.team.checking") : t("eventAdmin.team.continue")}
                        </button>
                      </div>
                    </div>
                  )}

                  {verifyStep === "code" && (
                    <div className="bg-surface-raised rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("eventAdmin.team.step2")}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("eventAdmin.team.codeGeneratedHint")}</p>
                      <input
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && confirmCode()}
                        placeholder={t("eventAdmin.team.sixDigitCode")}
                        maxLength={6}
                        autoFocus
                        dir="ltr"
                        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm tracking-widest text-center font-mono bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {codeError && <p className="text-xs text-red-500 dark:text-red-400">{codeError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5">{t("common.cancel")}</button>
                        <button onClick={confirmCode} disabled={codeInput.trim().length !== 6} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 disabled:opacity-50 bg-primary">
                          {t("eventAdmin.team.confirmAndSave")}
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
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">{t("eventAdmin.team.onlyEventLead")}</p>
        )}

        {canReassign && (
          showInvite ? (
            <div className="border border-blue-100 dark:border-blue-500/20 bg-surface-raised rounded-xl p-4 flex flex-col gap-2.5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("eventAdmin.team.addOfficer")}</p>
              <input
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("eventOps.staff.fullName")}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("eventAdmin.team.emailNotifyPlaceholder")}
                dir="ltr"
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                placeholder={t("eventAdmin.team.roleTitleOptional")}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5">{t("eventAdmin.team.modulesTheyOwn")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {allModules.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => toggleInviteFocus(mod)}
                      className={`text-xs font-medium rounded-full px-3 py-1 border transition-colors ${
                        inviteForm.focus.includes(mod) ? "bg-primary text-primary-contrast border-primary" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-500/40"
                      }`}
                    >
                      {t('eventOps.tabs.' + mod)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowInvite(false)} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5">{t("common.cancel")}</button>
                <button onClick={submitInvite} disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()} className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-1.5 disabled:opacity-50 bg-primary">
                  {inviting ? t("eventAdmin.team.addingEllipsis") : t("eventAdmin.team.addAndNotify")}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowInvite(true)} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors self-start">
              {t("eventAdmin.team.addOfficerBtn")}
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
  { id: "report", labelKey: "postEventReport" },
  { id: "customize", labelKey: "customize" },
];

const ADMIN_TAB_KEY = "event_admin_active_tab";

const EventAdmin = ({ link }) => {
  const { t } = useTranslation();
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
      const authHeader = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
      const [applicantsRes, companiesRes] = await Promise.all([
        axios.get(`${link}/applicants?limit=10000`, authHeader),
        axios.get(`${link}/companies`),
      ]);
      setReportData({
        applicants: applicantsRes?.data?.applicants || applicantsRes?.data || [],
        companies: companiesRes?.data || [],
      });
    } catch { /* report tab will show zeros until this succeeds */ }
  }, [link, user?.token]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const translatedAdminTabs = ADMIN_TABS.map((tab) => ({ ...tab, label: t(`eventAdmin.main.tabs.${tab.labelKey}`) }));

  return (
    <PageContainer
      user={user}
      title={t("eventAdmin.main.pageTitle")}
      collapsibleTopBar
      headerRight={
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportCompanies(true)} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {t("eventAdmin.main.importCompanies")}
          </button>
          <button onClick={() => navigate("/view-as")} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {t("eventAdmin.viewAs.title")}
          </button>
          <button onClick={() => setShowTeamPanel(true)} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {t("eventAdmin.team.title")}
          </button>
          <button onClick={() => setShowActivity(true)} className="text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {t("eventAdmin.main.activityLog")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <PillTabs tabs={translatedAdminTabs} activeId={activeTab} onSelect={setActiveTab} />
          <a href="/event-settings" className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors">
            {t("eventAdmin.main.backToOperations")}
          </a>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl">
          <div key={activeTab} className="bg-surface-card rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-panelIn">
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
