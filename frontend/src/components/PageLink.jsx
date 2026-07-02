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
const PageLink = ({ title, icon, link, itemRef }) => {
    const path = useLocation().pathname;
    const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isActive = cleanPath === cleanLink;

    return (
        <Link to={link} ref={itemRef} data-active={isActive || undefined} className="relative block">
            <div className="page-link cursor-pointer flex gap-x-3 items-center relative z-10">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 [&>svg]:w-4 [&>svg]:h-4"
                    style={{
                        color: isActive ? '#ffffff' : '#9ca3af',
                        transition: 'color 0.2s ease 0.05s',
                    }}
                >
                    {ICON_MAP[icon] ?? <Survey />}
                </div>
                <h2
                    className="title text-sm leading-none"
                    style={{
                        color: isActive ? '#0E7F41' : '#6b7280',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'color 0.25s ease, font-weight 0.15s ease',
                    }}
                >
                    {title}
                </h2>
            </div>
        </Link>
    );
};

export default PageLink;
