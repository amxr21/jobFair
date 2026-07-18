import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL } from "../config/api";
import TagPill from "../components/TagPill";
import SelectInput from "../components/SelectInput";
import MultiSelectInput, { INDUSTRY_FIELDS } from "../components/MultiSelectInput";
import CustomizeSettings from "../components/CustomizeSettings";
import { SubTabBar } from "../components/EventSettingsShared";
import { useToast } from "../components/Toast";
import { PageContainer } from "../components/index";
import { tCity, tSector, tStatus } from "../i18n/translateEnum";

// Self-service account settings. Redesigned into a sectioned layout: a company
// header (avatar · name · attendance badge) plus a left section-nav (Profile ·
// Attendance · Login Access · Appearance) so each area is focused instead of one
// long scroll. All the underlying data/APIs are unchanged — only the layout and
// affordances were reworked.

const STATUS_STYLES = {
    Confirmed: { badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
    Pending: { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    Canceled: { badge: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-500" },
};

// ── Small building blocks ───────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const CardHead = ({ title, desc, action }) => (
    <div className="flex items-start justify-between gap-3 px-4 md:px-5 pt-4 pb-3 border-b border-gray-50">
        <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
        {action}
    </div>
);

const Field = ({ label, value, mono = false, ltr = false }) => (
    <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <span className={`text-sm text-gray-700 truncate ${mono ? "font-mono" : ""} ${ltr ? "bidi-ltr" : ""}`}>{value || <span className="text-gray-300">—</span>}</span>
    </div>
);

const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full";

const CompanySettings = () => {
    const { t } = useTranslation();
    const { user } = useAuthContext();
    const toast = useToast();
    // Section tabs — same order the SubTabBar renders. Built from translations
    // so the labels follow the active language.
    const SECTIONS = [
        t("settings.tabs.profile"),
        t("settings.tabs.attendance"),
        t("settings.tabs.loginAccess"),
        t("settings.tabs.appearance"),
    ];
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [section, setSection] = useState(0);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const [loginEmails, setLoginEmails] = useState([]);
    const [newEmail, setNewEmail] = useState("");
    const [addingEmail, setAddingEmail] = useState(false);
    const [savingStatus, setSavingStatus] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?.user_id;
    const token = storedUser?.token;

    useEffect(() => {
        if (!userId) return;
        axios.get(`${API_URL}/companies/${userId}`)
            .then((res) => setCompanyData(res.data))
            .catch(() => setError("Failed to load company information"))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        if (!userId || !token) return;
        axios.get(`${API_URL}/companies/${userId}/login-emails`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setLoginEmails(res.data || []))
            .catch(() => { /* leave empty — not critical */ });
    }, [userId, token]);

    const reps = companyData?.representatives?.split(",").filter(Boolean) || [];
    const fields = (Array.isArray(companyData?.fields) ? companyData.fields : companyData?.fields?.split(",") || []).map((f) => (typeof f === "string" ? f.trim() : f)).filter(Boolean);

    const startEdit = () => {
        setForm({
            email: companyData?.email || "",
            phone: companyData?.phone || "",
            city: companyData?.city || "",
            sector: companyData?.sector || "",
            noOfPositions: companyData?.noOfPositions || "",
            fields: Array.isArray(companyData?.fields) ? companyData.fields.join(", ") : (companyData?.fields || ""),
            preferredQualities: companyData?.preferredQualities || "",
        });
        setEditing(true);
    };

    const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const saveProfile = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(`${API_URL}/companies/${userId}/profile`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanyData((prev) => ({ ...prev, ...res.data }));
            if (form.email !== companyData?.email) {
                const stored = JSON.parse(localStorage.getItem("user") || "{}");
                localStorage.setItem("user", JSON.stringify({ ...stored, email: form.email }));
            }
            toast(t("settings.toasts.saved"), { type: "success" });
            setEditing(false);
        } catch (err) {
            toast(err.response?.data?.error || "Failed to save changes", { type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const addEmail = async () => {
        if (!newEmail.trim()) return;
        setAddingEmail(true);
        try {
            const res = await axios.post(`${API_URL}/companies/${userId}/login-emails`, { email: newEmail.trim() }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLoginEmails((prev) => [...prev, res.data]);
            setNewEmail("");
            toast(t("settings.toasts.emailAdded"), { type: "success" });
        } catch (err) {
            toast(err.response?.data?.error || "Failed to add email", { type: "error" });
        } finally {
            setAddingEmail(false);
        }
    };

    const removeEmail = async (emailRow) => {
        try {
            await axios.delete(`${API_URL}/companies/${userId}/login-emails/${emailRow.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLoginEmails((prev) => prev.filter((e) => e.id !== emailRow.id));
            toast(t("settings.toasts.emailRemoved"), { type: "success" });
        } catch (err) {
            toast(err.response?.data?.error || "Failed to remove email", { type: "error" });
        }
    };

    const changeStatus = async (status) => {
        if (status === companyData?.status || savingStatus) return;
        setSavingStatus(true);
        try {
            const res = await axios.patch(`${API_URL}/companies/${userId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanyData((prev) => ({ ...prev, ...res.data.company }));
            toast(t("settings.toasts.statusSet", { status: tStatus(status) }), { type: "success" });
        } catch (err) {
            toast(err.response?.data?.error || "Failed to update status", { type: "error" });
        } finally {
            setSavingStatus(false);
        }
    };

    if (loading) return (
        <PageContainer user={user} title={t("settings.title")}>
            <div className="flex-1 flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0E7F41]" />
            </div>
        </PageContainer>
    );

    if (error) return (
        <PageContainer user={user} title={t("settings.title")}>
            <div className="flex-1 flex items-center justify-center py-16">
                <p className="text-sm font-medium text-gray-700">{error}</p>
            </div>
        </PageContainer>
    );

    const status = companyData?.status || "Pending";
    const st = STATUS_STYLES[status] || STATUS_STYLES.Pending;

    return (
        <PageContainer user={user} title={t("settings.title")}>
            <div className="flex flex-col gap-4 overflow-y-auto min-h-0 pb-4">
                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {companyData?.companyName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base md:text-lg font-bold text-gray-800 truncate">{companyData?.companyName}</h1>
                        <p className="text-xs text-gray-500 truncate">{[tSector(companyData?.sector), tCity(companyData?.city)].filter(Boolean).join(" · ") || t("settings.title")}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{tStatus(status)}
                    </span>
                </div>

                {/* Body: top section nav + content — same SubTabBar (sliding
                    pill) and fade-in the company Status tabs use, so tab motion
                    is identical across both pages. */}
                <div className="flex flex-col gap-4">
                    <SubTabBar tabs={SECTIONS} active={section} onChange={setSection} />

                    <div key={section} className="flex-1 min-w-0 flex flex-col gap-4 animate-panelIn">
                        {/* ── Profile ── */}
                        {section === 0 && (
                            <Card>
                                <CardHead
                                    title={t("settings.profile.title")}
                                    desc={t("settings.profile.subtitle")}
                                    action={!editing && (
                                        <button onClick={startEdit} className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors shrink-0">
                                            {t("common.edit")}
                                        </button>
                                    )}
                                />
                                <div className="p-4 md:p-5">
                                    {!editing ? (
                                        <div className="flex flex-col gap-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label={t("settings.profile.loginEmail")} value={companyData?.email} ltr />
                                                <Field label={t("settings.profile.phone")} value={companyData?.phone} ltr />
                                                <Field label={t("settings.profile.city")} value={tCity(companyData?.city)} />
                                                <Field label={t("settings.profile.sector")} value={tSector(companyData?.sector)} />
                                                <Field label={t("settings.profile.openPositions")} value={companyData?.noOfPositions} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("settings.profile.representatives")}</span>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {reps.length ? reps.map((rep, i) => <TagPill key={i} label={rep.trim()} variant="blue" />) : <span className="text-sm text-gray-300">—</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("settings.profile.industryFields")}</span>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {fields.length ? fields.map((f, i) => <TagPill key={i} label={f} variant="cyan" />) : <span className="text-sm text-gray-300">—</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("settings.profile.opportunityTypes")}</span>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {companyData?.opportunityTypes?.length > 0
                                                        ? companyData.opportunityTypes.map((ot, i) => <TagPill key={i} label={ot} variant="purple" />)
                                                        : <span className="text-sm text-gray-300">{t("common.notSpecified")}</span>}
                                                </div>
                                            </div>
                                            {companyData?.preferredMajors?.length > 0 && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("settings.profile.preferredMajors")}</span>
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">{companyData.preferredMajors.map((m, i) => <TagPill key={i} label={m} variant="green" />)}</div>
                                                </div>
                                            )}
                                            {companyData?.preferredQualities && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{t("settings.profile.idealQualities")}</span>
                                                    <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{companyData.preferredQualities}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-500 font-medium">{t("settings.profile.loginEmail")}</label>
                                                    <input type="email" className={inputCls} value={form.email} onChange={F("email")} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-gray-500 font-medium">{t("settings.profile.phone")}</label>
                                                    <input type="tel" className={inputCls} value={form.phone} onChange={F("phone")} placeholder={t("settings.profile.phonePlaceholder")} />
                                                </div>
                                                <SelectInput Id="csCity" Name={t("settings.profile.city")} options={["Sharjah", "Dubai", "Abu Dhabi", "Ajman", "Al-Ain", "Ras Al-Khaima", "Umm Al-Quwain", "AlFujairah"]} value={form.city} handleChange={F("city")} />
                                                <SelectInput Id="csSector" Name={t("settings.profile.sector")} options={["Local", "Private", "Semi", "Federal"]} value={form.sector} handleChange={F("sector")} />
                                                <SelectInput Id="csPositions" Name={t("settings.profile.openPositions")} options={["1-5", "5-10", "10-15", "15-20", ">20"]} value={form.noOfPositions} handleChange={F("noOfPositions")} />
                                            </div>
                                            <MultiSelectInput Id="csFields" Name="Industry Fields" options={INDUSTRY_FIELDS} value={form.fields ? form.fields.split(",").map((f) => f.trim()).filter(Boolean) : []} handleChange={(vals) => setForm((f) => ({ ...f, fields: vals.join(", ") }))} />
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 font-medium">{t("settings.profile.idealQualities")}</label>
                                                <textarea className={`${inputCls} resize-none`} rows={2} value={form.preferredQualities} onChange={F("preferredQualities")} />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <button onClick={() => setEditing(false)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">{t("common.cancel")}</button>
                                                <button onClick={saveProfile} disabled={saving} className="text-xs font-semibold text-white rounded-lg px-4 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                                                    {saving ? t("common.saving") : t("common.saveChanges")}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* ── Attendance ── */}
                        {section === 1 && (
                            <Card>
                                <CardHead title={t("settings.attendance.title")} desc={t("settings.attendance.subtitle")} />
                                <div className="p-4 md:p-5 flex flex-col gap-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {["Confirmed", "Pending", "Canceled"].map((s) => {
                                            const active = companyData?.status === s;
                                            const style = STATUS_STYLES[s];
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => changeStatus(s)}
                                                    disabled={savingStatus || active}
                                                    className={`flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-3 py-3 border transition-all disabled:cursor-default ${
                                                        active ? `${style.badge} ring-1 ring-inset ring-current/20` : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {active && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                    {tStatus(s)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400">{t("settings.attendance.hint")}</p>
                                </div>
                            </Card>
                        )}

                        {/* ── Login Access ── */}
                        {section === 2 && (
                            <Card>
                                <CardHead title={t("settings.access.title")} desc={t("settings.access.subtitle")} />
                                <div className="p-4 md:p-5 flex flex-col gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                                            <span className="font-medium text-gray-700 truncate bidi-ltr">{companyData?.email}</span>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 ms-2">{t("settings.access.primary")}</span>
                                        </div>
                                        {loginEmails.map((e) => (
                                            <div key={e.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                                                <span className="text-gray-700 truncate bidi-ltr">{e.email}</span>
                                                <button onClick={() => removeEmail(e)} className="text-red-500 hover:text-red-700 font-semibold text-xs shrink-0 ms-2">{t("common.remove")}</button>
                                            </div>
                                        ))}
                                        {loginEmails.length === 0 && (
                                            <p className="text-xs text-gray-400 px-1 py-1">{t("settings.access.emptyHint")}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(ev) => setNewEmail(ev.target.value)}
                                            onKeyDown={(ev) => ev.key === "Enter" && addEmail()}
                                            placeholder={t("settings.access.emailPlaceholder")}
                                            className={`flex-1 ${inputCls}`}
                                        />
                                        <button onClick={addEmail} disabled={addingEmail || !newEmail.trim()} className="text-xs font-semibold text-white rounded-lg px-4 py-2 disabled:opacity-50 shrink-0" style={{ background: "#0E7F41" }}>
                                            {t("settings.access.addEmail")}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* ── Appearance ── */}
                        {section === 3 && (
                            <Card>
                                <CardHead title={t("settings.appearance.title")} desc={t("settings.appearance.subtitle")} />
                                <div className="p-4 md:p-5">
                                    <CustomizeSettings />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default CompanySettings;
