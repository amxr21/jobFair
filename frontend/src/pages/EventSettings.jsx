import { useState, useRef, useMemo, useLayoutEffect, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventOps, formatWhen, MODULE_LABELS } from "../context/EventOpsContext";
import { useToast } from "../components/Toast";
import CompactSelect from "../components/CompactSelect";
import Modal from "../components/Modal";
import { API_URL } from "../config/api";

// ─── Small building blocks ─────────────────────────────────────────────────────

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

// "Who touched this last" — shown on every editable row/card
const LastEdited = ({ row }) => (
  <span className="text-[10px] text-gray-400 whitespace-nowrap" title={row?.updatedAt}>
    Updated by <span className="font-medium text-gray-500">{row?.updatedBy || "—"}</span> · {formatWhen(row?.updatedAt)}
  </span>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
);

const ChevronIcon = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
);

const inputCls = "border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white";

// Sub-tab bar (Attendance sections etc.)
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

// ─── Booth floor map (circular hall, center island, hover info, hide toggle) ──

const RING_STYLES = {
  Assigned: { fill: "#0E7F41", text: "#ffffff", stroke: "#0a5f31" },
  Reserved: { fill: "#fbbf24", text: "#7c5300", stroke: "#d97706" },
  Available: { fill: "#eef1f6", text: "#6b7280", stroke: "#d1d5db" },
};

const BoothMap = ({ booths, onSelect }) => {
  const [hover, setHover] = useState(null); // { booth, x, y }
  const wrapRef = useRef(null);

  const outer = booths.filter((b) => b.ring !== "center");
  const center = booths.filter((b) => b.ring === "center");

  const C = 230, R_OUT = 168, R_IN = 62;
  const place = (list, radius) => list.map((b, i) => {
    const angle = (-90 + (i * 360) / list.length) * (Math.PI / 180);
    return { ...b, x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
  });
  const nodes = [...place(outer, R_OUT), ...place(center, center.length === 1 ? 0 : R_IN)];

  const move = (e, booth) => {
    const rect = wrapRef.current.getBoundingClientRect();
    setHover({ booth, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={wrapRef} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-2 md:p-4 flex justify-center">
      <svg viewBox="0 0 460 460" className="w-full max-w-[440px]">
        {/* hall wall */}
        <circle cx={C} cy={C} r={208} fill="#fafbfe" stroke="#d8dee9" strokeWidth="2" strokeDasharray="6 5" />
        {/* center island platform */}
        <circle cx={C} cy={C} r={96} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
        <text x={C} y={C + (center.length ? 118 : 4)} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600" letterSpacing="1.5">CENTER ISLAND</text>
        {/* entrance marker */}
        <rect x={C - 26} y={434} width={52} height={10} rx={4} fill="#0E7F41" opacity="0.85" />
        <text x={C} y={456} textAnchor="middle" fontSize="10" fill="#0E7F41" fontWeight="700" letterSpacing="2">ENTRANCE</text>

        {nodes.map((b) => {
          const st = RING_STYLES[b.status] || RING_STYLES.Available;
          return (
            <g
              key={b.id}
              transform={`translate(${b.x}, ${b.y})`}
              className="cursor-pointer"
              onMouseMove={(e) => move(e, b)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(b)}
            >
              <circle r={25} fill={st.fill} stroke={st.stroke} strokeWidth="1.5" opacity={hover?.booth?.id === b.id ? 0.85 : 1} />
              <text textAnchor="middle" dy="-1" fontSize="11" fontWeight="700" fill={st.text}>{b.number}</text>
              <text textAnchor="middle" dy="11" fontSize="7" fill={st.text} opacity="0.85">
                {b.company ? (b.company.length > 11 ? b.company.slice(0, 10) + "…" : b.company) : "Free"}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="absolute z-20 pointer-events-none bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-56"
          style={{
            left: Math.min(hover.x + 14, (wrapRef.current?.offsetWidth || 300) - 235),
            top: Math.max(hover.y - 10, 4),
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-sm text-gray-800">{hover.booth.number} · Zone {hover.booth.zone}</span>
            <Badge label={hover.booth.status} color={statusColor(hover.booth.status)} />
          </div>
          <p className="text-xs text-gray-700 font-semibold">{hover.booth.company || "Not assigned yet"}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{hover.booth.type} booth · {hover.booth.ring === "center" ? "Center island" : "Outer ring"}</p>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100">
            <LastEdited row={hover.booth} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Click to manage this booth</p>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Venue & Booths ──────────────────────────────────────────────────────

const VenueMapping = () => {
  const { data, update, companies } = useEventOps();
  const toast = useToast();
  const booths = data.booths;
  const [assigningId, setAssigningId] = useState(null);
  const [formCompany, setFormCompany] = useState("");
  const [formType, setFormType] = useState("Standard");
  const [mapHidden, setMapHidden] = useState(() => localStorage.getItem("event_ops_map_hidden") === "1");
  const cardRefs = useRef({});

  const toggleMap = () => {
    setMapHidden((v) => {
      localStorage.setItem("event_ops_map_hidden", v ? "0" : "1");
      return !v;
    });
  };

  const startAssign = (booth) => { setAssigningId(booth.id); setFormCompany(booth.company || ""); setFormType(booth.type); };
  const cancelAssign = () => { setAssigningId(null); setFormCompany(""); setFormType("Standard"); };
  const saveAssign = (booth) => {
    const label = formCompany || null;
    update("booths", `${label ? `Assigned booth ${booth.number} to ${label}` : `Cleared booth ${booth.number}`}`, (rows, who) =>
      rows.map((b) => b.id === booth.id
        ? { ...b, company: label, type: formType, status: label ? "Assigned" : "Available", ...who }
        : b));
    toast(label ? `Booth ${booth.number} assigned to ${label}` : `Booth ${booth.number} cleared`, { type: "success" });
    cancelAssign();
  };

  const selectFromMap = (booth) => {
    startAssign(booth);
    cardRefs.current[booth.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const assigned = booths.filter((b) => b.status === "Assigned").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          {[["Assigned", "bg-green-500"], ["Reserved", "bg-amber-400"], ["Available", "bg-gray-300"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`w-2 h-2 rounded-full ${c}`} />{l}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">{assigned} / {booths.length} assigned</span>
          <button onClick={toggleMap} className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            {mapHidden ? "Show floor map" : "Hide floor map"}
          </button>
        </div>
      </div>

      {!mapHidden && (
        <div className="flex flex-col gap-1.5">
          <BoothMap booths={booths} onSelect={selectFromMap} />
          <p className="text-[11px] text-gray-400 text-center">
            Schematic layout — will be replaced by the real venue map. Hover a booth for details, click to manage it.
          </p>
        </div>
      )}

      {["A", "B", "C"].map((zone) => (
        <div key={zone}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Zone {zone}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {booths.filter((b) => b.zone === zone).map((booth) => (
              <div key={booth.id} ref={(el) => (cardRefs.current[booth.id] = el)} className={`rounded-xl border p-3 flex flex-col gap-2.5 ${
                booth.status === "Assigned" ? "border-green-200 bg-green-50"
                : booth.status === "Reserved" ? "border-amber-200 bg-amber-50"
                : "border-gray-200 bg-white"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">{booth.number}</span>
                  <Badge label={booth.status} color={statusColor(booth.status)} />
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                  <span className="text-gray-400">{booth.type} · {booth.ring === "center" ? "Center island" : "Outer ring"}</span>
                  <span className="font-semibold text-gray-700 truncate">{booth.company || "Unassigned"}</span>
                </div>
                {assigningId === booth.id ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <CompactSelect
                      className="text-xs"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="— Unassigned —"
                      options={[{ value: "", label: "— Unassigned —" }, ...companies.map((c) => ({ value: c, label: c }))]}
                    />
                    <CompactSelect
                      className="text-xs"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      options={["Standard", "Premium", "Corner"]}
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => saveAssign(booth)} className="flex-1 text-xs rounded-lg py-1.5 font-semibold text-white" style={{ background: "#0E7F41" }}>Save</button>
                      <button onClick={cancelAssign} className="flex-1 text-xs rounded-lg py-1.5 font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startAssign(booth)} className="text-xs rounded-lg py-1.5 font-medium border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
                    {booth.company ? "Reassign" : "Assign"}
                  </button>
                )}
                <LastEdited row={booth} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Tab: Banners & Branding ──────────────────────────────────────────────────

const BANNER_STEPS = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];

const BannerBranding = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const banners = data.banners;
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const stepIdx = (status) => BANNER_STEPS.indexOf(status);

  const advance = (row) => {
    const next = BANNER_STEPS[stepIdx(row.status) + 1];
    update("banners", `Moved ${row.company} ${row.material.toLowerCase()} to "${next}"`, (rows, who) =>
      rows.map((b) => (b.id === row.id ? { ...b, status: next, ...who } : b)));
    toast(`${row.company} banner marked ${next}`, { type: "success" });
  };

  const startEdit = (row) => { setEditingId(row.id); setForm({ ...row }); };
  const saveEdit = () => {
    update("banners", `Updated ${form.company} branding details`, (rows, who) =>
      rows.map((b) => (b.id === editingId ? { ...b, ...form, quantity: Number(form.quantity) || 1, ...who } : b)));
    toast("Branding details saved", { type: "success" });
    setEditingId(null);
  };

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
          const editing = editingId === row.id;
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
                    <button onClick={() => advance(row)} className="text-xs font-medium text-white rounded-lg px-3 py-1 hover:opacity-90 transition-opacity" style={{ background: "#0E7F41" }}>
                      Mark {BANNER_STEPS[si + 1]}
                    </button>
                  )}
                  <button onClick={() => (editing ? setEditingId(null) : startEdit(row))} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:bg-gray-50 transition-colors">
                    {editing ? "Close" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Detailed spec grid */}
              {!editing ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1.5 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  {[
                    ["Size", row.size],
                    ["Quantity", row.quantity],
                    ["Artwork file", row.artwork || "Not received"],
                    ["Company contact", row.contact],
                    ["Print deadline", row.deadline],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <p className="text-gray-400">{k}</p>
                      <p className={`font-medium truncate ${v === "Not received" ? "text-red-500" : "text-gray-700"}`}>{v}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#F3F6FF] rounded-lg p-3 border border-blue-100">
                  {[
                    ["Material", "material"], ["Size", "size"], ["Quantity", "quantity"],
                    ["Artwork file", "artwork"], ["Company contact", "contact"], ["Print deadline", "deadline"],
                  ].map(([label, key]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 font-medium">{label}</label>
                      <input className={`text-xs ${inputCls}`} value={form[key] ?? ""} onChange={F(key)} />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
                    <label className="text-xs text-gray-500 font-medium">Notes</label>
                    <input className={`text-xs ${inputCls}`} value={form.notes ?? ""} onChange={F("notes")} />
                  </div>
                  <div className="col-span-2 md:col-span-3 flex justify-end">
                    <button onClick={saveEdit} className="text-xs font-semibold text-white rounded-lg px-4 py-1.5" style={{ background: "#0E7F41" }}>Save details</button>
                  </div>
                </div>
              )}

              {/* Progress stepper */}
              <div className="flex items-center gap-0.5">
                {BANNER_STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div title={step} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all duration-300 ${
                      idx < si ? "border-green-500 bg-green-500 text-white"
                      : idx === si ? "border-green-500 bg-white text-green-600"
                      : "border-gray-200 bg-white text-gray-300"}`}>
                      {idx < si ? <CheckIcon /> : idx + 1}
                    </div>
                    {idx < BANNER_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-0.5 transition-all duration-300 ${idx < si ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                {row.notes ? <p className="text-xs text-gray-400 italic">{row.notes}</p> : <span />}
                <LastEdited row={row} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab: Special Requirements ────────────────────────────────────────────────

const SpecialRequirements = () => {
  const { data, update, companies } = useEventOps();
  const toast = useToast();
  const rows = data.requirements;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: "", description: "", category: "", priority: "Medium", status: "Open", notes: "" });

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.description.trim()) return;
    const company = form.company || companies[0];
    update("requirements", `Added requirement for ${company}: ${form.description.slice(0, 40)}`, (prev, who) =>
      [...prev, { ...form, company, id: Date.now(), ...who }]);
    toast("Requirement added", { type: "success" });
    setForm({ company: "", description: "", category: "", priority: "Medium", status: "Open", notes: "" });
    setShowForm(false);
  };

  const cycleStatus = (row) => {
    const cycle = ["Open", "In Progress", "Fulfilled"];
    const next = cycle[(cycle.indexOf(row.status) + 1) % cycle.length];
    update("requirements", `Marked ${row.company} requirement as ${next}`, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: next, ...who } : r)));
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
              { label: "Company", el: <CompactSelect value={form.company} onChange={F("company")} placeholder="Select…" options={companies} /> },
              { label: "Category", el: <input className={inputCls} placeholder="e.g. AV Equipment" value={form.category} onChange={F("category")} /> },
              { label: "Priority", el: <CompactSelect value={form.priority} onChange={F("priority")} options={["Low", "Medium", "High", "Critical"]} /> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Description</label>
              <input className={inputCls} placeholder="Describe the requirement..." value={form.description} onChange={F("description")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Notes</label>
              <input className={inputCls} placeholder="Optional..." value={form.notes} onChange={F("notes")} />
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
                {row.category && <Badge label={row.category} color="blue" />}
                <Badge label={row.priority} color={statusColor(row.priority)} />
              </div>
              <p className="text-sm text-gray-600">{row.description}</p>
              {row.notes && <p className="text-xs text-gray-400 italic">{row.notes}</p>}
              <LastEdited row={row} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge label={row.status} color={statusColor(row.status)} />
              {row.status !== "Fulfilled" && (
                <button onClick={() => cycleStatus(row)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors text-gray-600">
                  {row.status === "Open" ? "Start" : "Fulfill"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Equipment & Logistics ───────────────────────────────────────────────

const EquipmentLogistics = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const rows = data.equipment;

  const total = (kw) => rows.filter((r) => kw.some((k) => r.item.toLowerCase().includes(k))).reduce((a, r) => a + r.qtyReq, 0);
  const fulfillItem = (row) => {
    update("equipment", `Fulfilled ${row.item} for ${row.entity}`, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, qtyFul: r.qtyReq, status: "Fulfilled", ...who } : r)));
    toast(`${row.item} fulfilled`, { type: "success" });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tables" value={total(["table"])} sub="Total requested" />
        <StatCard label="Chairs" value={total(["chair"])} sub="Total requested" color="#2959A6" />
        <StatCard label="Power / Cables" value={total(["power", "extension", "cable"])} sub="Strips & cables" color="#f59e0b" />
        <StatCard label="Screens" value={total(["screen", "monitor"])} sub="Monitors & displays" color="#8b5cf6" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Company / Booth", "Item", "Requested", "Fulfilled", "Status", "Last change", ""].map((h, i) => (
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
                <td className="px-4 py-3"><LastEdited row={row} /></td>
                <td className="px-4 py-3">
                  {row.status !== "Fulfilled" && (
                    <button onClick={() => fulfillItem(row)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                      Fulfill
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

// ─── Tab: Delegates ───────────────────────────────────────────────────────────

const DelegateList = () => {
  const { data, update } = useEventOps();
  const companies = data.delegates;
  const [expanded, setExpanded] = useState(new Set([0]));

  const totalDelegates = companies.reduce((a, c) => a + c.delegates.length, 0);
  const totalPrinted = companies.reduce((a, c) => a + c.delegates.filter((d) => d.badge === "Printed").length, 0);

  const toggle = (idx) => setExpanded((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  const printBadge = (cIdx, dIdx, d) => {
    update("delegates", `Printed badge for ${d.name} (${companies[cIdx].company})`, (prev, who) =>
      prev.map((c, ci) => ci !== cIdx ? c : {
        ...c, delegates: c.delegates.map((dd, di) => di !== dIdx ? dd : { ...dd, badge: "Printed", ...who })
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
              <span className="text-gray-400"><ChevronIcon open={expanded.has(idx)} /></span>
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
                            <button onClick={() => printBadge(idx, di, d)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
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

// ─── Tab: Attendance & Check-in (with per-booth QR codes) ─────────────────────

const boothQrValue = (booth) => `jobfair:attendance:${booth.number}`;

const AttendanceCheckin = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const [subTab, setSubTab] = useState(0);
  const students = data.attendanceStudents;
  const companies = data.attendanceCompanies;
  const booths = data.booths.filter((b) => b.company);

  const compCheckedIn = companies.reduce((a, c) => a + c.checkedIn, 0);
  const compTotal = companies.reduce((a, c) => a + c.delegateCount, 0);
  const studCheckedIn = students.filter((s) => s.status === "Checked In").length;

  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const checkInStudent = (id) => update("attendanceStudents", `Checked in student ${id} (manual)`, (prev) =>
    prev.map((s) => s.id !== id ? s : { ...s, status: "Checked In", time: now(), method: "Manual" }));

  const checkInCompany = (row, method) => {
    update("attendanceCompanies", `Checked in ${row.company} at booth ${row.booth} (${method})`, (prev, who) =>
      prev.map((c) => c.booth !== row.booth ? c : { ...c, checkedIn: c.delegateCount, time: now(), method, status: "Present", ...who }));
    toast(`${row.company} checked in via ${method}`, { type: "success" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Expected" value={subTab === 1 ? students.length : compTotal} />
        <StatCard label="Checked In" value={subTab === 1 ? studCheckedIn : compCheckedIn} color="#2959A6" />
        <StatCard label="Pending" value={subTab === 1 ? students.length - studCheckedIn : compTotal - compCheckedIn} color="#f59e0b" />
      </div>

      <SubTabBar tabs={["Companies", "Students", "Booth QR Codes"]} active={subTab} onChange={setSubTab} />

      {subTab === 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Booth", "Company", "Delegates", "Checked In", "Time", "Method", "Status", ""].map((h, i) => (
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
                  <td className="px-4 py-3">{row.method && row.method !== "—" ? <Badge label={row.method} color={row.method === "QR" ? "blue" : "gray"} /> : <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3">
                    {row.status !== "Present" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => checkInCompany(row, "QR")} className="text-xs font-medium border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 text-blue-600 transition-colors" title="Simulates the booth QR being scanned">
                          QR Scan
                        </button>
                        <button onClick={() => checkInCompany(row, "Manual")} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                          Manual
                        </button>
                      </div>
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

      {subTab === 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            Each assigned booth has a printed QR code on its table. When a company representative scans it on event day,
            their attendance is confirmed automatically. Companies see the same code in their own settings page.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {booths.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2">
                <QRCodeSVG value={boothQrValue(b)} size={96} fgColor="#111827" />
                <p className="font-bold text-sm text-gray-800">{b.number}</p>
                <p className="text-xs text-gray-500 text-center truncate w-full">{b.company}</p>
                <span className="text-[10px] font-mono text-gray-400">{boothQrValue(b)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Tab: Manage Staff ─────────────────────────────────────────────────────────
// Rana (or whoever owns it) creates an attendance-staff account with just a
// name + email — the staffer fills in the rest (phone, notes) themselves the
// first time they log in with their code at /student-checkin.

const ManageStaff = () => {
  const { data, addStaffer, removeStaffer } = useEventOps();
  const toast = useToast();
  const staff = data.attendanceStaff || [];
  const checkinLog = data.checkinLog || [];
  const [form, setForm] = useState({ name: "", email: "" });
  const [revealedCode, setRevealedCode] = useState(null); // { name, code } — shown once after creation

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const code = addStaffer(form.name.trim(), form.email.trim());
    setRevealedCode({ name: form.name.trim(), code });
    setForm({ name: "", email: "" });
    toast(`Account created for ${form.name.trim()}`, { type: "success" });
  };

  const totalCheckins = checkinLog.length;
  const activeCount = staff.filter((s) => s.status === "active").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Staff Accounts" value={staff.length} sub={`${activeCount} active`} />
        <StatCard label="Students Checked In" value={totalCheckins} color="#2959A6" />
        <StatCard label="Awaiting First Login" value={staff.filter((s) => s.status === "invited").length} color="#f59e0b" />
      </div>

      <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        Create an account with a name and email — you'll get a short access code to share with them.
        They log in at
        <a href="/student-checkin" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline mx-1">/student-checkin</a>
        with that code, fill in their own remaining details, and can then check students in without a CASTO or company account.
        Each account's check-ins are logged separately below — no one sees anyone else's activity.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">New Staff Account</p>
        <div className="flex gap-2 items-start flex-wrap">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            type="email"
            placeholder="Email address"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleAdd} disabled={!form.name.trim() || !form.email.trim()} className="text-xs font-semibold text-white rounded-lg px-4 py-2 disabled:opacity-50" style={{ background: "#0E7F41" }}>
            Create Account
          </button>
        </div>
      </div>

      {revealedCode && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-green-800">Access code for {revealedCode.name}</p>
            <p className="text-2xl font-mono font-bold text-green-700 tracking-widest">{revealedCode.code}</p>
            <p className="text-[11px] text-green-600 mt-1">Share this with them now — it won't be shown again here.</p>
          </div>
          <button onClick={() => setRevealedCode(null)} className="text-xs font-medium text-green-700 hover:text-green-900">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {staff.map((s) => {
          const theirCheckins = checkinLog.filter((c) => c.byId === s.id);
          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                    <Badge label={s.status === "active" ? "Active" : "Invited"} color={s.status === "active" ? "green" : "yellow"} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  {s.phone && <p className="text-[11px] text-gray-400">{s.phone}</p>}
                  <p className="text-xs font-mono text-gray-400 mt-0.5">Code: {s.code}</p>
                </div>
                <button onClick={() => removeStaffer(s.id)} className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-1 text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  Revoke
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Checked in {theirCheckins.length} student{theirCheckins.length === 1 ? "" : "s"}</span>
              </div>
              {theirCheckins.length > 0 && (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                  {theirCheckins.slice(0, 8).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-700 truncate">{c.name || c.uniId}</span>
                      <span className="text-gray-400 text-[10px] shrink-0">{formatWhen(c.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {staff.length === 0 && <p className="text-xs text-gray-400 col-span-2 text-center py-6">No staff accounts created yet.</p>}
      </div>
    </div>
  );
};

// ─── Tab: Schedule ────────────────────────────────────────────────────────────

const ScheduleSlots = () => {
  const { data, update } = useEventOps();
  const slots = data.schedule;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.title.trim() || !form.start) return;
    update("schedule", `Added time slot "${form.title}"`, (prev, who) =>
      [...prev, { ...form, id: Date.now(), capacity: Number(form.capacity) || 0, registered: 0, ...who }]);
    setForm({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });
    setShowForm(false);
  };

  const cycleStatus = (slot) => {
    const cycle = ["Upcoming", "Live", "Ended"];
    const next = cycle[(cycle.indexOf(slot.status) + 1) % cycle.length];
    update("schedule", `Set "${slot.title}" to ${next}`, (prev, who) =>
      prev.map((s) => (s.id === slot.id ? { ...s, status: next, ...who } : s)));
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
              { label: "Start", el: <input type="time" className={inputCls} value={form.start} onChange={F("start")} /> },
              { label: "End", el: <input type="time" className={inputCls} value={form.end} onChange={F("end")} /> },
              { label: "Host", el: <input className={inputCls} placeholder="Host / team" value={form.host} onChange={F("host")} /> },
              { label: "Location", el: <input className={inputCls} placeholder="Room / area" value={form.location} onChange={F("location")} /> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Session Title</label>
              <input className={inputCls} placeholder="e.g. Opening Ceremony" value={form.title} onChange={F("title")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Capacity</label>
              <input type="number" className={inputCls} placeholder="0" value={form.capacity} onChange={F("capacity")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Status</label>
              <CompactSelect value={form.status} onChange={F("status")} options={["Upcoming", "Live", "Ended"]} />
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
                  <button onClick={() => cycleStatus(slot)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-0.5 hover:bg-white transition-colors text-gray-500 bg-white/60">
                    Next status
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {slot.host && <span>Host: <span className="font-medium text-gray-700">{slot.host}</span></span>}
                {slot.location && <span>Location: <span className="font-medium text-gray-700">{slot.location}</span></span>}
                {slot.capacity > 0 && <span>Registered: <span className="font-medium text-gray-700">{slot.registered} / {slot.capacity}</span></span>}
                <LastEdited row={slot} />
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

// ─── Tab: Access Passes ───────────────────────────────────────────────────────

const AccessPasses = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const passes = data.passes;
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState(0); // 0 = table, 1 = by company
  const [editingParking, setEditingParking] = useState(null); // pass id
  const [parkingForm, setParkingForm] = useState({ slot: "", location: "" });

  const types = ["All", "Entry", "Parking"];
  const shown = filter === "All" ? passes : passes.filter((p) => p.type === filter);
  const byCompany = useMemo(() => {
    const m = new Map();
    passes.forEach((p) => m.set(p.company, [...(m.get(p.company) || []), p]));
    return [...m.entries()];
  }, [passes]);

  const setStatus = (row, status) => {
    update("passes", `${status === "Revoked" ? "Revoked" : "Reactivated"} pass ${row.code} (${row.company})`, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, status, ...who } : p)));
    toast(`Pass ${row.code} ${status.toLowerCase()}`, { type: status === "Revoked" ? "warning" : "success" });
  };

  const startEditParking = (row) => {
    setEditingParking(row.id);
    setParkingForm({ slot: row.slot || "", location: row.location || "" });
  };

  const saveParking = (row) => {
    update("passes", `Set parking slot ${parkingForm.slot || "—"} for ${row.company}`, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, slot: parkingForm.slot, location: parkingForm.location, ...who } : p)));
    toast("Parking assignment saved", { type: "success" });
    setEditingParking(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Issued" value={passes.length} />
        <StatCard label="Entry Passes" value={passes.filter(p => p.type === "Entry").length} color="#2959A6" />
        <StatCard label="Parking Passes" value={passes.filter(p => p.type === "Parking").length} color="#f59e0b" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-all duration-150 ${filter === t ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              style={filter === t ? { background: "#0E7F41" } : {}}>
              {t} {t !== "All" && `(${passes.filter(p => p.type === t).length})`}
            </button>
          ))}
        </div>
        <SubTabBar tabs={["Table", "By Company"]} active={view} onChange={setView} />
      </div>

      {view === 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Company", "Delegate", "Type", "Parking Slot & Location", "Code", "Issued", "Status", "Last change", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.company}</td>
                  <td className="px-4 py-3 text-gray-700">{row.delegate}</td>
                  <td className="px-4 py-3"><Badge label={row.type} color={row.type === "Parking" ? "yellow" : "blue"} /></td>
                  <td className="px-4 py-3">
                    {row.type !== "Parking" ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : editingParking === row.id ? (
                      <div className="flex items-center gap-1.5">
                        <input value={parkingForm.slot} onChange={(e) => setParkingForm((f) => ({ ...f, slot: e.target.value }))} placeholder="Slot e.g. P1-14" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-green-500" />
                        <input value={parkingForm.location} onChange={(e) => setParkingForm((f) => ({ ...f, location: e.target.value }))} placeholder="Exact location" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-green-500" />
                        <button onClick={() => saveParking(row)} className="text-xs font-semibold text-white rounded-lg px-2 py-1" style={{ background: "#0E7F41" }}>Save</button>
                      </div>
                    ) : row.slot ? (
                      <button onClick={() => startEditParking(row)} className="text-left hover:underline">
                        <span className="font-mono text-xs font-semibold text-gray-700">{row.slot}</span>
                        <span className="text-[11px] text-gray-400 block">{row.location}</span>
                      </button>
                    ) : (
                      <button onClick={() => startEditParking(row)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:border-green-300 hover:text-green-700 transition-colors">
                        Assign slot
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.code}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.issued}</td>
                  <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3"><LastEdited row={row} /></td>
                  <td className="px-4 py-3">
                    {row.status === "Active" && (
                      <button onClick={() => setStatus(row, "Revoked")} className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 text-red-500 transition-colors">Revoke</button>
                    )}
                    {row.status === "Revoked" && (
                      <button onClick={() => setStatus(row, "Active")} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-500 transition-colors">Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {byCompany.map(([company, rows]) => (
            <div key={company} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800 text-sm">{company}</p>
                <Badge label={`${rows.length} passes`} color="blue" />
              </div>
              <div className="flex flex-col gap-2">
                {rows.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                    <QRCodeSVG value={`jobfair:pass:${p.code}`} size={44} fgColor="#111827" className="shrink-0 bg-white rounded p-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 truncate">{p.delegate}</p>
                      <p className="text-[10px] font-mono text-gray-400">{p.code}</p>
                      {p.type === "Parking" && p.slot && <p className="text-[10px] text-amber-600 mt-0.5">Slot {p.slot} · {p.location}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge label={p.type} color={p.type === "Parking" ? "yellow" : "blue"} />
                      <Badge label={p.status} color={statusColor(p.status)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">This exact view is what {company} sees in their settings page.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tab: Post-Event Report ───────────────────────────────────────────────────
// Every number here is computed from real data — applicants/companies fetched
// from the backend, plus the booths/banners/passes already tracked in
// EventOpsContext. Nothing is a static placeholder.

const uniqueApplicants = (applicants) => {
  const seen = new Set();
  return (applicants || []).filter((a) => {
    const id = a.applicantDetails?.uniId;
    if (id && !seen.has(id)) { seen.add(id); return true; }
    return false;
  });
};

const PostEventReporting = ({ applicants, companies }) => {
  const { data } = useEventOps();

  const stats = useMemo(() => {
    const uniqueApps = uniqueApplicants(applicants);
    const checkedInApps = uniqueApps.filter((a) => a.attended).length;
    const checkinRate = uniqueApps.length > 0 ? Math.round((checkedInApps / uniqueApps.length) * 100) : 0;

    const confirmedCompanies = (companies || []).filter((c) => c.status === "Confirmed").length;
    const assignedBooths = data.booths.filter((b) => b.company).length;
    const totalApplications = (applicants || []).length; // every submission, not deduped — mirrors "applications made"

    return {
      totalCompanies: companies?.length || 0,
      confirmedCompanies,
      totalStudents: uniqueApps.length,
      checkinRate,
      totalApplications,
      assignedBooths,
      totalBooths: data.booths.length,
      passesIssued: data.passes.length,
      bannersPlaced: data.banners.filter((b) => b.status === "Placed").length,
      totalBanners: data.banners.length,
    };
  }, [applicants, companies, data]);

  // Ops completion by module — derived from the same live event-ops data
  // shown throughout the rest of this page, not a separate mock feedback score
  const completionBreakdown = useMemo(() => {
    const pct = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);
    const boothPct = pct(stats.assignedBooths, stats.totalBooths);
    const bannerPct = pct(stats.bannersPlaced, stats.totalBanners);
    const reqDone = data.requirements.filter((r) => r.status === "Fulfilled").length;
    const reqPct = pct(reqDone, data.requirements.length);
    const eqDone = data.equipment.filter((e) => e.status === "Fulfilled").length;
    const eqPct = pct(eqDone, data.equipment.length);
    return [
      { label: "Booths Assigned", pct: boothPct, sub: `${stats.assignedBooths} / ${stats.totalBooths}` },
      { label: "Banners Placed", pct: bannerPct, sub: `${stats.bannersPlaced} / ${stats.totalBanners}` },
      { label: "Requirements Fulfilled", pct: reqPct, sub: `${reqDone} / ${data.requirements.length}` },
      { label: "Equipment Fulfilled", pct: eqPct, sub: `${eqDone} / ${data.equipment.length}` },
    ];
  }, [data, stats]);

  const exportCsv = (filename, rows) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCompanies = () => exportCsv("companies.csv", (companies || []).map((c) => ({
    name: c.companyName, email: c.email, status: c.status || "Pending", sector: c.sector, city: c.city,
  })));

  const exportStudents = () => exportCsv("students.csv", uniqueApplicants(applicants).map((a) => ({
    name: a.applicantDetails?.fullName, uniId: a.applicantDetails?.uniId, major: a.applicantDetails?.major, attended: a.attended ? "Yes" : "No",
  })));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Companies" value={stats.totalCompanies} sub={`${stats.confirmedCompanies} confirmed`} />
        <StatCard label="Total Students" value={stats.totalStudents.toLocaleString()} sub="Unique registrations" color="#2959A6" />
        <StatCard label="Check-in Rate" value={`${stats.checkinRate}%`} sub="Of registered students" />
        <StatCard label="Applications Made" value={stats.totalApplications.toLocaleString()} sub="Total submissions" color="#8b5cf6" />
        <StatCard label="Booths Assigned" value={`${stats.assignedBooths}/${stats.totalBooths}`} sub="Companies placed" color="#f59e0b" />
        <StatCard label="Access Passes Issued" value={stats.passesIssued} sub={`${stats.bannersPlaced}/${stats.totalBanners} banners placed`} color="#0891b2" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Operations Completion</p>
        <div className="flex flex-col gap-3">
          {completionBreakdown.map((cat) => (
            <div key={cat.label} className="flex items-center gap-3">
              <div className="w-44 text-xs text-gray-600 text-right flex-shrink-0">{cat.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700" style={{ width: `${Math.max(cat.pct, 4)}%`, background: "#0E7F41" }}>
                  {cat.pct >= 15 && <span className="text-white text-[10px] font-bold">{cat.pct}%</span>}
                </div>
              </div>
              <div className="w-16 text-xs text-gray-400 flex-shrink-0">{cat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Export Reports</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCompanies} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border" style={{ background: "white", color: "#0E7F41", borderColor: "#0E7F41" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Companies CSV
          </button>
          <button onClick={exportStudents} className="flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-90 border" style={{ background: "white", color: "#2959A6", borderColor: "#2959A6" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Students CSV
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab icons (SVG — no emojis) ──────────────────────────────────────────────

const TabIcon = ({ id }) => {
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
  };
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[id] || paths.venue} />
    </svg>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "venue",        label: "Venue & Booths",        component: VenueMapping },
  { id: "banners",      label: "Banners & Branding",    component: BannerBranding },
  { id: "requirements", label: "Special Requirements",  component: SpecialRequirements },
  { id: "equipment",    label: "Equipment & Logistics", component: EquipmentLogistics },
  { id: "delegates",    label: "Delegate List",         component: DelegateList },
  { id: "attendance",   label: "Attendance",            component: AttendanceCheckin },
  { id: "manageStaff",  label: "Manage Staff",          component: ManageStaff },
  { id: "schedule",     label: "Schedule",              component: ScheduleSlots },
  { id: "passes",       label: "Access Passes",         component: AccessPasses },
  { id: "report",       label: "Post-Event Report",     component: PostEventReporting },
];

// ─── Activity panel (audit trail) ─────────────────────────────────────────────

const ActivityPanel = ({ open, onClose }) => {
  const { data } = useEventOps();
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState(open ? "open" : "closed");
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimer.current);
      setMounted(true);
      setPhase("opening");
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("open")));
      return () => cancelAnimationFrame(id);
    } else if (mounted) {
      setPhase("closing");
      closeTimer.current = setTimeout(() => setMounted(false), 240);
    }
    return () => clearTimeout(closeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const backdropState = phase === "open" ? "backdrop-open" : phase === "closing" ? "backdrop-close" : "";
  const drawerState = phase === "open" ? "drawer-open" : phase === "closing" ? "drawer-close" : "";

  return (
    <>
      <div className={`expandDetails-backdrop fixed inset-0 bg-black/30 z-[300] ${backdropState}`} onClick={onClose} />
      <div className={`drawerPanel fixed right-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white z-[301] shadow-2xl flex flex-col ${drawerState}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-800">Recent Activity</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {(data.audit || []).length === 0 && <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>}
          {(data.audit || []).map((a) => (
            <div key={a.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#0E7F41] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {a.by?.[0] || "?"}
                </span>
                <span className="text-xs font-semibold text-gray-700">{a.by}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{formatWhen(a.at)}</span>
              </div>
              <p className="text-xs text-gray-600">{a.message}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{a.section}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── View As panel ─────────────────────────────────────────────────────────────
// Lets Rana preview what each role's world looks like — without swapping her
// real CASTO session (which could break her own login if anything went
// wrong). Company/staff previews are read-only panels built from data
// already loaded here; the student check-in view is genuinely public, so it
// just opens in a new tab.

const ViewAsPanel = ({ open, onClose }) => {
  const { companyView, companies, data } = useEventOps();
  const [mode, setMode] = useState("manager");
  const [selectedCompany, setSelectedCompany] = useState(companies[0] || "");
  const [selectedStaff, setSelectedStaff] = useState(data.attendanceStaff?.[0]?.id ?? null);

  const view = selectedCompany ? companyView(selectedCompany) : null;
  const staffer = (data.attendanceStaff || []).find((s) => s.id === selectedStaff);
  const stafferLog = staffer ? (data.checkinLog || []).filter((c) => c.byId === staffer.id) : [];

  return (
    <Modal visible={open} onClose={onClose} maxWidth="max-w-2xl" contentClassName="max-h-[85vh]">
      <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">View As</h2>
          <p className="text-xs text-white/80 mt-0.5">Preview what other roles see — read-only, doesn't touch your session</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 overflow-y-auto">
        <SubTabBar tabs={["Manager (Company)", "Attendance Staff", "Student Check-in"]} active={mode === "manager" ? 0 : mode === "staff" ? 1 : 2}
          onChange={(i) => setMode(i === 0 ? "manager" : i === 1 ? "staff" : "student")} />

        {mode === "manager" && (
          <div className="flex flex-col gap-3">
            <CompactSelect value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} options={companies} placeholder="Choose a company…" />
            {!view ? (
              <p className="text-xs text-gray-400 text-center py-8">Select a company to preview their Event Day view.</p>
            ) : (
              <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-[#F3F6FF]">
                <p className="text-xs font-semibold text-gray-500">This is what {selectedCompany} sees on their "My Status" page:</p>
                {view.booth ? (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-bold text-gray-800">Booth {view.booth.number} · Zone {view.booth.zone}</p>
                    <p className="text-xs text-gray-500">{view.booth.type} · {view.booth.status}</p>
                  </div>
                ) : <p className="text-xs text-gray-400">No booth assigned yet.</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2.5"><p className="text-gray-400">Banners</p><p className="font-semibold text-gray-700">{view.banners.length}</p></div>
                  <div className="bg-white rounded-lg p-2.5"><p className="text-gray-400">Passes</p><p className="font-semibold text-gray-700">{view.passes.length}</p></div>
                  <div className="bg-white rounded-lg p-2.5"><p className="text-gray-400">Requirements</p><p className="font-semibold text-gray-700">{view.requirements.length}</p></div>
                  <div className="bg-white rounded-lg p-2.5"><p className="text-gray-400">Equipment items</p><p className="font-semibold text-gray-700">{view.equipment.length}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "staff" && (
          <div className="flex flex-col gap-3">
            <CompactSelect
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(Number(e.target.value))}
              options={(data.attendanceStaff || []).map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Choose a staff account…"
            />
            {!staffer ? (
              <p className="text-xs text-gray-400 text-center py-8">No staff accounts yet — create one in the Manage Staff tab.</p>
            ) : (
              <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-[#F3F6FF]">
                <p className="text-xs font-semibold text-gray-500">This is what {staffer.name} sees at /student-checkin:</p>
                <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{staffer.name}</p>
                    <p className="text-xs text-gray-500">{staffer.email}</p>
                  </div>
                  <Badge label={staffer.status === "active" ? "Active" : "Invited"} color={staffer.status === "active" ? "green" : "yellow"} />
                </div>
                <p className="text-xs text-gray-500">Checked in {stafferLog.length} student{stafferLog.length === 1 ? "" : "s"} today</p>
                {stafferLog.slice(0, 5).map((c) => (
                  <div key={c.id} className="bg-white rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-gray-700">{c.name || c.uniId}</span>
                    <span className="text-gray-400">{formatWhen(c.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "student" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-gray-600 max-w-sm">
              The student check-in page is fully public — it needs a real access code to log in, so the truest preview is opening it directly.
            </p>
            <a href="/student-checkin" target="_blank" rel="noreferrer" className="text-sm font-semibold text-white rounded-lg px-5 py-2.5" style={{ background: "#0E7F41" }}>
              Open /student-checkin in a new tab
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Team & Roles panel ────────────────────────────────────────────────────────
// Shows every team member's responsibilities. Rana (Event Lead) additionally
// gets the ability to reassign who owns which module, gated behind a 2-step
// check: her real CASTO login password, then a one-time code shown on screen
// (there's no per-employee inbox to actually deliver it to).

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

const TeamPanel = ({ open, onClose }) => {
  const { team, employee, updateTeamFocus } = useEventOps();
  const toast = useToast();
  const canReassign = employee.id === "rana";

  const [reassigning, setReassigning] = useState(null); // member id being edited
  const [draftFocus, setDraftFocus] = useState([]);
  const [verifyStep, setVerifyStep] = useState(null); // null | 'password' | 'code'
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const resetVerification = () => {
    setVerifyStep(null); setPassword(""); setPasswordError("");
    setSentCode(""); setCodeInput(""); setCodeError("");
  };

  const startReassign = (member) => {
    setReassigning(member.id);
    setDraftFocus(member.focus);
    resetVerification();
  };

  const cancelReassign = () => {
    setReassigning(null);
    resetVerification();
  };

  const toggleModule = (id) => {
    setDraftFocus((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const requestVerification = () => setVerifyStep("password");

  const checkPassword = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!password.trim() || !storedUser?.email) return;
    setCheckingPassword(true);
    setPasswordError("");
    try {
      const res = await axios.post(`${API_URL}/user/login`, {
        email: storedUser.email, password, companyName: storedUser.companyName,
      });
      if (res.status === 200) {
        const code = genCode();
        setSentCode(code);
        setVerifyStep("code");
        toast(`Verification code: ${code} (no real inbox tied to this account — shown here instead)`, { type: "info", duration: 8000 });
      }
    } catch {
      setPasswordError("Incorrect password");
    } finally {
      setCheckingPassword(false);
    }
  };

  const confirmCode = () => {
    if (codeInput.trim() !== sentCode) {
      setCodeError("That code doesn't match");
      return;
    }
    updateTeamFocus(reassigning, draftFocus);
    toast("Role responsibilities updated", { type: "success" });
    setReassigning(null);
    resetVerification();
  };

  const allModules = Object.keys(MODULE_LABELS);

  return (
    <Modal visible={open} onClose={onClose} maxWidth="max-w-xl" contentClassName="max-h-[85vh]">
      <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold">Team & Roles</h2>
          <p className="text-xs text-white/80 mt-0.5">Who owns what across Event Settings</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex flex-col gap-3">
        {team.map((m) => {
          const isEditing = reassigning === m.id;
          return (
            <div key={m.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#0E7F41] text-white text-xs font-bold flex items-center justify-center shrink-0">{m.name[0]}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                </div>
                {canReassign && !isEditing && (
                  <button onClick={() => startReassign(m)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 hover:border-green-300 hover:text-green-700 transition-colors shrink-0">
                    Reassign
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mt-2.5">{m.responsibilities}</p>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {m.focus.map((id) => (
                  <span key={id} className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{MODULE_LABELS[id] || id}</span>
                ))}
              </div>

              {isEditing && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                  {!verifyStep && (
                    <>
                      <p className="text-xs font-semibold text-gray-600">Select the modules {m.name} should own:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allModules.map((id) => {
                          const checked = draftFocus.includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleModule(id)}
                              className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${checked ? "bg-[#0E7F41] text-white border-[#0E7F41]" : "bg-white text-gray-500 border-gray-200 hover:border-green-300"}`}>
                              {MODULE_LABELS[id]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={requestVerification} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#0E7F41" }}>
                          Save changes
                        </button>
                      </div>
                    </>
                  )}

                  {verifyStep === "password" && (
                    <div className="bg-[#F3F6FF] rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700">Step 1 of 2 — confirm your admin password</p>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && checkPassword()}
                        placeholder="CASTO account password"
                        autoFocus
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={checkPassword} disabled={checkingPassword || !password.trim()} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                          {checkingPassword ? "Checking…" : "Continue"}
                        </button>
                      </div>
                    </div>
                  )}

                  {verifyStep === "code" && (
                    <div className="bg-[#F3F6FF] rounded-xl p-3 flex flex-col gap-2.5">
                      <p className="text-xs font-semibold text-gray-700">Step 2 of 2 — enter the verification code</p>
                      <p className="text-[11px] text-gray-500">A code was generated for this change — check the notification in the top-right corner.</p>
                      <input
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && confirmCode()}
                        placeholder="6-digit code"
                        maxLength={6}
                        autoFocus
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      {codeError && <p className="text-xs text-red-500">{codeError}</p>}
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelReassign} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        <button onClick={confirmCode} disabled={codeInput.trim().length !== 6} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50" style={{ background: "#0E7F41" }}>
                          Confirm & Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!canReassign && (
          <p className="text-[11px] text-gray-400 text-center pt-1">Only the Event Lead can reassign team responsibilities.</p>
        )}
      </div>
    </Modal>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const EventSettings = ({ link }) => {
  const { user } = useAuthContext();
  const { employee, team, setActingAs } = useEventOps();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [showActivity, setShowActivity] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showViewAs, setShowViewAs] = useState(false);
  const [reportData, setReportData] = useState({ applicants: [], companies: [] });

  // Fetch real applicants/companies once, on demand — only the Post-Event
  // Report tab needs them, but fetching here keeps the tab switch instant
  useEffect(() => {
    (async () => {
      try {
        const [applicantsRes, companiesRes] = await Promise.all([
          axios.get(`${link}/applicants?limit=10000`),
          axios.get(`${link}/companies`),
        ]);
        setReportData({
          applicants: applicantsRes?.data?.applicants || applicantsRes?.data || [],
          companies: companiesRes?.data || [],
        });
      } catch { /* report tab will show zeros until this succeeds */ }
    })();
  }, [link]);

  // Each employee sees their own view: their modules come first and are marked
  const orderedTabs = useMemo(() => {
    const focus = employee.focus || [];
    return [...TABS].sort((a, b) => {
      const ai = focus.indexOf(a.id), bi = focus.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [employee]);

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || VenueMapping;
  const activeComponentProps = activeTab === "report" ? reportData : {};

  return (
    <PageContainer
      user={user}
      title="Event Settings"
      headerRight={
        <div className="flex items-center gap-2">
          {employee.id === "rana" && (
            <button onClick={() => setShowViewAs(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
              View As
            </button>
          )}
          <button onClick={() => setShowTeamPanel(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Team & Roles
          </button>
          <button onClick={() => setShowActivity(true)} className="text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Activity Log
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {/* Team view switcher — one CASTO account, one view per employee */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Viewing as</span>
          {team.map((m) => (
            <button
              key={m.id}
              onClick={() => setActingAs(m.id)}
              title={m.role}
              className={`flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-xs font-semibold border transition-all ${
                employee.id === m.id
                  ? "bg-[#0E7F41] text-white border-[#0E7F41] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${employee.id === m.id ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                {m.name[0]}
              </span>
              {m.name}
            </button>
          ))}
          <span className="text-[11px] text-gray-400 ml-1 hidden lg:inline">{employee.role} — changes are recorded under {employee.name}</span>
        </div>

        {/* Tab bar — employee's modules first, marked with a dot */}
        <div className="shrink-0 overflow-x-auto pb-1">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 min-w-max">
            {orderedTabs.map((tab) => {
              const mine = employee.focus?.includes(tab.id);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                    active ? "text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  style={active ? { background: "#0E7F41" } : {}}
                >
                  <TabIcon id={tab.id} />
                  <span>{tab.label}</span>
                  {mine && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-[#0E7F41]"}`} title={`Assigned to ${employee.name}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content — its own scroll area so every tab is fully reachable */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl">
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
            <ActiveComponent {...activeComponentProps} />
          </div>
        </div>
      </div>

      <ActivityPanel open={showActivity} onClose={() => setShowActivity(false)} />
      <TeamPanel open={showTeamPanel} onClose={() => setShowTeamPanel(false)} />
      <ViewAsPanel open={showViewAs} onClose={() => setShowViewAs(false)} />
    </PageContainer>
  );
};

export default EventSettings;
