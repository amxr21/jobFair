import { useRef, useLayoutEffect } from "react";
import { formatWhen } from "../context/EventOpsContext";

// Small presentational pieces shared between the Event Operations and Event
// Admin pages (both split out of what used to be one EventSettings.jsx).

export const BADGE_COLORS = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-500",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

export const Badge = ({ label, color = "gray" }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${BADGE_COLORS[color] || BADGE_COLORS.gray}`}>
    {label}
  </span>
);

export const statusColor = (s) => ({
  Assigned: "green", Available: "gray", Reserved: "yellow",
  Placed: "green", Printed: "green", Approved: "green", Submitted: "yellow", "Not Submitted": "gray",
  Fulfilled: "green", "In Progress": "blue", Open: "yellow", Partial: "yellow", Pending: "gray",
  Present: "green", Absent: "red", "Checked In": "green",
  Ended: "gray", Live: "green", Upcoming: "blue",
  Active: "green", Used: "gray", Revoked: "red",
  Critical: "red", High: "orange", Medium: "yellow", Low: "gray",
}[s] || "gray");

export const StatCard = ({ label, value, sub, color = "#0E7F41" }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 min-w-0">
    <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
    <p className="text-2xl font-bold truncate" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
  </div>
);

// "Who touched this last" — shown on every editable row/card
export const LastEdited = ({ row }) => (
  <span className="text-[10px] text-gray-400 whitespace-nowrap" title={row?.updatedAt}>
    Updated by <span className="font-medium text-gray-500">{row?.updatedBy || "—"}</span> · {formatWhen(row?.updatedAt)}
  </span>
);

export const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
);

export const ChevronIcon = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
);

export const inputCls = "border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";

// Sub-tab bar (Attendance sections, View As mode switch, etc.)
export const SubTabBar = ({ tabs, active, onChange }) => {
  const btnRefs = useRef([]);
  const pillRef = useRef(null);

  useLayoutEffect(() => {
    const btn = btnRefs.current[active];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    pill.style.left = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }, [active]);

  return (
    <div className="relative flex bg-gray-100 rounded-xl p-1 gap-1 w-fit max-w-full overflow-x-auto">
      <div
        ref={pillRef}
        className="absolute top-1 bottom-1 rounded-lg pointer-events-none"
        style={{ background: "#0E7F41", left: 0, width: 0, transition: "left 0.2s cubic-bezier(0.4,0,0.2,1), width 0.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {tabs.map((t, i) => (
        <button
          key={t}
          ref={(el) => (btnRefs.current[i] = el)}
          onClick={() => onChange(i)}
          className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-150 ${active === i ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
        >{t}</button>
      ))}
    </div>
  );
};

// Tab icons (SVG — no emojis) — keyed by module/tab id, shared by the
// Operations tab bar and the Admin tab bar.
export const TabIcon = ({ id }) => {
  const paths = {
    venue: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    banners: "M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42",
    requirements: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z",
    equipment: "m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z",
    delegates: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
    attendance: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    manageStaff: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
    schedule: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
    passes: "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z",
    report: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
    customize: "M6.75 3v2.25m10.5-2.25v2.25M3 8.25h18M4.5 5.25h15A1.5 1.5 0 0 1 21 6.75v12A1.5 1.5 0 0 1 19.5 20.25h-15A1.5 1.5 0 0 1 3 18.75v-12a1.5 1.5 0 0 1 1.5-1.5ZM7.5 12h.008v.008H7.5V12Zm3 0h.008v.008h-.008V12Zm3 0h.008v.008h-.008V12Zm3 0h.008v.008h-.008V12Zm-9 3.75h.008v.008H7.5v-.008Zm3 0h.008v.008h-.008v-.008Zm3 0h.008v.008h-.008v-.008Z",
  };
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[id] || paths.venue} />
    </svg>
  );
};
