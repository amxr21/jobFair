import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { BarChartElement, StatisticsElement, TopBar, PieChartElement, TopStatistic, AdvancedAnalytics } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

import { StatsticTypeProvider } from "../Context/StatsticTypeContext"

import { StarIcon, LightningIcon, TrendIcon, GraduationIcon, ChartIcon } from "../components/Icons";

const Statistics = ({ link }) => {
  const path = useLocation();
  const [data, setData] = useState({ applicants: [], managers: [] });
  const [sectors, setSectors] = useState({});
  const [number, setNumber] = useState(0);
  const [mostCompany, setMostCompany] = useState(['', '']);
  const [mostField, setMostField] = useState(['', '']);
  const [topMajor, setTopMajor] = useState(['', '']);
  const [avgGPA, setAvgGPA] = useState(0);
  const [viewMode, setViewMode] = useState('basic'); // 'basic' or 'advanced'

  const { user } = useAuthContext();
  const titles = useRef(['students', 'companies', 'seekers', 'fields']).current;

  // Get unique applicants by uniId, keeping only the latest submission (sorted by createdAt descending)
  const getUniqueLatestApplicants = (applicantsList) => {
    if (!applicantsList || applicantsList.length === 0) return [];

    // Sort by createdAt descending (newest first)
    const sorted = [...applicantsList].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Keep only the first occurrence of each uniId (which is the latest due to sorting)
    const seenIds = new Set();
    return sorted.filter((applicant) => {
      const uniId = applicant.applicantDetails?.uniId;
      if (uniId && !seenIds.has(uniId)) {
        seenIds.add(uniId);
        return true;
      }
      return false;
    });
  };

  const a = getUniqueLatestApplicants(data['applicants']);

  const pieData = [
    { id: 0, value: a?.filter((app) => app.attended).length || 0, label: 'Confirmed' },
    { id: 1, value: a?.filter((app) => !app.attended).length || 0, label: 'Registered' },
  ];

  const pieData2 = [
    { id: 0, value: data.managers?.filter((m) => m.status == 'Confirmed').length || 0, label: 'Confirmed' },
    { id: 1, value: data.managers?.filter((m) => m.status != 'Confirmed').length || 0, label: 'Canceled' },
  ];

  const categoryData1 = [
    { id: 0, value: data.managers?.filter((m) => m.city?.toLowerCase() == "ajman").length, label: "Ajman" },
    { id: 1, value: data.managers?.filter((m) => m.city?.toLowerCase() == "sharjah").length, label: "Sharjah" },
    { id: 2, value: data.managers?.filter((m) => m.city?.toLowerCase() == "dubai").length, label: "Dubai" },
    { id: 3, value: data.managers?.filter((m) => m.city?.toLowerCase() == "abu dhabi").length, label: "Abu Dhabi" },
    { id: 4, value: data.managers?.filter((m) => m.city?.toLowerCase() == "ras al khaima").length, label: "Ras Al Khaima" },
  ]

  const categoryData2 = [
    { id: 0, value: data.managers?.filter((m) => m.sector?.toLowerCase() == "semi").length, label: "Semi" },
    { id: 1, value: data.managers?.filter((m) => m.sector?.toLowerCase() == "local").length, label: "Local" },
    { id: 2, value: data.managers?.filter((m) => m.sector?.toLowerCase() == "federal").length, label: "Federal" },
    { id: 3, value: data.managers?.filter((m) => m.sector?.toLowerCase() == "private").length, label: "Private" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [applicantsRes, managersRes] = await Promise.all([
          axios.get(`${link}/applicants?limit=10000`),
          axios.get(`${link}/companies`)
        ]);

        // Handle new paginated response format
        const applicantsData = applicantsRes?.data?.applicants || applicantsRes?.data || [];

        setData({
          applicants: applicantsData,
          managers: managersRes?.data || []
        });
      } catch (error) {
        console.error("Fetch error:", error.message);
      }
    };

    fetchData();
  }, [user, path.pathname, link]);

  useEffect(() => {
    const countSectors = () => {
      const counts = {};
      data.managers.forEach((company) => {
        if (typeof company.fields === 'string') {
          company.fields.split(',').forEach(field => {
            const clean = field.trim().toLowerCase().replace(/[^ء-ي\w\s/-]/g, '');
            if (clean) counts[clean] = (counts[clean] || 0) + 1;
          });
        }
      });
      return counts;
    };

    const sectorsCount = countSectors();
    setSectors(sectorsCount);

    const maxField = Object.entries(sectorsCount).find(([_, val]) => val === Math.max(...Object.values(sectorsCount)));
    if (maxField) setMostField(maxField);

    const reps = [];
    data?.managers.forEach(manager => {
      // Note: 'representitives' is the field name in the database (kept for backward compatibility)
      if (typeof manager.representitives === 'string') {
        reps.push(...manager.representitives.split(',').map(rep => rep.trim()).filter(r => r));
      }
    });

    // Get unique attended applicants
    const attendedIds = new Set();
    data?.applicants?.forEach(app => {
      if (app.attended && app.applicantDetails?.uniId) {
        attendedIds.add(app.applicantDetails.uniId);
      }
    });

    const applicantsCount = attendedIds.size;
    const representativesCount = reps.length;
    const total = representativesCount + applicantsCount;
    setNumber(Math.round((total / 629) * 100));
  }, [data]);

  useEffect(() => {
    const counts = {};
    data?.applicants.forEach(applicant => {
      applicant.user_id?.forEach(company => {
        counts[company] = (counts[company] || 0) + 1;
      });
    });

    const maxEntry = Object.entries(counts).find(([_, val]) => val === Math.max(...Object.values(counts)));
    if (maxEntry) setMostCompany(maxEntry);

    // Get unique applicants for major and GPA calculations
    const seenIds = new Set();
    const uniqueApplicants = data.applicants.filter(applicant => {
      const id = applicant.applicantDetails?.uniId;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        return true;
      }
      return false;
    });

    // Calculate top major from unique applicants
    const majorCounts = {};
    uniqueApplicants.forEach(applicant => {
      const major = applicant.applicantDetails?.major?.trim();
      if (major) majorCounts[major] = (majorCounts[major] || 0) + 1;
    });
    const topMajorEntry = Object.entries(majorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMajorEntry) setTopMajor(topMajorEntry);

    // Calculate average GPA from unique applicants
    const gpas = uniqueApplicants
      .map(app => parseFloat(app.applicantDetails?.cgpa))
      .filter(gpa => !isNaN(gpa) && gpa > 0);
    if (gpas.length > 0) {
      setAvgGPA((gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length).toFixed(2));
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-y-3 md:gap-y-4 flex-1 min-w-0 h-full max-h-[100vh] overflow-hidden p-3 md:p-0">
      {user?.email?.toLowerCase() !== "casto@sharjah.ac.ae" && <TopBar user={user} />}

      {/* View Mode Toggle */}
      <div className="flex justify-end px-1 shrink-0">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setViewMode('basic')}
            className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              viewMode === 'basic'
                ? 'bg-[#0E7F41] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('advanced')}
            className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              viewMode === 'advanced'
                ? 'bg-[#0E7F41] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="hidden sm:inline">Advanced </span>Analytics
          </button>
        </div>
      </div>

      {viewMode === 'basic' ? (
        <div id="Statistics" className="bg-[#F3F6FF] flex-1 min-h-0 overflow-auto rounded-xl p-3 md:p-4 w-full animate-fadeIn">
          <div className="flex flex-col h-full gap-3">
            {/* Row 1 - Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2 md:gap-4 rounded-lg shrink-0">
              {titles.map((type, i) => (
                <StatisticsElement key={i} data={data} type={type} />
              ))}
            </div>

            {/* Row 2 - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 flex-1 min-h-[200px]">
              <StatsticTypeProvider>
                <PieChartElement dataCategory={'applicants_companies'} dataset={[pieData, pieData2]} title="Number of" colorsPair={[['#0E7F41', '#E5FFE5'], ["#2959A6", "#E5F0FF"]]} />
                <PieChartElement dataCategory={'cities_sectors_industries'} dataset={[categoryData1, categoryData2]} title="Companies By" colorsPair={[['#0E7F41', '#E5FFE5'], ["#2959A6", "#E5F0FF"]]} />
              </StatsticTypeProvider>
              <BarChartElement dataset={sectors} />
            </div>

            {/* Row 3 - Bottom stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 md:gap-4 shrink-0">
              <TopStatistic title="Top Company" subtitle="Applications" data={mostCompany?.length ? mostCompany : ['', '']} icon={<StarIcon />} />
              <TopStatistic title="Top Field" subtitle="Companies" data={mostField?.length ? mostField : ['', '']} icon={<TrendIcon />} />
              <TopStatistic title="Top Major" subtitle="Students" data={topMajor?.length ? topMajor : ['', '']} icon={<GraduationIcon />} />
              <TopStatistic title="Avg GPA" subtitle="Applicants" data={avgGPA ? [avgGPA, 'GPA'] : ['', '']} icon={<ChartIcon />} />
              <TopStatistic title="Capacity" subtitle="" data={number ? [`${number}%`, 'Max'] : ['', '']} icon={<LightningIcon />} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden animate-fadeIn">
          <AdvancedAnalytics applicants={data.applicants} companies={data.managers} />
        </div>
      )}
    </div>
  );
};

export default Statistics;
