import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL } from "../config/api";
import SectionCard from "../components/SectionCard";
import TagPill from "../components/TagPill";
import SelectInput from "../components/SelectInput";
import MultiSelectInput, { INDUSTRY_FIELDS } from "../components/MultiSelectInput";
import CustomizeSettings from "../components/CustomizeSettings";
import { useToast } from "../components/Toast";
import { PageContainer } from "../components/index";

// Self-service account settings — its own page (not buried inside My Status)
// so a company can edit their profile/attendance/login access/customization
// without it competing for space with the Overview/Event Day tabs.
const CompanySettings = () => {
    const { user } = useAuthContext();
    const toast = useToast();
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            toast("Account settings saved", { type: "success" });
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
            toast("Login email added", { type: "success" });
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
            toast("Login email removed", { type: "success" });
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
            toast(`Attendance status set to ${status}`, { type: "success" });
        } catch (err) {
            toast(err.response?.data?.error || "Failed to update status", { type: "error" });
        } finally {
            setSavingStatus(false);
        }
    };

    if (loading) return (
        <PageContainer user={user} title="Company Settings">
            <div className="flex-1 flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0E7F41]" />
            </div>
        </PageContainer>
    );

    if (error) return (
        <PageContainer user={user} title="Company Settings">
            <div className="flex-1 flex items-center justify-center py-16">
                <p className="text-sm font-medium text-gray-700">{error}</p>
            </div>
        </PageContainer>
    );

    return (
        <PageContainer user={user} title="Company Settings">
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
                <SectionCard title="Profile">
                    {!editing ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-end -mt-1">
                                <button onClick={startEdit} className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors shrink-0">
                                    Edit profile
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <SectionCard title="Contact Information" noPad>
                                    <div className="flex items-center gap-2 text-xs text-gray-700 p-3 md:p-4">
                                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <a href={`mailto:${companyData?.email}`} className="text-blue-600 hover:underline truncate">{companyData?.email}</a>
                                        {companyData?.phone && <span className="text-gray-400">· {companyData.phone}</span>}
                                    </div>
                                </SectionCard>
                                <SectionCard title="Representatives" noPad>
                                    <div className="flex flex-wrap gap-1.5 p-3 md:p-4">{reps.map((rep, i) => <TagPill key={i} label={rep.trim()} variant="blue" />)}</div>
                                </SectionCard>
                                <SectionCard title="Industry Fields" noPad>
                                    <div className="flex flex-wrap gap-1.5 p-3 md:p-4">{fields.map((f, i) => <TagPill key={i} label={f} variant="cyan" />)}</div>
                                </SectionCard>
                                <SectionCard title="Opportunity Types" noPad>
                                    <div className="flex flex-wrap gap-1.5 p-3 md:p-4">
                                        {companyData?.opportunityTypes?.length > 0
                                            ? companyData.opportunityTypes.map((t, i) => <TagPill key={i} label={t} variant="purple" />)
                                            : <span className="text-xs text-gray-400">Not specified</span>}
                                    </div>
                                </SectionCard>
                                {companyData?.preferredMajors?.length > 0 && (
                                    <SectionCard title="Preferred Majors" className="md:col-span-2" noPad>
                                        <div className="flex flex-wrap gap-1.5 p-3 md:p-4">{companyData.preferredMajors.map((m, i) => <TagPill key={i} label={m} variant="green" />)}</div>
                                    </SectionCard>
                                )}
                                {companyData?.preferredQualities && (
                                    <SectionCard title="Ideal Candidate Qualities" className="md:col-span-2" noPad>
                                        <p className="text-xs text-gray-700 leading-relaxed p-3 md:p-4">{companyData.preferredQualities}</p>
                                    </SectionCard>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500 font-medium">Login email</label>
                                    <input type="email" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.email} onChange={F("email")} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500 font-medium">Phone number</label>
                                    <input type="tel" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.phone} onChange={F("phone")} placeholder="+971 5X XXX XXXX" />
                                </div>
                                <SelectInput Id="csCity" Name="City" options={["Sharjah", "Dubai", "Abu Dhabi", "Ajman", "Al-Ain", "Ras Al-Khaima", "Umm Al-Quwain", "AlFujairah"]} value={form.city} handleChange={F("city")} />
                                <SelectInput Id="csSector" Name="Sector" options={["Local", "Private", "Semi", "Federal"]} value={form.sector} handleChange={F("sector")} />
                                <SelectInput Id="csPositions" Name="Available Positions" options={["1-5", "5-10", "10-15", "15-20", ">20"]} value={form.noOfPositions} handleChange={F("noOfPositions")} />
                            </div>
                            <MultiSelectInput Id="csFields" Name="Industry Fields" options={INDUSTRY_FIELDS} value={form.fields ? form.fields.split(",").map((f) => f.trim()).filter(Boolean) : []} handleChange={(vals) => setForm((f) => ({ ...f, fields: vals.join(", ") }))} />
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500 font-medium">Ideal candidate qualities</label>
                                <textarea className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" rows={2} value={form.preferredQualities} onChange={F("preferredQualities")} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditing(false)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                                <button onClick={saveProfile} disabled={saving} className="text-xs font-semibold text-white rounded-lg px-4 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                                    {saving ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Attendance Status">
                    <p className="text-xs text-gray-500 mb-2.5">
                        Let CASTO know whether your company is attending this year's fair.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Confirmed", "Pending", "Canceled"].map((s) => {
                            const active = companyData?.status === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => changeStatus(s)}
                                    disabled={savingStatus || active}
                                    className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors disabled:cursor-default ${
                                        active
                                            ? s === "Confirmed" ? "bg-green-50 border-green-300 text-green-700"
                                            : s === "Pending" ? "bg-amber-50 border-amber-300 text-amber-700"
                                            : "bg-red-50 border-red-300 text-red-600"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    {active && (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard title="Manage Login Access">
                    <p className="text-xs text-gray-500 mb-2">
                        Anyone with an approved email below can log in using your company's password — useful if more than one person needs access.
                    </p>
                    <div className="flex flex-col gap-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-medium text-gray-700">{companyData?.email}</span>
                            <span className="text-[10px] text-gray-400">Primary</span>
                        </div>
                        {loginEmails.map((e) => (
                            <div key={e.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-700">{e.email}</span>
                                <button onClick={() => removeEmail(e)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(ev) => setNewEmail(ev.target.value)}
                            placeholder="colleague@company.com"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <button onClick={addEmail} disabled={addingEmail || !newEmail.trim()} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50 shrink-0" style={{ background: "#0E7F41" }}>
                            + Add email
                        </button>
                    </div>
                </SectionCard>

                <SectionCard title="Customize">
                    <CustomizeSettings />
                </SectionCard>
            </div>
        </PageContainer>
    );
};

export default CompanySettings;
