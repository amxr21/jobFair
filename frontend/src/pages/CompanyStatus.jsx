import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthContext } from "../Hooks/useAuthContext";
import { API_URL } from "../config/api";

const CompanyStatus = () => {
    const { user } = useAuthContext();
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState(null);

    const userId = JSON.parse(localStorage.getItem('user'))?.user_id;

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/companies/${userId}`);
                if (response?.data) {
                    setCompanyData(response.data);
                }
            } catch (err) {
                setError("Failed to load company information");
                console.error("Error fetching company data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchCompanyData();
        }
    }, [userId]);

    // Handle confirm attendance
    const handleConfirmAttendance = async () => {
        try {
            setIsConfirming(true);
            setConfirmError(null);
            await axios.patch(`${API_URL}/companies/${userId}/status`,
                { status: 'Confirmed' },
                { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} }
            );
            // Update local state
            setCompanyData(prev => ({ ...prev, status: 'Confirmed' }));
        } catch (err) {
            setConfirmError("Failed to confirm attendance. Please try again.");
            console.error("Error confirming attendance:", err);
        } finally {
            setIsConfirming(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Canceled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Confirmed':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'Pending':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'Canceled':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E7F41]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-red-500 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg font-medium">{error}</p>
                </div>
            </div>
        );
    }

    const status = companyData?.status || 'Pending';
    const applicantsCount = companyData?.applicants?.length || 0;

    return (
        <div className="flex-1 flex flex-col gap-6 overflow-auto p-2">
            {/* Header */}
            <div className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#0E7F41] to-[#0a5f31] rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {companyData?.companyName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-800">{companyData?.companyName}</h1>
                        <p className="text-sm text-gray-500">{companyData?.sector} • {companyData?.city}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="font-semibold">{status}</span>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className={`rounded-xl p-5 border-2 ${status === 'Confirmed' ? 'bg-blue-50 border-blue-200' : status === 'Canceled' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full ${status === 'Confirmed' ? 'bg-blue-100 text-blue-600' : status === 'Canceled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {getStatusIcon(status)}
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-base font-bold ${status === 'Confirmed' ? 'text-blue-800' : status === 'Canceled' ? 'text-red-800' : 'text-yellow-800'}`}>
                            {status === 'Confirmed' && 'Your attendance is confirmed!'}
                            {status === 'Pending' && 'Awaiting confirmation'}
                            {status === 'Canceled' && 'Participation canceled'}
                        </h2>
                        <p className={`mt-1 text-sm ${status === 'Confirmed' ? 'text-blue-600' : status === 'Canceled' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {status === 'Confirmed' && 'Thank you for confirming your participation in the Job Fair. We look forward to seeing you!'}
                            {status === 'Pending' && 'Please check your email for the confirmation link, or contact CASTO if you have not received it.'}
                            {status === 'Canceled' && 'Your participation has been canceled. Please contact CASTO if you believe this is an error.'}
                        </p>
                        {/* Confirm Attendance Button - Only show for Pending status */}
                        {status === 'Pending' && (
                            <div className="mt-3">
                                <button
                                    onClick={handleConfirmAttendance}
                                    disabled={isConfirming}
                                    className="px-4 py-2 bg-[#0E7F41] text-white rounded-lg text-sm font-medium hover:bg-[#0a5f31] transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isConfirming ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Confirm My Attendance
                                        </>
                                    )}
                                </button>
                                {confirmError && (
                                    <p className="mt-2 text-sm text-red-600">{confirmError}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Applicants Count */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Applicants</p>
                            <p className="text-xl font-bold text-gray-800">{applicantsCount}</p>
                        </div>
                    </div>
                </div>

                {/* Open Positions */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 rounded-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Open Positions</p>
                            <p className="text-xl font-bold text-gray-800">{companyData?.noOfPositions || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Representatives */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Representatives</p>
                            <p className="text-xl font-bold text-gray-800">{companyData?.representitives?.split(',').length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{companyData?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Representatives */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Representatives</h3>
                    <div className="flex flex-wrap gap-2">
                        {companyData?.representitives?.split(',').map((rep, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                {rep.trim()}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Industry Fields */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Industry Fields</h3>
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(companyData?.fields) ? companyData.fields : companyData?.fields?.split(','))?.map((field, idx) => (
                            <span key={idx} className="bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                {typeof field === 'string' ? field.trim() : field}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Opportunity Types */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Opportunity Types</h3>
                    <div className="flex flex-wrap gap-2">
                        {companyData?.opportunityTypes?.length > 0 ? (
                            companyData.opportunityTypes.map((type, idx) => (
                                <span key={idx} className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                    {type}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-400 text-xs">Not specified</span>
                        )}
                    </div>
                </div>

                {/* Preferred Majors */}
                {companyData?.preferredMajors?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border md:col-span-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Preferred Majors</h3>
                        <div className="flex flex-wrap gap-2">
                            {companyData.preferredMajors.map((major, idx) => (
                                <span key={idx} className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                    {major}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ideal Candidate Qualities */}
                {companyData?.preferredQualities && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border md:col-span-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ideal Candidate Qualities</h3>
                        <p className="text-sm text-gray-700">{companyData.preferredQualities}</p>
                    </div>
                )}
            </div>

            {/* Survey Status */}
            {companyData?.surveyResult?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-800">Survey Completed</p>
                            <p className="text-xs text-green-600">Thank you for completing the post-event survey!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyStatus;
