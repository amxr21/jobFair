import { useState, useEffect } from "react";
import axios from "axios";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL } from "../config/api";

// Developer-only panel (CASTO account). Currently surfaces the outbound-email
// state: whether sending is enabled, the configured From address, and the log
// of recent send attempts (what would have gone out while email is off). This
// is where the maintainer confirms nothing is emailing real people during
// testing — and, once EMAIL_ENABLED=true, that the right recipients got mail.

const fmt = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const DevPanel = () => {
    const { user } = useAuthContext();
    const [state, setState] = useState({ loading: true, error: null, data: null });

    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    const authHeaders = () => {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.token ? { Authorization: `Bearer ${u.token}` } : {};
    };

    const load = async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const res = await axios.get(`${API_URL}/dev/email-activity`, { headers: authHeaders() });
            setState({ loading: false, error: null, data: res.data });
        } catch (err) {
            setState({ loading: false, error: err.response?.data?.error || "Failed to load — email activity is only available in real (non-demo) mode.", data: null });
        }
    };

    useEffect(() => { if (isCASTO) load(); /* eslint-disable-next-line */ }, []);

    if (!isCASTO) {
        return (
            <PageContainer user={user} title="Developer">
                <p className="text-sm text-gray-500 p-6">This panel is only available to the CASTO office account.</p>
            </PageContainer>
        );
    }

    const data = state.data;
    const enabled = data?.enabled;

    return (
        <PageContainer
            user={user}
            title="Developer — Email Activity"
            headerRight={
                <button onClick={load} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
                    Refresh
                </button>
            }
        >
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
                {/* Status banner */}
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${enabled ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${enabled ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <div className="min-w-0">
                        <p className={`text-sm font-bold ${enabled ? "text-amber-800" : "text-green-800"}`}>
                            {state.loading ? "Checking…" : enabled ? "Outbound email is ON — real emails WILL be sent" : "Outbound email is OFF — nothing is being sent"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {data?.fromAddress ? <>From address: <span className="font-mono">{data.fromAddress}</span> · </> : null}
                            Controlled by <span className="font-mono">EMAIL_ENABLED</span> in the backend .env (only you can change it).
                        </p>
                    </div>
                </div>

                {state.error && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-500 text-center">{state.error}</div>
                )}

                {/* Activity log */}
                {data && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-800">Recent email attempts</p>
                            <span className="text-xs text-gray-400">{data.attempts?.length || 0} logged</span>
                        </div>
                        {(!data.attempts || data.attempts.length === 0) ? (
                            <p className="px-4 py-8 text-sm text-gray-400 text-center">
                                No email has been attempted since the server started. Trigger something that would email (e.g. register a student, send reminders) and it'll appear here.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[640px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            {["When", "Subject", "To", "From", "Result"].map((h) => (
                                                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.attempts.map((a, i) => (
                                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmt(a.at)}</td>
                                                <td className="px-4 py-2.5 text-gray-800 max-w-[220px] truncate" title={a.subject}>{a.subject}</td>
                                                <td className="px-4 py-2.5 text-gray-600 text-xs">{a.to}</td>
                                                <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[160px] truncate" title={a.from}>{a.from}</td>
                                                <td className="px-4 py-2.5">
                                                    {a.sent
                                                        ? <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-700">Sent</span>
                                                        : <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-gray-100 text-gray-500" title={a.skippedReason || a.error || ""}>Skipped (off)</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageContainer>
    );
};

export default DevPanel;
