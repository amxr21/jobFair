import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";

const STORAGE_KEY = "checkin_staff_session";

// Public, code-gated attendance check-in — for volunteers/helpers who don't
// have a CASTO or company account. A short code (issued from Event Settings >
// Attendance > Staff Codes) identifies them; every check-in they do is logged
// under their name so they can see their own list here.
const StudentCheckin = () => {
    const [session, setSession] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
    });
    const [code, setCode] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [uniId, setUniId] = useState("");
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', message, name }
    const [myLog, setMyLog] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        if (session) inputRef.current?.focus();
    }, [session]);

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

    const checkIn = async () => {
        if (!uniId.trim() || !session) return;
        setChecking(true);
        setResult(null);
        try {
            const res = await axios.patch(`${API_URL}/attendance-staff/checkin`, {
                code: session.code, uniId: uniId.trim(),
            });
            const name = res.data.applicant?.applicantDetails?.fullName || uniId.trim();
            setResult({ type: "success", message: `${name} checked in`, name });
            setMyLog((prev) => [{ id: Date.now(), uniId: uniId.trim(), name, at: new Date().toISOString() }, ...prev]);
            setUniId("");
        } catch (err) {
            setResult({ type: "error", message: err.response?.data?.error || "Check-in failed" });
        } finally {
            setChecking(false);
            inputRef.current?.focus();
        }
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
                            <label className="text-xs font-medium text-gray-500">University ID</label>
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
                            {result && (
                                <div className={`text-xs rounded-lg px-3 py-2 ${result.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                                    {result.message}
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto min-h-0">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Checked in by you today ({myLog.length})</p>
                            {myLog.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">No check-ins yet — enter a University ID above.</p>
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
