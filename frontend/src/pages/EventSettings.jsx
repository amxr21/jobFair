import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const COMPANIES = ["Emirates NBD", "Etisalat", "Dubai Police", "DP World", "ADNOC"];

const INIT_BOOTHS = [
  { id: 1, number: "B01", zone: "A", company: "Emirates NBD", type: "Premium", status: "Assigned" },
  { id: 2, number: "B02", zone: "A", company: "Etisalat", type: "Standard", status: "Assigned" },
  { id: 3, number: "B03", zone: "A", company: null, type: "Standard", status: "Available" },
  { id: 4, number: "B04", zone: "A", company: null, type: "Corner", status: "Available" },
  { id: 5, number: "B05", zone: "B", company: "Dubai Police", type: "Premium", status: "Assigned" },
  { id: 6, number: "B06", zone: "B", company: null, type: "Standard", status: "Reserved" },
  { id: 7, number: "B07", zone: "B", company: "DP World", type: "Corner", status: "Assigned" },
  { id: 8, number: "B08", zone: "B", company: null, type: "Standard", status: "Available" },
  { id: 9, number: "B09", zone: "C", company: null, type: "Standard", status: "Reserved" },
  { id: 10, number: "B10", zone: "C", company: null, type: "Standard", status: "Available" },
  { id: 11, number: "B11", zone: "C", company: null, type: "Premium", status: "Available" },
  { id: 12, number: "B12", zone: "C", company: null, type: "Corner", status: "Available" },
];

const INIT_BANNERS = [
  { id: 1, company: "Emirates NBD", material: "Roll-up Banner", status: "Placed", submitted: "2024-03-10", notes: "2 roll-ups, logo updated" },
  { id: 2, company: "Etisalat", material: "Backdrop 3×2m", status: "Printed", submitted: "2024-03-12", notes: "Awaiting delivery" },
  { id: 3, company: "Dubai Police", material: "Table Skirt", status: "Approved", submitted: "2024-03-14", notes: "Standard green theme" },
  { id: 4, company: "DP World", material: "Digital Screen Graphic", status: "Submitted", submitted: "2024-03-15", notes: "HD resolution required" },
  { id: 5, company: "ADNOC", material: "Roll-up Banner", status: "Not Submitted", submitted: "—", notes: "Follow up needed" },
];

const BANNER_STEPS = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];

const INIT_REQUIREMENTS = [
  { id: 1, company: "Emirates NBD", description: "Extra monitor for presentations", category: "AV Equipment", priority: "High", status: "In Progress", notes: "32\" screen requested" },
  { id: 2, company: "Etisalat", description: "Wheelchair accessible booth positioning", category: "Accessibility", priority: "Critical", status: "Fulfilled", notes: "Booth B02 repositioned" },
  { id: 3, company: "Dubai Police", description: "Uniform mannequin display", category: "Display", priority: "Medium", status: "Open", notes: "Needs stand and lighting" },
  { id: 4, company: "DP World", description: "VIP lounge seating nearby", category: "Comfort", priority: "Low", status: "Open", notes: "Pending space review" },
  { id: 5, company: "ADNOC", description: "Dedicated power line 30A", category: "Power", priority: "Critical", status: "In Progress", notes: "Electrician scheduled" },
];

const INIT_EQUIPMENT = [
  { id: 1, entity: "Emirates NBD / B01", item: "Folding Table", qtyReq: 2, qtyFul: 2, status: "Fulfilled" },
  { id: 2, entity: "Emirates NBD / B01", item: "Chair", qtyReq: 4, qtyFul: 4, status: "Fulfilled" },
  { id: 3, entity: "Etisalat / B02", item: "Power Strip (6-way)", qtyReq: 2, qtyFul: 1, status: "Partial" },
  { id: 4, entity: "Etisalat / B02", item: "Monitor Stand", qtyReq: 1, qtyFul: 0, status: "Pending" },
  { id: 5, entity: "Dubai Police / B05", item: "Folding Table", qtyReq: 3, qtyFul: 3, status: "Fulfilled" },
  { id: 6, entity: "Dubai Police / B05", item: "Display Screen 43\"", qtyReq: 1, qtyFul: 1, status: "Fulfilled" },
  { id: 7, entity: "DP World / B07", item: "Chair", qtyReq: 6, qtyFul: 4, status: "Partial" },
  { id: 8, entity: "DP World / B07", item: "Extension Cable 10m", qtyReq: 2, qtyFul: 2, status: "Fulfilled" },
];

const INIT_DELEGATES = [
  {
    company: "Emirates NBD",
    delegates: [
      { name: "Sara Al Mansouri", role: "HR Manager", email: "sara.m@enbd.ae", phone: "+971 50 111 2233", badge: "Printed" },
      { name: "Khalid Rashid", role: "Recruiter", email: "k.rashid@enbd.ae", phone: "+971 55 444 5566", badge: "Pending" },
    ],
  },
  {
    company: "Etisalat",
    delegates: [
      { name: "Aisha Noor", role: "Talent Acquisition", email: "aisha.n@etisalat.ae", phone: "+971 52 777 8899", badge: "Printed" },
      { name: "Mohammed Al Ali", role: "Campus Relations", email: "m.alali@etisalat.ae", phone: "+971 56 223 3445", badge: "Printed" },
      { name: "Fatima Hamdan", role: "HR Coordinator", email: "f.hamdan@etisalat.ae", phone: "+971 50 998 1122", badge: "Pending" },
    ],
  },
  {
    company: "Dubai Police",
    delegates: [
      { name: "Maj. Ahmed Karimi", role: "Recruitment Officer", email: "a.karimi@dubaipolice.gov.ae", phone: "+971 4 999 0011", badge: "Printed" },
      { name: "Lt. Hessa Al Zaabi", role: "HR Specialist", email: "h.alzaabi@dubaipolice.gov.ae", phone: "+971 4 999 0022", badge: "Pending" },
    ],
  },
];

const INIT_ATTENDANCE_COMPANIES = [
  { booth: "B01", company: "Emirates NBD", delegateCount: 2, checkedIn: 2, time: "08:45", status: "Present" },
  { booth: "B02", company: "Etisalat", delegateCount: 3, checkedIn: 2, time: "09:10", status: "Partial" },
  { booth: "B05", company: "Dubai Police", delegateCount: 2, checkedIn: 0, time: "—", status: "Absent" },
  { booth: "B07", company: "DP World", delegateCount: 2, checkedIn: 2, time: "08:55", status: "Present" },
];

const INIT_ATTENDANCE_STUDENTS = [
  { id: "202110001", name: "Layla Hassan", time: "09:05", method: "QR", status: "Checked In" },
  { id: "202110045", name: "Omar Al Farsi", time: "09:12", method: "QR", status: "Checked In" },
  { id: "202110089", name: "Nour Ibrahim", time: "09:30", method: "Manual", status: "Checked In" },
  { id: "202110120", name: "Reem Sultan", time: "09:44", method: "QR", status: "Checked In" },
  { id: "202110200", name: "Faisal Ahmed", time: "—", method: "—", status: "Pending" },
  { id: "202110234", name: "Amira Khalil", time: "10:05", method: "QR", status: "Checked In" },
];

const INIT_SCHEDULE = [
  { id: 1, start: "08:30", end: "09:00", title: "Registration & Venue Setup", host: "Event Team", location: "Main Entrance", capacity: 300, registered: 280, status: "Ended" },
  { id: 2, start: "09:00", end: "09:30", title: "Opening Ceremony & Welcome Address", host: "University President", location: "Main Hall", capacity: 500, registered: 420, status: "Ended" },
  { id: 3, start: "09:30", end: "12:00", title: "Open Networking — Booth Visits", host: "All Companies", location: "Exhibition Floor", capacity: 1000, registered: 850, status: "Live" },
  { id: 4, start: "12:00", end: "13:00", title: "Lunch Break", host: "Catering Team", location: "Cafeteria", capacity: 400, registered: 370, status: "Upcoming" },
  { id: 5, start: "13:00", end: "15:30", title: "Resume Drop & Interview Sessions", host: "All Companies", location: "Exhibition Floor", capacity: 1000, registered: 760, status: "Upcoming" },
  { id: 6, start: "15:30", end: "16:00", title: "Closing & Prize Distribution", host: "Event Coordinator", location: "Main Stage", capacity: 300, registered: 210, status: "Upcoming" },
];

const INIT_PASSES = [
  { id: 1, company: "Emirates NBD", delegate: "Sara Al Mansouri", type: "VIP", code: "VIP-ENB-001", issued: "2024-03-18", status: "Active" },
  { id: 2, company: "Emirates NBD", delegate: "Khalid Rashid", type: "Entry", code: "ENT-ENB-002", issued: "2024-03-18", status: "Active" },
  { id: 3, company: "Etisalat", delegate: "Aisha Noor", type: "Entry", code: "ENT-ETS-001", issued: "2024-03-18", status: "Used" },
  { id: 4, company: "Etisalat", delegate: "Mohammed Al Ali", type: "Parking", code: "PRK-ETS-002", issued: "2024-03-18", status: "Active" },
  { id: 5, company: "Etisalat", delegate: "Fatima Hamdan", type: "Entry", code: "ENT-ETS-003", issued: "2024-03-18", status: "Active" },
  { id: 6, company: "Dubai Police", delegate: "Maj. Ahmed Karimi", type: "VIP", code: "VIP-DXB-001", issued: "2024-03-18", status: "Revoked" },
  { id: 7, company: "DP World", delegate: "Logistics Lead", type: "Parking", code: "PRK-DPW-001", issued: "2024-03-18", status: "Active" },
  { id: 8, company: "DP World", delegate: "HR Director", type: "VIP", code: "VIP-DPW-002", issued: "2024-03-18", status: "Active" },
];

const ANALYTICS_STATS = {
  totalCompanies: 24, totalStudents: 1847, checkinRate: 86,
  applications: 1423, boothsUtilized: 22, avgFeedback: 4.3,
};

const FEEDBACK_CATEGORIES = [
  { label: "Venue & Layout", score: 4.5 },
  { label: "Company Variety", score: 4.2 },
  { label: "Organization", score: 4.4 },
  { label: "Staff Helpfulness", score: 4.7 },
  { label: "Overall Experience", score: 4.3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-500",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

const Badge = ({ label, color = "gray" }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${BADGE_COLORS[color] || BADGE_COLORS.gray}`}>
    {label}
  </span>
);

const statusColor = (s) => ({
  Assigned: "green", Available: "gray", Reserved: "yellow",
  Placed: "green", Printed: "green", Approved: "green", Submitted: "yellow", "Not Submitted": "gray",
  Fulfilled: "green", "In Progress": "blue", Open: "yellow", Partial: "yellow", Pending: "gray",
  Present: "green", Absent: "red", "Checked In": "green",
  Ended: "gray", Live: "green", Upcoming: "blue",
  Active: "green", Used: "gray", Revoked: "red",
  Critical: "red", High: "orange", Medium: "yellow", Low: "gray",
}[s] || "gray");

const StatCard = ({ label, value, sub, color = "#0E7F41" }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 min-w-0">
    <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
    <p className="text-2xl font-bold truncate" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
  </div>
);

const Th = ({ children }) => (
  <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4 whitespace-nowrap">{children}</th>
);

// Sub-tab bar used inside Attendance
const SubTabBar = ({ tabs, active, onChange }) => {
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
    <div className="relative flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
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
          className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 ${active === i ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
        >{t}</button>
      ))}
    </div>
  );
};

// ─── Tab 1: Venue Mapping & Booth Assignment ──────────────────────────────────

const VenueMapping = () => {
  const [booths, setBooths] = useState(INIT_BOOTHS);
  const [assigningId, setAssigningId] = useState(null);
  const [formCompany, setFormCompany] = useState("");
  const [formType, setFormType] = useState("Standard");

  const startAssign = (booth) => { setAssigningId(booth.id); setFormCompany(booth.company || ""); setFormType(booth.type); };
  const cancelAssign = () => { setAssigningId(null); setFormCompany(""); setFormType("Standard"); };
  const saveAssign = (id) => {
    setBooths((prev) => prev.map((b) => b.id === id
      ? { ...b, company: formCompany || null, type: formType, status: formCompany ? "Assigned" : "Available" }
      : b));
    cancelAssign();
  };

  const assigned = booths.filter((b) => b.status === "Assigned").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          {[["Assigned", "green"], ["Reserved", "yellow"], ["Available", "gray"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2 h-2 rounded-full ${c === "green" ? "bg-green-500" : c === "yellow" ? "bg-amber-400" : "bg-gray-300"}`} />
              {l}
            </div>
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-500">{assigned} / {booths.length} assigned</span>
      </div>

      {["A", "B", "C"].map((zone) => (
        <div key={zone}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Zone {zone}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {booths.filter((b) => b.zone === zone).map((booth) => (
              <div key={booth.id} className={`rounded-xl border p-3 flex flex-col gap-2.5 ${
                booth.status === "Assigned" ? "border-green-200 bg-green-50"
                : booth.status === "Reserved" ? "border-amber-200 bg-amber-50"
                : "border-gray-200 bg-white"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">{booth.number}</span>
                  <Badge label={booth.status} color={statusColor(booth.status)} />
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                  <span className="text-gray-400">{booth.type}</span>
                  <span className="font-semibold text-gray-700 truncate">{booth.company || "Unassigned"}</span>
                </div>
                {assigningId === booth.id ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={formCompany} onChange={(e) => setFormCompany(e.target.value)}>
                      <option value="">— Unassigned —</option>
                      {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={formType} onChange={(e) => setFormType(e.target.value)}>
                      {["Standard", "Premium", "Corner"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <button onClick={() => saveAssign(booth.id)} className="flex-1 text-xs rounded-lg py-1.5 font-semibold text-white" style={{ background: "#0E7F41" }}>Save</button>
                      <button onClick={cancelAssign} className="flex-1 text-xs rounded-lg py-1.5 font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startAssign(booth)} className="text-xs rounded-lg py-1.5 font-medium border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
                    {booth.company ? "Reassign" : "Assign"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Tab 2: Banner & Branding Status ─────────────────────────────────────────

const BannerBranding = () => {
  const [banners, setBanners] = useState(INIT_BANNERS);

  const stepIdx = (status) => BANNER_STEPS.indexOf(status);

  const advance = (id) => {
    setBanners((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const idx = stepIdx(b.status);
      return idx < BANNER_STEPS.length - 1 ? { ...b, status: BANNER_STEPS[idx + 1] } : b;
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 flex-wrap pb-1">
        {BANNER_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${idx === 0 ? "bg-gray-300" : idx === 4 ? "bg-green-500" : "bg-blue-400"}`} />
            {step}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {banners.map((row) => {
          const si = stepIdx(row.status);
          return (
            <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{row.company}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{row.material}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={row.status} color={statusColor(row.status)} />
                  {si < BANNER_STEPS.length - 1 && (
                    <button onClick={() => advance(row.id)} className="text-xs font-medium text-white rounded-lg px-3 py-1 hover:opacity-90 transition-opacity" style={{ background: "#0E7F41" }}>
                      Mark {BANNER_STEPS[si + 1]} →
                    </button>
                  )}
                </div>
              </div>

              {/* Progress stepper */}
              <div className="flex items-center gap-0.5">
                {BANNER_STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div title={step} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all duration-300 ${
                      idx < si ? "border-green-500 bg-green-500 text-white"
                      : idx === si ? "border-green-500 bg-white text-green-600"
                      : "border-gray-200 bg-white text-gray-300"}`}>
                      {idx < si ? "✓" : idx + 1}
                    </div>
                    {idx < BANNER_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-0.5 transition-all duration-300 ${idx < si ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>

              {row.notes && <p className="text-xs text-gray-400 italic">{row.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab 3: Special & Additional Requirements ──────────────────────────────────

const SpecialRequirements = () => {
  const [rows, setRows] = useState(INIT_REQUIREMENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: COMPANIES[0], description: "", category: "", priority: "Medium", status: "Open", notes: "" });

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.description.trim()) return;
    setRows((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm({ company: COMPANIES[0], description: "", category: "", priority: "Medium", status: "Open", notes: "" });
    setShowForm(false);
  };

  const cycleStatus = (id) => {
    const cycle = ["Open", "In Progress", "Fulfilled"];
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: cycle[(cycle.indexOf(r.status) + 1) % cycle.length] } : r));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {["Open", "In Progress", "Fulfilled"].map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Badge label={`${rows.filter(r => r.status === s).length} ${s}`} color={statusColor(s)} />
            </span>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-white rounded-xl px-3 py-2 hover:opacity-90 transition-opacity flex-shrink-0" style={{ background: "#0E7F41" }}>
          {showForm ? "Cancel" : "+ Add Requirement"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F3F6FF] rounded-xl p-4 border border-blue-100 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">New Requirement</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Company", el: <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={form.company} onChange={F("company")}>{COMPANIES.map((c) => <option key={c}>{c}</option>)}</select> },
              { label: "Category", el: <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="e.g. AV Equipment" value={form.category} onChange={F("category")} /> },
              { label: "Priority", el: <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={form.priority} onChange={F("priority")}>{["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}</select> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Description</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Describe the requirement..." value={form.description} onChange={F("description")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Notes</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Optional..." value={form.notes} onChange={F("notes")} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} className="text-sm font-semibold text-white rounded-xl px-4 py-2" style={{ background: "#0E7F41" }}>Save</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex items-start justify-between gap-3 flex-wrap hover:border-gray-200 transition-colors">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{row.company}</span>
                <Badge label={row.category} color="blue" />
                <Badge label={row.priority} color={statusColor(row.priority)} />
              </div>
              <p className="text-sm text-gray-600">{row.description}</p>
              {row.notes && <p className="text-xs text-gray-400 italic">{row.notes}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge label={row.status} color={statusColor(row.status)} />
              {row.status !== "Fulfilled" && (
                <button onClick={() => cycleStatus(row.id)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors text-gray-600">
                  {row.status === "Open" ? "Start →" : "Fulfill ✓"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 4: Equipment & Logistics ─────────────────────────────────────────────

const EquipmentLogistics = () => {
  const [rows, setRows] = useState(INIT_EQUIPMENT);

  const total = (kw) => rows.filter((r) => kw.some((k) => r.item.toLowerCase().includes(k))).reduce((a, r) => a + r.qtyReq, 0);
  const fulfillItem = (id) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, qtyFul: r.qtyReq, status: "Fulfilled" } : r));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tables" value={total(["table"])} sub="Total requested" />
        <StatCard label="Chairs" value={total(["chair"])} sub="Total requested" color="#2959A6" />
        <StatCard label="Power / Cables" value={total(["power", "extension", "cable"])} sub="Strips & cables" color="#f59e0b" />
        <StatCard label="Screens" value={total(["screen", "monitor"])} sub="Monitors & displays" color="#8b5cf6" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Company / Booth", "Item", "Requested", "Fulfilled", "Status", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="px-4 py-3 text-xs font-medium text-gray-600">{row.entity}</td>
                <td className="px-4 py-3 text-gray-800">{row.item}</td>
                <td className="px-4 py-3 text-gray-600 text-center font-mono">{row.qtyReq}</td>
                <td className="px-4 py-3 text-gray-600 text-center font-mono">{row.qtyFul}</td>
                <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                <td className="px-4 py-3">
                  {row.status !== "Fulfilled" && (
                    <button onClick={() => fulfillItem(row.id)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                      Fulfill ✓
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab 5: Company Delegate List ─────────────────────────────────────────────

const DelegateList = () => {
  const [companies, setCompanies] = useState(INIT_DELEGATES);
  const [expanded, setExpanded] = useState(new Set([0]));

  const totalDelegates = companies.reduce((a, c) => a + c.delegates.length, 0);
  const totalPrinted = companies.reduce((a, c) => a + c.delegates.filter((d) => d.badge === "Printed").length, 0);

  const toggle = (idx) => setExpanded((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  const printBadge = (cIdx, dIdx) => {
    setCompanies((prev) => prev.map((c, ci) => ci !== cIdx ? c : {
      ...c, delegates: c.delegates.map((d, di) => di !== dIdx ? d : { ...d, badge: "Printed" })
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Delegates" value={totalDelegates} sub="Across all companies" />
        <StatCard label="Badges Printed" value={totalPrinted} sub={`${totalDelegates - totalPrinted} pending`} color="#2959A6" />
        <StatCard label="Companies" value={companies.length} sub="With delegates registered" color="#8b5cf6" />
      </div>

      <div className="flex flex-col gap-2">
        {companies.map((company, idx) => (
          <div key={company.company} className="rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle(idx)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800 text-sm">{company.company}</span>
                <Badge label={`${company.delegates.length} delegates`} color="blue" />
                <Badge label={`${company.delegates.filter(d => d.badge === "Printed").length} badges printed`} color="green" />
              </div>
              <span className="text-gray-400 text-xs">{expanded.has(idx) ? "▲ Hide" : "▼ Show"}</span>
            </button>

            {expanded.has(idx) && (
              <div className="border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Name", "Role", "Email", "Phone", "Badge", ""].map((h, i) => (
                        <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {company.delegates.map((d, di) => (
                      <tr key={di} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{d.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{d.role}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{d.email}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{d.phone}</td>
                        <td className="px-4 py-2.5"><Badge label={d.badge} color={d.badge === "Printed" ? "green" : "yellow"} /></td>
                        <td className="px-4 py-2.5">
                          {d.badge !== "Printed" && (
                            <button onClick={() => printBadge(idx, di)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                              Print Badge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 6: Attendance & Check-in ─────────────────────────────────────────────

const AttendanceCheckin = () => {
  const [subTab, setSubTab] = useState(0);
  const [students, setStudents] = useState(INIT_ATTENDANCE_STUDENTS);
  const [companies, setCompanies] = useState(INIT_ATTENDANCE_COMPANIES);

  const compCheckedIn = companies.reduce((a, c) => a + c.checkedIn, 0);
  const compTotal = companies.reduce((a, c) => a + c.delegateCount, 0);
  const studCheckedIn = students.filter((s) => s.status === "Checked In").length;
  const studTotal = students.length;

  const checkInStudent = (id) => setStudents((prev) => prev.map((s) => s.id !== id ? s : { ...s, status: "Checked In", time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), method: "Manual" }));
  const checkInCompany = (booth) => setCompanies((prev) => prev.map((c) => c.booth !== booth ? c : { ...c, checkedIn: c.delegateCount, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), status: "Present" }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Expected" value={subTab === 0 ? compTotal : studTotal} />
        <StatCard label="Checked In" value={subTab === 0 ? compCheckedIn : studCheckedIn} color="#2959A6" />
        <StatCard label="Pending" value={subTab === 0 ? compTotal - compCheckedIn : studTotal - studCheckedIn} color="#f59e0b" />
      </div>

      <SubTabBar tabs={["Companies", "Students"]} active={subTab} onChange={setSubTab} />

      {subTab === 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Booth", "Company", "Delegates", "Checked In", "Time", "Status", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{row.booth}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.company}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.delegateCount}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.checkedIn}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.time}</td>
                  <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3">
                    {row.status !== "Present" && (
                      <button onClick={() => checkInCompany(row.booth)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                        Check In
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 1 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Student ID", "Name", "Time", "Method", "Status", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.time}</td>
                  <td className="px-4 py-3">{row.method !== "—" ? <Badge label={row.method} color={row.method === "QR" ? "blue" : "gray"} /> : <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3">
                    {row.status !== "Checked In" && (
                      <button onClick={() => checkInStudent(row.id)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                        Check In
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab 7: Schedule & Time Slots ─────────────────────────────────────────────

const ScheduleSlots = () => {
  const [slots, setSlots] = useState(INIT_SCHEDULE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.title.trim() || !form.start) return;
    setSlots((prev) => [...prev, { ...form, id: Date.now(), capacity: Number(form.capacity) || 0, registered: 0 }]);
    setForm({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });
    setShowForm(false);
  };

  const cycleStatus = (id) => {
    const cycle = ["Upcoming", "Live", "Ended"];
    setSlots((prev) => prev.map((s) => s.id === id ? { ...s, status: cycle[(cycle.indexOf(s.status) + 1) % cycle.length] } : s));
  };

  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {["Ended", "Live", "Upcoming"].map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Badge label={`${slots.filter(sl => sl.status === s).length} ${s}`} color={statusColor(s)} />
            </span>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-white rounded-xl px-3 py-2 hover:opacity-90 transition-opacity flex-shrink-0" style={{ background: "#0E7F41" }}>
          {showForm ? "Cancel" : "+ Add Slot"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F3F6FF] rounded-xl p-4 border border-blue-100 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">New Time Slot</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Start", el: <input type="time" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.start} onChange={F("start")} /> },
              { label: "End", el: <input type="time" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.end} onChange={F("end")} /> },
              { label: "Host", el: <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Host / team" value={form.host} onChange={F("host")} /> },
              { label: "Location", el: <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Room / area" value={form.location} onChange={F("location")} /> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Session Title</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="e.g. Opening Ceremony" value={form.title} onChange={F("title")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Capacity</label>
              <input type="number" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="0" value={form.capacity} onChange={F("capacity")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Status</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white" value={form.status} onChange={F("status")}>
                {["Upcoming", "Live", "Ended"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} className="text-sm font-semibold text-white rounded-xl px-4 py-2" style={{ background: "#0E7F41" }}>Save Slot</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((slot) => (
          <div key={slot.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center pt-1 flex-shrink-0 w-14">
              <span className="text-xs font-bold text-gray-700">{slot.start}</span>
              <div className="w-px flex-1 bg-gray-200 my-1 min-h-[20px]" />
              <span className="text-xs text-gray-400">{slot.end}</span>
            </div>
            <div className={`flex-1 rounded-xl border p-4 flex flex-col gap-2 min-w-0 ${
              slot.status === "Live" ? "border-green-300 bg-green-50"
              : slot.status === "Ended" ? "border-gray-200 bg-gray-50"
              : "border-blue-200 bg-blue-50"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{slot.title}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={slot.status} color={statusColor(slot.status)} />
                  <button onClick={() => cycleStatus(slot.id)} className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-0.5 hover:bg-white transition-colors text-gray-500 bg-white/60">
                    →
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {slot.host && <span>Host: <span className="font-medium text-gray-700">{slot.host}</span></span>}
                {slot.location && <span>Location: <span className="font-medium text-gray-700">{slot.location}</span></span>}
                {slot.capacity > 0 && <span>Registered: <span className="font-medium text-gray-700">{slot.registered} / {slot.capacity}</span></span>}
              </div>
              {slot.capacity > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{
                    width: `${Math.min(100, Math.round((slot.registered / slot.capacity) * 100))}%`,
                    background: slot.status === "Live" ? "#0E7F41" : slot.status === "Ended" ? "#9ca3af" : "#2959A6"
                  }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 8: Access & Parking Passes ───────────────────────────────────────────

const AccessPasses = () => {
  const [passes, setPasses] = useState(INIT_PASSES);
  const [filter, setFilter] = useState("All");

  const types = ["All", "Entry", "Parking", "VIP"];
  const shown = filter === "All" ? passes : passes.filter((p) => p.type === filter);

  const revokePass = (id) => setPasses((prev) => prev.map((p) => p.id === id ? { ...p, status: "Revoked" } : p));
  const activatePass = (id) => setPasses((prev) => prev.map((p) => p.id === id ? { ...p, status: "Active" } : p));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Issued" value={passes.length} />
        <StatCard label="Entry Passes" value={passes.filter(p => p.type === "Entry").length} color="#2959A6" />
        <StatCard label="Parking Passes" value={passes.filter(p => p.type === "Parking").length} color="#f59e0b" />
        <StatCard label="VIP Passes" value={passes.filter(p => p.type === "VIP").length} color="#8b5cf6" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-all duration-150 ${filter === t ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            style={filter === t ? { background: "#0E7F41" } : {}}>
            {t} {t !== "All" && `(${passes.filter(p => p.type === t).length})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Company", "Delegate", "Type", "Code", "Issued", "Status", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="px-4 py-3 font-medium text-gray-800">{row.company}</td>
                <td className="px-4 py-3 text-gray-700">{row.delegate}</td>
                <td className="px-4 py-3"><Badge label={row.type} color={row.type === "VIP" ? "purple" : row.type === "Parking" ? "yellow" : "blue"} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.code}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{row.issued}</td>
                <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                <td className="px-4 py-3">
                  {row.status === "Active" && (
                    <button onClick={() => revokePass(row.id)} className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 text-red-500 transition-colors">Revoke</button>
                  )}
                  {row.status === "Revoked" && (
                    <button onClick={() => activatePass(row.id)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-500 transition-colors">Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab 9: Post-Event Reporting & Analytics ──────────────────────────────────

const PostEventReporting = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard label="Total Companies" value={ANALYTICS_STATS.totalCompanies} sub="Participated" />
      <StatCard label="Total Students" value={ANALYTICS_STATS.totalStudents.toLocaleString()} sub="Registered" color="#2959A6" />
      <StatCard label="Check-in Rate" value={`${ANALYTICS_STATS.checkinRate}%`} sub="Overall attendance" />
      <StatCard label="Applications Made" value={ANALYTICS_STATS.applications.toLocaleString()} sub="During the event" color="#8b5cf6" />
      <StatCard label="Booths Utilized" value={`${ANALYTICS_STATS.boothsUtilized}/${ANALYTICS_STATS.totalCompanies}`} sub="Active booths" color="#f59e0b" />
      <StatCard label="Avg Feedback" value={`${ANALYTICS_STATS.avgFeedback} / 5`} sub="Based on 312 responses" color="#0891b2" />
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">Feedback Breakdown by Category</p>
      <div className="flex flex-col gap-3">
        {FEEDBACK_CATEGORIES.map((cat) => {
          const pct = Math.round((cat.score / 5) * 100);
          return (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-36 text-xs text-gray-600 text-right flex-shrink-0">{cat.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700" style={{ width: `${pct}%`, background: "#0E7F41", minWidth: "2rem" }}>
                  <span className="text-white text-[10px] font-bold">{cat.score}</span>
                </div>
              </div>
              <div className="w-9 text-xs text-gray-400 flex-shrink-0">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-3">Export Reports</p>
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Export Companies CSV", color: "#0E7F41", bg: false },
          { label: "Export Students CSV", color: "#2959A6", bg: false },
          { label: "Export Full Report PDF", color: "#fff", bg: "#2959A6" },
        ].map(({ label, color, bg }) => (
          <button key={label} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border"
            style={bg ? { background: bg, color, borderColor: bg } : { background: "white", color, borderColor: color }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { label: "Venue & Booths",        icon: "🏛️",  component: VenueMapping },
  { label: "Banners & Branding",    icon: "🎨",  component: BannerBranding },
  { label: "Special Requirements",  icon: "⭐",  component: SpecialRequirements },
  { label: "Equipment & Logistics", icon: "📦",  component: EquipmentLogistics },
  { label: "Delegate List",         icon: "👥",  component: DelegateList },
  { label: "Attendance",            icon: "✅",  component: AttendanceCheckin },
  { label: "Schedule",              icon: "🗓️",  component: ScheduleSlots },
  { label: "Access Passes",         icon: "🎫",  component: AccessPasses },
  { label: "Post-Event Report",     icon: "📊",  component: PostEventReporting },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const EventSettings = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);
  const pillRef = useRef(null);

  // useLayoutEffect so pill is positioned before first paint
  useLayoutEffect(() => {
    const btn = tabRefs.current[activeTab];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    // First render: set without transition so it doesn't fly in from 0
    if (activeTab === 0) {
      pill.style.transition = "none";
      pill.style.left = `${btn.offsetLeft}px`;
      pill.style.width = `${btn.offsetWidth}px`;
      requestAnimationFrame(() => {
        pill.style.transition = "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)";
      });
    } else {
      pill.style.left = `${btn.offsetLeft}px`;
      pill.style.width = `${btn.offsetWidth}px`;
    }
  }, [activeTab]);

  const ActiveComponent = TABS[activeTab].component;

  return (
    <PageContainer user={user} title="Event Settings">
      <div className="flex flex-col gap-4">
        {/* Tab bar — 3-col grid on mobile, scrollable row on md+ */}
        <div className="relative">
          {/* md+: horizontal scrollable pill bar */}
          <div className="hidden md:flex overflow-x-auto pb-1 relative">
            <div className="relative flex bg-white border border-gray-200 rounded-xl p-1 gap-1 min-w-max">
              <div
                ref={pillRef}
                className="absolute top-1 bottom-1 rounded-lg pointer-events-none z-0"
                style={{ background: "#0E7F41", left: 0, width: 0 }}
              />
              {TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  ref={(el) => (tabRefs.current[i] = el)}
                  onClick={() => setActiveTab(i)}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                    activeTab === i ? "text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* mobile: 3-col grid of pill buttons */}
          <div className="md:hidden grid grid-cols-3 gap-2">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border"
                style={activeTab === i
                  ? { background: "#0E7F41", color: "#fff", borderColor: "#0E7F41" }
                  : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-center leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content — plain flow, PageContainer handles the scroll */}
        <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <ActiveComponent />
        </div>
      </div>
    </PageContainer>
  );
};

export default EventSettings;
