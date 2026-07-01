import { Link, useLocation } from "react-router-dom"
import { Applicants, Managers, Statistics, SurveyStatsticsIcon, Survey, StatusIcon } from "./Icons"

const ICON_MAP = {
    applicants: <Applicants />,
    managers: <Managers />,
    statistics: <Statistics />,
    surveyResults: <SurveyStatsticsIcon />,
    surveyStatstics: <SurveyStatsticsIcon />,
    status: <StatusIcon />,
    survey: <Survey />,
};

const PageLink = ({ title, icon, link }) => {
    const path = useLocation().pathname;
    const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLink = link.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const isActive = cleanPath === cleanLink;

    return (
        <Link to={link}>
            <div className="page-link cursor-pointer flex gap-x-3 items-center">
                {/* Icon box */}
                <div
                    className="flex items-center justify-center w-8 h-8 p-1.5 rounded-xl shrink-0"
                    style={{
                        backgroundColor: isActive ? '#0E7F41' : 'transparent',
                        color: isActive ? '#ffffff' : '#9ca3af',
                        transition: 'background-color 0.25s ease, color 0.25s ease, box-shadow 0.2s ease',
                        boxShadow: isActive ? '0 2px 8px rgba(14,127,65,0.35)' : 'none',
                    }}
                >
                    {ICON_MAP[icon] ?? <Survey />}
                </div>

                {/* Label */}
                <h2
                    className="title text-sm leading-none"
                    style={{
                        color: isActive ? '#f9fafb' : '#9ca3af',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'color 0.25s ease',
                    }}
                >
                    {title}
                </h2>
            </div>
        </Link>
    );
};

export default PageLink;
