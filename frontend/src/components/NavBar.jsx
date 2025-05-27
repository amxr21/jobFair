import ApplicationFormButton from "./ApplicationFormButton";
import { OfficeLogo, PageLink, UniLogo, AccessButtons } from "./index";

import { useEffect, useState } from "react";

import { useAuthContext } from "../Hooks/useAuthContext";
import axios from "axios";

const NavBar = ({link}) => {    

    const { user } = useAuthContext()
    
    const [ userData, setUserData ] = useState() 

    const userId = JSON.parse(localStorage.getItem('user'))?.user_id
    
    useEffect(() => {
        // console.log(userId);
        
        const getUserData = async () => {
            try {
                const response = await axios.get(link+'/companies/'+userId)
                if(response) {
                    setUserData(response.data)
                }
                else{
                    throw Error("Unfound")
                }
            } catch (error) {
                console.log(error, 'error in fetching company id');
            }
            finally{
                
            }
        }
        
        getUserData()


    }, [])



    return (
        <nav className="col-span-0 md:col-span-2 hidden md:flex flex-col py-4 justify-between gap-y-16 h-full overflow-hidden ">

            <OfficeLogo />

            <div className="links flex flex-col justify-between w-full grow ">
                <div className="flex flex-col gap-y-8">
                    {user?.companyName == "CASTO Office" && <ApplicationFormButton />}
                    <div className="flex flex-col gap-y-4">
                        <PageLink link='' title={'Applicants'} icon={'applicants'} />
                        { 
                            userData?.surveyResult?.length == 0 && user?.companyName != "CASTO Office" && <PageLink link='survey' title={'Survey'} icon={'surveyStatstics'} />}
                        {
                            user?.email == "casto@sharjah.ac.ae" && 
                            <div className="flex flex-col gap-y-4">
                                <PageLink link='managers' title={'Managers'} icon={'managers'} />
                                <PageLink link='statistics' title={'Statistics'} icon={'statistics'} />
                            </div>
                        }
                        {user && user.companyName == "CASTO Office" && <PageLink link='surveyResults' title={'Survey Results'} icon={'surveyResults'} />}

                    </div>
                </div>
                    
                <AccessButtons />
                
            </div>


            <UniLogo />
            
            
        </nav>
    )
}


export default NavBar;