import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { API_URL } from "../config/api";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";

const STORAGE_KEY = "checkin_staff_session";
const logStorageKey = (code) => `checkin_staff_log_${code}`;

// Public, code-gated attendance check-in — for volunteers/helpers who don't
// have a CASTO or company account. A short code (created by CASTO in Event
// Settings > Manage Staff, along with just a name + email) identifies them;
// the first time they log in they fill in their own remaining details
// (phone), then every check-in they do is logged under their name so they
// can see their own list here.
const StudentCheckin = () => {
    const [session, setSession] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
    });
    const [code, setCode] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [phone, setPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    const [uniId, setUniId] = useState("");
    const [manualMode, setManualMode] = useState(false);
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', message, name }
    const [myLog, setMyLog] = useState(() => {
        if (!session?.code) return [];
        try { return JSON.parse(localStorage.getItem(logStorageKey(session.code))) || []; } catch { return []; }
    });
    const inputRef = useRef(null);
    const scannerRef = useRef(null);

    const needsProfile = session && session.status === "invited";
    const readyToScan = session && !needsProfile;

    useEffect(() => {
        if (session && manualMode) inputRef.current?.focus();
    }, [session, manualMode]);

    // Instant on refresh from localStorage (set above), then reconciled
    // against the real DB-backed log so it's accurate across devices/sessions
    // too — not just whatever this browser happened to remember.
    useEffect(() => {
        if (!session?.code) return;
        axios.get(`${API_URL}/attendance-staff/my-checkins`, { params: { code: session.code } })
            .then((res) => { if (Array.isArray(res.data)) setMyLog(res.data); })
            .catch(() => { /* keep whatever localStorage had */ });
    }, [session?.code]);

    useEffect(() => {
        if (!session?.code) return;
        localStorage.setItem(logStorageKey(session.code), JSON.stringify(myLog));
    }, [session?.code, myLog]);

    // QR camera is the primary check-in method — same pattern used elsewhere
    // in the app (BarButtons/MobileRegisterFAB): the printed QR encodes the
    // applicant's Mongo _id, sanitized before use.
    useEffect(() => {
        if (!readyToScan || manualMode) return;
        let scanner;
        let scanLocked = false; // guards against re-firing on the same still-visible QR
        const timeout = setTimeout(() => {
            scanner = new Html5QrcodeScanner("staff-reader", { qrbox: { width: 220, height: 220 }, fps: 10 });
            scannerRef.current = scanner;
            const onSuccess = async (decodedText) => {
                if (scanLocked) return;
                scanLocked = true;
                await checkInByQr(decodedText.replace(/[^a-zA-Z0-9]/g, ""));
                setTimeout(() => { scanLocked = false; }, 2000);
            };
            scanner.render(onSuccess, () => {});
        }, 100);
        return () => {
            clearTimeout(timeout);
            scannerRef.current?.clear().catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readyToScan, manualMode]);

    const login = async () => {
        if (!code.trim()) return;
        setLoggingIn(true);
        setLoginError("");
        try {
            const trimmed = code.trim().toUpperCase();
            const res = await axios.post(`${API_URL}/attendance-staff/verify`, { code: trimmed });
            // Store the code alongside the verified identity — later check-ins
            // re-send it since the endpoint is stateless (no session token)
            const s = { ...res.data, code: trimmed };
            setSession(s);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch (err) {
            setLoginError(err.response?.data?.error || "Invalid code");
        } finally {
            setLoggingIn(false);
        }
    };

    const logout = () => {
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
        setMyLog([]);
    };

    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await axios.patch(`${API_URL}/attendance-staff/profile`, {
                code: session.code, phone: phone.trim(),
            });
            const s = { ...res.data, code: session.code };
            setSession(s);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch {
            // If this fails, needsProfile just stays true and they can retry
        } finally {
            setSavingProfile(false);
        }
    };

    const submitCheckin = async (body, resetField) => {
        if (!session || checking) return;
        setChecking(true);
        setResult(null);
        try {
            const res = await axios.patch(`${API_URL}/attendance-staff/checkin`, { code: session.code, ...body });
            const name = res.data.applicant?.applicantDetails?.fullName || res.data.applicant?.applicantDetails?.uniId || "Student";
            const scannedUniId = res.data.applicant?.applicantDetails?.uniId || body.uniId || "";
            setResult({ type: "success", message: `${name} checked in`, name });
            setMyLog((prev) => [{ id: Date.now(), uniId: scannedUniId, name, at: new Date().toISOString() }, ...prev]);
            resetField?.();
        } catch (err) {
            setResult({ type: "error", message: err.response?.data?.error || "Check-in failed" });
        } finally {
            setChecking(false);
            if (manualMode) inputRef.current?.focus();
        }
    };

    const checkInByQr = (applicantId) => submitCheckin({ applicantId });

    const checkIn = () => {
        if (!uniId.trim()) return;
        submitCheckin({ uniId: uniId.trim() }, () => setUniId(""));
    };

    return (
        <div className="fixed inset-0 flex w-screen h-screen overflow-hidden z-50">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${CareerFairBg})` }}>
                <div className="absolute inset-0 bg-[#0E7F41]/85" />
            </div>

            <div className="relative flex items-center justify-center w-full h-full p-4">
                <div className="hidden md:flex absolute bottom-8 left-8 gap-6 items-center">
                    <img src={UniLogoWhite} alt="University Logo" className="h-12 w-auto opacity-80" />
                    <img src={CastoLogoWhite} alt="CASTO Logo" className="h-12 w-auto opacity-80" />
                </div>

                {!session ? (
                    <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-[#0E7F41] p-6 text-center">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-[#0E7F41]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            </div>
                            <h1 className="text-white text-lg font-bold">Student Check-in</h1>
                            <p className="text-white/80 text-xs mt-1">Enter the access code given to you by CASTO</p>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            <input
                                value={code}
                                onChange={(e) => { setCode(e.target.value.toUpperCase()); setLoginError(""); }}
                                onKeyDown={(e) => e.key === "Enter" && login()}
                                placeholder="Access code"
                                autoFocus
                                className="border border-gray-200 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {loginError && <p className="text-xs text-red-500 text-center">{loginError}</p>}
                            <button onClick={login} disabled={loggingIn || !code.trim()} className="w-full py-3 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                                {loggingIn ? "Checking…" : "Continue"}
                            </button>
                        </div>
                    </div>
                ) : needsProfile ? (
                    <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-[#0E7F41] p-6 text-center">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-[#0E7F41]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                            </div>
                            <h1 className="text-white text-lg font-bold">Welcome, {session.name}</h1>
                            <p className="text-white/80 text-xs mt-1">Just one more step to finish setting up your account</p>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Email</label>
                                <p className="text-sm text-gray-700 mt-0.5 bidi-ltr">{session.email}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Phone number</label>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                                    placeholder="+971 5xx xxx xxx"
                                    autoFocus
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button onClick={saveProfile} disabled={savingProfile} className="w-full py-3 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 mt-1">
                                {savingProfile ? "Saving…" : "Finish setup"}
                            </button>
                            <button onClick={() => saveProfile()} className="text-xs text-gray-400 hover:text-gray-600 text-center">Skip for now</button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="bg-[#0E7F41] px-5 py-4 flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-white font-bold text-sm">{session.name}</p>
                                <p className="text-white/70 text-[11px]">Student attendance check-in</p>
                            </div>
                            <button onClick={logout} className="text-white/70 hover:text-white text-xs font-medium">Log out</button>
                        </div>

                        <div className="p-5 flex flex-col gap-3 shrink-0 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-500">
                                    {manualMode ? "University ID" : "Scan the student's QR code"}
                                </label>
                                <button
                                    onClick={() => { setManualMode((v) => !v); setResult(null); }}
                                    className="text-[11px] font-medium text-blue-600 hover:underline"
                                >
                                    {manualMode ? "Use camera instead" : "Enter ID manually"}
                                </button>
                            </div>

                            {manualMode ? (
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        value={uniId}
                                        onChange={(e) => setUniId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && checkIn()}
                                        placeholder="e.g. 202110001"
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <button onClick={checkIn} disabled={checking || !uniId.trim()} className="px-4 py-2.5 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                        {checking ? "…" : "Check In"}
                                    </button>
                                </div>
                            ) : (
                                <div id="staff-reader" className="rounded-lg overflow-hidden [&_video]:rounded-lg" />
                            )}

                            {result && (
                                <div className={`text-xs rounded-lg px-3 py-2 ${result.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                                    {result.message}
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto min-h-0">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Checked in by you today ({myLog.length})</p>
                            {myLog.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">No check-ins yet — scan a student's QR code above.</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {myLog.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-700 truncate">{c.name}</p>
                                                <p className="text-[10px] font-mono text-gray-400">{c.uniId}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 shrink-0">{new Date(c.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCheckin;
