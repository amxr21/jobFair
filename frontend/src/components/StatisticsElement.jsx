import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudentIcon, CompanyIcon, FieldIcon, SeekerIcon } from "./Icons";
import CountUp from "./CountUp";

const sample = [
  { header: "81", subheaderKey: "registeredStudents", icon: StudentIcon },
  { header: "36", subheaderKey: "companies", icon: CompanyIcon },
  { header: "8", subheaderKey: "ceosAndSeekers", icon: SeekerIcon },
  { header: "10", subheaderKey: "techFields", icon: FieldIcon },
];

const StatisticsElement = ({ data = {}, type }) => {
  const { t } = useTranslation();
  const [icon, setIcon] = useState(sample[0].icon);
  const [header, setHeader] = useState(sample[0].header);
  const [subheader, setSubheader] = useState(t(`statisticsElement.${sample[0].subheaderKey}`));

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

  const representativesCount = managers.reduce((acc, manager) => {
    if (typeof manager.representatives === "string") {
      return acc + manager.representatives.split(",").length;
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
        setSubheader(t("statisticsElement.registeredStudents"));
        break;

      case "companies":
        setIcon(CompanyIcon);
        setHeader(managers.length);
        setSubheader(t("statisticsElement.companies"));
        break;

      case "seekers":
        setIcon(SeekerIcon);
        setHeader(representativesCount);
        setSubheader(t("statisticsElement.ceosAndSeekers"));
        break;

      case "fields":
        setIcon(FieldIcon);
        setHeader(fieldsNumber);
        setSubheader(t("statisticsElement.techFields"));
        break;

      default:
        // Fallback to sample[0] just in case
        setIcon(sample[0].icon);
        setHeader(sample[0].header);
        setSubheader(t(`statisticsElement.${sample[0].subheaderKey}`));
    }
  }, [type, managers, applicants, representativesCount, fieldsNumber, t]);

  return (
    <div className="statistics-element col-span-1 lg:col-span-3 flex gap-1.5 md:gap-2 bg-surface-card p-1.5 md:p-2 h-fit rounded-lg">
      <div className="icon h-7 w-7 md:h-8 md:w-8 shrink-0">
        <img src={icon} alt="icon" className="h-full w-full" />
      </div>
      <div className="text flex flex-col gap-y-0 min-w-0">
        <h2 className="number text-lg md:text-2xl font-bold">
          <CountUp end={header} duration={1500} suffix="+" />
        </h2>
        <h6 className="subtitle text-[9px] md:text-[10px] font-medium truncate">{subheader}</h6>
      </div>
    </div>
  );
};

export default StatisticsElement;
