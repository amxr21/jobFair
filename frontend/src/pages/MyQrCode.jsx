import { useState, useRef } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { API_URL } from "../config/api";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";

// Public page — the student's journey doesn't have to end at the submission
// screen. They can come back any time, type the University ID they applied
// with, and get their QR code back (same value the door scanners read).
const MyQrCode = () => {
    const [uniId, setUniId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [applicant, setApplicant] = useState(null);
    const inputRef = useRef(null);

    const lookup = async () => {
        if (!uniId.trim() || loading) return;
        setLoading(true);
        setError("");
        setApplicant(null);
        try {
            const res = await axios.get(`${API_URL}/applicants/lookup/${encodeURIComponent(uniId.trim())}`);
            setApplicant(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setApplicant(null);
        setUniId("");
        setError("");
        setTimeout(() => inputRef.current?.focus(), 0);
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

                {!applicant ? (
                    <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-[#0E7F41] p-6 text-center">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-[#0E7F41]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m0 0-3-3m3 3 3-3M3.75 9h16.5" /></svg>
                            </div>
                            <h1 className="text-white text-lg font-bold">Retrieve My QR Code</h1>
                            <p className="text-white/80 text-xs mt-1">Enter the University ID you applied with</p>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            <input
                                ref={inputRef}
                                value={uniId}
                                onChange={(e) => { setUniId(e.target.value); setError(""); }}
                                onKeyDown={(e) => e.key === "Enter" && lookup()}
                                placeholder="e.g. 202110001"
                                autoFocus
                                className="border border-gray-200 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                            <button onClick={lookup} disabled={loading || !uniId.trim()} className="w-full py-3 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                                {loading ? "Looking up…" : "Get My QR Code"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-[#0E7F41] p-6 text-center">
                            <h1 className="text-white text-lg font-bold">{applicant.fullName}</h1>
                            <p className="text-white/80 text-xs mt-1 font-mono">{applicant.uniId}</p>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <QRCodeSVG value={applicant.id} size={176} fgColor="#111827" />
                            </div>
                            <div className={`w-full text-center text-xs font-medium rounded-lg px-3 py-2 ${applicant.attended ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                {applicant.attended ? "You're checked in — see you there!" : "Show this QR code at the entrance to check in"}
                            </div>
                            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">
                                Look up a different ID
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyQrCode;
