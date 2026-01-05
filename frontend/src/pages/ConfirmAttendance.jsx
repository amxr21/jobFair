import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

const ConfirmAttendance = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // loading, success, error
    const [message, setMessage] = useState("");
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        const confirmAttendance = async () => {
            try {
                const response = await axios.get(`${API_URL}/confirm-attendance/${token}`);
                setStatus("success");
                setMessage(response.data.message);
                setCompanyName(response.data.companyName);
            } catch (error) {
                setStatus("error");
                setMessage(error.response?.data?.error || "An error occurred while confirming attendance");
            }
        };

        if (token) {
            confirmAttendance();
        } else {
            setStatus("error");
            setMessage("Invalid confirmation link");
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className={`p-6 ${status === "success" ? "bg-[#0E7F41]" : status === "error" ? "bg-red-500" : "bg-gray-500"}`}>
                    <div className="flex justify-center">
                        {status === "loading" && (
                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {status === "success" && (
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-[#0E7F41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    {status === "loading" && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirming Attendance...</h2>
                            <p className="text-gray-500">Please wait while we process your confirmation.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Attendance Confirmed!</h2>
                            {companyName && (
                                <p className="text-lg text-[#0E7F41] font-semibold mb-4">{companyName}</p>
                            )}
                            <p className="text-gray-500 mb-6">{message}</p>
                            <p className="text-sm text-gray-400 mb-6">
                                Thank you for confirming your participation in the Job Fair. We look forward to seeing you!
                            </p>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full py-3 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors"
                            >
                                Go to Login
                            </button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirmation Failed</h2>
                            <p className="text-gray-500 mb-6">{message}</p>
                            <p className="text-sm text-gray-400 mb-6">
                                The confirmation link may have expired or already been used. Please contact CASTO if you need assistance.
                            </p>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Go to Login
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        University of Sharjah - CASTO Office
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConfirmAttendance;
