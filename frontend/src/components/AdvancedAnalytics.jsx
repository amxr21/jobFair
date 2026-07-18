import { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

// A hardcoded light-tier hex used as a chart series/default color throughout
// this file; call sites read the current theme and pick this file's dark-tier
// counterpart instead of using the hex directly. Keeps one source of truth
// for "the brand green as used in a chart series" across every chart here.
const seriesColor = (hex, isDark) => {
    const DARK_TIER = {
        '#0E7F41': '#34C775', // brand green
        '#0066CC': '#66AAEE', // brand blue
        '#9333EA': '#c084fc', // purple
        '#CC0000': '#f87171', // red
        '#EBC600': '#fcd34d', // yellow
        '#14B8A6': '#5eead4', // teal
    };
    return isDark ? (DARK_TIER[hex] || hex) : hex;
};

// Hook to get container width
const useContainerWidth = (ref) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(ref.current);
        setWidth(ref.current.offsetWidth);

        return () => resizeObserver.disconnect();
    }, [ref]);

    return width;
};

// Counts are integers — never show fractional ticks like 2.5
const integerAxis = {
    tickMinStep: 1,
    valueFormatter: (v) => (Number.isInteger(v) ? String(v) : ''),
    tickLabelStyle: { fontSize: 11 },
};

// Responsive Bar Chart wrapper
const ResponsiveBarChart = ({ data, layout = 'vertical', color = '#0E7F41', height = 200 }) => {
    const containerRef = useRef(null);
    const width = useContainerWidth(containerRef);
    const { isDark } = useTheme();
    const tickColor = isDark ? '#cbd5e1' : '#374151';
    const seriesC = seriesColor(color, isDark);

    if (layout === 'horizontal') {
        return (
            <div ref={containerRef} className="w-full">
                {width > 0 && (
                    <BarChart
                        layout="horizontal"
                        yAxis={[{
                            scaleType: 'band',
                            data: data.map(d => d[0]),
                            tickLabelStyle: { fontSize: 11, fill: tickColor }
                        }]}
                        xAxis={[{ ...integerAxis, tickLabelStyle: { fontSize: 11, fill: tickColor } }]}
                        series={[{
                            data: data.map(d => d[1]),
                            color: seriesC,
                            valueFormatter: (v) => `${v}`
                        }]}
                        width={width}
                        height={Math.max(height, data.length * 32)}
                        margin={{ left: 140, right: 50, top: 10, bottom: 30 }}
                        slotProps={{ bar: { rx: 4 } }}
                    />
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full">
            {width > 0 && (
                <BarChart
                    xAxis={[{
                        scaleType: 'band',
                        data: data.map(d => d[0]),
                        tickLabelStyle: { fontSize: 11, fill: tickColor }
                    }]}
                    yAxis={[{ ...integerAxis, tickLabelStyle: { fontSize: 11, fill: tickColor } }]}
                    series={[{
                        data: data.map(d => d[1]),
                        color: seriesC,
                        valueFormatter: (v) => `${v}`
                    }]}
                    width={width}
                    height={height}
                    margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
                    slotProps={{ bar: { rx: 4 } }}
                />
            )}
        </div>
    );
};

const AdvancedAnalytics = ({ applicants, companies }) => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('demographics');
    const tabRefs = useRef({});
    const [pillStyle, setPillStyle] = useState({ width: 0, left: 0, opacity: 0 });

    useEffect(() => {
        const el = tabRefs.current[activeTab];
        if (!el) return;
        const parent = el.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const isRtl = document.documentElement.dir === 'rtl';
        // Measure in the same logical direction the pill is positioned with
        // (inset-inline-start): in RTL that's the distance from the
        // container's RIGHT edge, not the physical left — mixing the two
        // stretched/misplaced the pill under RTL.
        const start = isRtl
            ? (parentRect.right - elRect.right) + parent.scrollLeft
            : (elRect.left - parentRect.left) + parent.scrollLeft;
        setPillStyle({
            width: elRect.width,
            left: start,
            opacity: 1,
        });
    }, [activeTab]);

    // Get unique applicants by uniId
    const uniqueApplicants = useMemo(() => {
        const seen = new Set();
        return applicants?.filter(app => {
            const id = app.applicantDetails?.uniId;
            if (id && !seen.has(id)) {
                seen.add(id);
                return true;
            }
            return false;
        }) || [];
    }, [applicants]);

    // Color palette matching the theme
    const colors = (isDark
        ? ['#34C775', '#66AAEE', '#f87171', '#fcd34d', '#5ce1e6', '#c084fc', '#fb923c', '#5eead4', '#f472b6', '#818cf8']
        : ['#0E7F41', '#0066CC', '#CC0000', '#EBC600', '#00B4D8', '#9333EA', '#F97316', '#14B8A6', '#EC4899', '#6366F1']);

    // ===== DEMOGRAPHICS TAB DATA =====

    // Gender Distribution
    const genderData = useMemo(() => {
        const counts = { Male: 0, Female: 0 };
        uniqueApplicants.forEach(app => {
            const gender = app.applicantDetails?.gender;
            if (gender) counts[gender] = (counts[gender] || 0) + 1;
        });
        return [
            { id: 0, value: counts.Male, label: 'Male', color: '#0066CC' },
            { id: 1, value: counts.Female, label: 'Female', color: '#EC4899' }
        ];
    }, [uniqueApplicants]);

    // Nationality Breakdown (Top 10)
    const nationalityData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const nat = app.applicantDetails?.nationality?.trim();
            if (nat) counts[nat] = (counts[nat] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [uniqueApplicants]);

    // City Distribution
    const cityData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const city = app.applicantDetails?.city?.trim();
            if (city) counts[city] = (counts[city] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [uniqueApplicants]);

    // ===== EDUCATION TAB DATA =====

    // Study Level Distribution
    const studyLevelData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const level = app.applicantDetails?.studyLevel?.trim();
            if (level) counts[level] = (counts[level] || 0) + 1;
        });
        return Object.entries(counts).map(([label, value], id) => ({
            id, value, label, color: colors[id % colors.length]
        }));
    }, [uniqueApplicants]);

    // College Distribution
    const collegeData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const college = app.applicantDetails?.college?.trim();
            if (college) counts[college] = (counts[college] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [uniqueApplicants]);

    // Major Distribution (Top 10)
    const majorData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const major = app.applicantDetails?.major?.trim();
            if (major) counts[major] = (counts[major] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [uniqueApplicants]);

    // GPA Distribution (Histogram)
    const gpaDistribution = useMemo(() => {
        const ranges = {
            '3.5 - 4.0': 0,
            '3.0 - 3.49': 0,
            '2.5 - 2.99': 0,
            '2.0 - 2.49': 0,
            'Below 2.0': 0
        };
        uniqueApplicants.forEach(app => {
            const gpa = parseFloat(app.applicantDetails?.cgpa);
            if (!isNaN(gpa)) {
                if (gpa >= 3.5) ranges['3.5 - 4.0']++;
                else if (gpa >= 3.0) ranges['3.0 - 3.49']++;
                else if (gpa >= 2.5) ranges['2.5 - 2.99']++;
                else if (gpa >= 2.0) ranges['2.0 - 2.49']++;
                else ranges['Below 2.0']++;
            }
        });
        return Object.entries(ranges);
    }, [uniqueApplicants]);

    // ===== RECRUITMENT TAB DATA =====

    // Shortlist Rate by Company
    const shortlistData = useMemo(() => {
        const counts = {};
        applicants?.forEach(app => {
            app.shortlistedBy?.forEach(company => {
                counts[company] = (counts[company] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [applicants]);

    // Flag Heat Map (Most Flagged)
    const flagData = useMemo(() => {
        const flagged = applicants?.filter(app => app.flags?.length > 0) || [];
        const sorted = flagged.sort((a, b) => (b.flags?.length || 0) - (a.flags?.length || 0));
        return sorted.slice(0, 10).map(app => ({
            name: app.applicantDetails?.fullName || 'Unknown',
            count: app.flags?.length || 0,
            companies: app.flags?.join(', ') || ''
        }));
    }, [applicants]);

    // Company Popularity
    const companyPopularity = useMemo(() => {
        const counts = {};
        applicants?.forEach(app => {
            app.user_id?.forEach(company => {
                if (company && company !== 'CASTO Office') {
                    counts[company] = (counts[company] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [applicants]);

    // Sector Demand
    const sectorDemand = useMemo(() => {
        const sectorApplicants = {};
        companies?.forEach(company => {
            const sector = company.sector?.toLowerCase();
            if (sector) {
                const companyApplicants = applicants?.filter(app =>
                    app.user_id?.includes(company.companyName)
                ).length || 0;
                sectorApplicants[sector] = (sectorApplicants[sector] || 0) + companyApplicants;
            }
        });
        return Object.entries(sectorApplicants).map(([label, value]) => ([
            label.charAt(0).toUpperCase() + label.slice(1),
            value
        ]));
    }, [applicants, companies]);

    // ===== PROFILE TAB DATA =====

    // CV Upload Rate
    const cvRate = useMemo(() => {
        const withCV = uniqueApplicants.filter(app => app.cv).length;
        const total = uniqueApplicants.length;
        return { withCV, withoutCV: total - withCV, percentage: total > 0 ? ((withCV / total) * 100).toFixed(1) : 0 };
    }, [uniqueApplicants]);

    // LinkedIn Profile Rate
    const linkedInRate = useMemo(() => {
        const withProfile = uniqueApplicants.filter(app =>
            app.applicantDetails?.linkedIn && app.applicantDetails.linkedIn.trim() !== ''
        ).length;
        const total = uniqueApplicants.length;
        return { withProfile, withoutProfile: total - withProfile, percentage: total > 0 ? ((withProfile / total) * 100).toFixed(1) : 0 };
    }, [uniqueApplicants]);

    // Expected Graduation Distribution
    const graduationData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const gradDate = app.applicantDetails?.ExpectedToGraduate;
            if (gradDate) {
                const year = new Date(gradDate).getFullYear();
                if (!isNaN(year)) {
                    counts[year] = (counts[year] || 0) + 1;
                }
            }
        });
        return Object.entries(counts).sort((a, b) => a[0] - b[0]);
    }, [uniqueApplicants]);

    // Experience Rate
    const experienceRate = useMemo(() => {
        const withExp = uniqueApplicants.filter(a => a.applicantDetails?.experience?.trim()).length;
        const total = uniqueApplicants.length;
        return { withExp, withoutExp: total - withExp, percentage: total > 0 ? ((withExp / total) * 100).toFixed(1) : 0 };
    }, [uniqueApplicants]);

    // Languages Distribution
    const languagesData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const langs = app.applicantDetails?.languages;
            if (langs) {
                String(langs).split(',').forEach(lang => {
                    const trimmed = lang.trim();
                    if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [uniqueApplicants]);

    // ===== COMPANIES TAB DATA =====

    // Opportunity Types Distribution
    const opportunityTypesData = useMemo(() => {
        const counts = {};
        companies?.forEach(company => {
            const types = company.opportunityTypes || [];
            types.forEach(type => {
                if (type) counts[type] = (counts[type] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([label, value], id) => ({
            id, value, label, color: colors[id % colors.length]
        }));
    }, [companies]);

    // Preferred Majors Distribution (Top 15)
    const preferredMajorsData = useMemo(() => {
        const counts = {};
        companies?.forEach(company => {
            const majors = company.preferredMajors || [];
            majors.forEach(major => {
                if (major) counts[major] = (counts[major] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    }, [companies]);

    // Companies by Sector
    const companySectorData = useMemo(() => {
        const counts = {};
        companies?.forEach(company => {
            const sector = company.sector?.trim();
            if (sector) counts[sector] = (counts[sector] || 0) + 1;
        });
        return Object.entries(counts).map(([label, value], id) => ({
            id, value, label, color: colors[id % colors.length]
        }));
    }, [companies]);

    // Companies by City
    const companyCityData = useMemo(() => {
        const counts = {};
        companies?.forEach(company => {
            const city = company.city?.trim();
            if (city) counts[city] = (counts[city] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);
    }, [companies]);

    // Company Fields Distribution
    const companyFieldsData = useMemo(() => {
        const counts = {};
        companies?.forEach(company => {
            if (typeof company.fields === 'string') {
                company.fields.split(',').forEach(field => {
                    const clean = field.trim();
                    if (clean && clean.toLowerCase() !== 'office and students fairs') {
                        counts[clean] = (counts[clean] || 0) + 1;
                    }
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);
    }, [companies]);

    // Number of Positions Total
    const totalPositions = useMemo(() => {
        return companies?.reduce((sum, company) => {
            const pos = parseInt(company.noOfPositions) || 0;
            return sum + pos;
        }, 0) || 0;
    }, [companies]);

    // Representatives Count
    const totalRepresentatives = useMemo(() => {
        return companies?.reduce((sum, company) => {
            if (typeof company.representatives === 'string') {
                return sum + company.representatives.split(',').filter(r => r.trim()).length;
            }
            return sum;
        }, 0) || 0;
    }, [companies]);

    // ===== SKILLS TAB DATA =====

    // Technical Skills Distribution (from applicants)
    const techSkillsData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const skills = app.applicantDetails?.skills?.tech || app.applicantDetails?.['Technical Skills'];
            if (skills) {
                // Handle both array and string formats
                const skillsList = Array.isArray(skills) ? skills : String(skills).split(',');
                skillsList.forEach(skill => {
                    const trimmed = skill.trim();
                    if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    }, [uniqueApplicants]);

    // Non-Technical Skills Distribution
    const nonTechSkillsData = useMemo(() => {
        const counts = {};
        uniqueApplicants.forEach(app => {
            const skills = app.applicantDetails?.skills?.nontech || app.applicantDetails?.['Non-technical skills'];
            if (skills) {
                const skillsList = Array.isArray(skills) ? skills : String(skills).split(',');
                skillsList.forEach(skill => {
                    const trimmed = skill.trim();
                    if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    }, [uniqueApplicants]);

    // Tabs without icons
    const tabs = [
        { id: 'demographics', label: t('advancedAnalytics.tabs.demographics') },
        { id: 'education', label: t('advancedAnalytics.tabs.education') },
        { id: 'companies', label: t('advancedAnalytics.tabs.companies') },
        { id: 'skills', label: t('advancedAnalytics.tabs.skills') },
        { id: 'recruitment', label: t('advancedAnalytics.tabs.recruitment') },
        { id: 'profiles', label: t('advancedAnalytics.tabs.profiles') }
    ];

    const StatCard = ({ title, value, subtitle, color }) => (
        <div className="bg-surface-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color ? "" : "text-primary"}`} style={color ? { color } : undefined}>{value}</p>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );

    const ChartContainer = ({ title, children, className = '' }) => (
        <div className={`bg-surface-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col ${className}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
            <div className="flex-1 min-h-0 w-full">{children}</div>
        </div>
    );

    // Pie chart with legend on the right side
    const PieWithLegend = ({ data }) => (
        <div className="flex items-center justify-center gap-4 h-full">
            <PieChart
                series={[{
                    data: data,
                    innerRadius: 25,
                    outerRadius: 60,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    cx: 65,
                    cy: 65
                }]}
                width={140}
                height={140}
                slotProps={{ legend: { hidden: true } }}
            />
            <div className="flex flex-col gap-1">
                {data.map((item, idx) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: item.color || colors[idx % colors.length] }}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{item.label}: <strong>{item.value}</strong></span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-surface rounded-xl p-4 h-full overflow-hidden flex flex-col">
            {/* Tab Navigation — sliding pill */}
            <div className="relative flex gap-1 mb-4 overflow-x-auto pb-1 bg-surface-card rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Sliding pill — shared .tab-pill motion (see style.css) plus
                    an opacity fade for its initial appearance. */}
                <div
                    className="tab-pill absolute top-1 bottom-1 rounded-lg bg-primary shadow-md pointer-events-none"
                    style={{
                        width: pillStyle.width,
                        insetInlineStart: pillStyle.left + 4,
                        opacity: pillStyle.opacity,
                        transitionProperty: 'inset-inline-start, width, opacity',
                    }}
                />
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        ref={el => tabRefs.current[tab.id] = el}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                            activeTab === tab.id ? 'text-primary-contrast' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto pe-1.5 pb-1">
                {/* Demographics Tab */}
                {activeTab === 'demographics' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Gender Distribution - Pie with side legend */}
                        <ChartContainer title={t('advancedAnalytics.genderDistribution')} className="col-span-4">
                            <PieWithLegend data={genderData} />
                        </ChartContainer>

                        {/* Nationality Breakdown - Side by side with City */}
                        <ChartContainer title={t('advancedAnalytics.top10Nationalities')} className="col-span-8 row-span-2">
                            <ResponsiveBarChart data={nationalityData} layout="horizontal" color="#0E7F41" />
                        </ChartContainer>

                        {/* Attendance Status - Below Gender */}
                        <ChartContainer title={t('applicants.columns.status')} className="col-span-4">
                            <PieWithLegend data={[
                                { id: 0, value: uniqueApplicants.filter(a => a.attended).length, label: t('advancedAnalytics.attended'), color: '#0E7F41' },
                                { id: 1, value: uniqueApplicants.filter(a => !a.attended).length, label: t('enums.status.Registered'), color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* City Distribution - Full width */}
                        <ChartContainer title={t('advancedAnalytics.applicantsByCity')} className="col-span-12">
                            <ResponsiveBarChart data={cityData} layout="horizontal" color="#0066CC" />
                        </ChartContainer>
                    </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Study Level Distribution - Pie with side legend */}
                        <ChartContainer title={t('advancedAnalytics.studyLevelDistribution')} className="col-span-4">
                            <PieWithLegend data={studyLevelData} />
                        </ChartContainer>

                        {/* GPA Distribution - Bar chart */}
                        <ChartContainer title={t('advancedAnalytics.gpaDistribution')} className="col-span-8">
                            <ResponsiveBarChart data={gpaDistribution} layout="vertical" color="#0E7F41" height={180} />
                        </ChartContainer>

                        {/* College Distribution - Half width */}
                        <ChartContainer title={t('advancedAnalytics.applicantsByCollege')} className="col-span-6">
                            <ResponsiveBarChart data={collegeData} layout="horizontal" color="#9333EA" />
                        </ChartContainer>

                        {/* Major Distribution - Half width */}
                        <ChartContainer title={t('advancedAnalytics.top10Majors')} className="col-span-6">
                            <ResponsiveBarChart data={majorData} layout="horizontal" color="#0066CC" />
                        </ChartContainer>
                    </div>
                )}

                {/* Companies Tab */}
                {activeTab === 'companies' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Summary Stats */}
                        <div className="col-span-12 grid grid-cols-4 gap-4">
                            <StatCard
                                title={t('eventOps.requirements.company')}
                                value={companies?.length || 0}
                                subtitle={t('advancedAnalytics.registered')}
                            />
                            <StatCard
                                title={t('managersCols.reps')}
                                value={totalRepresentatives}
                                subtitle={t('advancedAnalytics.ceosAndSeekers')}
                            />
                            <StatCard
                                title={t('settings.profile.openPositions')}
                                value={totalPositions}
                                subtitle={t('advancedAnalytics.availableRoles')}
                            />
                            <StatCard
                                title={t('enums.status.Confirmed')}
                                value={companies?.filter(c => c.status === 'Confirmed').length || 0}
                                subtitle={t('advancedAnalytics.ratePercent', { pct: companies?.length > 0 ? ((companies?.filter(c => c.status === 'Confirmed').length / companies.length) * 100).toFixed(0) : 0 })}
                            />
                        </div>

                        {/* Sector Distribution - Pie */}
                        <ChartContainer title={t('advancedAnalytics.companiesBySector')} className="col-span-4">
                            <PieWithLegend data={companySectorData} />
                        </ChartContainer>

                        {/* Opportunity Types - Pie */}
                        <ChartContainer title={t('advancedAnalytics.opportunityTypesOffered')} className="col-span-4">
                            {opportunityTypesData.length > 0 ? (
                                <PieWithLegend data={opportunityTypesData} />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noOpportunityData')}</p>
                            )}
                        </ChartContainer>

                        {/* Companies by City */}
                        <ChartContainer title={t('advancedAnalytics.companiesByCity')} className="col-span-4">
                            {companyCityData.length > 0 ? (
                                <ResponsiveBarChart data={companyCityData} layout="vertical" color="#0066CC" height={180} />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noCityData')}</p>
                            )}
                        </ChartContainer>

                        {/* Company Fields Distribution */}
                        <ChartContainer title={t('settings.profile.industryFields')} className="col-span-6">
                            {companyFieldsData.length > 0 ? (
                                <ResponsiveBarChart data={companyFieldsData} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noFieldsData')}</p>
                            )}
                        </ChartContainer>

                        {/* Preferred Majors by Companies */}
                        <ChartContainer title={t('advancedAnalytics.mostSoughtMajors')} className="col-span-6">
                            {preferredMajorsData.length > 0 ? (
                                <ResponsiveBarChart data={preferredMajorsData} layout="horizontal" color="#9333EA" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noPreferredMajorsData')}</p>
                            )}
                        </ChartContainer>
                    </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Technical Skills */}
                        <ChartContainer title={t('advancedAnalytics.topTechSkills')} className="col-span-6">
                            {techSkillsData.length > 0 ? (
                                <ResponsiveBarChart data={techSkillsData} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noTechSkillsData')}</p>
                            )}
                        </ChartContainer>

                        {/* Non-Technical Skills */}
                        <ChartContainer title={t('advancedAnalytics.topNonTechSkills')} className="col-span-6">
                            {nonTechSkillsData.length > 0 ? (
                                <ResponsiveBarChart data={nonTechSkillsData} layout="horizontal" color="#0066CC" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noNonTechSkillsData')}</p>
                            )}
                        </ChartContainer>

                        {/* Languages */}
                        <ChartContainer title={t('advancedAnalytics.languagesSpokenByApplicants')} className="col-span-6">
                            {languagesData.length > 0 ? (
                                <ResponsiveBarChart data={languagesData} layout="horizontal" color="#9333EA" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noLanguageData')}</p>
                            )}
                        </ChartContainer>

                        {/* Experience Rate Card */}
                        <ChartContainer title={t('advancedAnalytics.workExperienceStatus')} className="col-span-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('advancedAnalytics.withExperience')}</span>
                                    <span className="text-lg font-bold text-primary">{experienceRate.withExp}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('advancedAnalytics.noExperience')}</span>
                                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500">{experienceRate.withoutExp}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/15 rounded-lg">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t('advancedAnalytics.experienceRate')}</span>
                                    <span className="text-lg font-bold text-primary">{experienceRate.percentage}%</span>
                                </div>
                            </div>
                        </ChartContainer>
                    </div>
                )}

                {/* Recruitment Tab */}
                {activeTab === 'recruitment' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Summary Stats */}
                        <div className="col-span-12 grid grid-cols-4 gap-4">
                            <StatCard
                                title={t('advancedAnalytics.totalShortlisted')}
                                value={applicants?.filter(a => a.shortlistedBy?.length > 0).length || 0}
                                subtitle={t('advancedAnalytics.byAnyCompany')}
                            />
                            <StatCard
                                title={t('advancedAnalytics.totalFlagged')}
                                value={applicants?.filter(a => a.flags?.length > 0).length || 0}
                                subtitle={t('advancedAnalytics.interestingCandidates')}
                            />
                            <StatCard
                                title={t('advancedAnalytics.totalRejected')}
                                value={applicants?.filter(a => a.rejectedBy?.length > 0).length || 0}
                                subtitle={t('advancedAnalytics.byAnyCompany')}
                            />
                            <StatCard
                                title={t('advancedAnalytics.conversionRate')}
                                value={`${uniqueApplicants.length > 0 ? ((applicants?.filter(a => a.shortlistedBy?.length > 0).length / uniqueApplicants.length) * 100).toFixed(1) : 0}%`}
                                subtitle={t('advancedAnalytics.shortlistRate')}
                            />
                        </div>

                        {/* Most Applied Companies - Half width */}
                        <ChartContainer title={t('advancedAnalytics.mostAppliedCompanies')} className="col-span-6">
                            {companyPopularity.length > 0 ? (
                                <ResponsiveBarChart data={companyPopularity} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noApplicationData')}</p>
                            )}
                        </ChartContainer>

                        {/* Shortlist by Company - Half width */}
                        <ChartContainer title={t('advancedAnalytics.shortlistsByCompany')} className="col-span-6">
                            {shortlistData.length > 0 ? (
                                <ResponsiveBarChart data={shortlistData} layout="horizontal" color="#0066CC" />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noShortlistData')}</p>
                            )}
                        </ChartContainer>

                        {/* Flag Heat Map */}
                        <ChartContainer title={t('advancedAnalytics.mostFlaggedApplicants')} className="col-span-6">
                            {flagData.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {flagData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={item.companies}>{item.companies}</p>
                                            </div>
                                            <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-bold ms-2 flex-shrink-0">
                                                {t('advancedAnalytics.flagsCount', { count: item.count })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noFlaggedApplicants')}</p>
                            )}
                        </ChartContainer>

                        {/* Sector Demand */}
                        <ChartContainer title={t('advancedAnalytics.applicationsBySector')} className="col-span-6">
                            {sectorDemand.length > 0 ? (
                                <ResponsiveBarChart data={sectorDemand} layout="vertical" color="#0066CC" height={220} />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noSectorData')}</p>
                            )}
                        </ChartContainer>
                    </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'profiles' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Profile Completion Stats */}
                        <div className="col-span-12 grid grid-cols-4 gap-4">
                            <StatCard
                                title={t('advancedAnalytics.cvUploadRate')}
                                value={`${cvRate.percentage}%`}
                                subtitle={t('advancedAnalytics.xOfY', { x: cvRate.withCV, y: uniqueApplicants.length })}
                            />
                            <StatCard
                                title={t('advancedAnalytics.linkedInProfileRate')}
                                value={`${linkedInRate.percentage}%`}
                                subtitle={t('advancedAnalytics.xOfY', { x: linkedInRate.withProfile, y: uniqueApplicants.length })}
                            />
                            <StatCard
                                title={t('advancedAnalytics.experienceRate')}
                                value={`${experienceRate.percentage}%`}
                                subtitle={t('advancedAnalytics.withExperienceCount', { count: experienceRate.withExp })}
                            />
                            <StatCard
                                title={t('advancedAnalytics.confirmedAttendance')}
                                value={uniqueApplicants.filter(a => a.attended).length}
                                subtitle={t('advancedAnalytics.ratePercent', { pct: ((uniqueApplicants.filter(a => a.attended).length / uniqueApplicants.length) * 100 || 0).toFixed(1) })}
                            />
                        </div>

                        {/* CV Stats Pie with side legend */}
                        <ChartContainer title={t('advancedAnalytics.cvUploadStatus')} className="col-span-4">
                            <PieWithLegend data={[
                                { id: 0, value: cvRate.withCV, label: t('advancedAnalytics.hasCv'), color: '#0E7F41' },
                                { id: 1, value: cvRate.withoutCV, label: t('advancedAnalytics.noCv'), color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* LinkedIn Stats Pie with side legend */}
                        <ChartContainer title={t('advancedAnalytics.linkedInProfileStatus')} className="col-span-4">
                            <PieWithLegend data={[
                                { id: 0, value: linkedInRate.withProfile, label: t('advancedAnalytics.hasLinkedIn'), color: '#0066CC' },
                                { id: 1, value: linkedInRate.withoutProfile, label: t('advancedAnalytics.noLinkedIn'), color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* Experience Stats Pie with side legend */}
                        <ChartContainer title={t('advancedAnalytics.workExperienceStatus')} className="col-span-4">
                            <PieWithLegend data={[
                                { id: 0, value: experienceRate.withExp, label: t('advancedAnalytics.hasExperience'), color: '#9333EA' },
                                { id: 1, value: experienceRate.withoutExp, label: t('advancedAnalytics.noExperience'), color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* Expected Graduation Timeline */}
                        <ChartContainer title={t('advancedAnalytics.expectedGraduationTimeline')} className="col-span-6">
                            {graduationData.length > 0 ? (
                                <ResponsiveBarChart data={graduationData} layout="vertical" color="#9333EA" height={200} />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noGraduationData')}</p>
                            )}
                        </ChartContainer>

                        {/* Languages Distribution */}
                        <ChartContainer title={t('advancedAnalytics.languagesSpoken')} className="col-span-6">
                            {languagesData.length > 0 ? (
                                <ResponsiveBarChart data={languagesData} layout="vertical" color="#14B8A6" height={200} />
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">{t('advancedAnalytics.noLanguageData')}</p>
                            )}
                        </ChartContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
