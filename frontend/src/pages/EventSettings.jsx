import { useState, useRef, useEffect } from "react";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";

// ─── Seed Data ───────────────────────────────────────────────────────────────

const COMPANIES = ["Emirates NBD", "Etisalat", "Dubai Police", "DP World"];

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
  { id: 2, company: "Etisalat", material: "Backdrop 3x2m", status: "Printed", submitted: "2024-03-12", notes: "Awaiting delivery" },
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
  totalCompanies: 24,
  totalStudents: 1847,
  checkinRate: 86,
  applications: 1423,
  boothsUtilized: 22,
  avgFeedback: 4.3,
};

const FEEDBACK_CATEGORIES = [
  { label: "Venue & Layout", score: 4.5 },
  { label: "Company Variety", score: 4.2 },
  { label: "Organization", score: 4.4 },
  { label: "Staff Helpfulness", score: 4.7 },
  { label: "Overall Experience", score: 4.3 },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const Badge = ({ label, color }) => {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-500",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
};

const statusColor = (status) => {
  const map = {
    Assigned: "green", Available: "gray", Reserved: "yellow",
    Placed: "green", Printed: "blue", Approved: "green",
    Submitted: "yellow", "Not Submitted": "gray",
    Fulfilled: "green", "In Progress": "blue", Open: "yellow",
    Partial: "yellow", Pending: "gray",
    Present: "green", Absent: "red",
    "Checked In": "green",
    Ended: "gray", Live: "green", Upcoming: "blue",
    Active: "green", Used: "gray", Revoked: "red",
    Printed: "green",
    Critical: "red", High: "orange", Medium: "yellow", Low: "gray",
  };
  return map[status] || "gray";
};

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
    <p className="text-xs text-gray-500 font-medium">{label}</p>
    <p className={`text-2xl font-bold`} style={{ color: color || "#0E7F41" }}>{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

// ─── Tab 1: Venue Mapping & Booth Assignment ──────────────────────────────────

const VenueMapping = () => {
  const [booths, setBooths] = useState(INIT_BOOTHS);
  const [assigningId, setAssigningId] = useState(null);
  const [formCompany, setFormCompany] = useState("");
  const [formType, setFormType] = useState("Standard");

  const startAssign = (booth) => {
    setAssigningId(booth.id);
    setFormCompany(booth.company || "");
    setFormType(booth.type);
  };

  const cancelAssign = () => {
    setAssigningId(null);
    setFormCompany("");
    setFormType("Standard");
  };

  const saveAssign = (id) => {
    setBooths((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, company: formCompany || null, type: formType, status: formCompany ? "Assigned" : "Available" }
          : b
      )
    );
    cancelAssign();
  };

  const zones = ["A", "B", "C"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Assigned", color: "green" },
          { label: "Reserved", color: "yellow" },
          { label: "Available", color: "gray" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <Badge label={s.label} color={s.color} />
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{booths.filter((b) => b.status === "Assigned").length} / {booths.length} assigned</span>
      </div>

      {zones.map((zone) => (
        <div key={zone}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Zone {zone}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {booths.filter((b) => b.zone === zone).map((booth) => (
              <div key={booth.id} className={`rounded-xl border p-3 flex flex-col gap-2 ${booth.status === "Assigned" ? "border-green-200 bg-green-50" : booth.status === "Reserved" ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">{booth.number}</span>
                  <Badge label={booth.status} color={statusColor(booth.status)} />
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                  <span>{booth.type}</span>
                  <span className="font-medium text-gray-700 truncate">{booth.company || "—"}</span>
                </div>

                {assigningId === booth.id ? (
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-200">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                    >
                      <option value="">— No Company —</option>
                      {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                    >
                      {["Standard", "Premium", "Corner"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveAssign(booth.id)}
                        className="flex-1 text-xs rounded-lg py-1 font-medium text-white"
                        style={{ background: "#0E7F41" }}
                      >Save</button>
                      <button
                        onClick={cancelAssign}
                        className="flex-1 text-xs rounded-lg py-1 font-medium bg-gray-100 text-gray-600"
                      >Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startAssign(booth)}
                    className="text-xs rounded-lg py-1 font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >Assign</button>
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
  const [banners] = useState(INIT_BANNERS);

  const stepIdx = (status) => BANNER_STEPS.indexOf(status);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Company", "Material Type", "Status", "Submitted", "Notes", "Progress"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banners.map((row) => {
              const si = stepIdx(row.status);
              return (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-800">{row.company}</td>
                  <td className="py-3 pr-4 text-gray-600">{row.material}</td>
                  <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{row.submitted}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs max-w-[160px]">{row.notes}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      {BANNER_STEPS.map((step, idx) => (
                        <div key={step} className="flex items-center gap-1">
                          <div
                            title={step}
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${idx <= si ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white text-gray-300"}`}
                          >
                            {idx < si ? "✓" : idx === si ? "●" : ""}
                          </div>
                          {idx < BANNER_STEPS.length - 1 && (
                            <div className={`w-4 h-0.5 ${idx < si ? "bg-green-400" : "bg-gray-200"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        {BANNER_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-gray-300" : idx === 4 ? "bg-green-500" : "bg-blue-400"}`} />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab 3: Special & Additional Requirements ─────────────────────────────────

const SpecialRequirements = () => {
  const [rows, setRows] = useState(INIT_REQUIREMENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: COMPANIES[0], description: "", category: "", priority: "Medium", status: "Open", notes: "" });

  const handleAdd = () => {
    if (!form.description.trim()) return;
    setRows((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm({ company: COMPANIES[0], description: "", category: "", priority: "Medium", status: "Open", notes: "" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-white rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
          style={{ background: "#0E7F41" }}
        >
          {showForm ? "Cancel" : "+ Add Requirement"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F3F6FF] rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">New Requirement</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Company</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}>
                {COMPANIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Category</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="e.g. AV Equipment" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Priority</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Description</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Describe the requirement..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Notes</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} className="text-sm font-medium text-white rounded-xl px-4 py-2" style={{ background: "#0E7F41" }}>Save</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Company", "Description", "Category", "Priority", "Status", "Notes"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 font-medium text-gray-800">{row.company}</td>
                <td className="py-3 pr-4 text-gray-600 max-w-[200px]">{row.description}</td>
                <td className="py-3 pr-4 text-gray-500 text-xs">{row.category}</td>
                <td className="py-3 pr-4"><Badge label={row.priority} color={statusColor(row.priority)} /></td>
                <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
                <td className="py-3 pr-4 text-gray-500 text-xs">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab 4: Equipment & Logistics ─────────────────────────────────────────────

const EquipmentLogistics = () => {
  const [rows] = useState(INIT_EQUIPMENT);

  const totalTables = rows.filter((r) => r.item.toLowerCase().includes("table")).reduce((a, r) => a + r.qtyReq, 0);
  const totalChairs = rows.filter((r) => r.item.toLowerCase().includes("chair")).reduce((a, r) => a + r.qtyReq, 0);
  const totalPower = rows.filter((r) => r.item.toLowerCase().includes("power") || r.item.toLowerCase().includes("extension")).reduce((a, r) => a + r.qtyReq, 0);
  const totalScreens = rows.filter((r) => r.item.toLowerCase().includes("screen") || r.item.toLowerCase().includes("monitor")).reduce((a, r) => a + r.qtyReq, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tables" value={totalTables} sub="Total requested" />
        <StatCard label="Chairs" value={totalChairs} sub="Total requested" color="#2959A6" />
        <StatCard label="Power Outlets" value={totalPower} sub="Strips & cables" color="#f59e0b" />
        <StatCard label="Screens" value={totalScreens} sub="Monitors & displays" color="#8b5cf6" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Company / Booth", "Item", "Qty Requested", "Qty Fulfilled", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 font-medium text-gray-800 text-xs">{row.entity}</td>
                <td className="py-3 pr-4 text-gray-700">{row.item}</td>
                <td className="py-3 pr-4 text-gray-600 text-center">{row.qtyReq}</td>
                <td className="py-3 pr-4 text-gray-600 text-center">{row.qtyFul}</td>
                <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
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
  const [companies] = useState(INIT_DELEGATES);
  const [expanded, setExpanded] = useState(new Set([0]));

  const totalDelegates = companies.reduce((a, c) => a + c.delegates.length, 0);
  const totalPrinted = companies.reduce((a, c) => a + c.delegates.filter((d) => d.badge === "Printed").length, 0);

  const toggle = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
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
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800 text-sm">{company.company}</span>
                <Badge label={`${company.delegates.length} delegates`} color="blue" />
              </div>
              <span className="text-gray-400 text-sm">{expanded.has(idx) ? "▲" : "▼"}</span>
            </button>

            {expanded.has(idx) && (
              <div className="border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Name", "Role", "Email", "Phone", "Badge"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
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
  const subTabRefs = useRef([]);
  const subPillRef = useRef(null);

  const subTabs = ["Companies", "Students"];

  useEffect(() => {
    const btn = subTabRefs.current[subTab];
    const pill = subPillRef.current;
    if (!btn || !pill) return;
    pill.style.left = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }, [subTab]);

  const compCheckedIn = INIT_ATTENDANCE_COMPANIES.reduce((a, c) => a + c.checkedIn, 0);
  const compTotal = INIT_ATTENDANCE_COMPANIES.reduce((a, c) => a + c.delegateCount, 0);
  const studCheckedIn = INIT_ATTENDANCE_STUDENTS.filter((s) => s.status === "Checked In").length;
  const studTotal = INIT_ATTENDANCE_STUDENTS.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Expected" value={subTab === 0 ? compTotal : studTotal} />
        <StatCard label="Checked In" value={subTab === 0 ? compCheckedIn : studCheckedIn} color="#2959A6" />
        <StatCard label="Pending" value={subTab === 0 ? compTotal - compCheckedIn : studTotal - studCheckedIn} color="#f59e0b" />
      </div>

      {/* Sub-tab bar */}
      <div className="relative flex bg-white border border-gray-200 rounded-xl p-1 w-fit gap-1">
        <div
          ref={subPillRef}
          className="absolute top-1 bottom-1 rounded-lg transition-all duration-200 pointer-events-none"
          style={{ background: "#0E7F41", left: 0, width: 0, transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {subTabs.map((t, i) => (
          <button
            key={t}
            ref={(el) => (subTabRefs.current[i] = el)}
            onClick={() => setSubTab(i)}
            className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${subTab === i ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
          >{t}</button>
        ))}
      </div>

      {subTab === 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Booth", "Company", "Delegates", "Checked In", "Time", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INIT_ATTENDANCE_COMPANIES.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{row.booth}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{row.company}</td>
                  <td className="py-3 pr-4 text-gray-600 text-center">{row.delegateCount}</td>
                  <td className="py-3 pr-4 text-gray-600 text-center">{row.checkedIn}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{row.time}</td>
                  <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 1 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Student ID", "Name", "Check-in Time", "Method", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INIT_ATTENDANCE_STUDENTS.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{row.id}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{row.name}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">{row.time}</td>
                  <td className="py-3 pr-4">
                    {row.method !== "—" ? (
                      <Badge label={row.method} color={row.method === "QR" ? "blue" : "gray"} />
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
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
  const [form, setForm] = useState({ start: "", end: "", title: "", host: "", location: "", capacity: "", registered: "", status: "Upcoming" });

  const handleAdd = () => {
    if (!form.title.trim() || !form.start) return;
    setSlots((prev) => [...prev, { ...form, id: Date.now(), capacity: Number(form.capacity) || 0, registered: Number(form.registered) || 0 }]);
    setForm({ start: "", end: "", title: "", host: "", location: "", capacity: "", registered: "", status: "Upcoming" });
    setShowForm(false);
  };

  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-white rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
          style={{ background: "#0E7F41" }}
        >
          {showForm ? "Cancel" : "+ Add Slot"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F3F6FF] rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700">New Time Slot</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Start</label>
              <input type="time" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">End</label>
              <input type="time" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Title</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Session title..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Host</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Host / company" value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Location</label>
              <input className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Room / area" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Capacity</label>
              <input type="number" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="0" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Status</label>
              <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {["Upcoming", "Live", "Ended"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} className="text-sm font-medium text-white rounded-xl px-4 py-2" style={{ background: "#0E7F41" }}>Save Slot</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((slot) => (
          <div key={slot.id} className="flex gap-4 items-start group">
            <div className="flex flex-col items-center pt-1 min-w-[56px]">
              <span className="text-xs font-bold text-gray-700">{slot.start}</span>
              <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[24px]" />
              <span className="text-xs text-gray-400">{slot.end}</span>
            </div>
            <div className={`flex-1 rounded-xl border p-4 flex flex-col gap-2 ${slot.status === "Live" ? "border-green-300 bg-green-50" : slot.status === "Ended" ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{slot.title}</span>
                <Badge label={slot.status} color={statusColor(slot.status)} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>Host: <span className="font-medium text-gray-700">{slot.host}</span></span>
                <span>Location: <span className="font-medium text-gray-700">{slot.location}</span></span>
                <span>Capacity: <span className="font-medium text-gray-700">{slot.registered} / {slot.capacity}</span></span>
              </div>
              {slot.capacity > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((slot.registered / slot.capacity) * 100))}%`, background: slot.status === "Live" ? "#0E7F41" : slot.status === "Ended" ? "#9ca3af" : "#2959A6" }}
                  />
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
  const [passes] = useState(INIT_PASSES);

  const total = passes.length;
  const entryCount = passes.filter((p) => p.type === "Entry").length;
  const parkingCount = passes.filter((p) => p.type === "Parking").length;
  const vipCount = passes.filter((p) => p.type === "VIP").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Issued" value={total} />
        <StatCard label="Entry Passes" value={entryCount} color="#2959A6" />
        <StatCard label="Parking Passes" value={parkingCount} color="#f59e0b" />
        <StatCard label="VIP Passes" value={vipCount} color="#8b5cf6" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["Company", "Delegate", "Pass Type", "Code", "Issued", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {passes.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 font-medium text-gray-800">{row.company}</td>
                <td className="py-3 pr-4 text-gray-700">{row.delegate}</td>
                <td className="py-3 pr-4">
                  <Badge
                    label={row.type}
                    color={row.type === "VIP" ? "purple" : row.type === "Parking" ? "yellow" : "blue"}
                  />
                </td>
                <td className="py-3 pr-4 text-gray-500 text-xs font-mono">{row.code}</td>
                <td className="py-3 pr-4 text-gray-500 text-xs">{row.issued}</td>
                <td className="py-3 pr-4"><Badge label={row.status} color={statusColor(row.status)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab 9: Post-Event Reporting & Analytics ──────────────────────────────────

const PostEventReporting = () => {
  const maxScore = 5;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Companies" value={ANALYTICS_STATS.totalCompanies} sub="Participated" />
        <StatCard label="Total Students" value={ANALYTICS_STATS.totalStudents.toLocaleString()} sub="Registered" color="#2959A6" />
        <StatCard label="Check-in Rate" value={`${ANALYTICS_STATS.checkinRate}%`} sub="Overall attendance" color="#0E7F41" />
        <StatCard label="Applications Made" value={ANALYTICS_STATS.applications.toLocaleString()} sub="During the event" color="#8b5cf6" />
        <StatCard label="Booths Utilized" value={`${ANALYTICS_STATS.boothsUtilized} / ${ANALYTICS_STATS.totalCompanies}`} sub="Active booths" color="#f59e0b" />
        <StatCard label="Avg Feedback Score" value={`${ANALYTICS_STATS.avgFeedback} / 5`} sub="Based on 312 responses" color="#0891b2" />
      </div>

      {/* Feedback bar chart (CSS only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Feedback Breakdown by Category</p>
        <div className="flex flex-col gap-3">
          {FEEDBACK_CATEGORIES.map((cat) => {
            const pct = Math.round((cat.score / maxScore) * 100);
            return (
              <div key={cat.label} className="flex items-center gap-3">
                <div className="w-40 text-xs text-gray-600 text-right flex-shrink-0">{cat.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${pct}%`, background: "#0E7F41", minWidth: "2rem" }}
                  >
                    <span className="text-white text-[10px] font-bold">{cat.score}</span>
                  </div>
                </div>
                <div className="w-8 text-xs text-gray-400 flex-shrink-0">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Export Reports</p>
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 text-sm font-medium border rounded-xl px-4 py-2 transition-colors hover:bg-green-50"
            style={{ borderColor: "#0E7F41", color: "#0E7F41" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Companies CSV
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium border rounded-xl px-4 py-2 transition-colors hover:bg-blue-50"
            style={{ borderColor: "#2959A6", color: "#2959A6" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Students CSV
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium text-white rounded-xl px-4 py-2 transition-opacity hover:opacity-90"
            style={{ background: "#2959A6" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export Full Report PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { label: "Venue & Booths", component: VenueMapping },
  { label: "Banners & Branding", component: BannerBranding },
  { label: "Special Requirements", component: SpecialRequirements },
  { label: "Equipment & Logistics", component: EquipmentLogistics },
  { label: "Delegate List", component: DelegateList },
  { label: "Attendance", component: AttendanceCheckin },
  { label: "Schedule", component: ScheduleSlots },
  { label: "Access Passes", component: AccessPasses },
  { label: "Post-Event Report", component: PostEventReporting },
];

const EventSettings = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);
  const pillRef = useRef(null);

  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    pill.style.left = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }, [activeTab]);

  const ActiveComponent = TABS[activeTab].component;

  return (
    <PageContainer user={user} title="Event Settings">
      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* Tab bar */}
        <div className="overflow-x-auto pb-1">
          <div className="relative flex bg-white border border-gray-200 rounded-xl p-1 gap-1 w-max min-w-full">
            {/* Sliding pill */}
            <div
              ref={pillRef}
              className="absolute top-1 bottom-1 rounded-lg pointer-events-none"
              style={{
                background: "#0E7F41",
                left: 0,
                width: 0,
                transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                ref={(el) => (tabRefs.current[i] = el)}
                onClick={() => setActiveTab(i)}
                className={`relative z-10 whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 ${activeTab === i ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <ActiveComponent />
        </div>
      </div>
    </PageContainer>
  );
};

export default EventSettings;
