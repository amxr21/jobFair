import axios from "axios";
import { CircularProgress } from "@mui/material"
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FixedSizeList as List } from 'react-window';

import { useAuthContext } from "../Hooks/useAuthContext";
import { Row, TableHeader, BarButtons, ListHeader, FlagButton, NoApplicants, AccessButtons, TopBar, LoadingApplicants, ScrollToTopButton } from "./index";



const MainBanner = ({link}) => {
    const path = useLocation()

    const { user } = useAuthContext(); // Access the authenticated user context

    
    const flagIcon = useRef()
    const scrollableRef = useRef(null);
    
    const [ isFlagged, setIsFlagged ] = useState(false)
    const [ filterSelected, setFilterSelected ] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [applicants, setApplicants] = useState([]); // State to store the list of applicants
    const [otherApplicants, setOtherApplicants] = useState([]); // State to store the list of applicants
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [isAtTop, setIsAtTop] = useState(true);
    

    const itemData = useMemo(() => ({ applicants: finalList, user }), [finalList, user]);
    const otherItemData = useMemo(() => ({ otherApplicants: otherApplicants }), [otherApplicants, user])
    

    const filter = (e) => {
        if(['Name', 'University ID', 'Major', 'Age', 'CGPA', 'Status' , 'Nationality', 'CV'].includes(e.target.parentElement.innerText)){
            setFilterCriteria(e.target.parentElement.innerText);
        }
    }

    // Sorting function to arrange applicants by specified criteria
    const sortedApplicants = (filterCriteria) => {
        let sortedArray = [...applicants];

        switch (filterCriteria) {
            case "CGPA":
                setFilterSelected('CGPA')
                return sortedArray.sort((a, b) => b.applicantDetails.cgpa - a.applicantDetails.cgpa);
            case "University ID":
                setFilterSelected('University ID')
                    return sortedArray.sort((a, b) => a.applicantDetails.uniId.localeCompare(b.applicantDetails.uniId));
            case "Major":
                setFilterSelected('Major')
                return sortedArray.sort((a, b) => a.applicantDetails.major.localeCompare(b.applicantDetails.major));
            case "Name":
                setFilterSelected('Name')
                return sortedArray.sort((a, b) => a.applicantDetails.fullName.toLowerCase().localeCompare(b.applicantDetails.fullName.toLowerCase())); 
            case "Nationality":
                setFilterSelected('Nationality')
                return sortedArray.sort((a, b) => a.applicantDetails.nationality.toLowerCase().localeCompare(b.applicantDetails.nationality.toLowerCase())); 
            case "Status":
                setFilterSelected('Status')
                return sortedArray.sort((a, b) => String(b.attended).toLowerCase().localeCompare(String(a.attended).toLowerCase()))
            case "CV":
                setFilterSelected('CV')
                return sortedArray.sort((a, b) => String(a.cv).localeCompare(String(b.cv)))
            case "Age":
                setFilterSelected('Age')
                return sortedArray.sort((a, b) => {
                    // console.log((2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0]));
                    return (2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0])

                });

            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }



    };


    useEffect(() => {
        if(applicants.length != 0){
            setFinalList(sortedApplicants(filterCriteriaa));
        }
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

    const isFlaggedRef = useRef(isFlagged);

    useEffect(() => {
        isFlaggedRef.current = isFlagged;
    }, [isFlagged]);


    
    useEffect(() => {
        const el = scrollableRef?.current;
        console.log(el);
        
    
        const handleScroll = () => {
            console.log("scrollTop:", el?.scrollTop); // Debug
            if (el) setIsAtTop(el.scrollTop === 0);
        };
    
        if (el) {
            el.addEventListener('scroll', handleScroll);
            handleScroll(); // run once on mount
        }
    
        return () => {
            if (el) el.removeEventListener('scroll', handleScroll);
        };
    }, []);


    const filterFlagged = () => {
        setIsFlagged(prev => {
            const newValue = !prev;
    
            if (newValue) {
                const a = finalList.filter(applicant => applicant.flags?.includes(user?.companyName));
                flagIcon?.current.classList.replace("opacity-50", "opacity-100");
                setFinalList(a);
            } else {
                flagIcon?.current.classList.replace("opacity-100", "opacity-50");
                setFinalList(sortedApplicants(filterCriteriaa));
            }
    
            return newValue;
        });
    };





    const RowVirsualized = React.memo(({index, style, data}) => {
        const { applicants , user } = data
        const applicant = applicants[index]

        return (
            <div style={{...style}} className="relative flex flex-col gap-3">
                <Row
                    userType={'casto'}
                    key={applicant?._id}
                    ticketId={applicant?._id}
                    number={index+1}
                    name={applicant?.applicantDetails?.fullName}
                    uniId={applicant?.applicantDetails?.uniId}
                    nationality={applicant?.applicantDetails?.nationality}
                    email={applicant?.applicantDetails?.email}
                    phoneNumber={applicant?.applicantDetails?.phoneNumber}
                    studyLevel={applicant?.applicantDetails?.studyLevel}
                    major={applicant?.applicantDetails?.major}
                    gpa={applicant?.applicantDetails?.cgpa}
                    experience={applicant?.applicantDetails?.experience}
                    attended={applicant?.attended ? "Confirmed" : "No"}
                    shortlistedBy={applicant?.shortlistedBy}
                    rejectedBy={applicant?.rejectedBy}
                    age={2024 - parseInt(applicant?.applicantDetails?.birthdate?.split("-")[0] || 2006)}
                    // age={2024 - parseInt(String(applicant?.applicantDetails?.birthdate)?.slice(0, 4))}
                    languages={String(applicant?.applicantDetails?.languages)}
                    portfolio={applicant?.applicantDetails?.linkedIn}
                    file={applicant?.cv}
                    qrCode={applicant?._id}
                    status={applicant?.attended}
                    city={applicant?.applicantDetails?.city}
                    skills={{tech: applicant?.applicantDetails?.technicalSkills, nontech: applicant?.applicantDetails?.nonTechnicalSkills}}
                    expectedToGraduate={applicant?.applicantDetails?.ExpectedToGraduate}
                    flags={applicant?.flags}
                    user={user}
                    cv={applicant?.cv?.fieldname}
                />
            </div>

        )
    })




    
    const OthersRowVisualized = React.memo(({index, style, data}) => {
        const { otherApplicants, user } = data
        const otherApplicant = otherApplicants[index]
        

        return (
            <div style={style} className="relative flex flex-col gap-3">
                <Row
                    userType={'casto'}
                    key={otherApplicant?._id}
                    ticketId={otherApplicant?._id}
                    number={index + 1 + finalList?.length}
                    name={otherApplicant?.applicantDetails?.fullName}
                    uniId={otherApplicant?.applicantDetails?.uniId}
                    email={otherApplicant?.applicantDetails?.email}
                    phoneNumber={otherApplicant?.applicantDetails?.phoneNumber}
                    studyLevel={otherApplicant?.applicantDetails?.studyLevel}
                    major={otherApplicant?.applicantDetails?.major}
                    gpa={otherApplicant?.applicantDetails?.cgpa}
                    nationality={otherApplicant?.applicantDetails?.nationality}
                    experience={otherApplicant?.applicantDetails?.experience}
                    attended={otherApplicant?.attended ? "Confirmed" : "No"}
                    age={2024 - parseInt(String(otherApplicant?.applicantDetails?.birthdate)?.slice(0, 4))}
                    languages={String(otherApplicant?.applicantDetails?.languages)}
                    portfolio={otherApplicant?.applicantDetails?.linkedIn}
                    file={otherApplicant?.cv}
                    qrCode={otherApplicant?._id}
                    status={otherApplicant?.attended}
                    flags={otherApplicant?.flags}
                />


            </div>
        )




    })





    



    return (
        <div id="Main" className="flex flex-col md:gap-y-6 xl:gap-y-8 col-span-12 md:col-span-10 w-full md:mx-auto overflow-y-auto p-8 md:p-0 max-w-[100vw] max-h-[92vh]">
            <AccessButtons otherClasses={'md:hidden'} />
            <TopBar user={user} />
            <div id="Hero" className={`bg-[#F3F6FF] flex flex-col grow  overflow-y-hidden rounded-xl p-8 col-span-12 md:col-span-10 w-full md:mx-auto`}>
                
                <div className="flex md:flex-row flex-col justify-between items-center pl-2 border-b border-b-gray-400 pb-5 mb-3">
                    <div className="flex gap-x-6">
                        <h2 className="text-center text-2xl xl:text-3xl font-bold md:my-0 mb-7">Applicants list</h2>
                         
                        {user && <FlagButton btnRef={flagIcon} handleClick={filterFlagged} />}
 
                    </div>

                    {user && <BarButtons link={link} />}
                </div>


                <div className={`relative ${user?.companyName == "CASTO Office" ? 'grow' : 'h-[60%]'} overflow-y-hidden rounded-lg text-xs md:text-lg mb-4`} onClick={filter}>
                    <TableHeader/>

                    {
                        isLoading
                        ?
                        <LoadingApplicants />
                        :
                        finalList.length > 0
                        ?
                        <>
                        <List
                            height={user.companyName == "CASTO Office" ? 400 : 280}
                            itemCount={finalList.length}
                            itemSize={112}
                            width="100%"
                            itemData={itemData}
                            outerRef={scrollableRef}
                            onScroll={({ scrollOffset }) => {
                                setIsAtTop(scrollOffset === 0);
                            }}
                            >
                            {RowVirsualized}
                        </List>

                            <ScrollToTopButton isAtTop={isAtTop} scrollableRefC={scrollableRef} />
                        </>
                        :
                        <NoApplicants />   

                    }   


                    
                </div>


                {
                    user?.email != 'casto@sharjah.ac.ae' &&
                    <div className="flex flex-col gap-5 ">
                        <ListHeader headerText={'Other Applicants'} type={'other'} />
                        <div className="relative  rounded-lg text-xs md:text-lg" onClick={filter}>
                            <div className="list max-h-0 pr-3 overflow-x-hidden overflow-y-auto w-full pt-0 pb-0 transition-all duration-500 ease-in-out">
                                {
                                    isLoading
                                    ?
                                    <LoadingApplicants />
                                    :
                                    otherApplicants?.length > 0
                                        ?
                                        <List
                                            height={200}
                                            itemCount={otherApplicants.length}
                                            itemSize={112}
                                            width='100%'
                                            itemData={otherItemData}
                                        >
                                            {OthersRowVisualized}
                                        </List>
                                        :
                                        <NoApplicants />

                                }


                                {/* <button
                                    className={`sticky flex items-center justify-center bottom-[50%] left-[95%] scroll-to-top p-2 rounded-2xl w-10 h-10 bg-white border shadow-2xl transition-opacity duration-300 ${
                                    isAtTop ? 'opacity-100' : 'opacity-100'
                                    }`}
                                    onClick={() => {
                                    scrollableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-4"
                                    >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                    </svg>
                                </button> */}
                            </div>
                        </div>
                    </div >
                }



            </div>
        </div>
    );
};





export default MainBanner;