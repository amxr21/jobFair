import ApplicationFormButton from "./ApplicationFormButton";
import { OfficeLogo, PageLink, UniLogo, AccessButtons } from "./index";

import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "../hooks/useAuthContext";
import axios from "axios";

// One real DOM element that glides between links, instead of each link fading
// its own copy of the pill in and out (which reads as flicker, not motion).
const SlidingPill = ({ containerRef }) => {
    const pillRef = useRef(null);
    const location = useLocation();
    const { i18n } = useTranslation();

    const reposition = useCallback((animate = true) => {
        const container = containerRef.current;
        const pill = pillRef.current;
        if (!container || !pill) return;
        const activeEl = container.querySelector('[data-active="true"]');
        if (!activeEl) { pill.style.opacity = '0'; return; }

        const iconEl = activeEl.querySelector('.page-link > div');
        const cRect = container.getBoundingClientRect();
        const iRect = (iconEl || activeEl).getBoundingClientRect();

        pill.style.transition = animate
            ? 'top 0.28s cubic-bezier(0.4,0,0.2,1), left 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease'
            : 'none';
        pill.style.top = `${iRect.top - cRect.top}px`;
        pill.style.left = `${iRect.left - cRect.left}px`;
        pill.style.width = `${iRect.width}px`;
        pill.style.height = `${iRect.height}px`;
        pill.style.opacity = '1';
    }, [containerRef]);

    useLayoutEffect(() => {
        reposition(false);
        const id = requestAnimationFrame(() => reposition(true));
        return () => cancelAnimationFrame(id);
        // Also re-measure on language change: label widths/positions shift when
        // switching EN<->AR (different text length, RTL flow), so the pill sized
        // for the old layout would otherwise stay stuck until the next route
        // change or window resize.
    }, [location.pathname, i18n.resolvedLanguage, reposition]);

    useEffect(() => {
        const onResize = () => reposition(false);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [reposition]);

    return (
        <div
            ref={pillRef}
            className="absolute rounded-xl pointer-events-none bg-primary shadow-[0_2px_10px_rgba(14,127,65,0.4)] dark:shadow-[0_2px_10px_rgba(52,199,117,0.35)]"
            style={{ opacity: 0 }}
        />
    );
};

const NavBar = ({ link }) => {

    const { t } = useTranslation();
    const { user } = useAuthContext()

    const [userData, setUserData] = useState()
    const [surveyPublic, setSurveyPublic] = useState(false)
    const mainGroupRef = useRef(null);
    const settingsGroupRef = useRef(null);

    const userId = JSON.parse(localStorage.getItem('user'))?.user_id

    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await axios.get(link + '/companies/' + userId)
                if (response) {
                    setUserData(response.data)
                } else {
                    throw Error("Unfound")
                }
            } catch (error) {
                // Error fetching company data
            }
        }

        const getSettings = async () => {
            try {
                const response = await axios.get(link + '/settings')
                if (response?.data) {
                    setSurveyPublic(response.data.surveyPublic)
                }
            } catch (error) {
                // Error fetching settings
            }
        }

        getUserData()
        getSettings()

    }, [])

    const isCASTOAdmin = user?.email == "casto@sharjah.ac.ae";

    return (
        <nav className="w-0 md:w-[15%] lg:w-[12%] xl:w-[11%] shrink-0 hidden md:flex flex-col py-3 justify-between gap-y-8 h-full overflow-hidden">

            <OfficeLogo />

            <div className="links flex flex-col justify-between w-full grow">
                <div className="flex flex-col gap-y-5">
                    {user?.companyName == "CASTO Office" && <ApplicationFormButton />}

                    {/* Main navigation group — one shared sliding pill glides between these */}
                    <div ref={mainGroupRef} className="relative flex flex-col gap-y-3">
                        <SlidingPill containerRef={mainGroupRef} />
                        <PageLink link='' title={t('nav.applicants')} icon={'applicants'} />
                        {user && user.companyName !== "CASTO Office" && <PageLink link='company-status' title={t('nav.myStatus')} icon={'status'} />}
                        {user && user.companyName !== "CASTO Office" && <PageLink link='company-settings' title={t('nav.settings')} icon={'settings'} />}
                        {surveyPublic && (userData === undefined || userData?.surveyResult?.length === 0) && user?.companyName !== "CASTO Office" &&
                            <PageLink link='survey' title={t('nav.survey')} icon={'surveyStatstics'} />}
                        {isCASTOAdmin && <PageLink link='managers' title={t('nav.managers')} icon={'managers'} />}
                        {isCASTOAdmin && <PageLink link='statistics' title={t('nav.statistics')} icon={'statistics'} />}
                        {user && user.companyName == "CASTO Office" && <PageLink link='surveyResults' title={t('nav.surveyResults')} icon={'surveyResults'} />}
                    </div>
                </div>

                <div className="flex flex-col gap-y-5">
                    {/* Event Settings sits on its own at the bottom, separate from daily-use links */}
                    {isCASTOAdmin && (
                        <div ref={settingsGroupRef} className="relative flex flex-col gap-y-3 pt-3 border-t border-gray-100">
                            <SlidingPill containerRef={settingsGroupRef} />
                            <PageLink link='event-settings' title={t('nav.eventSettings')} icon={'settings'} matchPaths={['event-admin', 'view-as', 'dev']} />
                        </div>
                    )}
                    <AccessButtons />
                </div>
            </div>

            <UniLogo />

        </nav>
    )
}

export default NavBar;
