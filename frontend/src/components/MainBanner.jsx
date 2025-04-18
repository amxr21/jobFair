import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import axios from "axios";

import { AccessButtons, Row, TableHeader, ControlBar, BarButtons, ListHeader, FlagButton } from "./index";
import { useAuthContext } from "../Hooks/useAuthContext";


import { CircularProgress } from "@mui/material"


import { TopBar } from "./index";


const MainBanner = ({link}) => {

    const path = useLocation()

    const [ isFlagged, setIsFlagged ] = useState(false)

    const flagIcon = useRef()

    const [applicants, setApplicants] = useState([]); // State to store the list of applicants
    const [otherApplicants, setOtherApplicants] = useState([]); // State to store the list of applicants
    const { user } = useAuthContext(); // Access the authenticated user context
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);

    const [isLoading, setIsLoading] = useState(false)


    const filter = (e) => {
        if(['Name', 'University ID', 'Major', 'Age', 'CGPA', 'Status' , 'Nationality'].includes(e.target.parentElement.innerText)){
            setFilterCriteria(e.target.parentElement.innerText);
        }
    }


    // Sorting function to arrange applicants by specified criteria
    const sortedApplicants = (filterCriteria) => {
        let sortedArray = [...applicants];

        switch (filterCriteria) {
            case "CGPA":
                return sortedArray.sort((a, b) => b.applicantDetails.cgpa - a.applicantDetails.cgpa);
            case "University ID":
                    return sortedArray.sort((a, b) => a.applicantDetails.uniId.localeCompare(b.applicantDetails.uniId));
            case "Major":
                return sortedArray.sort((a, b) => a.applicantDetails.major.localeCompare(b.applicantDetails.major));
            case "Name":
                return sortedArray.sort((a, b) => a.applicantDetails.fullName.toLowerCase().localeCompare(b.applicantDetails.fullName.toLowerCase())); 
            case "Nationality":
                return sortedArray.sort((a, b) => a.applicantDetails.nationality.toLowerCase().localeCompare(b.applicantDetails.nationality.toLowerCase())); 
            case "Age":
                return sortedArray.sort((a, b) => {
                    // console.log((2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0]));
                    return (2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0])

                });

            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }



    };


    useEffect(() => {
        if(applicants.length != 0) setFinalList(sortedApplicants(filterCriteriaa));
    }, [filterCriteriaa, applicants, path.pathname]);

    let counter = 0;


    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get(`${link}/applicants`, {
                    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                });
                let allIds = []
                if (user) {
                    if(user.email == "casto@sharjah.ac.ae"){
                        // Filter applicants to only include those associated with the logged-in user
                        setApplicants(response.data.filter((applicant) => {
                            if(!allIds.includes(applicant.applicantDetails.uniId)) {
                                allIds.push(applicant.applicantDetails.uniId)
                                return true
                            }
                            return false
                        }));
                    }
                    else{
                        // Filter applicants to only include those associated with the logged-in user
                        setApplicants(
                            response.data.filter((applicant) =>
    
                            //SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
                            applicant.user_id.includes(user.companyName)
                            //SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
                            
                            )
                        );
                        setOtherApplicants(response.data.filter(
                            (applicant) => applicant.user_id.indexOf(user.companyName) == -1
                        ))

                    }
                } else {
                    // If no user is logged in, display all applicants
                    setApplicants(response.data);
                }
            } catch (err) {
                console.log("Error fetching data:", err);
            }
            finally{
                setIsLoading(false)
            }
        };
        if(user) fetchApplicants();
    }, [user]); // Fetch applicants again if the user changes

    // console.log(applicants); // Logging to debug and verify the applicants' list



    const filterFlagged = () => {
        if(!isFlagged){
            const a = finalList.filter((applicant) => applicant.flags?.includes(user?.companyName))
            flagIcon.current.classList.replace("bg-[#F3F6FF]", "bg-white")
            // flagIcon.current.classList.replace("border-gray-300", "border-none")
            flagIcon.current.classList.replace("opacity-50", "opacity-100")
            setFinalList(a)
        }
        else{
            setFinalList(sortedApplicants(filterCriteriaa))
            flagIcon.current.classList.replace("bg-white", "bg-[#F3F6FF]")
            // flagIcon.current.classList.replace("border-none", "border-gray-300")
            flagIcon.current.classList.replace("opacity-100", "opacity-50")
        }
        setIsFlagged(prev => !prev)

        

    }


    useEffect(() => {
        console.log('====================================');
        console.log('flags');
        console.log('====================================');
    }, [isFlagged])









    return (
        <div id="Main" className="flex flex-col md:gap-y-6 xl:gap-y-8 col-span-12 md:col-span-10 w-full md:mx-auto scroll-y-auto p-8 md:p-0 max-w-[100vw] max-h-[92vh]">
            <TopBar user={user} />
            <div id="Hero" className={`bg-[#F3F6FF] flex flex-col grow ${user?.companyName == "CASTO Office" ? 'overflow-y-hidden' : 'overflow-y-auto'} rounded-xl p-8 col-span-12 md:col-span-10 w-full md:mx-auto`}>
                
                <div className="flex md:flex-row flex-col justify-between items-center pl-2 border-b border-b-gray-400 pb-5 mb-3">
                    <div className="flex gap-x-6">
                        <h2 className="text-center text-2xl xl:text-3xl font-bold md:my-0 mb-7">Applicants list</h2>
                        
                        
                        
                        <FlagButton btnRef={flagIcon} handleClick={filterFlagged}/>




                    </div>

                    {user && <BarButtons link={link} />}
                </div>



                {/* <ListHeader headerText={'Registered Applicants'} /> */}
                <div className="grow min-h-40 rounded-lg text-xs md:text-lg mb-4" onClick={filter}>
                    <TableHeader/>
                    <div className={`list ${user?.email != 'casto@sharjah.ac.ae' ? 'max-h-[26rem]' : 'max-h-[26rem]'} py-2 pr-3 overflow-y-auto w-full`}>
                        {finalList.length != 0 ?  finalList.map((applicant) => {
                            counter += 1;

                            return (
                                <Row
                                    userType={'casto'}
                                    key={applicant?._id}
                                    ticketId={applicant?._id}
                                    number={counter}
                                    name={applicant?.applicantDetails.fullName}
                                    uniId={applicant?.applicantDetails.uniId}
                                    nationality={applicant?.applicantDetails.nationality}
                                    email={applicant?.applicantDetails.email}
                                    phoneNumber={applicant?.applicantDetails.phoneNumber}
                                    studyLevel={applicant?.applicantDetails.studyLevel}
                                    major={applicant?.applicantDetails.major}
                                    gpa={applicant?.applicantDetails.cgpa}
                                    experience={applicant?.applicantDetails.experience}
                                    attended={applicant?.attended ? "Confirmed" : "No"}
                                    age={2024 - parseInt(String(applicant?.applicantDetails.birthdate)?.slice(0, 4))}
                                    languages={String(applicant?.applicantDetails.languages)}
                                    portfolio={applicant?.applicantDetails?.linkedIn}
                                    file={applicant?.cv}
                                    qrCode={applicant?._id}
                                    status={applicant?.attended}
                                    city={applicant?.applicantDetails.city}
                                    skills={{tech: applicant?.applicantDetails.technicalSkills, nontech: applicant?.applicantDetails.nonTechnicalSkills}}
                                    expectedToGraduate={applicant?.applicantDetails?.ExpectedToGraduate}
                                    flags={applicant?.flags}
                                    user={user}
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
                            <p className="text-sm">Np Applicants</p>
                        </div>


                            }
                    </div>
                </div>


                {
                    user?.email != 'casto@sharjah.ac.ae' &&
                    <>
                        <ListHeader headerText={'Other Applicants'} type={'other'} />
                        <div className="grow rounded-lg text-xs md:text-lg" onClick={filter}>
                            <div className="list max-h-0 pr-3 overflow-y-auto w-full pt-0 pb-0">
                                {otherApplicants.length != 0 ?  otherApplicants.map((applicant) => {
                                    counter += 1;

                                    return (
                                        <Row
                                            userType={'casto'}
                                            key={applicant._id}
                                            ticketId={applicant._id}
                                            number={counter}
                                            name={applicant.applicantDetails.fullName}
                                            uniId={applicant.applicantDetails.uniId}
                                            email={applicant.applicantDetails.email}
                                            phoneNumber={applicant.applicantDetails.phoneNumber}
                                            studyLevel={applicant.applicantDetails.studyLevel}
                                            major={applicant.applicantDetails.major}
                                            gpa={applicant.applicantDetails.cgpa}
                                            nationality={applicant.applicantDetails.nationality}
                                            experience={applicant.applicantDetails.experience}
                                            attended={applicant.attended ? "Confirmed" : "No"}
                                            age={2024 - parseInt(String(applicant.applicantDetails.birthdate)?.slice(0, 4))}
                                            languages={String(applicant.applicantDetails.languages)}
                                            portfolio={applicant.applicantDetails?.linkedIn}
                                            file={applicant.cv}
                                            qrCode={applicant._id}
                                            status={applicant?.attended}
                                            flags={applicant?.flags}
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
                                    <p className="text-sm">No Applicants</p>
                                </div>


                                    }
                            </div>
                        </div>
                    </>
                }



            </div>
        </div>
    );
};

export default MainBanner;




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