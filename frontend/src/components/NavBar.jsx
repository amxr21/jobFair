import { BrowserRouter, Routes, Route } from "react-router-dom"
import ApplicationFormButton from "./ApplicationFormButton";
import { OfficeLogo, PageLink, UniLogo, AccessButtons } from "./index";

import { useState } from "react";

import { useAuthContext } from "../Hooks/useAuthContext";

const NavBar = () => {    

    const { user } = useAuthContext()


    return (
        <nav className="col-span-0 md:col-span-2 hidden md:flex flex-col py-4 justify-between gap-y-16 h-full overflow-hidden ">

            <OfficeLogo />

            <div className="links flex flex-col justify-between w-full grow ">
                <div className="flex flex-col gap-y-8">
                    {user?.companyName == "CASTO Office" && <ApplicationFormButton />}
                    <div className="flex flex-col gap-y-4">
                        <PageLink link='' title={'Applicants'} icon={'applicants'} />
                        {
                            user?.email == "casto@sharjah.ac.ae" && 
                            <div className="flex flex-col gap-y-4">
                                <PageLink link='managers' title={'Managers'} icon={'managers'} />
                                <PageLink link='statistics' title={'Statistics'} icon={'statistics'} />
                            </div>
                        }
                    </div>
                </div>
                    
                <AccessButtons />
                
            </div>


            <UniLogo />
            
            
        </nav>
    )
}


export default NavBar;