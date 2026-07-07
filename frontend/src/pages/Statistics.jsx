import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { PieChart } from "@mui/x-charts/PieChart";

import { BarChartElement, StatisticsElement, TopBar, PieChartElement, TopStatistic, AdvancedAnalytics } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";

import { StatsticTypeProvider } from "../context/StatsticTypeContext"

import { StarIcon, LightningIcon, TrendIcon, GraduationIcon, ChartIcon } from "../components/Icons";
import { useToast } from "../components/Toast";

// A single-dataset pie card — same visual language as PieChartElement, but
// for a dimension that doesn't need its filter-toggle machinery (one clean
// series, no sub-category switch)
const SimplePieCard = ({ title, data, colors }) => (
  <div className="bg-white rounded-lg p-2 md:p-3 flex flex-col w-full h-full overflow-hidden min-h-[240px]">
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-xs font-medium text-gray-700">{title}</h2>
    </div>
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 overflow-hidden">
      <div className="flex-shrink-0">
        <PieChart
          sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
          height={190}
          width={190}
          colors={colors}
          series={[{
            data, innerRadius: 34, outerRadius: 80, paddingAngle: 4, cornerRadius: 4,
            startAngle: 90, endAngle: 450, cx: 95, cy: 95,
          }]}
          tooltip={{ trigger: "none" }}
          skipAnimation={true}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-1 px-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-xs font-medium">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Statistics = ({ link }) => {
  const path = useLocation();
  const toast = useToast();
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

  // Applicant gender split — a demographic dimension not covered by the other
  // two pies (which are about attendance/company status), from real submissions
  const genderData = [
    { id: 0, value: a?.filter((app) => app.applicantDetails?.gender === 'Male').length || 0, label: 'Male' },
    { id: 1, value: a?.filter((app) => app.applicantDetails?.gender === 'Female').length || 0, label: 'Female' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
        const [applicantsRes, managersRes] = await Promise.all([
          axios.get(`${link}/applicants?limit=10000`, authHeader),
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
      if (typeof manager.representatives === 'string') {
        reps.push(...manager.representatives.split(',').map(rep => rep.trim()).filter(r => r));
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
    <div className="flex flex-col gap-y-2 flex-1 min-w-0 h-full max-h-[100vh] overflow-hidden p-2 md:p-0">
      {user?.email?.toLowerCase() !== "casto@sharjah.ac.ae" && <TopBar user={user} />}

      {/* View Mode Toggle — sliding pill over two equal-width cells */}
      <div className="flex justify-end px-0.5 shrink-0">
        <div className="relative grid grid-cols-2 bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
          {/* Sliding pill — buttons share the same width, so 50% always matches */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-md bg-[#0E7F41] shadow-md"
            style={{
              width: 'calc(50% - 2px)',
              left: viewMode === 'basic' ? '2px' : 'calc(50% + 0px)',
              transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
          <button
            onClick={() => { setViewMode('basic'); toast('Switched to Overview', { type: 'info', duration: 1600 }); }}
            className={`relative z-10 px-2.5 md:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
              viewMode === 'basic' ? 'text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => { setViewMode('advanced'); toast('Switched to Advanced Analytics', { type: 'info', duration: 1600 }); }}
            className={`relative z-10 px-2.5 md:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
              viewMode === 'advanced' ? 'text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Advanced </span>Analytics
          </button>
        </div>
      </div>

      {viewMode === 'basic' ? (
        <div id="Statistics" className="bg-[#F3F6FF] flex-1 min-h-0 overflow-auto rounded-lg p-2 md:p-3 w-full animate-fadeIn">
          <div className="flex flex-col h-full gap-2">
            {/* Row 1 - Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-1.5 md:gap-2 rounded-lg shrink-0">
              {titles.map((type, i) => (
                <StatisticsElement key={i} data={data} type={type} />
              ))}
            </div>

            {/* Row 2a - Pie charts, side by side in their own band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2 shrink-0">
              <StatsticTypeProvider>
                <PieChartElement dataCategory={'applicants_companies'} dataset={[pieData, pieData2]} title="Number of" colorsPair={[['#0E7F41', '#E5FFE5'], ["#2959A6", "#E5F0FF"]]} />
                <PieChartElement dataCategory={'cities_sectors_industries'} dataset={[categoryData1, categoryData2]} title="Companies By" colorsPair={[['#0E7F41', '#E5FFE5'], ["#2959A6", "#E5F0FF"]]} />
              </StatsticTypeProvider>
              <SimplePieCard title="Applicants By Gender" data={genderData} colors={["#0066CC", "#EC4899"]} />
            </div>

            {/* Row 2b - Bar chart, full width with real room to breathe */}
            <div className="flex-1 min-h-[280px]">
              <BarChartElement dataset={sectors} />
            </div>

            {/* Row 3 - Bottom stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-1.5 md:gap-2 shrink-0">
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
