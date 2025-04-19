import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import { AccessButtons, Row, TableHeader, TopBar, BarButtons } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";


import { CircularProgress } from "@mui/material"


const Managers = ({link}) => {

    const path = useLocation()

    const [companies, setCompanies ] = useState([]); // State to store the list of companies
    const { user } = useAuthContext(); // Access the authenticated user context
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [isLoading, setIsLoading] = useState(false)

    const [ applicantsList, setApplicantsList ] = useState([])
    const [ numberOfApplicants, setNumberOfApplicants ] = useState()


    const filter = (e) => {
        if(['Company Name', 'Company Email', 'Representatives', 'Fields of interest', 'No of App', 'City', 'Sector', 'Status'].includes(e.target.parentElement.innerText)){
            console.log('====================================');
            console.log(e.target.parentElement.innerText);
            console.log('====================================');
            setFilterCriteria(e.target.parentElement.innerText);
            // console.log(e.target.parentElement.innerText);
        }
    } 
 
        

    // Sorting function to arrange applicants by specified criteria
    const sortedCompanies = (filterCriteria) => {

        let sortedArray = [...companies]
        
            switch (filterCriteria) {
                case "Company Name": 
                    return sortedArray.sort((a, b) => a.companyName?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.companyName.replace(/[^a-zA-Z]/g, '').toLowerCase())); 
                case "Company Email":
                        return sortedArray.sort((a, b) =>a.email.localeCompare(b.email)); 
                case "Representatives":
                        return sortedArray.sort((a, b) => a.representitives?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.representitives.replace(/[^a-zA-Z]/g, '').toLowerCase())); 
                case "Sector":
                        return sortedArray.sort((a, b) => a.sector?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.sector.replace(/[^a-zA-Z]/g, '').toLowerCase())); 
                case "City":
                        return sortedArray.sort((a, b) => a.city?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.city.replace(/[^a-zA-Z]/g, '').toLowerCase())); 
                case "Fields of interest":
                    return sortedArray.sort((a, b) => a.fields.localeCompare(b.fields));
                case "No of App":
                    return sortedArray.sort((a, b) => b.numberOfApplicants - a.numberOfApplicants); 
                // case "Status":
                //     return sortedArray.sort((a, b) => {
                //         console.log((2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0]));
                //         return (2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0])
    
                //     });
    
                default:
                    return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
            }



        
        

    };


    useEffect(() => {
        if(companies.length != 0) setFinalList(sortedCompanies(filterCriteriaa));
    }, [filterCriteriaa, companies, path.pathname]);

    let counter = 0;



    useEffect(() => {
        const fetchApplicantsNumberForCompanies = async () => {
            try {
                const response = await axios.get(link + '/applicants')
                if(user && user.email == "casto@sharjah.ac.ae")setApplicantsList(response.data)
                    
            } catch (error) {
                console.log(error)
            }
        }
        
        fetchApplicantsNumberForCompanies() 
    }, [user])



    useEffect(() => {

        const fetchCompanies = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get(`${link}/companies`, {
                    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                });



                if (user) {
                    if(user.email == "casto@sharjah.ac.ae"){

                        let numberOfApplicantsPerCompany = {}
                        const updatedCompanies = response.data.map((company) => {
                            numberOfApplicantsPerCompany[company.companyName] = 0
                            // console.log(numberOfApplicantsPerCompany);
                            applicantsList.forEach((applicant) => {
                                if(applicant.user_id.includes(company.companyName)){
                                    numberOfApplicantsPerCompany[company.companyName] =  numberOfApplicantsPerCompany[company.companyName] + 1
                                }
                            })

                            return {
                                ...company,
                                'numberOfApplicants': numberOfApplicantsPerCompany[company.companyName]
                            }
                            
                        })



                        // Filter applicants to only include those associated with the logged-in user
                        setCompanies([...updatedCompanies].slice(1));
                    }
                    else{
                        // Filter applicants to only include those associated with the logged-in user
                        setCompanies(
                            response.data.filter((applicant) =>
                            // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
                            applicant.user_id.includes(user.email)
                            // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    
                        )
                        );

                    }
                }
            } catch (err) {
                console.log("Error fetching data:", err);
            }
            finally{
                setTimeout(() => {
                    setIsLoading(false)

                }, 2000)
            }
        };


        fetchCompanies();
    }, [user, path.pathname, applicantsList]); // Fetch companies again if the user changes

    // console.log(companies); // Logging to debug and verify the companies' list

    return (
        <div className="flex flex-col gap-y-8 col-span-10 w-full mx-auto max-h-[92vh]">
            <TopBar user={user} />
            <div id="Hero" className="bg-[#F3F6FF] flex flex-col grow overflow-y-hidden rounded-xl p-8 col-span-10 w-full mx-auto">
                
                <div className="flex md:flex-row flex-col justify-between items-center px-2 border-b border-b-gray-400 pb-5">
                    <h2 className="text-center text-3xl font-bold md:my-0 mb-7">Companies & Cooperations</h2>
                </div>



                {/* <ControlBar
                    numberOfApplicants={sortedCompanies(filterCriteriaa).length}
                    attendancePercentageNum={
                    applicants.length != 0
                    ?
                    Math.floor((applicants.filter((applicant) => {return applicant.attended == true}).length / applicants.length) *100) + ("%")
                    :
                    <CircularProgress size={20}/>
                }
                /> */}




                <div className="grow h-40 overflow-hidden text-xs md:text-lg" onClick={filter}>
                    <TableHeader userType={'manager'}/>
                    <div className="list h-96 pr-3 overflow-y-auto w-full pt-2 pb-8">
                        {finalList.length != 0 ?  finalList.map((company) => {
                            counter += 1;   console.log();
                            

                            return (
                                <Row
                                    key={company._id}
                                    number={counter}
                                    userType={'manager'}
                                    // ticketId={applicant._id}
                                    // name={applicant.applicantDetails.fullName}
                                    // uniId={applicant.applicantDetails.uniId}
                                    // email={applicant.applicantDetails.email}
                                    // phoneNumber={applicant.applicantDetails.phoneNumber}
                                    // studyLevel={applicant.applicantDetails.studyLevel}
                                    // major={applicant.applicantDetails.major}
                                    // gpa={applicant.applicantDetails.cgpa}
                                    // nationality={applicant.applicantDetails.nationality}
                                    // experience={applicant.applicantDetails.experience}
                                    // attended={applicant.attended ? "Confirmed" : "No"}
                                    // age={2024 - parseInt(String(applicant.applicantDetails.birthdate).slice(0, 4))}
                                    // languages={String(applicant.applicantDetails.languages)}
                                    // portfolio={applicant.applicantDetails.portfolio}
                                    // file={applicant.cv}
                                    // qrCode={applicant._id}
                                    // status={applicant?.attended}

                                    companyName={company.companyName}
                                    companyEmail={company.email}
                                    companyRepresentitives={company.representitives}
                                    companyFields={company.fields}
                                    companyStatus={company?.status}
                                    companySector={company.sector}
                                    companyCity={company.city}
                                    numberOfPositions={company.noOfPositions}

                                    numebrOfApplicants={company.numberOfApplicants}


                                />
                            );
                        }) 
                        :
                        isLoading
                        ?
                        <div className="flex items-center w-48 justify-between mx-auto mt-4">
                            <CircularProgress size={20}/>
                            <p className="text-sm">Loading applicants...</p>
                        </div>
                        :
                        <div className="flex items-center w-48 justify-between mx-auto mt-4">
                            <p className="text-sm">No listed Companies</p>
                        </div>

                            }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Managers;




//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG
//REVIEW THE WHOLE CODE LINE BY LINE TO UNDERSTAND WHAT WAS WRONG