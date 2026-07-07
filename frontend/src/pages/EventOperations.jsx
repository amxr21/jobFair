import { useState, useRef, useMemo, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventOps, formatWhen } from "../context/EventOpsContext";
import { useToast } from "../components/Toast";
import CompactSelect from "../components/CompactSelect";
import Modal from "../components/Modal";
import { API_URL } from "../config/api";
import { Badge, statusColor, StatCard, LastEdited, CheckIcon, ChevronIcon, inputCls, SubTabBar, TabIcon, Highlight } from "../components/EventSettingsShared";

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
          style={(() => {
            // Keep the card fully inside the map on every edge: flip to the left
            // of the cursor when it would overflow right, and clamp top/bottom so
            // it never spills out of line below the container.
            const W = wrapRef.current?.offsetWidth || 300;
            const H = wrapRef.current?.offsetHeight || 300;
            const cardW = 224, cardH = 150, pad = 6;
            let left = hover.x + 14;
            if (left + cardW > W - pad) left = hover.x - cardW - 14;
            left = Math.max(pad, Math.min(left, W - cardW - pad));
            const top = Math.max(pad, Math.min(hover.y - 10, H - cardH - pad));
            return { left, top };
          })()}
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
  const [showMap, setShowMap] = useState(false);
  const cardRefs = useRef({});

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

  // Closes the map modal first, then scrolls to the matching zone card once the
  // modal's own close animation has finished (see components/Modal.jsx, 240ms) —
  // scrolling while the modal is still animating out fights the layout.
  const selectFromMap = (booth) => {
    setShowMap(false);
    startAssign(booth);
    setTimeout(() => {
      cardRefs.current[booth.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 260);
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
          <button onClick={() => setShowMap(true)} className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors">
            Show floor map
          </button>
        </div>
      </div>

      <Modal visible={showMap} onClose={() => setShowMap(false)} maxWidth="max-w-3xl" contentClassName="max-h-[85vh]">
        <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Floor Map</h2>
            <p className="text-xs text-white/80 mt-0.5">Click a booth to manage its assignment</p>
          </div>
          <button onClick={() => setShowMap(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-5 overflow-y-auto flex flex-col gap-1.5">
          <BoothMap booths={booths} onSelect={selectFromMap} />
          <p className="text-[11px] text-gray-400 text-center">
            Schematic layout — will be replaced by the real venue map. Hover a booth for details, click to manage it.
          </p>
        </div>
      </Modal>

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

// Real values found in the banners table today — these are item TYPES
// (what's being printed), not physical materials like vinyl/fabric.
const BANNER_MATERIALS = ["Roll-up Banner", "Backdrop", "Table Skirt", "Digital Screen Graphic", "Other"];

// `size` is stored as one "{width} × {height} cm" string (real data already
// uses this exact format, e.g. "85 × 200 cm") — parsed into two fields for
// editing, then recomposed back into that same string shape on save so the
// DB column (and every other reader of `size`) doesn't need to change.
const SIZE_RE = /^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*cm$/i;
function parseSize(size) {
  const m = SIZE_RE.exec(String(size || "").trim());
  return m ? { width: m[1], height: m[2] } : { width: "", height: "" };
}
function composeSize(width, height) {
  if (!width && !height) return "";
  return `${width || "?"} × ${height || "?"} cm`;
}

const BannerBranding = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const banners = data.banners;
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);

  const stepIdx = (status) => BANNER_STEPS.indexOf(status);

  const advance = (row) => {
    const next = BANNER_STEPS[stepIdx(row.status) + 1];
    update("banners", `Moved ${row.company} ${row.material.toLowerCase()} to "${next}"`, (rows, who) =>
      rows.map((b) => (b.id === row.id ? { ...b, status: next, ...who } : b)));
    toast(`${row.company} banner marked ${next}`, { type: "success" });
  };

  const startEdit = (row) => { setEditingId(row.id); setForm({ ...row, ...parseSize(row.size) }); };
  const saveEdit = () => {
    const size = composeSize(form.width, form.height);
    update("banners", `Updated ${form.company} branding details`, (rows, who) =>
      rows.map((b) => (b.id === editingId ? { ...b, ...form, size, quantity: Number(form.quantity) || 1, ...who } : b)));
    toast("Branding details saved", { type: "success" });
    setEditingId(null);
  };

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Uploads the real file to Cloudinary via the backend, then updates just
  // this banner's artwork URL — both in local state (so it shows immediately)
  // and via update(...) so it persists through the normal event-ops save path.
  const uploadArtwork = async (row, file) => {
    if (!file) return;
    setUploadingId(row.id);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const formData = new FormData();
      formData.append("artwork", file);
      formData.append("bannerId", row.id);
      const res = await axios.post(`${API_URL}/banners/${row.id}/artwork`, formData, {
        headers: { Authorization: storedUser?.token ? `Bearer ${storedUser.token}` : undefined },
      });
      update("banners", `Uploaded artwork for ${row.company}`, (rows, who) =>
        rows.map((b) => (b.id === row.id ? { ...b, artwork: res.data.artwork, ...who } : b)));
      if (editingId === row.id) setForm((f) => ({ ...f, artwork: res.data.artwork }));
      toast("Artwork uploaded", { type: "success" });
    } catch (err) {
      toast(err.response?.data?.error || "Failed to upload artwork", { type: "error" });
    } finally {
      setUploadingId(null);
    }
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
                    ["Company contact", row.contact],
                    ["Print deadline", row.deadline],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <p className="text-gray-400">{k}</p>
                      <p className={`font-medium truncate ${v === "Not received" ? "text-red-500" : "text-gray-700"}`}>{v}</p>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <p className="text-gray-400">Artwork file</p>
                    {row.artwork ? (
                      <a href={row.artwork} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline truncate block">View file</a>
                    ) : (
                      <p className="font-medium text-red-500 truncate">Not received</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#F3F6FF] rounded-lg p-3 border border-blue-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Material</label>
                    <CompactSelect className="text-xs" value={form.material ?? ""} onChange={F("material")} options={BANNER_MATERIALS} placeholder="Select type…" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Width (cm)</label>
                    <input type="number" min="0" className={`text-xs ${inputCls}`} value={form.width ?? ""} onChange={F("width")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Height (cm)</label>
                    <input type="number" min="0" className={`text-xs ${inputCls}`} value={form.height ?? ""} onChange={F("height")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Quantity</label>
                    <input type="number" min="1" step="1" className={`text-xs ${inputCls}`} value={form.quantity ?? ""} onChange={F("quantity")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Company contact</label>
                    <input className={`text-xs ${inputCls}`} value={form.contact ?? ""} onChange={F("contact")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Print deadline</label>
                    <input type="date" className={`text-xs ${inputCls}`} value={form.deadline ? String(form.deadline).slice(0, 10) : ""} onChange={F("deadline")} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
                    <label className="text-xs text-gray-500 font-medium">Artwork file</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.ai,.eps"
                        disabled={uploadingId === row.id}
                        onChange={(e) => uploadArtwork(row, e.target.files[0])}
                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#0E7F41] file:text-white hover:file:bg-[#0a5f31] file:cursor-pointer disabled:opacity-50"
                      />
                      {uploadingId === row.id && <span className="text-xs text-gray-400">Uploading…</span>}
                    </div>
                    {form.artwork && (
                      <a href={form.artwork} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                        View current file
                      </a>
                    )}
                  </div>
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
    if (!form.description.trim()) {
      toast("Please describe the requirement before saving", { type: "error" });
      return;
    }
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
            <button onClick={handleAdd} disabled={!form.description.trim()} className="text-sm font-semibold text-white rounded-xl px-4 py-2 disabled:opacity-50" style={{ background: "#0E7F41" }}>Save</button>
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
  const { data, update, companies: allCompanyNames } = useEventOps();
  const toast = useToast();
  const allRows = data.equipment;
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: "", booth: "", item: "", qtyReq: "1" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const total = (kw) => allRows.filter((r) => kw.some((k) => r.item.toLowerCase().includes(k))).reduce((a, r) => a + r.qtyReq, 0);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? allRows.filter((r) => r.entity.toLowerCase().includes(q) || r.item.toLowerCase().includes(q)) : allRows;
  }, [allRows, search]);

  const addRequest = () => {
    if (!form.company || !form.item.trim()) {
      toast("Company and item are both required", { type: "error" });
      return;
    }
    const entity = form.booth.trim() ? `${form.company} / ${form.booth.trim()}` : form.company;
    const qtyReq = Number(form.qtyReq) || 1;
    update("equipment", `Added ${form.item} request for ${entity}`, (prev, who) =>
      [...prev, { id: Date.now(), entity, item: form.item.trim(), qtyReq, qtyFul: 0, status: "Pending", ...who }]);
    toast(`${form.item.trim()} request added for ${form.company}`, { type: "success" });
    setForm({ company: "", booth: "", item: "", qtyReq: "1" });
    setShowForm(false);
  };

  const fulfillItem = (row) => {
    update("equipment", `Fulfilled ${row.item} for ${row.entity}`, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, qtyFul: r.qtyReq, status: "Fulfilled", ...who } : r)));
    toast(`${row.item} fulfilled`, { type: "success" });
  };
  // Reverses a fulfillment — resets to Pending since the exact prior partial
  // amount (if any) wasn't tracked separately from qtyFul
  const unfulfillItem = (row) => {
    update("equipment", `Marked ${row.item} for ${row.entity} as unfulfilled`, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, qtyFul: 0, status: "Pending", ...who } : r)));
    toast(`${row.item} marked unfulfilled`, { type: "warning" });
  };

  // Split "Company / Booth" back into parts for editing, then recompose on save
  // so the stored `entity` string shape is preserved.
  const startEdit = (row) => {
    const [company, booth] = String(row.entity || "").split("/").map((s) => s.trim());
    setEditingId(row.id);
    setEditForm({ company: company || "", booth: booth || "", item: row.item, qtyReq: row.qtyReq, qtyFul: row.qtyFul });
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const saveEdit = (row) => {
    if (!editForm.item?.trim()) { toast("Item is required", { type: "error" }); return; }
    const entity = editForm.booth?.trim() ? `${editForm.company} / ${editForm.booth.trim()}` : editForm.company;
    const qtyReq = Number(editForm.qtyReq) || 1;
    const qtyFul = Math.min(Number(editForm.qtyFul) || 0, qtyReq);
    const status = qtyFul === 0 ? "Pending" : qtyFul >= qtyReq ? "Fulfilled" : "Partial";
    update("equipment", `Edited ${editForm.item} for ${entity}`, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, entity, item: editForm.item.trim(), qtyReq, qtyFul, status, ...who } : r)));
    toast("Equipment updated", { type: "success" });
    cancelEdit();
  };
  const removeItem = (row) => {
    update("equipment", `Removed ${row.item} for ${row.entity}`, (prev) => prev.filter((r) => r.id !== row.id));
    toast(`Removed ${row.item}`, { type: "info" });
    if (editingId === row.id) cancelEdit();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tables" value={total(["table"])} sub="Total requested" />
        <StatCard label="Chairs" value={total(["chair"])} sub="Total requested" color="#2959A6" />
        <StatCard label="Power / Cables" value={total(["power", "extension", "cable"])} sub="Strips & cables" color="#f59e0b" />
        <StatCard label="Screens" value={total(["screen", "monitor"])} sub="Monitors & displays" color="#8b5cf6" />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, booth or item…"
            className="w-full sm:w-80 pl-8 pr-3 h-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-white rounded-xl px-3 py-2 hover:opacity-90 transition-opacity" style={{ background: "#0E7F41" }}>
          {showForm ? "Cancel" : "+ Add Equipment Request"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F3F6FF] rounded-xl p-4 border border-blue-100 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-500 font-medium">Company</label>
            <CompactSelect value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Select company…" options={allCompanyNames} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Booth (optional)</label>
            <input className={inputCls} placeholder="e.g. B03" value={form.booth} onChange={(e) => setForm((f) => ({ ...f, booth: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Item</label>
            <input className={inputCls} placeholder="e.g. Folding Table" value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Qty</label>
            <div className="flex gap-2">
              <input type="number" min="1" className={inputCls} value={form.qtyReq} onChange={(e) => setForm((f) => ({ ...f, qtyReq: e.target.value }))} />
              <button onClick={addRequest} className="text-xs font-semibold text-white rounded-lg px-3 shrink-0" style={{ background: "#0E7F41" }}>Add</button>
            </div>
          </div>
        </div>
      )}

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
            {rows.map((row) => editingId === row.id ? (
              <tr key={row.id} className="border-b border-blue-100 bg-blue-50/40">
                <td className="px-4 py-2">
                  <div className="flex gap-1.5">
                    <CompactSelect className="text-xs min-w-[130px]" value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} options={allCompanyNames} placeholder="Company" />
                    <input className={`text-xs w-20 ${inputCls}`} placeholder="Booth" value={editForm.booth} onChange={(e) => setEditForm((f) => ({ ...f, booth: e.target.value }))} />
                  </div>
                </td>
                <td className="px-4 py-2"><input className={`text-xs ${inputCls}`} value={editForm.item} onChange={(e) => setEditForm((f) => ({ ...f, item: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min="1" className={`text-xs w-16 text-center ${inputCls}`} value={editForm.qtyReq} onChange={(e) => setEditForm((f) => ({ ...f, qtyReq: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min="0" className={`text-xs w-16 text-center ${inputCls}`} value={editForm.qtyFul} onChange={(e) => setEditForm((f) => ({ ...f, qtyFul: e.target.value }))} /></td>
                <td className="px-4 py-2 text-[10px] text-gray-400" colSpan={2}>Status is set from fulfilled vs requested</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1.5">
                    <button onClick={() => saveEdit(row)} className="text-xs font-semibold text-white rounded-lg px-2.5 py-1" style={{ background: "#0E7F41" }}>Save</button>
                    <button onClick={cancelEdit} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1">Cancel</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="px-4 py-3 text-xs font-medium text-gray-600"><Highlight text={row.entity} query={search} /></td>
                <td className="px-4 py-3 text-gray-800"><Highlight text={row.item} query={search} /></td>
                <td className="px-4 py-3 text-gray-600 text-center font-mono">{row.qtyReq}</td>
                <td className="px-4 py-3 text-gray-600 text-center font-mono">{row.qtyFul}</td>
                <td className="px-4 py-3"><Badge label={row.status} color={statusColor(row.status)} /></td>
                <td className="px-4 py-3"><LastEdited row={row} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {row.status === "Fulfilled" ? (
                      <button onClick={() => unfulfillItem(row)} className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500">
                        Unfulfill
                      </button>
                    ) : (
                      <button onClick={() => fulfillItem(row)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                        Fulfill
                      </button>
                    )}
                    <button onClick={() => startEdit(row)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-100 transition-colors text-gray-500">Edit</button>
                    <button onClick={() => removeItem(row)} className="text-xs font-medium border border-red-200 rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 transition-colors">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400">No equipment matches "{search}".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab: Delegates ───────────────────────────────────────────────────────────

const DelegateList = () => {
  const { data, update, companies: allCompanyNames } = useEventOps();
  const [expanded, setExpanded] = useState(new Set());
  const [search, setSearch] = useState("");

  // Every registered company appears here — not just the handful that already
  // have delegates. Companies with delegates keep their real rows; the rest
  // show as empty "no delegates yet" entries so all 70+ are covered and
  // trackable. Mutations still key on company name, never array position.
  const withDelegates = data.delegates;
  const mergedAll = useMemo(() => {
    const map = new Map();
    withDelegates.forEach((c) => map.set(c.company, c));
    allCompanyNames.forEach((name) => { if (!map.has(name)) map.set(name, { company: name, delegates: [] }); });
    return [...map.values()].sort((a, b) => a.company.localeCompare(b.company));
  }, [withDelegates, allCompanyNames]);

  const companies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? mergedAll.filter((c) => c.company.toLowerCase().includes(q)) : mergedAll;
  }, [mergedAll, search]);

  const totalDelegates = mergedAll.reduce((a, c) => a + c.delegates.length, 0);
  const totalPrinted = mergedAll.reduce((a, c) => a + c.delegates.filter((d) => d.badge === "Printed").length, 0);
  const companiesWithDelegates = mergedAll.filter((c) => c.delegates.length > 0).length;

  const toggle = (idx) => setExpanded((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  // Opens an actual printable badge (name/role/company card sized for a
  // standard badge holder) in a new tab and triggers the browser's print
  // dialog — this is a real print action, not just a status flip. The
  // delegate is only marked "Printed" once the browser actually opens that
  // dialog (the win.onafterprint / immediate print() call below), not before.
  const printBadge = (company, dIdx, d) => {
    const win = window.open("", "_blank", "width=420,height=620");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Badge — ${d.name}</title>
      <style>
        @page { size: 3.5in 5.5in; margin: 0; }
        body { margin: 0; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; }
        .badge { width: 3.5in; height: 5.5in; background: white; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .stripe { width: 100%; height: 90px; background: #0E7F41; border-radius: 12px 12px 0 0; position: absolute; top: 0; left: 0; }
        .name { font-size: 22px; font-weight: 700; color: #111827; text-align: center; }
        .role { font-size: 14px; color: #6b7280; text-align: center; }
        .company { font-size: 16px; font-weight: 600; color: #0E7F41; text-align: center; margin-top: 12px; }
        @media print { body { background: white; } .badge { box-shadow: none; } }
      </style></head>
      <body>
        <div class="badge">
          <p class="name">${d.name}</p>
          <p class="role">${d.role || ""}</p>
          <p class="company">${company}</p>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body></html>`);
    win.document.close();

    update("delegates", `Printed badge for ${d.name} (${company})`, (prev, who) =>
      prev.map((c) => c.company !== company ? c : {
        ...c, delegates: c.delegates.map((dd, di) => di !== dIdx ? dd : { ...dd, badge: "Printed", ...who })
      }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Delegates" value={totalDelegates} sub="Across all companies" />
        <StatCard label="Badges Printed" value={totalPrinted} sub={`${totalDelegates - totalPrinted} pending`} color="#2959A6" />
        <StatCard label="Companies" value={mergedAll.length} sub="All registered" color="#8b5cf6" />
        <StatCard label="With Delegates" value={companiesWithDelegates} sub={`${mergedAll.length - companiesWithDelegates} awaiting`} color="#f59e0b" />
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company…"
          className="w-full sm:w-72 pl-8 pr-3 h-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div className="flex flex-col gap-2">
        {companies.map((company) => {
          const open = expanded.has(company.company);
          const empty = company.delegates.length === 0;
          return (
            <div key={company.company} className="rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggle(company.company)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-gray-800 text-sm truncate"><Highlight text={company.company} query={search} /></span>
                  {empty ? (
                    <Badge label="No delegates yet" color="gray" />
                  ) : (
                    <>
                      <Badge label={`${company.delegates.length} delegates`} color="blue" />
                      <Badge label={`${company.delegates.filter(d => d.badge === "Printed").length} badges printed`} color="green" />
                    </>
                  )}
                </div>
                <span className="text-gray-400"><ChevronIcon open={open} /></span>
              </button>

              {open && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  {empty ? (
                    <p className="text-xs text-gray-400 px-4 py-4">No delegates registered for this company yet. They'll appear here once added.</p>
                  ) : (
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
                                <button onClick={() => printBadge(company.company, di, d)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500">
                                  Print Badge
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {companies.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No companies match "{search}".</p>}
      </div>
    </div>
  );
};

// ─── Tab: Attendance & Check-in (with per-booth QR codes) ─────────────────────

const boothQrValue = (booth) => `jobfair:attendance:${booth.number}`;

// Converts the on-screen QRCodeSVG (rendered inline as an <svg> by qrcode.react)
// into a downloadable PNG by drawing it onto an offscreen canvas — no
// server round-trip and no extra dependency, since the SVG markup is already
// self-contained (no external image refs) and can be rasterized directly.
function downloadQrAsPng(svgEl, filename) {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width || 256;
    canvas.height = img.height || 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  };
  img.src = url;
}

const AttendanceCheckin = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const [subTab, setSubTab] = useState(0);
  const students = data.attendanceStudents;
  const companies = data.attendanceCompanies;
  const booths = data.booths.filter((b) => b.company);
  const qrRefs = useRef({});

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
        <div className="flex flex-col gap-3">
        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          Companies check themselves in by scanning their booth QR on arrival (or tapping “I've arrived” on their Status page) — that's the normal flow. The buttons below are a manual override for when a company can't scan.
        </p>
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
                      <button onClick={() => checkInCompany(row, "Manual")} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors text-gray-500" title="Manual override — use only if the company can't scan their booth QR">
                        Check in manually
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <div ref={(el) => { if (el) qrRefs.current[b.id] = el.querySelector("svg"); }}>
                  <QRCodeSVG value={boothQrValue(b)} size={96} fgColor="#111827" />
                </div>
                <p className="font-bold text-sm text-gray-800">{b.number}</p>
                <p className="text-xs text-gray-500 text-center truncate w-full">{b.company}</p>
                <span className="text-[10px] font-mono text-gray-400">{boothQrValue(b)}</span>
                <button
                  onClick={() => qrRefs.current[b.id] && downloadQrAsPng(qrRefs.current[b.id], `booth-${b.number}-qr.png`)}
                  className="text-[11px] font-medium border border-gray-200 rounded-lg px-2 py-1 text-gray-500 hover:border-green-300 hover:text-green-700 transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Tab: Manage Staff ─────────────────────────────────────────────────────────
// Two kinds of people help run the day, split into sub-tabs:
//   • Support Staff — known helpers CASTO manages directly (printing, supplies,
//     setup, runners). Each carries a role and an assignable task list.
//   • Check-in Staff — code-gated door volunteers (mostly temporary). Created
//     with a name + email; they finish their own profile at /student-checkin.

const SUPPORT_ROLES = ["Printing & Supplies", "Logistics & Setup", "Runner", "Catering", "Technical / AV", "Other"];
const TASK_STATUSES = ["Pending", "In Progress", "Done"];
const taskStatusColor = (s) => (s === "Done" ? "green" : s === "In Progress" ? "blue" : "yellow");

// ── Sub-tab: Support Staff ──
const SupportStaffPanel = () => {
  const { data, addSupportStaff, updateSupportStaff, removeSupportStaff, addSupportTask, setSupportTaskStatus, removeSupportTask } = useEventOps();
  const toast = useToast();
  const staff = data.supportStaff || [];
  const [form, setForm] = useState({ name: "", role: SUPPORT_ROLES[0], phone: "" });
  const [taskDrafts, setTaskDrafts] = useState({}); // staffId -> title being typed

  const handleAdd = () => {
    if (!form.name.trim()) { toast("Name is required", { type: "error" }); return; }
    addSupportStaff(form.name.trim(), form.role, form.phone.trim());
    setForm({ name: "", role: SUPPORT_ROLES[0], phone: "" });
    toast(`Added ${form.name.trim()}`, { type: "success" });
  };

  const handleAddTask = (staffId) => {
    const title = (taskDrafts[staffId] || "").trim();
    if (!title) return;
    addSupportTask(staffId, title);
    setTaskDrafts((d) => ({ ...d, [staffId]: "" }));
  };

  const cycleStatus = (staffId, task) => {
    const next = TASK_STATUSES[(TASK_STATUSES.indexOf(task.status) + 1) % TASK_STATUSES.length];
    setSupportTaskStatus(staffId, task.id, next);
  };

  const totalTasks = staff.reduce((n, s) => n + (s.tasks?.length || 0), 0);
  const openTasks = staff.reduce((n, s) => n + (s.tasks?.filter((t) => t.status !== "Done").length || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Support Staff" value={staff.length} />
        <StatCard label="Open Tasks" value={openTasks} color="#f59e0b" />
        <StatCard label="Total Tasks" value={totalTasks} color="#2959A6" />
      </div>

      <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        Add the people who handle services on the day — printing, bringing supplies, setup, runners — and assign them tasks.
        Each task cycles through <span className="font-semibold">Pending → In Progress → Done</span>. This is for staff you manage
        directly; temporary door helpers who scan students in live under the <span className="font-semibold">Check-in Staff</span> tab.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">New Support Staff</p>
        <div className="flex gap-2 items-start flex-wrap">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-1 focus:ring-green-500" />
          <div className="min-w-[180px]">
            <CompactSelect value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} options={SUPPORT_ROLES} placeholder="Select role" />
          </div>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Phone (optional)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-green-500" />
          <button onClick={handleAdd} disabled={!form.name.trim()} className="text-xs font-semibold text-white rounded-lg px-4 py-2 disabled:opacity-50" style={{ background: "#0E7F41" }}>
            Add Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {staff.map((s) => {
          const done = s.tasks?.filter((t) => t.status === "Done").length || 0;
          return (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge label={s.role || "Support"} color="gray" />
                    {s.phone && <span className="text-[11px] text-gray-400">{s.phone}</span>}
                  </div>
                </div>
                <button onClick={() => { removeSupportStaff(s.id); toast(`Removed ${s.name}`, { type: "info" }); }}
                  className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-1 text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  Remove
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Tasks</span>
                <span className="text-[11px] text-gray-400">{done}/{s.tasks?.length || 0} done</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {(s.tasks || []).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <button onClick={() => cycleStatus(s.id, t)} title="Click to advance status" className="shrink-0">
                      <Badge label={t.status} color={taskStatusColor(t.status)} />
                    </button>
                    <span className={`text-xs flex-1 min-w-0 truncate ${t.status === "Done" ? "line-through text-gray-400" : "text-gray-700"}`}>{t.title}</span>
                    <button onClick={() => removeSupportTask(s.id, t.id)} className="text-gray-300 hover:text-red-500 shrink-0 text-sm leading-none">×</button>
                  </div>
                ))}
                {(s.tasks?.length || 0) === 0 && <p className="text-[11px] text-gray-400 italic">No tasks assigned yet.</p>}
              </div>

              <div className="flex gap-2 items-center">
                <input value={taskDrafts[s.id] || ""} onChange={(e) => setTaskDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask(s.id)} placeholder="Assign a task…"
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-green-500" />
                <button onClick={() => handleAddTask(s.id)} disabled={!(taskDrafts[s.id] || "").trim()}
                  className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: "#0E7F41" }}>Add</button>
              </div>
            </div>
          );
        })}
        {staff.length === 0 && <p className="text-xs text-gray-400 lg:col-span-2 text-center py-6">No support staff added yet.</p>}
      </div>
    </div>
  );
};

// ── Sub-tab: Check-in Staff (the original code-gated volunteers) ──
const CheckinStaffPanel = () => {
  const { data, addStaffer, removeStaffer } = useEventOps();
  const toast = useToast();
  const staff = data.attendanceStaff || [];
  const checkinLog = data.checkinLog || [];
  const [form, setForm] = useState({ name: "", email: "" });
  const [revealedCode, setRevealedCode] = useState(null); // { name, code } — shown once after creation

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Name and email are both required", { type: "error" });
      return;
    }
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
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/student-checkin`); toast("Check-in link copied", { type: "success", duration: 1800 }); }}
          className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold border border-blue-200 rounded-lg px-2 py-1 text-blue-700 hover:bg-blue-100 transition-colors align-middle"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy link
        </button>
        <br />
        Students who lost their ticket can retrieve their own QR code at
        <a href="/my-qr-code" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline mx-1">/my-qr-code</a>
        using the University ID they applied with.
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/my-qr-code`); toast("Student ticket link copied", { type: "success", duration: 1800 }); }}
          className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold border border-blue-200 rounded-lg px-2 py-1 text-blue-700 hover:bg-blue-100 transition-colors align-middle"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Copy link
        </button>
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

// ── Wrapper: Support Staff + Check-in Staff sub-tabs ──
const MANAGE_STAFF_SUBTAB_KEY = "event_ops_manage_staff_subtab";
const ManageStaff = () => {
  const [sub, setSub] = useState(() => Number(localStorage.getItem(MANAGE_STAFF_SUBTAB_KEY)) || 0);
  useEffect(() => { try { localStorage.setItem(MANAGE_STAFF_SUBTAB_KEY, String(sub)); } catch { /* quota */ } }, [sub]);
  return (
    <div className="flex flex-col gap-4">
      <SubTabBar tabs={["Support Staff", "Check-in Staff"]} active={sub} onChange={setSub} />
      {sub === 0 ? <SupportStaffPanel /> : <CheckinStaffPanel />}
    </div>
  );
};

// ─── Tab: Schedule ────────────────────────────────────────────────────────────

// Fixed set of venue areas sessions can actually be held in — keeps
// Schedule's "Location" consistent instead of free text that can typo or
// drift from what the floor map / signage actually says.
const SCHEDULE_LOCATIONS = ["Main Entrance", "Main Hall", "Exhibition Floor", "Cafeteria", "Main Stage"];

const ScheduleSlots = () => {
  const { data, update } = useEventOps();
  const toast = useToast();
  const slots = data.schedule;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const EF = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.title.trim() || !form.start) {
      toast("Session title and start time are both required", { type: "error" });
      return;
    }
    update("schedule", `Added time slot "${form.title}"`, (prev, who) =>
      [...prev, { ...form, id: Date.now(), capacity: Number(form.capacity) || 0, registered: 0, ...who }]);
    setForm({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });
    setShowForm(false);
  };

  const startEdit = (slot) => { setEditingId(slot.id); setEditForm({ ...slot }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const saveEdit = () => {
    if (!editForm.title?.trim() || !editForm.start) {
      toast("Session title and start time are both required", { type: "error" });
      return;
    }
    update("schedule", `Edited time slot "${editForm.title}"`, (prev, who) =>
      prev.map((s) => (s.id === editingId ? { ...s, ...editForm, capacity: Number(editForm.capacity) || 0, ...who } : s)));
    toast("Time slot updated", { type: "success" });
    cancelEdit();
  };

  const removeSlot = (slot) => {
    update("schedule", `Removed time slot "${slot.title}"`, (prev) => prev.filter((s) => s.id !== slot.id));
    toast(`Removed "${slot.title}"`, { type: "info" });
    if (editingId === slot.id) cancelEdit();
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
              { label: "Location", el: <CompactSelect value={form.location} onChange={F("location")} options={SCHEDULE_LOCATIONS} placeholder="Select area" /> },
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
            <button onClick={handleAdd} disabled={!form.title.trim() || !form.start} className="text-sm font-semibold text-white rounded-xl px-4 py-2 disabled:opacity-50" style={{ background: "#0E7F41" }}>Save Slot</button>
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
              {editingId === slot.id ? (
                /* Inline editor — change the time or any detail of an existing slot */
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">Start</label><input type="time" className={`text-xs ${inputCls}`} value={editForm.start || ""} onChange={EF("start")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">End</label><input type="time" className={`text-xs ${inputCls}`} value={editForm.end || ""} onChange={EF("end")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">Host</label><input className={`text-xs ${inputCls}`} value={editForm.host || ""} onChange={EF("host")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">Location</label><CompactSelect className="text-xs" value={editForm.location || ""} onChange={EF("location")} options={SCHEDULE_LOCATIONS} placeholder="Select area" /></div>
                    <div className="flex flex-col gap-1 col-span-2"><label className="text-[11px] text-gray-500 font-medium">Title</label><input className={`text-xs ${inputCls}`} value={editForm.title || ""} onChange={EF("title")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">Capacity</label><input type="number" className={`text-xs ${inputCls}`} value={editForm.capacity ?? ""} onChange={EF("capacity")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 font-medium">Status</label><CompactSelect className="text-xs" value={editForm.status || "Upcoming"} onChange={EF("status")} options={["Upcoming", "Live", "Ended"]} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                    <button onClick={saveEdit} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#0E7F41" }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{slot.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge label={slot.status} color={statusColor(slot.status)} />
                      <button onClick={() => cycleStatus(slot)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-0.5 hover:bg-white transition-colors text-gray-500 bg-white/60">
                        Next status
                      </button>
                      <button onClick={() => startEdit(slot)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-0.5 hover:bg-white transition-colors text-gray-500 bg-white/60">
                        Edit
                      </button>
                      <button onClick={() => removeSlot(slot)} className="text-xs font-medium border border-red-200 rounded-lg px-2.5 py-0.5 text-red-500 hover:bg-red-50 transition-colors bg-white/60">
                        Remove
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
                </>
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
  const { data, update, companies: allCompanyNames } = useEventOps();
  const toast = useToast();
  const passes = data.passes;
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState(0); // 0 = table, 1 = by company
  const [editingParking, setEditingParking] = useState(null); // pass id
  const [parkingForm, setParkingForm] = useState({ slot: "", location: "", mapUrl: "" });
  const [companySearch, setCompanySearch] = useState("");

  const types = ["All", "Entry", "Parking"];
  const shown = filter === "All" ? passes : passes.filter((p) => p.type === filter);
  // Every registered company appears in the By-Company view, even those with no
  // passes issued yet, so all 70+ are visible and can have a pass issued.
  const byCompany = useMemo(() => {
    const m = new Map();
    allCompanyNames.forEach((name) => m.set(name, []));
    passes.forEach((p) => m.set(p.company, [...(m.get(p.company) || []), p]));
    const entries = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const q = companySearch.trim().toLowerCase();
    return q ? entries.filter(([name]) => name.toLowerCase().includes(q)) : entries;
  }, [passes, allCompanyNames, companySearch]);

  // Issues a fresh Entry pass for a company that has none yet — gives the
  // By-Company view an action instead of just displaying an empty card.
  const issueEntryPass = (company) => {
    const seq = String(passes.filter((p) => p.company === company).length + 1).padStart(3, "0");
    const code = `ENT-${company.slice(0, 3).toUpperCase()}-${seq}`;
    update("passes", `Issued entry pass ${code} for ${company}`, (prev, who) =>
      [...prev, { id: Date.now(), company, delegate: "Unassigned", type: "Entry", code, issued: new Date().toISOString().slice(0, 10), status: "Active", ...who }]);
    toast(`Entry pass issued for ${company}`, { type: "success" });
  };

  const setStatus = (row, status) => {
    update("passes", `${status === "Revoked" ? "Revoked" : "Reactivated"} pass ${row.code} (${row.company})`, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, status, ...who } : p)));
    toast(`Pass ${row.code} ${status.toLowerCase()}`, { type: status === "Revoked" ? "warning" : "success" });
  };

  const startEditParking = (row) => {
    setEditingParking(row.id);
    setParkingForm({ slot: row.slot || "", location: row.location || "", mapUrl: row.mapUrl || "" });
  };

  const saveParking = (row) => {
    update("passes", `Set parking slot ${parkingForm.slot || "—"} for ${row.company}`, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, slot: parkingForm.slot, location: parkingForm.location, mapUrl: parkingForm.mapUrl.trim(), ...who } : p)));
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
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <input value={parkingForm.slot} onChange={(e) => setParkingForm((f) => ({ ...f, slot: e.target.value }))} placeholder="Slot e.g. P1-14" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-green-500" />
                          <input value={parkingForm.location} onChange={(e) => setParkingForm((f) => ({ ...f, location: e.target.value }))} placeholder="Exact location" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-green-500" />
                          <button onClick={() => saveParking(row)} className="text-xs font-semibold text-white rounded-lg px-2 py-1" style={{ background: "#0E7F41" }}>Save</button>
                        </div>
                        {/* Google Maps link — paste a share/pin URL; the company
                            side renders a map preview + "Open in Maps". Placeholder
                            for now (no live embed API wired up yet). */}
                        <input value={parkingForm.mapUrl} onChange={(e) => setParkingForm((f) => ({ ...f, mapUrl: e.target.value }))} placeholder="Google Maps link (optional)" className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-green-500" />
                      </div>
                    ) : row.slot ? (
                      <button onClick={() => startEditParking(row)} className="text-left hover:underline">
                        <span className="font-mono text-xs font-semibold text-gray-700">{row.slot}</span>
                        <span className="text-[11px] text-gray-400 block">{row.location}</span>
                        {row.mapUrl && <span className="text-[10px] text-green-600 block">📍 Map linked</span>}
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
        <>
        <div className="relative">
          <input
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Search company…"
            className="w-full sm:w-72 pl-8 pr-3 h-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {byCompany.map(([company, rows]) => (
            <div key={company} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800 text-sm truncate"><Highlight text={company} query={companySearch} /></p>
                {rows.length > 0
                  ? <Badge label={`${rows.length} passes`} color="blue" />
                  : <Badge label="No passes yet" color="gray" />}
              </div>
              {rows.length === 0 && (
                <button onClick={() => issueEntryPass(company)} className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:border-green-300 hover:text-green-700 transition-colors self-start">
                  + Issue entry pass
                </button>
              )}
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
              {rows.length > 0 && <p className="text-[10px] text-gray-400">This exact view is what {company} sees in their settings page.</p>}
            </div>
          ))}
          {byCompany.length === 0 && <p className="text-xs text-gray-400 text-center py-6 col-span-2">No companies match "{companySearch}".</p>}
        </div>
        </>
      )}
    </div>
  );
};


// ─── Tab definitions (operational modules only) ───────────────────────────────

const OPERATIONS_TABS = [
  { id: "venue",        label: "Venue & Booths",        component: VenueMapping },
  { id: "banners",      label: "Banners & Branding",    component: BannerBranding },
  { id: "requirements", label: "Special Requirements",  component: SpecialRequirements },
  { id: "equipment",    label: "Equipment & Logistics", component: EquipmentLogistics },
  { id: "delegates",    label: "Delegate List",         component: DelegateList },
  { id: "attendance",   label: "Attendance",            component: AttendanceCheckin },
  { id: "manageStaff",  label: "Manage Staff",          component: ManageStaff },
  { id: "schedule",     label: "Schedule",              component: ScheduleSlots },
  { id: "passes",       label: "Access Passes",         component: AccessPasses },
];

// ─── Main component: Event Operations ──────────────────────────────────────────
// Day-to-day modules each team member owns a slice of — split out of the
// original single EventSettings.jsx into this page plus EventAdmin.jsx
// (Post-Event Report, Customize, and the Team/ViewAs/Activity/Import panels).

const OPERATIONS_TAB_KEY = "event_ops_active_tab";

const EventOperations = () => {
  const { user } = useAuthContext();
  const { employee, team, setActingAs } = useEventOps();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(OPERATIONS_TAB_KEY) || OPERATIONS_TABS[0].id);

  // Rana (Event Lead) sees every module, matching her "final point of
  // contact" responsibility and the same employee.id === "rana" check the
  // Team & Roles panel (EventAdmin.jsx) uses for reassignment permission.
  // Everyone else sees only their own assigned modules.
  const orderedTabs = useMemo(() => {
    const focus = employee.focus || [];
    const visible = employee.id === "rana" ? OPERATIONS_TABS : OPERATIONS_TABS.filter((t) => focus.includes(t.id));
    return [...visible].sort((a, b) => {
      const ai = focus.indexOf(a.id), bi = focus.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [employee]);

  // If switching "Viewing as" leaves the currently-open tab outside this
  // employee's visible set, fall back to their first visible tab instead of
  // silently rendering a tab that's no longer shown in the tab bar.
  useEffect(() => {
    if (!orderedTabs.some((t) => t.id === activeTab) && orderedTabs.length > 0) {
      setActiveTab(orderedTabs[0].id);
    }
  }, [orderedTabs, activeTab]);

  // Remember the open tab across reloads, so refreshing the page reopens
  // wherever the user left off instead of always resetting to the first tab.
  useEffect(() => {
    try { localStorage.setItem(OPERATIONS_TAB_KEY, activeTab); } catch { /* quota */ }
  }, [activeTab]);

  const ActiveComponent = OPERATIONS_TABS.find((t) => t.id === activeTab)?.component || VenueMapping;

  return (
    <PageContainer user={user} title="Event Operations" collapsibleTopBar>
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
          <a href="/event-admin" className="ml-auto text-xs font-semibold text-gray-500 hover:text-green-700 transition-colors shrink-0">
            Admin →
          </a>
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
            <ActiveComponent />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default EventOperations;
