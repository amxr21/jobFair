import { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';

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

// Responsive Bar Chart wrapper
const ResponsiveBarChart = ({ data, layout = 'vertical', color = '#0E7F41', height = 200 }) => {
    const containerRef = useRef(null);
    const width = useContainerWidth(containerRef);

    if (layout === 'horizontal') {
        return (
            <div ref={containerRef} className="w-full">
                {width > 0 && (
                    <BarChart
                        layout="horizontal"
                        yAxis={[{
                            scaleType: 'band',
                            data: data.map(d => d[0]),
                            tickLabelStyle: { fontSize: 11 }
                        }]}
                        xAxis={[{ tickLabelStyle: { fontSize: 11 } }]}
                        series={[{
                            data: data.map(d => d[1]),
                            color: color,
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
                        tickLabelStyle: { fontSize: 11 }
                    }]}
                    series={[{
                        data: data.map(d => d[1]),
                        color: color,
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
    const [activeTab, setActiveTab] = useState('demographics');

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
    const colors = ['#0E7F41', '#0066CC', '#CC0000', '#EBC600', '#00B4D8', '#9333EA', '#F97316', '#14B8A6', '#EC4899', '#6366F1'];

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
            if (typeof company.representitives === 'string') {
                return sum + company.representitives.split(',').filter(r => r.trim()).length;
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
        { id: 'demographics', label: 'Demographics' },
        { id: 'education', label: 'Education' },
        { id: 'companies', label: 'Companies' },
        { id: 'skills', label: 'Skills' },
        { id: 'recruitment', label: 'Recruitment' },
        { id: 'profiles', label: 'Profiles' }
    ];

    const StatCard = ({ title, value, subtitle, color = '#0E7F41' }) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );

    const ChartContainer = ({ title, children, className = '' }) => (
        <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col ${className}`}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
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
                        <span className="text-xs text-gray-700">{item.label}: <strong>{item.value}</strong></span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-[#F3F6FF] rounded-xl p-4 h-full overflow-hidden flex flex-col">
            {/* Tab Navigation - No icons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-[#0E7F41] text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Demographics Tab */}
                {activeTab === 'demographics' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Gender Distribution - Pie with side legend */}
                        <ChartContainer title="Gender Distribution" className="col-span-4 h-[180px]">
                            <PieWithLegend data={genderData} />
                        </ChartContainer>

                        {/* Nationality Breakdown - Side by side with City */}
                        <ChartContainer title="Top 10 Nationalities" className="col-span-8 row-span-2">
                            <ResponsiveBarChart data={nationalityData} layout="horizontal" color="#0E7F41" />
                        </ChartContainer>

                        {/* Attendance Status - Below Gender */}
                        <ChartContainer title="Attendance Status" className="col-span-4 h-[180px]">
                            <PieWithLegend data={[
                                { id: 0, value: uniqueApplicants.filter(a => a.attended).length, label: 'Attended', color: '#0E7F41' },
                                { id: 1, value: uniqueApplicants.filter(a => !a.attended).length, label: 'Registered', color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* City Distribution - Full width */}
                        <ChartContainer title="Applicants by City" className="col-span-12">
                            <ResponsiveBarChart data={cityData} layout="horizontal" color="#0066CC" />
                        </ChartContainer>
                    </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Study Level Distribution - Pie with side legend */}
                        <ChartContainer title="Study Level Distribution" className="col-span-4 h-[220px]">
                            <PieWithLegend data={studyLevelData} />
                        </ChartContainer>

                        {/* GPA Distribution - Bar chart */}
                        <ChartContainer title="GPA Distribution" className="col-span-8 h-[220px]">
                            <ResponsiveBarChart data={gpaDistribution} layout="vertical" color="#0E7F41" height={180} />
                        </ChartContainer>

                        {/* College Distribution - Half width */}
                        <ChartContainer title="Applicants by College" className="col-span-6">
                            <ResponsiveBarChart data={collegeData} layout="horizontal" color="#9333EA" />
                        </ChartContainer>

                        {/* Major Distribution - Half width */}
                        <ChartContainer title="Top 10 Majors" className="col-span-6">
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
                                title="Total Companies"
                                value={companies?.length || 0}
                                subtitle="Registered"
                                color="#0E7F41"
                            />
                            <StatCard
                                title="Representatives"
                                value={totalRepresentatives}
                                subtitle="CEOs & Talent Seekers"
                                color="#0066CC"
                            />
                            <StatCard
                                title="Open Positions"
                                value={totalPositions}
                                subtitle="Available roles"
                                color="#9333EA"
                            />
                            <StatCard
                                title="Confirmed"
                                value={companies?.filter(c => c.status === 'Confirmed').length || 0}
                                subtitle={`${companies?.length > 0 ? ((companies?.filter(c => c.status === 'Confirmed').length / companies.length) * 100).toFixed(0) : 0}% rate`}
                                color="#14B8A6"
                            />
                        </div>

                        {/* Sector Distribution - Pie */}
                        <ChartContainer title="Companies by Sector" className="col-span-4 h-[220px]">
                            <PieWithLegend data={companySectorData} />
                        </ChartContainer>

                        {/* Opportunity Types - Pie */}
                        <ChartContainer title="Opportunity Types Offered" className="col-span-4 h-[220px]">
                            {opportunityTypesData.length > 0 ? (
                                <PieWithLegend data={opportunityTypesData} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No opportunity data available</p>
                            )}
                        </ChartContainer>

                        {/* Companies by City */}
                        <ChartContainer title="Companies by City" className="col-span-4 h-[220px]">
                            {companyCityData.length > 0 ? (
                                <ResponsiveBarChart data={companyCityData} layout="vertical" color="#0066CC" height={180} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No city data available</p>
                            )}
                        </ChartContainer>

                        {/* Company Fields Distribution */}
                        <ChartContainer title="Industry Fields" className="col-span-6">
                            {companyFieldsData.length > 0 ? (
                                <ResponsiveBarChart data={companyFieldsData} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No fields data available</p>
                            )}
                        </ChartContainer>

                        {/* Preferred Majors by Companies */}
                        <ChartContainer title="Most Sought After Majors" className="col-span-6">
                            {preferredMajorsData.length > 0 ? (
                                <ResponsiveBarChart data={preferredMajorsData} layout="horizontal" color="#9333EA" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No preferred majors data available</p>
                            )}
                        </ChartContainer>
                    </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                    <div className="grid grid-cols-12 gap-4">
                        {/* Technical Skills */}
                        <ChartContainer title="Top Technical Skills (Applicants)" className="col-span-6">
                            {techSkillsData.length > 0 ? (
                                <ResponsiveBarChart data={techSkillsData} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No technical skills data available</p>
                            )}
                        </ChartContainer>

                        {/* Non-Technical Skills */}
                        <ChartContainer title="Top Non-Technical Skills (Applicants)" className="col-span-6">
                            {nonTechSkillsData.length > 0 ? (
                                <ResponsiveBarChart data={nonTechSkillsData} layout="horizontal" color="#0066CC" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No non-technical skills data available</p>
                            )}
                        </ChartContainer>

                        {/* Languages */}
                        <ChartContainer title="Languages Spoken by Applicants" className="col-span-6">
                            {languagesData.length > 0 ? (
                                <ResponsiveBarChart data={languagesData} layout="horizontal" color="#9333EA" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No language data available</p>
                            )}
                        </ChartContainer>

                        {/* Experience Rate Card */}
                        <ChartContainer title="Work Experience Status" className="col-span-6 h-[280px]">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700">With Experience</span>
                                    <span className="text-lg font-bold text-[#0E7F41]">{experienceRate.withExp}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700">No Experience</span>
                                    <span className="text-lg font-bold text-gray-400">{experienceRate.withoutExp}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm text-gray-700">Experience Rate</span>
                                    <span className="text-lg font-bold text-[#0E7F41]">{experienceRate.percentage}%</span>
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
                                title="Total Shortlisted"
                                value={applicants?.filter(a => a.shortlistedBy?.length > 0).length || 0}
                                subtitle="By any company"
                                color="#0066CC"
                            />
                            <StatCard
                                title="Total Flagged"
                                value={applicants?.filter(a => a.flags?.length > 0).length || 0}
                                subtitle="Interesting candidates"
                                color="#0E7F41"
                            />
                            <StatCard
                                title="Total Rejected"
                                value={applicants?.filter(a => a.rejectedBy?.length > 0).length || 0}
                                subtitle="By any company"
                                color="#CC0000"
                            />
                            <StatCard
                                title="Conversion Rate"
                                value={`${uniqueApplicants.length > 0 ? ((applicants?.filter(a => a.shortlistedBy?.length > 0).length / uniqueApplicants.length) * 100).toFixed(1) : 0}%`}
                                subtitle="Shortlist rate"
                                color="#9333EA"
                            />
                        </div>

                        {/* Most Applied Companies - Half width */}
                        <ChartContainer title="Most Applied Companies" className="col-span-6">
                            {companyPopularity.length > 0 ? (
                                <ResponsiveBarChart data={companyPopularity} layout="horizontal" color="#0E7F41" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No application data available</p>
                            )}
                        </ChartContainer>

                        {/* Shortlist by Company - Half width */}
                        <ChartContainer title="Shortlists by Company" className="col-span-6">
                            {shortlistData.length > 0 ? (
                                <ResponsiveBarChart data={shortlistData} layout="horizontal" color="#0066CC" />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No shortlist data available</p>
                            )}
                        </ChartContainer>

                        {/* Flag Heat Map */}
                        <ChartContainer title="Most Flagged Applicants" className="col-span-6">
                            {flagData.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {flagData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-400 truncate" title={item.companies}>{item.companies}</p>
                                            </div>
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold ml-2 flex-shrink-0">
                                                {item.count} flags
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No flagged applicants</p>
                            )}
                        </ChartContainer>

                        {/* Sector Demand */}
                        <ChartContainer title="Applications by Sector" className="col-span-6 h-[280px]">
                            {sectorDemand.length > 0 ? (
                                <ResponsiveBarChart data={sectorDemand} layout="vertical" color="#0066CC" height={220} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No sector data available</p>
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
                                title="CV Upload Rate"
                                value={`${cvRate.percentage}%`}
                                subtitle={`${cvRate.withCV} of ${uniqueApplicants.length}`}
                                color="#0E7F41"
                            />
                            <StatCard
                                title="LinkedIn Profile Rate"
                                value={`${linkedInRate.percentage}%`}
                                subtitle={`${linkedInRate.withProfile} of ${uniqueApplicants.length}`}
                                color="#0066CC"
                            />
                            <StatCard
                                title="Experience Rate"
                                value={`${experienceRate.percentage}%`}
                                subtitle={`${experienceRate.withExp} with experience`}
                                color="#9333EA"
                            />
                            <StatCard
                                title="Confirmed Attendance"
                                value={uniqueApplicants.filter(a => a.attended).length}
                                subtitle={`${((uniqueApplicants.filter(a => a.attended).length / uniqueApplicants.length) * 100 || 0).toFixed(1)}% rate`}
                                color="#14B8A6"
                            />
                        </div>

                        {/* CV Stats Pie with side legend */}
                        <ChartContainer title="CV Upload Status" className="col-span-4 h-[200px]">
                            <PieWithLegend data={[
                                { id: 0, value: cvRate.withCV, label: 'Has CV', color: '#0E7F41' },
                                { id: 1, value: cvRate.withoutCV, label: 'No CV', color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* LinkedIn Stats Pie with side legend */}
                        <ChartContainer title="LinkedIn Profile Status" className="col-span-4 h-[200px]">
                            <PieWithLegend data={[
                                { id: 0, value: linkedInRate.withProfile, label: 'Has LinkedIn', color: '#0066CC' },
                                { id: 1, value: linkedInRate.withoutProfile, label: 'No LinkedIn', color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* Experience Stats Pie with side legend */}
                        <ChartContainer title="Work Experience Status" className="col-span-4 h-[200px]">
                            <PieWithLegend data={[
                                { id: 0, value: experienceRate.withExp, label: 'Has Experience', color: '#9333EA' },
                                { id: 1, value: experienceRate.withoutExp, label: 'No Experience', color: '#E5E7EB' }
                            ]} />
                        </ChartContainer>

                        {/* Expected Graduation Timeline */}
                        <ChartContainer title="Expected Graduation Timeline" className="col-span-6 h-[260px]">
                            {graduationData.length > 0 ? (
                                <ResponsiveBarChart data={graduationData} layout="vertical" color="#9333EA" height={200} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No graduation data available</p>
                            )}
                        </ChartContainer>

                        {/* Languages Distribution */}
                        <ChartContainer title="Languages Spoken" className="col-span-6 h-[260px]">
                            {languagesData.length > 0 ? (
                                <ResponsiveBarChart data={languagesData} layout="vertical" color="#14B8A6" height={200} />
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">No language data available</p>
                            )}
                        </ChartContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
