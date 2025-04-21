import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { BarChartElement, StatisticsElement, TopBar, PieChartElement, TopStatistic } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

import { StarIcon, LightningIcon, TrendIcon } from "../components/Icons";

const Statistics = ({ link }) => {
  const path = useLocation();
  const [data, setData] = useState({ applicants: [], managers: [] });
  const [sectors, setSectors] = useState({});
  const [number, setNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mostCompany, setMostCompany] = useState(['', '']);
  const [mostField, setMostField] = useState(['', '']);

  const { user } = useAuthContext();
  const titles = useRef(['students', 'companies', 'seekers', 'fields']).current;


  let allIds = []
  
  


  let a = data['applicants'].filter((applicant) => {
    if(!allIds.includes(applicant.applicantDetails.uniId)) {
        allIds.push(applicant.applicantDetails.uniId)
        return true
    }
    return false
    });







  const pieData = [
    { id: 0, value: a?.filter((app) => app.attended).length || 0, label: 'Confirmed' },
    { id: 1, value: a?.filter((app) => !app.attended).length || 0, label: 'Unconfirmed' },
  ];

  const pieData2 = [
    { id: 0, value: data.managers?.filter((m) => m.status == 'Confirmed').length || 0, label: 'Confirmed' },
    { id: 1, value: data.managers?.filter((m) => m.status == 'Canceled').length || 0, label: 'Unconfirmed' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [applicantsRes, managersRes] = await Promise.all([
          axios.get(`${link}/applicants`),
          axios.get(`${link}/companies`)
        ]);

        setData({
          applicants: applicantsRes?.data || [],
          managers: managersRes?.data || []
        });
      } catch (error) {
        console.error("Fetch error:", error.message);
      } finally {
        setIsLoading(false);
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
    data.managers.forEach(manager => {
      if (typeof manager.representitives === 'string') {
        reps.push(...manager.representitives.split(',').map(rep => rep.trim()));
      }
    });

    const applicantsCount = data.applicants?.filter(app => app.attended).length || 0;
    const representitivesCount = reps.length;
    const total = representitivesCount + applicantsCount;
    setNumber(Math.round((total / 60) * 100));
  }, [data]);

  useEffect(() => {
    const counts = {};
    data.applicants.forEach(applicant => {
      applicant.user_id?.forEach(company => {
        counts[company] = (counts[company] || 0) + 1;
      });
    });

    const maxEntry = Object.entries(counts).find(([_, val]) => val === Math.max(...Object.values(counts)));
    if (maxEntry) setMostCompany(maxEntry);
  }, [data]);

  return (
    <div className="flex flex-col gap-y-8 col-span-10 w-full mx-auto max-h-[100vh] overflow-hidden">
      {user?.email?.toLowerCase() !== "casto@sharjah.ac.ae" && <TopBar user={user} />}

      <div id="Statistics" className="bg-[#F3F6FF] min-h-full h-full overflow-y-auto grow rounded-xl px-6 py-4 col-span-10   mx-auto">
        <div className="flex flex-col w-full gap-3">
          <div className="grid grid-cols-12 gap-x-5 rounded-lg overflow-hidden">
            {titles.map((type, i) => (
              <StatisticsElement key={i} data={data} type={type} />
            ))}
          </div>

          <div className="grid grid-cols-12 gap-x-5">
            <PieChartElement dataset={pieData} title="Applicants" colorsPair={["#0066CC", "#E5F0FF"]} />
            <PieChartElement dataset={pieData2} title="Managers" colorsPair={["#0E7F41", "#E5FFE5"]} />
            <BarChartElement dataset={sectors} />
          </div>

          <div className="grid grid-cols-12 gap-x-5 max-h-full">
            <TopStatistic title="Max Capacity" subtitle="" data={number ? [number, 'Capacity'] : ['', '']} icon={<LightningIcon />} />
            <TopStatistic title="Top Company by Applications" subtitle="Applicants" data={mostCompany?.length ? mostCompany : ['', '']} icon={<StarIcon />} />
            <TopStatistic title="Top Applied Field" subtitle="Companies" data={mostField?.length ? mostField : ['', '']} icon={<TrendIcon />} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
