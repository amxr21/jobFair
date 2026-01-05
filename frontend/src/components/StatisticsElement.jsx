import { useEffect, useState } from "react";
import { StudentIcon, CompanyIcon, FieldIcon, SeekerIcon } from "./Icons";
import CountUp from "./CountUp";

const sample = [
  {
    header: "81",
    subheader: "Registered Students",
    icon: StudentIcon,
  },
  {
    header: "36",
    subheader: "Companies",
    icon: CompanyIcon,
  },
  {
    header: "8",
    subheader: "CEO’s & Talent seekers",
    icon: SeekerIcon,
  },
  {
    header: "10",
    subheader: "Tech fields",
    icon: FieldIcon,
  },
];

const StatisticsElement = ({ data = {}, type }) => {
  const [icon, setIcon] = useState(sample[0].icon);
  const [header, setHeader] = useState(sample[0].header);
  const [subheader, setSubheader] = useState(sample[0].subheader);

  const managers = Array.isArray(data.managers) ? data.managers : [];
  const applicantsRaw = Array.isArray(data.applicants) ? data.applicants : [];

  // Get unique applicants by uniId, keeping only the latest submission
  const getUniqueLatestApplicants = (applicantsList) => {
    if (applicantsList.length === 0) return [];
    // Sort by createdAt descending (newest first)
    const sorted = [...applicantsList].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    // Keep only the first occurrence of each uniId
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

  const applicants = getUniqueLatestApplicants(applicantsRaw);

  // Note: 'representitives' is the field name in the database (kept for backward compatibility)
  const representativesCount = managers.reduce((acc, manager) => {
    if (typeof manager.representitives === "string") {
      return acc + manager.representitives.split(",").length;
    }
    return acc;
  }, 0);

  const uniqueFields = new Set();

  managers.forEach((company) => {
    if (
      typeof company.fields === "string" &&
      company.fields !== "Office and Students Fairs"
    ) {
      const fieldsArray = company.fields
        .split(",")
        .map((field) => field.toLowerCase().trim());

      fieldsArray.forEach((field) => {
        if (field && field !== "office and students fairs") {
          uniqueFields.add(field.replace(/\s+/g, ""));
        }
      });
    }
  });

  const fieldsNumber = uniqueFields.size;

  useEffect(() => {
    switch (type) {
      case "students":
        // applicants is already filtered to unique latest entries
        setIcon(StudentIcon);
        setHeader(applicants.length);
        setSubheader("Registered Students");
        break;

      case "companies":
        setIcon(CompanyIcon);
        setHeader(managers.length);
        setSubheader("Companies");
        break;

      case "seekers":
        setIcon(SeekerIcon);
        setHeader(representativesCount);
        setSubheader("CEO's & Talent seekers");
        break;

      case "fields":
        setIcon(FieldIcon);
        setHeader(fieldsNumber);
        setSubheader("Tech fields");
        break;

      default:
        // Fallback to sample[0] just in case
        setIcon(sample[0].icon);
        setHeader(sample[0].header);
        setSubheader(sample[0].subheader);
    }
  }, [type, managers, applicants, representativesCount, fieldsNumber]);

  return (
    <div className="statistics-element col-span-1 lg:col-span-3 flex gap-2 md:gap-3 bg-white p-2 md:p-3 h-fit rounded-xl">
      <div className="icon h-8 w-8 md:h-10 md:w-10 shrink-0">
        <img src={icon} alt="icon" className="h-full w-full" />
      </div>
      <div className="text flex flex-col gap-y-0 min-w-0">
        <h2 className="number text-xl md:text-3xl font-bold">
          <CountUp end={header} duration={1500} suffix="+" />
        </h2>
        <h6 className="subtitle text-[10px] md:text-xs font-medium truncate">{subheader}</h6>
      </div>
    </div>
  );
};

export default StatisticsElement;
