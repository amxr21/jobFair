import { Link, useLocation } from "react-router-dom"
import { Applicants, Managers, Statistics, SurveyStatsticsIcon, Survey, StatusIcon, SettingsIcon } from "./Icons"

const ICON_MAP = {
    applicants:      <Applicants />,
    managers:        <Managers />,
    statistics:      <Statistics />,
    surveyResults:   <SurveyStatsticsIcon />,
    surveyStatstics: <SurveyStatsticsIcon />,
    status:          <StatusIcon />,
    survey:          <Survey />,
    settings:        <SettingsIcon />,
};

// itemRef lets the parent NavBar track this link's DOM node so a single shared
// pill element can glide to it — no separate pill is rendered here.
// `matchPaths` lets a top-level link stay highlighted while the user is on one
// of its nested/child pages (e.g. Event Settings stays active on /view-as and
// /dev), so the nav always shows where you are.
const PageLink = ({ title, icon, link, itemRef, matchPaths = [] }) => {
    const path = useLocation().pathname;
    const clean = (s) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanPath = clean(path);
    const cleanLink = clean(link);
    const isActive = cleanPath === cleanLink || matchPaths.some((p) => cleanPath === clean(p));

    return (
        <Link to={link} ref={itemRef} data-active={isActive || undefined} className="relative block">
            <div className="page-link cursor-pointer flex gap-x-3 items-center relative z-10">
                <div
                    className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 [&>svg]:w-4 [&>svg]:h-4 transition-colors ${
                        isActive ? 'text-primary-contrast' : 'text-gray-400 dark:text-gray-500'
                    }`}
                >
                    {ICON_MAP[icon] ?? <Survey />}
                </div>
                <h2
                    className={`title text-sm leading-none transition-colors ${
                        isActive ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400 font-normal'
                    }`}
                >
                    {title}
                </h2>
            </div>
        </Link>
    );
};

export default PageLink;
