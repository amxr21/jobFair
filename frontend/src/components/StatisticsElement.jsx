import { useEffect, useState } from "react";
import { StudentIcon, CompanyIcon, FieldIcon, SeekerIcon } from "./Icons";

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
  const applicants = Array.isArray(data.applicants) ? data.applicants : [];

  const managersNumber = managers.reduce((acc, manager) => {
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
        let students = new Set(applicants.map(a => a.applicantDetails.uniId))
        setIcon(StudentIcon);
        setHeader(students.size);
        setSubheader("Registered Students");
        break;

      case "companies":
        setIcon(CompanyIcon);
        setHeader(managers.length);
        setSubheader("Companies");
        break;

      case "seekers":
        setIcon(SeekerIcon);
        setHeader(managersNumber);
        setSubheader("CEO’s & Talent seekers");
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
  }, [type, managers, applicants, managersNumber, fieldsNumber]);

  return (
    <div className="statistics-element col-span-3 flex gap-3 bg-white p-3 h-fit rounded-xl">
      <div className="icon h-10 w-10">
        <img src={icon} alt="icon h-full" />
      </div>
      <div className="text flex flex-col gap-y-0">
        <h2 className="number text-3xl font-bold">{header}+</h2>
        <h6 className="subtitle text-xs font-medium">{subheader}</h6>
      </div>
    </div>
  );
};

export default StatisticsElement;
