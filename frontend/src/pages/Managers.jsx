import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

import { Row, TableHeader, PageContainer } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

import { CircularProgress } from "@mui/material";


// Reminder Modal Component
const ReminderModal = ({ visible, onClose, companies, link, user }) => {
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const [selectAll, setSelectAll] = useState(false);

    // Filter to only show pending companies (not Confirmed or Canceled)
    const pendingCompanies = companies.filter(c => !c.status || c.status === 'Pending');

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedCompanies([]);
        } else {
            setSelectedCompanies(pendingCompanies.map(c => c._id));
        }
        setSelectAll(!selectAll);
    };

    const handleToggleCompany = (companyId) => {
        setSelectedCompanies(prev =>
            prev.includes(companyId)
                ? prev.filter(id => id !== companyId)
                : [...prev, companyId]
        );
    };

    const handleSendReminders = async () => {
        if (selectedCompanies.length === 0) return;

        setIsSending(true);
        setResult(null);

        try {
            const response = await axios.post(
                `${link}/companies/send-reminders`,
                {
                    companyIds: selectedCompanies,
                    frontendUrl: window.location.origin
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setResult({ type: 'success', data: response.data });
            setSelectedCompanies([]);
            setSelectAll(false);
        } catch (error) {
            setResult({ type: 'error', message: error.response?.data?.error || error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (!visible) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
                {/* Header */}
                <div className="bg-[#0E7F41] text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Send Confirmation Reminders</h2>
                        <p className="text-sm text-white/80">Select companies to send attendance confirmation emails</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {/* Select All */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded border-gray-300 text-[#0E7F41] focus:ring-[#0E7F41]"
                            />
                            <span className="font-semibold text-gray-700">
                                Select All Pending ({pendingCompanies.length})
                            </span>
                        </label>
                        <span className="text-sm text-gray-500">
                            {selectedCompanies.length} selected
                        </span>
                    </div>

                    {/* Company List */}
                    <div className="space-y-2">
                        {pendingCompanies.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">All companies have confirmed their attendance.</p>
                        ) : (
                            pendingCompanies.map(company => (
                                <label
                                    key={company._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedCompanies.includes(company._id)
                                            ? 'border-[#0E7F41] bg-[#0E7F41]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCompanies.includes(company._id)}
                                        onChange={() => handleToggleCompany(company._id)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0E7F41] focus:ring-[#0E7F41]"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{company.companyName}</p>
                                        <p className="text-xs text-gray-500">{company.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            company.status === 'Confirmed'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {company.status || 'Pending'}
                                        </span>
                                        {company.reminderSentAt && (
                                            <span className="text-xs text-gray-400" title={`Last sent: ${new Date(company.reminderSentAt).toLocaleString()}`}>
                                                Sent
                                            </span>
                                        )}
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-lg ${
                            result.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {result.type === 'success' ? (
                                <div>
                                    <p className="font-semibold">{result.data.message}</p>
                                    {result.data.results?.length > 0 && (
                                        <ul className="mt-2 text-sm">
                                            {result.data.results.map((r, i) => (
                                                <li key={i}>{r.companyName}: {r.status}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <p>{result.message}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendReminders}
                        disabled={selectedCompanies.length === 0 || isSending}
                        className="px-6 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <CircularProgress size={16} sx={{ color: 'white' }} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Reminders ({selectedCompanies.length})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


const Managers = ({link}) => {

    const [companies, setCompanies ] = useState([]); // State to store the list of companies
    const { user } = useAuthContext(); // Access the authenticated user context
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [isAscending, setIsAscending] = useState(true)
    const [filterSelected, setFilterSelected] = useState('')
    const [showReminderModal, setShowReminderModal] = useState(false)

    const [ applicantsList, setApplicantsList ] = useState([])
    const [ numberOfApplicants, setNumberOfApplicants ] = useState()


    const handleSort = useCallback((columnName) => {
        console.log('handleSort called:', columnName, 'current filterSelected:', filterSelected);
        if(filterSelected === columnName) {
            setIsAscending(prev => !prev);
        } else {
            setFilterCriteria(columnName);
            setFilterSelected(columnName);
            setIsAscending(true);
        }
    }, [filterSelected]) 
 
    

    // Sorting function to arrange companies by specified criteria
    const sortedCompanies = (filterCriteria, ascending) => {
        let sortedArray = [...companies]
        const direction = ascending ? 1 : -1;

        switch (filterCriteria) {
            case "Company Name":
                return sortedArray.sort((a, b) => direction * (a.companyName?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.companyName?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '')));
            case "Company Email":
                return sortedArray.sort((a, b) => direction * (a.email || '').localeCompare(b.email || ''));
            case "Representatives":
                // Note: 'representitives' is the field name in the database (kept for backward compatibility)
                return sortedArray.sort((a, b) => direction * (a.representitives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.representitives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "Sector":
                return sortedArray.sort((a, b) => direction * (a.sector?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.sector?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "City":
                return sortedArray.sort((a, b) => direction * (a.city?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.city?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "No of App":
                return sortedArray.sort((a, b) => direction * ((b.numberOfApplicants || 0) - (a.numberOfApplicants || 0)));
            case "Status":
                return sortedArray.sort((a, b) => direction * (a.status || '').localeCompare(b.status || ''));
            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }
    };


    useEffect(() => {
        if(companies.length != 0) setFinalList(sortedCompanies(filterCriteriaa, isAscending));
    }, [filterCriteriaa, companies, isAscending]);

    let counter = 0;



    // useEffect(() => {
    //     const fetchApplicantsNumberForCompanies = async () => {
    //         try {
    //             const response = await axios.get(link + '/applicants')
    //             if(user && user.email == "casto@sharjah.ac.ae") setApplicantsList(response.data)


                
                    
    //         } catch (error) {
    //             console.log(error)
    //         }
    //     }
        
    //     fetchApplicantsNumberForCompanies() 
    // }, [user])



    // useEffect(() => {

    //     const fetchCompanies = async () => {
    //         try {
    //             setIsLoading(true)
    //             const response = await axios.get(`${link}/companies`, {
    //                 headers: user ? { Authorization: `Bearer ${user.token}` } : {},
    //             });



    //             if (user) {
    //                 if(user.email == "casto@sharjah.ac.ae"){

    //                     let numberOfApplicantsPerCompany = {}
    //                     if(response.data){
    //                         const updatedCompanies = response.data.map((company) => {
    //                             numberOfApplicantsPerCompany[company.companyName] = 0
    //                             // console.log(numberOfApplicantsPerCompany);
    //                             applicantsList.forEach((applicant) => {
    //                                 if(applicant.user_id.includes(company.companyName)){
    //                                     numberOfApplicantsPerCompany[company.companyName] =  numberOfApplicantsPerCompany[company.companyName] + 1
    //                                 }
    //                             })
    
    //                             return {
    //                                 ...company,
    //                                 'numberOfApplicants': numberOfApplicantsPerCompany[company.companyName]
    //                             }
                                
    //                         })
    
    
    
    //                         // Filter applicants to only include those associated with the logged-in user
    //                         setCompanies([...updatedCompanies].slice(1));
                            
    //                     }
    //                 }
    //                 else{
    //                     // Filter applicants to only include those associated with the logged-in user
    //                     setCompanies(
    //                         response.data.filter((applicant) =>
    //                         // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    //                         applicant.user_id.includes(user.email)
    //                         // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    
    //                     )
    //                     );

    //                 }
    //             }
    //         } catch (err) {
    //             console.log("Error fetching data:", err);
    //         }
    //         finally{
    //             setTimeout(() => {
    //                 setIsLoading(false)

    //             }, 2000)
    //         }
    //     };


    //     fetchCompanies();
    // }, [user, path.pathname, applicantsList]); // Fetch companies again if the user changes

    // console.log(companies); // Logging to debug and verify the companies' list





    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // 1. Fetch applicants (if casto) - use high limit to get all for counting
                let applicants = [];
                if (user?.email === "casto@sharjah.ac.ae") {
                    const applicantsResponse = await axios.get(`${link}/applicants?limit=10000`, {
                        headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                    });
                    // Handle new paginated response format
                    applicants = applicantsResponse.data.applicants || applicantsResponse.data;
                    setApplicantsList(applicants);
                }

                // 2. Fetch companies
                const companiesResponse = await axios.get(`${link}/companies`, {
                    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                });

                const companiesData = companiesResponse.data;
    
                if (user) {
                    if (user.email === "casto@sharjah.ac.ae") {
                        // Build a map of applicants per company
                        const updatedCompanies = companiesData.map((company) => {
                            const num = applicants.filter((app) =>
                                app.user_id.includes(company.companyName)
                            ).length;
    
                            return {
                                ...company,
                                numberOfApplicants: num,
                            };
                        });
    
                        setCompanies([...updatedCompanies].slice(1));
                    } else {
                        const filtered = companiesData.filter((applicant) =>
                            applicant.user_id.includes(user.email)
                        );
                        setCompanies(filtered);
                    }
                }
    
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setTimeout(() => setIsLoading(false), 2000);
            }
        };
    
        if (user) fetchData();

    }, [user, link]);
    













    return (
        <PageContainer
            user={user}
            title="Companies & Cooperations"
            titleExtra={user?.email === "casto@sharjah.ac.ae" && (
                <button
                    onClick={() => setShowReminderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Reminders
                </button>
            )}
        >
            {/* Reminder Modal */}
            <ReminderModal
                visible={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                companies={companies}
                link={link}
                user={user}
            />

            <div className="grow h-40 overflow-hidden text-xs md:text-base">
                <TableHeader userType={'manager'} sortColumn={filterSelected} isAscending={isAscending} onSort={handleSort} />
                <div className="list h-[40rem] overflow-y-auto w-full pt-2 pb-6">
                    {finalList.length != 0 ?  finalList.map((company) => {
                        counter += 1;

                        // Get applicants for this company
                        const companyApplicants = applicantsList.filter(app =>
                            app.user_id?.includes(company.companyName)
                        );

                        return (
                            <Row
                                key={company._id}
                                number={counter}
                                userType={'manager'}
                                companyName={company.companyName}
                                companyEmail={company.email}
                                companyRepresentatives={company.representitives}
                                companyFields={company.fields}
                                companyStatus={company?.status}
                                companySector={company.sector}
                                companyCity={company.city}
                                numberOfPositions={company.noOfPositions}
                                numebrOfApplicants={company.numberOfApplicants}
                                preferredMajors={company.preferredMajors}
                                opportunityTypes={company.opportunityTypes}
                                preferredQualities={company.preferredQualities}
                                companyApplicants={companyApplicants}
                            />
                        );
                    })
                    :
                    isLoading
                    ?
                    <div className="flex items-center w-48 justify-between mx-auto mt-4">
                        <CircularProgress size={18}/>
                        <p className="text-sm">Loading companies...</p>
                    </div>
                    :
                    <div className="flex items-center w-48 justify-between mx-auto mt-4">
                        <p className="text-sm">No listed Companies</p>
                    </div>

                        }
                </div>
            </div>
        </PageContainer>
    );
};

export default Managers;