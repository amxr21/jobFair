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

const PageLink = ({ title, icon, link }) => {
    const path = useLocation().pathname;
    const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isActive = cleanPath === cleanLink;

    return (
        <Link to={link}>
            <div className="page-link group cursor-pointer flex gap-x-3 items-center">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 [&>svg]:w-4 [&>svg]:h-4"
                    style={{
                        backgroundColor: isActive ? '#0E7F41' : 'transparent',
                        color: isActive ? '#ffffff' : '#9ca3af',
                        boxShadow: isActive ? '0 2px 10px rgba(14,127,65,0.4)' : 'none',
                        transition: 'background-color 0.25s cubic-bezier(0.4,0,0.2,1), color 0.25s ease, box-shadow 0.25s ease',
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
