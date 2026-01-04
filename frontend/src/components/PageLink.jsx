import { useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"

import { Applicants, Managers, Statistics, SurveyStatsticsIcon, Survey } from "./Icons"



const PageLink = ({title, icon, link}) => {
    
    const path = String(useLocation().pathname).replace(/[^a-zA-Z0-9]/g,'').toLowerCase()

    const linkRef = useRef()


    // useEffect(() =>  {
    //     if(path == link.replace(/[^a-zA-Z0-0]/g,'').toLowerCase()){
    //         linkRef.current?.classList.replace('bg-white', 'bg-[#0E7F41]')
    //         linkRef.current?.firstElementChild.classList.replace('stroke-gray-200', 'stroke-white')
    //         linkRef.current?.parentElement.lastElementChild.classList.replace('text-gray-200', 'text-black')
    //     }
    //     else{
    //         linkRef.current?.classList.replace('bg-[#0E7F41]', 'bg-white')
    //         linkRef.current?.firstElementChild.classList.replace('stroke-white', 'stroke-gray-200')
    //         linkRef.current?.parentElement.lastElementChild.classList.replace('text-black', 'text-gray-200')
    //     }
        

    const cleanedLink = link.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // }, [path])
    useEffect(() => {

        const el = linkRef.current;
        if (!el) return; // Prevent null access

        const iconEl = el.firstElementChild;
        const textEl = el.parentElement?.lastElementChild;

        // Safe class manipulation with presence check
        if (path === cleanedLink) {
        el.classList?.replace('bg-white', 'bg-[#0E7F41]');
        iconEl?.classList?.replace('stroke-gray-200', 'stroke-white');
        textEl?.classList?.replace('text-gray-200', 'text-black');
        } else {
        el.classList?.replace('bg-[#0E7F41]', 'bg-white');
        iconEl?.classList?.replace('stroke-white', 'stroke-gray-200');
        textEl?.classList?.replace('text-black', 'text-gray-200');
        }
    }, [path, cleanedLink]);



    return (
        <Link to={link}>
            <div className={`page-link cursor-pointer page-link flex gap-x-3 items-center`} >
                <div ref={linkRef} className={`flex items-center justify-center w-8 h-8 p-1.5 bg-white rounded-xl`}>
                    {
                        icon == 'applicants' ? <Applicants/> : icon == 'managers' ? <Managers/> : icon == 'statistics' ? <Statistics/> : icon == "surveyResults" ? <SurveyStatsticsIcon/> : <Survey />
                    }
                </div>
                <h2 className={`title text-sm text-gray-200`}>{title}</h2>
            </div>
        </Link>
    )
}

export default PageLink