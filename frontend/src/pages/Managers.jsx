import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import { Row, TableHeader, PageContainer } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

import { CircularProgress } from "@mui/material";


const Managers = ({link}) => {

    const [companies, setCompanies ] = useState([]); // State to store the list of companies
    const { user } = useAuthContext(); // Access the authenticated user context
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [isAscending, setIsAscending] = useState(true)
    const [filterSelected, setFilterSelected] = useState('')

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
        >
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