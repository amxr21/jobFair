import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { AccessButtons, Row, TableHeader, ControlBar } from "./index";
import { useAuthContext } from "../../Hooks/useAuthContext";


import { CircularProgress } from "@mui/material"

const link = "https://jobfair-1.onrender.com"



const MainBanner = () => {
    const [applicants, setApplicants] = useState([]); // State to store the list of applicants
    const { user } = useAuthContext(); // Access the authenticated user context
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);


    const filter = (e) => {
        if(['Full name', 'University ID', 'Major', 'Nationality', 'age', 'GPA'].includes(e.target.parentElement.innerText)){
            setFilterCriteria(e.target.parentElement.innerText);
            // console.log(e.target.parentElement.innerText);
        }
    }


    // Sorting function to arrange applicants by specified criteria
    const sortedApplicants = (filterCriteria) => {
        let sortedArray = [...applicants];

        switch (filterCriteria) {
            case "GPA":
                return sortedArray.sort((a, b) => b.applicantDetails.cgpa - a.applicantDetails.cgpa);
                
            case "University ID":
                    return sortedArray.sort((a, b) => a.applicantDetails.uniId.localeCompare(b.applicantDetails.uniId));
            case "Major":
                return sortedArray.sort((a, b) => a.applicantDetails.major.localeCompare(b.applicantDetails.major));
            case "Full name":
                return sortedArray.sort((a, b) => a.applicantDetails.fullName.toLowerCase().localeCompare(b.applicantDetails.fullName.toLowerCase())); 
            case "Nationality":
                return sortedArray.sort((a, b) => a.applicantDetails.nationality.toLowerCase().localeCompare(b.applicantDetails.nationality.toLowerCase())); 
            case "age":
                return sortedArray.sort((a, b) => {
                    console.log(2024 - a.applicantDetails.birthdate.split("-")[0] );
                    return 2024 - a.applicantDetails.birthdate.split("-")[0] - 2024 - b.applicantDetails.birthdate.split("-")[0]

                });

            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }



    };


    useEffect(() => {
        if(applicants.length != 0) setFinalList(sortedApplicants(filterCriteriaa));
    }, [filterCriteriaa, applicants]);

    let counter = 0;


    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const response = await axios.get(`${link}/applicants`, {
                    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                });

                if (user) {
                    if(user.email == "casto@sharjah.ac.ae"){
                        // Filter applicants to only include those associated with the logged-in user
                        setApplicants(response.data);
                    }
                    else{
                        // Filter applicants to only include those associated with the logged-in user
                        setApplicants(
                            response.data.filter((applicant) =>
    
                            //SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
                            applicant.user_id.includes(user.email)
                            //SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    
                            )
                        );

                    }
                } else {
                    // If no user is logged in, display all applicants
                    setApplicants(response.data);
                }
            } catch (err) {
                console.log("Error fetching data:", err);
            }
        };

        fetchApplicants();
    }, [user]); // Fetch applicants again if the user changes

    // console.log(applicants); // Logging to debug and verify the applicants' list

    return (
        <div id="Hero" className="w-full mx-auto pt-2 pb-12">
            <div className="flex md:flex-row flex-col justify-between items-center px-2 mb-8">
                <h2 className="text-center text-4xl font-bold md:my-0 mb-7">Applicants list</h2>
                <AccessButtons />
            </div>



                <ControlBar
                    numberOfApplicants={sortedApplicants(filterCriteriaa).length}
                    attendancePercentageNum={
                    applicants.length != 0
                    ?
                    Math.floor((applicants.filter((applicant) => {return applicant.attended == true}).length / applicants.length) *100) + ("%")
                    :
                    <CircularProgress size={20}/>
                }
                />






                <div className="bg-white h-fit rounded-lg md:px-4 py-6 shadow-2xl overflow-x-scroll md:overflow-hidden text-xs md:text-lg"onClick={filter}>
                    <TableHeader/>
                    <div className="table w-full py-2">
                        {finalList.length != 0 ?  finalList.map((applicant) => {
                            counter += 1;

                            return (
                                <Row
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
                                    age={2024 - parseInt(String(applicant.applicantDetails.birthdate).slice(0, 4))}
                                    languages={String(applicant.applicantDetails.languages)}
                                    portfolio={applicant.applicantDetails.portfolio}
                                    file={applicant.cv}
                                    qrCode={applicant._id}
                                />
                            );
                        }) 
                        :
                        <div className="flex items-center w-48 justify-between mx-auto mt-4">
                            <CircularProgress size={20}/>
                            <p className="text-sm">Loading applicants...</p>
                        </div>
                         }
                    </div>
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