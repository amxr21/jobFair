import { useState, useRef, useMemo, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { PageContainer } from "../components/index";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventOps, formatWhen } from "../context/EventOpsContext";
import { useNotifications } from "../context/NotificationsContext";
import { useToast } from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import CompactSelect from "../components/CompactSelect";
import Modal from "../components/Modal";
import { API_URL } from "../config/api";
import { Badge, statusColor, StatCard, LastEdited, CheckIcon, ChevronIcon, inputCls, SubTabBar, PillTabs, TabIcon, Highlight } from "../components/EventSettingsShared";
import { translateEnum } from "../i18n/translateEnum";

// Translate a fixed-option badge/status value that may belong to any of the
// enum groups used across the operational modules. DB value stays English; only
// the label shown is localized. Falls back to the raw value if unknown.
const tBadge = (value) => {
  if (value == null || value === "") return value;
  for (const group of ["boothStatus", "bannerStatus", "requestStatus", "attendanceState", "eventState", "priority"]) {
    const t = translateEnum(group, value);
    if (t !== value) return t;
  }
  return value;
};

// ─── Booth floor map (circular hall, center island, hover info, hide toggle) ──

// Theme-aware ring palette for the booth map — the map renders on a dark canvas
// in dark mode, so the fills/strokes/text switch to lighter, legible values.
const ringStyles = (isDark) => ({
  Assigned: isDark
    ? { fill: "#34C775", text: "#06281a", stroke: "#15803d" }
    : { fill: "#0E7F41", text: "#ffffff", stroke: "#0a5f31" },
  Reserved: isDark
    ? { fill: "#fbbf24", text: "#3a2800", stroke: "#b45309" }
    : { fill: "#fbbf24", text: "#7c5300", stroke: "#d97706" },
  Available: isDark
    ? { fill: "#334155", text: "#cbd5e1", stroke: "#475569" }
    : { fill: "#eef1f6", text: "#6b7280", stroke: "#d1d5db" },
});

const BoothMap = ({ booths, onSelect }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const RING_STYLES = ringStyles(isDark);
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

  const brand = isDark ? "#34C775" : "#0E7F41";
  return (
    <div ref={wrapRef} className="relative bg-surface-card rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-2 md:p-4 flex justify-center">
      <svg viewBox="0 0 460 460" className="w-full max-w-[440px]">
        {/* hall wall */}
        <circle cx={C} cy={C} r={208} fill={isDark ? "#1e293b" : "#fafbfe"} stroke={isDark ? "#334155" : "#d8dee9"} strokeWidth="2" strokeDasharray="6 5" />
        {/* center island platform */}
        <circle cx={C} cy={C} r={96} fill={isDark ? "#273449" : "#f1f5f9"} stroke={isDark ? "#3b4a63" : "#e2e8f0"} strokeWidth="1.5" />
        <text x={C} y={C + (center.length ? 118 : 4)} textAnchor="middle" fontSize="9" fill={isDark ? "#64748b" : "#94a3b8"} fontWeight="600" letterSpacing="1.5">{t("eventOps.map.centerIsland")}</text>
        {/* entrance marker */}
        <rect x={C - 26} y={434} width={52} height={10} rx={4} fill={brand} opacity="0.85" />
        <text x={C} y={456} textAnchor="middle" fontSize="10" fill={brand} fontWeight="700" letterSpacing="2">{t("eventOps.map.entrance")}</text>

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
                {b.company ? (b.company.length > 11 ? b.company.slice(0, 10) + "…" : b.company) : t("eventOps.map.free")}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="absolute z-20 pointer-events-none bg-surface-card rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 w-56"
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
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{hover.booth.number} · {t("eventOps.venue.zone", { zone: hover.booth.zone })}</span>
            <Badge label={tBadge(hover.booth.status)} color={statusColor(hover.booth.status)} />
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{hover.booth.company || t("eventOps.venue.notAssignedYet")}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t("eventOps.venue.boothTypeRing", { type: hover.booth.type, ring: hover.booth.ring === "center" ? t("eventOps.venue.centerIsland") : t("eventOps.venue.outerRing") })}</p>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
            <LastEdited row={hover.booth} />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t("eventOps.venue.clickToManageBooth")}</p>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Venue & Booths ──────────────────────────────────────────────────────

const VenueMapping = () => {
  const { t } = useTranslation();
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
    update("booths", label ? "booths.assigned" : "booths.cleared", { number: booth.number, label }, (rows, who) =>
      rows.map((b) => b.id === booth.id
        ? { ...b, company: label, type: formType, status: label ? "Assigned" : "Available", ...who }
        : b));
    toast(label ? t("eventOps.venue.toastAssigned", { number: booth.number, company: label }) : t("eventOps.venue.toastCleared", { number: booth.number }), { type: "success" });
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
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <span className={`w-2 h-2 rounded-full ${c}`} />{translateEnum("boothStatus", l)}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("eventOps.venue.assignedCount", { assigned, total: booths.length })}</span>
          <button onClick={() => setShowMap(true)} className="text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors">
            {t("eventOps.venue.showFloorMap")}
          </button>
        </div>
      </div>

      <Modal visible={showMap} onClose={() => setShowMap(false)} maxWidth="max-w-3xl" contentClassName="max-h-[85vh]">
        <div className="bg-primary text-primary-contrast px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">{t("eventOps.venue.floorMap")}</h2>
            <p className="text-xs text-white/80 mt-0.5">{t("eventOps.venue.floorMapSubtitle")}</p>
          </div>
          <button onClick={() => setShowMap(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label={t("common.close")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-5 overflow-y-auto flex flex-col gap-1.5">
          <BoothMap booths={booths} onSelect={selectFromMap} />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            {t("eventOps.venue.floorMapNote")}
          </p>
        </div>
      </Modal>

      {["A", "B", "C"].map((zone) => (
        <div key={zone}>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t("eventOps.venue.zone", { zone })}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {booths.filter((b) => b.zone === zone).map((booth) => (
              <div key={booth.id} ref={(el) => (cardRefs.current[booth.id] = el)} className={`rounded-xl border p-3 flex flex-col gap-2.5 ${
                booth.status === "Assigned" ? "border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10"
                : booth.status === "Reserved" ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                : "border-gray-200 dark:border-gray-700 bg-surface-card"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{booth.number}</span>
                  <Badge label={tBadge(booth.status)} color={statusColor(booth.status)} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5">
                  <span className="text-gray-400 dark:text-gray-500">{t("eventOps.venue.typeRing", { type: booth.type, ring: booth.ring === "center" ? t("eventOps.venue.centerIsland") : t("eventOps.venue.outerRing") })}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{booth.company || t("eventOps.venue.unassigned")}</span>
                </div>
                {assigningId === booth.id ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <CompactSelect
                      className="text-xs"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder={t("eventOps.venue.unassignedOption")}
                      options={[{ value: "", label: t("eventOps.venue.unassignedOption") }, ...companies.map((c) => ({ value: c, label: c }))]}
                    />
                    <CompactSelect
                      className="text-xs"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      options={["Standard", "Premium", "Corner"]}
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => saveAssign(booth)} className="flex-1 text-xs rounded-lg py-1.5 font-semibold text-primary-contrast bg-primary hover:bg-primary-hover transition-colors">{t("common.save")}</button>
                      <button onClick={cancelAssign} className="flex-1 text-xs rounded-lg py-1.5 font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t("common.cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startAssign(booth)} className="text-xs rounded-lg py-1.5 font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors">
                    {booth.company ? t("eventOps.venue.reassign") : t("eventOps.venue.assign")}
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
  const { t } = useTranslation();
  const { data, update } = useEventOps();
  const toast = useToast();
  const banners = data.banners;
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);

  const stepIdx = (status) => BANNER_STEPS.indexOf(status);

  const advance = (row) => {
    const next = BANNER_STEPS[stepIdx(row.status) + 1];
    update("banners", "banners.moved", { company: row.company, material: row.material.toLowerCase(), status: next }, (rows, who) =>
      rows.map((b) => (b.id === row.id ? { ...b, status: next, ...who } : b)));
    toast(t("eventOps.banners.toastMarked", { company: row.company, status: translateEnum("bannerStatus", next) }), { type: "success" });
  };

  const startEdit = (row) => { setEditingId(row.id); setForm({ ...row, ...parseSize(row.size) }); };
  const saveEdit = () => {
    const size = composeSize(form.width, form.height);
    update("banners", "banners.updatedDetails", { company: form.company }, (rows, who) =>
      rows.map((b) => (b.id === editingId ? { ...b, ...form, size, quantity: Number(form.quantity) || 1, ...who } : b)));
    toast(t("eventOps.banners.toastSaved"), { type: "success" });
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
      update("banners", "banners.uploadedArtwork", { company: row.company }, (rows, who) =>
        rows.map((b) => (b.id === row.id ? { ...b, artwork: res.data.artwork, ...who } : b)));
      if (editingId === row.id) setForm((f) => ({ ...f, artwork: res.data.artwork }));
      toast(t("eventOps.banners.toastUploaded"), { type: "success" });
    } catch (err) {
      toast(err.response?.data?.error || t("eventOps.banners.toastUploadFailed"), { type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 flex-wrap pb-1">
        {BANNER_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${idx === 0 ? "bg-gray-300 dark:bg-gray-600" : idx === 4 ? "bg-green-500" : "bg-blue-400"}`} />
            {translateEnum("bannerStatus", step)}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {banners.map((row) => {
          const si = stepIdx(row.status);
          const editing = editingId === row.id;
          return (
            <div key={row.id} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.company}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{row.material}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={translateEnum("bannerStatus", row.status)} color={statusColor(row.status)} />
                  {si < BANNER_STEPS.length - 1 && (
                    <button onClick={() => advance(row)} className="text-xs font-medium text-primary-contrast rounded-lg px-3 py-1 hover:opacity-90 transition-opacity bg-primary">
                      {t("eventOps.banners.mark", { status: translateEnum("bannerStatus", BANNER_STEPS[si + 1]) })}
                    </button>
                  )}
                  <button onClick={() => (editing ? setEditingId(null) : startEdit(row))} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {editing ? t("common.close") : t("common.edit")}
                  </button>
                </div>
              </div>

              {/* Detailed spec grid */}
              {!editing ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  {[
                    [t("eventOps.banners.size"), row.size],
                    [t("eventOps.banners.quantity"), row.quantity],
                    [t("eventOps.banners.companyContact"), row.contact],
                    [t("eventOps.banners.printDeadline"), row.deadline],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <p className="text-gray-400 dark:text-gray-500">{k}</p>
                      <p className={`font-medium truncate ${v === "Not received" ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>{v === "Not received" ? t("eventOps.banners.notReceived") : v}</p>
                    </div>
                  ))}
                  <div className="min-w-0">
                    <p className="text-gray-400 dark:text-gray-500">{t("eventOps.banners.artworkFile")}</p>
                    {row.artwork ? (
                      <a href={row.artwork} target="_blank" rel="noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block">{t("eventOps.banners.viewFile")}</a>
                    ) : (
                      <p className="font-medium text-red-500 dark:text-red-400 truncate">{t("eventOps.banners.notReceived")}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-surface-raised rounded-lg p-3 border border-blue-100 dark:border-blue-500/20">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.material")}</label>
                    <CompactSelect className="text-xs" value={form.material ?? ""} onChange={F("material")} options={BANNER_MATERIALS} placeholder={t("eventOps.banners.selectType")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.widthCm")}</label>
                    <input type="number" min="0" dir="ltr" className={`text-xs ${inputCls}`} value={form.width ?? ""} onChange={F("width")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.heightCm")}</label>
                    <input type="number" min="0" dir="ltr" className={`text-xs ${inputCls}`} value={form.height ?? ""} onChange={F("height")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.quantity")}</label>
                    <input type="number" min="1" step="1" dir="ltr" className={`text-xs ${inputCls}`} value={form.quantity ?? ""} onChange={F("quantity")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.companyContact")}</label>
                    <input className={`text-xs ${inputCls}`} value={form.contact ?? ""} onChange={F("contact")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.printDeadline")}</label>
                    <input type="date" dir="ltr" className={`text-xs ${inputCls}`} value={form.deadline ? String(form.deadline).slice(0, 10) : ""} onChange={F("deadline")} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.artworkFile")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.ai,.eps"
                        disabled={uploadingId === row.id}
                        onChange={(e) => uploadArtwork(row, e.target.files[0])}
                        className="text-xs file:me-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-contrast hover:file:bg-primary-hover file:cursor-pointer disabled:opacity-50"
                      />
                      {uploadingId === row.id && <span className="text-xs text-gray-400 dark:text-gray-500">{t("eventOps.banners.uploading")}</span>}
                    </div>
                    {form.artwork && (
                      <a href={form.artwork} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {t("eventOps.banners.viewCurrentFile")}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.notes")}</label>
                    <input className={`text-xs ${inputCls}`} value={form.notes ?? ""} onChange={F("notes")} />
                  </div>
                  <div className="col-span-2 md:col-span-3 flex justify-end">
                    <button onClick={saveEdit} className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-1.5 bg-primary">{t("eventOps.banners.saveDetails")}</button>
                  </div>
                </div>
              )}

              {/* Progress stepper */}
              <div className="flex items-center gap-0.5">
                {BANNER_STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div title={translateEnum("bannerStatus", step)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all duration-300 ${
                      idx < si ? "border-green-500 bg-green-500 text-white"
                      : idx === si ? "border-green-500 bg-surface-card text-green-600 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-600 bg-surface-card text-gray-300 dark:text-gray-500"}`}>
                      {idx < si ? <CheckIcon /> : idx + 1}
                    </div>
                    {idx < BANNER_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-0.5 transition-all duration-300 ${idx < si ? "bg-green-400" : "bg-gray-200 dark:bg-gray-600"}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                {row.notes ? <p className="text-xs text-gray-400 dark:text-gray-500 italic">{row.notes}</p> : <span />}
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
  const { t } = useTranslation();
  const { data, update, companies } = useEventOps();
  const toast = useToast();
  const rows = data.requirements;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: "", description: "", category: "", priority: "Medium", status: "Open", notes: "" });

  const F = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.description.trim()) {
      toast(t("eventOps.requirements.toastDescribeFirst"), { type: "error" });
      return;
    }
    const company = form.company || companies[0];
    update("requirements", "requirements.added", { company, description: form.description.slice(0, 40) }, (prev, who) =>
      [...prev, { ...form, company, id: Date.now(), ...who }]);
    toast(t("eventOps.requirements.toastAdded"), { type: "success" });
    setForm({ company: "", description: "", category: "", priority: "Medium", status: "Open", notes: "" });
    setShowForm(false);
  };

  const cycleStatus = (row) => {
    const cycle = ["Open", "In Progress", "Fulfilled"];
    const next = cycle[(cycle.indexOf(row.status) + 1) % cycle.length];
    update("requirements", "requirements.marked", { company: row.company, status: next }, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: next, ...who } : r)));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {["Open", "In Progress", "Fulfilled"].map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Badge label={`${rows.filter(r => r.status === s).length} ${translateEnum("requestStatus", s)}`} color={statusColor(s)} />
            </span>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-primary-contrast rounded-xl px-3 py-2 hover:opacity-90 transition-opacity flex-shrink-0 bg-primary">
          {showForm ? t("common.cancel") : t("eventOps.requirements.addRequirement")}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-raised rounded-xl p-4 border border-blue-100 dark:border-blue-500/20 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("eventOps.requirements.newRequirement")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: t("eventOps.requirements.company"), el: <CompactSelect value={form.company} onChange={F("company")} placeholder={t("common.search")} options={companies} /> },
              { label: t("eventOps.requirements.category"), el: <input className={inputCls} placeholder={t("eventOps.requirements.categoryPlaceholder")} value={form.category} onChange={F("category")} /> },
              { label: t("eventOps.requirements.priority"), el: <CompactSelect value={form.priority} onChange={F("priority")} options={["Low", "Medium", "High", "Critical"]} tOption={(v) => translateEnum("priority", v)} /> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.requirements.description")}</label>
              <input className={inputCls} placeholder={t("eventOps.requirements.describePlaceholder")} value={form.description} onChange={F("description")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.banners.notes")}</label>
              <input className={inputCls} placeholder={t("eventOps.requirements.optional")} value={form.notes} onChange={F("notes")} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={!form.description.trim()} className="text-sm font-semibold text-primary-contrast rounded-xl px-4 py-2 disabled:opacity-50 bg-primary">{t("common.save")}</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3.5 flex items-start justify-between gap-3 flex-wrap hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.company}</span>
                {row.category && <Badge label={row.category} color="blue" />}
                <Badge label={translateEnum("priority", row.priority)} color={statusColor(row.priority)} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{row.description}</p>
              {row.notes && <p className="text-xs text-gray-400 dark:text-gray-500 italic">{row.notes}</p>}
              <LastEdited row={row} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge label={translateEnum("requestStatus", row.status)} color={statusColor(row.status)} />
              {row.status !== "Fulfilled" && (
                <button onClick={() => cycleStatus(row)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                  {row.status === "Open" ? t("eventOps.requirements.start") : t("eventOps.requirements.fulfill")}
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
  const { t } = useTranslation();
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
      toast(t("eventOps.equipment.toastRequired"), { type: "error" });
      return;
    }
    const entity = form.booth.trim() ? `${form.company} / ${form.booth.trim()}` : form.company;
    const qtyReq = Number(form.qtyReq) || 1;
    update("equipment", "equipment.added", { item: form.item, entity }, (prev, who) =>
      [...prev, { id: Date.now(), entity, item: form.item.trim(), qtyReq, qtyFul: 0, status: "Pending", requestedBy: null, ...who }]);
    toast(t("eventOps.equipment.toastAdded", { item: form.item.trim(), company: form.company }), { type: "success" });
    setForm({ company: "", booth: "", item: "", qtyReq: "1" });
    setShowForm(false);
  };

  const fulfillItem = (row) => {
    update("equipment", "equipment.fulfilled", { item: row.item, entity: row.entity }, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, qtyFul: r.qtyReq, status: "Fulfilled", ...who } : r)));
    toast(t("eventOps.equipment.toastFulfilled", { item: row.item }), { type: "success" });
  };
  // Reverses a fulfillment — resets to Pending since the exact prior partial
  // amount (if any) wasn't tracked separately from qtyFul
  const unfulfillItem = (row) => {
    update("equipment", "equipment.markedUnfulfilled", { item: row.item, entity: row.entity }, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, qtyFul: 0, status: "Pending", ...who } : r)));
    toast(t("eventOps.equipment.toastUnfulfilled", { item: row.item }), { type: "warning" });
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
    if (!editForm.item?.trim()) { toast(t("eventOps.equipment.toastItemRequired"), { type: "error" }); return; }
    const entity = editForm.booth?.trim() ? `${editForm.company} / ${editForm.booth.trim()}` : editForm.company;
    const qtyReq = Number(editForm.qtyReq) || 1;
    const qtyFul = Math.min(Number(editForm.qtyFul) || 0, qtyReq);
    const status = qtyFul === 0 ? "Pending" : qtyFul >= qtyReq ? "Fulfilled" : "Partial";
    update("equipment", "equipment.edited", { item: editForm.item, entity }, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, entity, item: editForm.item.trim(), qtyReq, qtyFul, status, ...who } : r)));
    toast(t("eventOps.equipment.toastUpdated"), { type: "success" });
    cancelEdit();
  };
  const removeItem = (row) => {
    update("equipment", "equipment.removed", { item: row.item, entity: row.entity }, (prev) => prev.filter((r) => r.id !== row.id));
    toast(t("eventOps.equipment.toastRemoved", { item: row.item }), { type: "info" });
    if (editingId === row.id) cancelEdit();
  };

  // Company-requested rows (requestedBy set) await CASTO approval. Approving
  // clears the requestedBy flag so it becomes a normal pending equipment row
  // CASTO then fulfils; declining removes it.
  const pendingRequests = allRows.filter((r) => r.requestedBy);
  const approveRequest = (row) => {
    update("equipment", "equipment.approved", { item: row.item, requestedBy: row.requestedBy }, (prev, who) =>
      prev.map((r) => (r.id === row.id ? { ...r, requestedBy: null, ...who } : r)));
    toast(t("eventOps.equipment.toastApproved", { item: row.item, requester: row.requestedBy }), { type: "success" });
  };
  const declineRequest = (row) => {
    update("equipment", "equipment.declined", { item: row.item, requestedBy: row.requestedBy }, (prev) => prev.filter((r) => r.id !== row.id));
    toast(t("eventOps.equipment.toastDeclined"), { type: "warning" });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("eventOps.equipment.tables")} value={total(["table"])} sub={t("eventOps.equipment.totalRequested")} />
        <StatCard label={t("eventOps.equipment.chairs")} value={total(["chair"])} sub={t("eventOps.equipment.totalRequested")} />
        <StatCard label={t("eventOps.equipment.powerCables")} value={total(["power", "extension", "cable"])} sub={t("eventOps.equipment.stripsCables")} />
        <StatCard label={t("eventOps.equipment.screens")} value={total(["screen", "monitor"])} sub={t("eventOps.equipment.monitorsDisplays")} />
      </div>

      {/* Company-submitted requests awaiting approval — surfaced at the top so
          CASTO acts on them before they get lost in the full list. */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-[11px] font-bold flex items-center justify-center">{pendingRequests.length}</span>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t("eventOps.equipment.awaitingApproval")}</p>
          </div>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 bg-surface-card rounded-lg border border-amber-100 dark:border-amber-500/20 px-3 py-2 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{row.qtyReq} × {row.item}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("eventOps.equipment.requestedBy", { requester: row.requestedBy })}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => approveRequest(row)} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity bg-primary">{t("eventOps.equipment.approve")}</button>
                  <button onClick={() => declineRequest(row)} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">{t("eventOps.equipment.decline")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("eventOps.equipment.searchPlaceholder")}
            className="w-full sm:w-80 ps-8 pe-3 h-9 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-primary-contrast rounded-xl px-3 py-2 hover:opacity-90 transition-opacity bg-primary">
          {showForm ? t("common.cancel") : t("eventOps.equipment.addRequest")}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-raised rounded-xl p-4 border border-blue-100 dark:border-blue-500/20 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.requirements.company")}</label>
            <CompactSelect value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder={t("eventOps.equipment.selectCompany")} options={allCompanyNames} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.equipment.boothOptional")}</label>
            <input className={inputCls} placeholder="e.g. B03" value={form.booth} onChange={(e) => setForm((f) => ({ ...f, booth: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.equipment.item")}</label>
            <input className={inputCls} placeholder={t("eventOps.equipment.itemPlaceholder")} value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.equipment.qty")}</label>
            <div className="flex gap-2">
              <input type="number" min="1" dir="ltr" className={inputCls} value={form.qtyReq} onChange={(e) => setForm((f) => ({ ...f, qtyReq: e.target.value }))} />
              <button onClick={addRequest} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 shrink-0 bg-primary">{t("common.add")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {[t("eventOps.equipment.colCompanyBooth"), t("eventOps.equipment.item"), t("eventOps.equipment.colRequested"), t("eventOps.equipment.colFulfilled"), t("applicants.columns.status"), t("eventOps.equipment.colLastChange"), ""].map((h, i) => (
                <th key={i} className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => editingId === row.id ? (
              <tr key={row.id} className="border-b border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/10">
                <td className="px-4 py-2">
                  <div className="flex gap-1.5">
                    <CompactSelect className="text-xs min-w-[130px]" value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} options={allCompanyNames} placeholder={t("eventOps.requirements.company")} />
                    <input className={`text-xs w-20 ${inputCls}`} placeholder={t("eventOps.equipment.booth")} value={editForm.booth} onChange={(e) => setEditForm((f) => ({ ...f, booth: e.target.value }))} />
                  </div>
                </td>
                <td className="px-4 py-2"><input className={`text-xs ${inputCls}`} value={editForm.item} onChange={(e) => setEditForm((f) => ({ ...f, item: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min="1" dir="ltr" className={`text-xs w-16 text-center ${inputCls}`} value={editForm.qtyReq} onChange={(e) => setEditForm((f) => ({ ...f, qtyReq: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min="0" dir="ltr" className={`text-xs w-16 text-center ${inputCls}`} value={editForm.qtyFul} onChange={(e) => setEditForm((f) => ({ ...f, qtyFul: e.target.value }))} /></td>
                <td className="px-4 py-2 text-[10px] text-gray-400 dark:text-gray-500" colSpan={2}>{t("eventOps.equipment.statusAutoSet")}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1.5">
                    <button onClick={() => saveEdit(row)} className="text-xs font-semibold text-primary-contrast rounded-lg px-2.5 py-1 bg-primary">{t("common.save")}</button>
                    <button onClick={cancelEdit} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1">{t("common.cancel")}</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={row.id} className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-0 ${row.requestedBy ? "bg-amber-50/40 dark:bg-amber-500/10" : ""}`}>
                <td className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <Highlight text={row.entity} query={search} />
                  {row.requestedBy && <Badge label={t("eventOps.equipment.requested")} color="yellow" />}
                </td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-100"><Highlight text={row.item} query={search} /></td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-center font-mono">{row.qtyReq}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-center font-mono">{row.qtyFul}</td>
                <td className="px-4 py-3"><Badge label={translateEnum("requestStatus", row.status)} color={statusColor(row.status)} /></td>
                <td className="px-4 py-3"><LastEdited row={row} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {row.status === "Fulfilled" ? (
                      <button onClick={() => unfulfillItem(row)} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-500 dark:text-gray-400">
                        {t("eventOps.equipment.unfulfill")}
                      </button>
                    ) : (
                      <button onClick={() => fulfillItem(row)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors text-gray-500 dark:text-gray-400">
                        {t("eventOps.requirements.fulfill")}
                      </button>
                    )}
                    <button onClick={() => startEdit(row)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400">{t("common.edit")}</button>
                    <button onClick={() => removeItem(row)} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2 py-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">{t("eventOps.equipment.noMatch", { search })}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Tab: Delegates ───────────────────────────────────────────────────────────

const DelegateList = () => {
  const { t } = useTranslation();
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

    update("delegates", "delegates.printedBadge", { name: d.name, company }, (prev, who) =>
      prev.map((c) => c.company !== company ? c : {
        ...c, delegates: c.delegates.map((dd, di) => di !== dIdx ? dd : { ...dd, badge: "Printed", ...who })
      }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("eventOps.delegates.totalDelegates")} value={totalDelegates} sub={t("eventOps.delegates.acrossAllCompanies")} />
        <StatCard label={t("eventOps.delegates.badgesPrinted")} value={totalPrinted} sub={t("eventOps.delegates.pending", { count: totalDelegates - totalPrinted })} />
        <StatCard label={t("eventOps.requirements.company")} value={mergedAll.length} sub={t("eventOps.delegates.allRegistered")} />
        <StatCard label={t("eventOps.delegates.withDelegates")} value={companiesWithDelegates} sub={t("eventOps.delegates.awaiting", { count: mergedAll.length - companiesWithDelegates })} />
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("eventOps.delegates.searchCompany")}
          className="w-full sm:w-72 ps-8 pe-3 h-9 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <svg className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div className="flex flex-col gap-2">
        {companies.map((company) => {
          const open = expanded.has(company.company);
          const empty = company.delegates.length === 0;
          return (
            <div key={company.company} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => toggle(company.company)} className="w-full flex items-center justify-between px-4 py-3 bg-surface-card hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate"><Highlight text={company.company} query={search} /></span>
                  {empty ? (
                    <Badge label={t("eventOps.delegates.noDelegatesYet")} color="gray" />
                  ) : (
                    <>
                      <Badge label={t("eventOps.delegates.delegatesCount", { count: company.delegates.length })} color="blue" />
                      <Badge label={t("eventOps.delegates.badgesPrintedCount", { count: company.delegates.filter(d => d.badge === "Printed").length })} color="green" />
                    </>
                  )}
                </div>
                <span className="text-gray-400 dark:text-gray-500"><ChevronIcon open={open} /></span>
              </button>

              {open && (
                <div className="border-t border-gray-100 dark:border-gray-700 overflow-x-auto">
                  {empty ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-4 py-4">{t("eventOps.delegates.noneRegisteredYet")}</p>
                  ) : (
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          {[t("applicants.columns.name"), t("eventOps.delegates.role"), t("managersCols.email"), t("eventOps.delegates.phone"), t("eventOps.delegates.badge"), ""].map((h, i) => (
                            <th key={i} className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {company.delegates.map((d, di) => (
                          <tr key={di} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">{d.name}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 text-xs">{d.role}</td>
                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs bidi-ltr">{d.email}</td>
                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs bidi-ltr">{d.phone}</td>
                            <td className="px-4 py-2.5"><Badge label={d.badge === "Printed" ? t("eventOps.delegates.printed") : t("eventOps.delegates.pendingBadge")} color={d.badge === "Printed" ? "green" : "yellow"} /></td>
                            <td className="px-4 py-2.5">
                              {d.badge !== "Printed" && (
                                <button onClick={() => printBadge(company.company, di, d)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors text-gray-500 dark:text-gray-400">
                                  {t("eventOps.delegates.printBadge")}
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
        {companies.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">{t("eventOps.delegates.noCompanyMatch", { search })}</p>}
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
  const { t } = useTranslation();
  const { data, update } = useEventOps();
  const toast = useToast();
  const [subTab, setSubTab] = useState(0);
  const students = data.attendanceStudents;
  const booths = data.booths.filter((b) => b.company);
  const qrRefs = useRef({});

  // Every company with an assigned booth is expected on the day, so all of
  // them appear in the attendance list — not just the ones that already have
  // an attendance record. Start from the assigned booths, then overlay any
  // real attendance row (checked-in time/method/status), and finally include
  // any attendance rows whose booth is no longer assigned so nothing is lost.
  // delegateCount defaults to how many delegates the company has registered.
  const companies = useMemo(() => {
    const eq = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
    const attRows = data.attendanceCompanies || [];
    const delegatesOf = (name) =>
      (data.delegates || []).find((d) => eq(d.company, name))?.delegates.length || 0;

    const rows = booths.map((b) => {
      const existing = attRows.find((a) => eq(a.company, b.company) || a.booth === b.number);
      return existing
        ? { ...existing, booth: b.number, company: b.company }
        : { booth: b.number, company: b.company, delegateCount: delegatesOf(b.company), checkedIn: 0, time: "—", method: "—", status: "Absent" };
    });

    // Attendance rows for companies whose booth assignment was cleared still
    // shown at the end so a prior check-in never silently disappears.
    const boothCompanies = new Set(booths.map((b) => (b.company || "").trim().toLowerCase()));
    const orphans = attRows.filter((a) => !boothCompanies.has((a.company || "").trim().toLowerCase()));
    return [...rows, ...orphans];
  }, [booths, data.attendanceCompanies, data.delegates]);

  const compCheckedIn = companies.reduce((a, c) => a + (c.checkedIn || 0), 0);
  const compTotal = companies.reduce((a, c) => a + (c.delegateCount || 0), 0);
  const studCheckedIn = students.filter((s) => s.status === "Checked In").length;

  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const checkInStudent = (id) => update("attendanceStudents", "attendance.checkedInStudent", { id }, (prev) =>
    prev.map((s) => s.id !== id ? s : { ...s, status: "Checked In", time: now(), method: "Manual" }));

  // Upsert: a company that has no attendance row yet (only a booth) gets one
  // created on check-in; an existing row is flipped to Present. Keyed by
  // company name so it works whether or not the row already existed.
  const checkInCompany = (row, method) => {
    const eq = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
    update("attendanceCompanies", "attendance.checkedInCompany", { company: row.company, booth: row.booth, method }, (prev, who) => {
      const rows = prev || [];
      const idx = rows.findIndex((c) => eq(c.company, row.company));
      const filled = {
        booth: row.booth, company: row.company,
        delegateCount: row.delegateCount || 0, checkedIn: row.delegateCount || 0,
        time: now(), method, status: "Present", ...who,
      };
      if (idx === -1) return [...rows, filled];
      return rows.map((c, i) => (i === idx ? { ...c, ...filled } : c));
    });
    toast(t("eventOps.attendance.toastCheckedIn", { company: row.company, method }), { type: "success" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("eventOps.attendance.expected")} value={subTab === 1 ? students.length : compTotal} />
        <StatCard label={t("eventOps.attendance.checkedIn")} value={subTab === 1 ? studCheckedIn : compCheckedIn} />
        <StatCard label={t("eventOps.attendance.pendingLabel")} value={subTab === 1 ? students.length - studCheckedIn : compTotal - compCheckedIn} />
      </div>

      <SubTabBar tabs={[t("eventOps.attendance.subtabCompanies"), t("eventOps.attendance.subtabStudents"), t("eventOps.attendance.subtabBoothQr")]} active={subTab} onChange={setSubTab} />

      {subTab === 0 && (
        <div className="flex flex-col gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3">
          {t("eventOps.attendance.companiesHint")}
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[t("eventOps.attendance.colBooth"), t("eventOps.requirements.company"), t("eventOps.attendance.colDelegates"), t("eventOps.attendance.colCheckedIn"), t("eventOps.attendance.colTime"), t("eventOps.attendance.colMethod"), t("applicants.columns.status"), ""].map((h, i) => (
                  <th key={i} className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{row.booth}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.company}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{row.delegateCount}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{row.checkedIn}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{row.time}</td>
                  <td className="px-4 py-3">{row.method && row.method !== "—" ? <Badge label={row.method === "QR" ? t("eventOps.attendance.methodQr") : t("eventOps.attendance.methodManual")} color={row.method === "QR" ? "blue" : "gray"} /> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}</td>
                  <td className="px-4 py-3"><Badge label={translateEnum("attendanceState", row.status)} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3">
                    {row.status !== "Present" && (
                      <button onClick={() => checkInCompany(row, "Manual")} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors text-gray-500 dark:text-gray-400" title={t("eventOps.attendance.manualOverrideHint")}>
                        {t("eventOps.attendance.checkInManually")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">{t("eventOps.attendance.noBoothsYet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {subTab === 1 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[t("eventOps.attendance.colStudentId"), t("applicants.columns.name"), t("eventOps.attendance.colTime"), t("eventOps.attendance.colMethod"), t("applicants.columns.status"), ""].map((h, i) => (
                  <th key={i} className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{row.time}</td>
                  <td className="px-4 py-3">{row.method !== "—" ? <Badge label={row.method === "QR" ? t("eventOps.attendance.methodQr") : t("eventOps.attendance.methodManual")} color={row.method === "QR" ? "blue" : "gray"} /> : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}</td>
                  <td className="px-4 py-3"><Badge label={translateEnum("attendanceState", row.status)} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3">
                    {row.status !== "Checked In" && (
                      <button onClick={() => checkInStudent(row.id)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors text-gray-500 dark:text-gray-400">
                        {t("eventOps.attendance.checkIn")}
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
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3">
            {t("eventOps.attendance.qrHint")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {booths.map((b) => (
              <div key={b.id} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col items-center gap-2">
                <div ref={(el) => { if (el) qrRefs.current[b.id] = el.querySelector("svg"); }}>
                  <QRCodeSVG value={boothQrValue(b)} size={96} fgColor="#111827" />
                </div>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{b.number}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">{b.company}</p>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bidi-ltr">{boothQrValue(b)}</span>
                <button
                  onClick={() => qrRefs.current[b.id] && downloadQrAsPng(qrRefs.current[b.id], `booth-${b.number}-qr.png`)}
                  className="text-[11px] font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                >
                  {t("eventOps.attendance.download")}
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
  const { t } = useTranslation();
  const { data, addSupportStaff, updateSupportStaff, removeSupportStaff, addSupportTask, setSupportTaskStatus, removeSupportTask } = useEventOps();
  const toast = useToast();
  const staff = data.supportStaff || [];
  const [form, setForm] = useState({ name: "", role: SUPPORT_ROLES[0], phone: "" });
  const [taskDrafts, setTaskDrafts] = useState({}); // staffId -> title being typed

  const handleAdd = () => {
    if (!form.name.trim()) { toast(t("eventOps.staff.toastNameRequired"), { type: "error" }); return; }
    addSupportStaff(form.name.trim(), form.role, form.phone.trim());
    setForm({ name: "", role: SUPPORT_ROLES[0], phone: "" });
    toast(t("eventOps.staff.toastAdded", { name: form.name.trim() }), { type: "success" });
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
        <StatCard label={t("eventOps.staff.supportStaff")} value={staff.length} />
        <StatCard label={t("eventOps.staff.openTasks")} value={openTasks} />
        <StatCard label={t("eventOps.staff.totalTasks")} value={totalTasks} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-4 py-3">
        <Trans i18nKey="eventOps.staff.supportHint" components={{ b: <span className="font-semibold" /> }} />
      </p>

      <div className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("eventOps.staff.newSupportStaff")}</p>
        <div className="flex gap-2 items-start flex-wrap">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("eventOps.staff.fullName")}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="min-w-[180px]">
            <CompactSelect value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} options={SUPPORT_ROLES} placeholder={t("eventOps.staff.selectRole")} tOption={(v) => translateEnum("supportRole", v)} />
          </div>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder={t("eventOps.staff.phoneOptional")} dir="ltr"
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[140px] bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={handleAdd} disabled={!form.name.trim()} className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-2 disabled:opacity-50 bg-primary">
            {t("eventOps.staff.addStaff")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {staff.map((s) => {
          const done = s.tasks?.filter((t) => t.status === "Done").length || 0;
          return (
            <div key={s.id} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge label={s.role ? translateEnum("supportRole", s.role) : t("eventOps.staff.support")} color="gray" />
                    {s.phone && <span className="text-[11px] text-gray-400 dark:text-gray-500 bidi-ltr">{s.phone}</span>}
                  </div>
                </div>
                <button onClick={() => { removeSupportStaff(s.id); toast(t("eventOps.staff.toastRemoved", { name: s.name }), { type: "info" }); }}
                  className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0">
                  {t("common.remove")}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("eventOps.staff.tasks")}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{t("eventOps.staff.doneCount", { done, total: s.tasks?.length || 0 })}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {(s.tasks || []).map((t2) => (
                  <div key={t2.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                    <button onClick={() => cycleStatus(s.id, t2)} title={t("eventOps.staff.clickToAdvance")} className="shrink-0">
                      <Badge label={translateEnum("taskStatus", t2.status)} color={taskStatusColor(t2.status)} />
                    </button>
                    <span className={`text-xs flex-1 min-w-0 truncate ${t2.status === "Done" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>{t2.title}</span>
                    <button onClick={() => removeSupportTask(s.id, t2.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 shrink-0 text-sm leading-none">×</button>
                  </div>
                ))}
                {(s.tasks?.length || 0) === 0 && <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">{t("eventOps.staff.noTasksYet")}</p>}
              </div>

              <div className="flex gap-2 items-center">
                <input value={taskDrafts[s.id] || ""} onChange={(e) => setTaskDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask(s.id)} placeholder={t("eventOps.staff.assignTask")}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs flex-1 bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={() => handleAddTask(s.id)} disabled={!(taskDrafts[s.id] || "").trim()}
                  className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 disabled:opacity-40 bg-primary">{t("common.add")}</button>
              </div>
            </div>
          );
        })}
        {staff.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 lg:col-span-2 text-center py-6">{t("eventOps.staff.noStaffYet")}</p>}
      </div>
    </div>
  );
};

// ── Sub-tab: Check-in Staff (the original code-gated volunteers) ──
const CheckinStaffPanel = () => {
  const { t } = useTranslation();
  const { data, addStaffer, removeStaffer } = useEventOps();
  const toast = useToast();
  const staff = data.attendanceStaff || [];
  const checkinLog = data.checkinLog || [];
  const [form, setForm] = useState({ name: "", email: "" });
  const [revealedCode, setRevealedCode] = useState(null); // { name, code } — shown once after creation

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast(t("eventOps.checkinStaff.toastRequired"), { type: "error" });
      return;
    }
    const code = addStaffer(form.name.trim(), form.email.trim());
    setRevealedCode({ name: form.name.trim(), code });
    setForm({ name: "", email: "" });
    toast(t("eventOps.checkinStaff.toastCreated", { name: form.name.trim() }), { type: "success" });
  };

  const totalCheckins = checkinLog.length;
  const activeCount = staff.filter((s) => s.status === "active").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label={t("eventOps.checkinStaff.staffAccounts")} value={staff.length} sub={t("eventOps.checkinStaff.activeCount", { count: activeCount })} />
        <StatCard label={t("eventOps.checkinStaff.studentsCheckedIn")} value={totalCheckins} />
        <StatCard label={t("eventOps.checkinStaff.awaitingFirstLogin")} value={staff.filter((s) => s.status === "invited").length} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3">
        {t("eventOps.checkinStaff.createHint")}
        <a href="/student-checkin" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 dark:text-blue-400 hover:underline mx-1 bidi-ltr">/student-checkin</a>
        {t("eventOps.checkinStaff.createHint2")}
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/student-checkin`); toast(t("eventOps.checkinStaff.toastLinkCopied"), { type: "success", duration: 1800 }); }}
          className="ms-2 inline-flex items-center gap-1 text-[11px] font-semibold border border-blue-200 dark:border-blue-500/30 rounded-lg px-2 py-1 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors align-middle"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {t("eventOps.checkinStaff.copyLink")}
        </button>
        <br />
        {t("eventOps.checkinStaff.studentTicketHint")}
        <a href="/my-qr-code" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 dark:text-blue-400 hover:underline mx-1 bidi-ltr">/my-qr-code</a>
        {t("eventOps.checkinStaff.studentTicketHint2")}
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/my-qr-code`); toast(t("eventOps.checkinStaff.toastTicketLinkCopied"), { type: "success", duration: 1800 }); }}
          className="ms-2 inline-flex items-center gap-1 text-[11px] font-semibold border border-blue-200 dark:border-blue-500/30 rounded-lg px-2 py-1 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors align-middle"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {t("eventOps.checkinStaff.copyLink")}
        </button>
      </p>

      <div className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("eventOps.checkinStaff.newAccount")}</p>
        <div className="flex gap-2 items-start flex-wrap">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("eventOps.staff.fullName")}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            type="email"
            dir="ltr"
            placeholder={t("eventOps.checkinStaff.emailPlaceholder")}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={handleAdd} disabled={!form.name.trim() || !form.email.trim()} className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-2 disabled:opacity-50 bg-primary">
            {t("eventOps.checkinStaff.createAccount")}
          </button>
        </div>
      </div>

      {revealedCode && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-green-800 dark:text-green-300">{t("eventOps.checkinStaff.accessCodeFor", { name: revealedCode.name })}</p>
            <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-400 tracking-widest bidi-ltr">{revealedCode.code}</p>
            <p className="text-[11px] text-green-600 dark:text-green-400 mt-1">{t("eventOps.checkinStaff.shareNowHint")}</p>
          </div>
          <button onClick={() => setRevealedCode(null)} className="text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300">{t("eventOps.checkinStaff.dismiss")}</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {staff.map((s) => {
          const theirCheckins = checkinLog.filter((c) => c.byId === s.id);
          return (
            <div key={s.id} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                    <Badge label={s.status === "active" ? t("eventOps.checkinStaff.active") : t("eventOps.checkinStaff.invited")} color={s.status === "active" ? "green" : "yellow"} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate bidi-ltr">{s.email}</p>
                  {s.phone && <p className="text-[11px] text-gray-400 dark:text-gray-500 bidi-ltr">{s.phone}</p>}
                  <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5 bidi-ltr">{t("eventOps.checkinStaff.code", { code: s.code })}</p>
                </div>
                <button onClick={() => removeStaffer(s.id)} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0">
                  {t("eventOps.checkinStaff.revoke")}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{t("eventOps.checkinStaff.checkedInCount", { count: theirCheckins.length })}</span>
              </div>
              {theirCheckins.length > 0 && (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pe-1">
                  {theirCheckins.slice(0, 8).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{c.name || c.uniId}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] shrink-0">{formatWhen(c.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {staff.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 col-span-2 text-center py-6">{t("eventOps.checkinStaff.noAccountsYet")}</p>}
      </div>
    </div>
  );
};

// ── Wrapper: Support Staff + Check-in Staff sub-tabs ──
const MANAGE_STAFF_SUBTAB_KEY = "event_ops_manage_staff_subtab";
const ManageStaff = () => {
  const { t } = useTranslation();
  const [sub, setSub] = useState(() => Number(localStorage.getItem(MANAGE_STAFF_SUBTAB_KEY)) || 0);
  useEffect(() => { try { localStorage.setItem(MANAGE_STAFF_SUBTAB_KEY, String(sub)); } catch { /* quota */ } }, [sub]);
  return (
    <div className="flex flex-col gap-4">
      <SubTabBar tabs={[t("eventOps.staff.supportStaff"), t("eventOps.checkinStaff.tabLabel")]} active={sub} onChange={setSub} />
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
  const { t } = useTranslation();
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
      toast(t("eventOps.schedule.toastRequired"), { type: "error" });
      return;
    }
    update("schedule", "schedule.added", { title: form.title }, (prev, who) =>
      [...prev, { ...form, id: Date.now(), capacity: Number(form.capacity) || 0, registered: 0, ...who }]);
    setForm({ start: "", end: "", title: "", host: "", location: "", capacity: "", status: "Upcoming" });
    setShowForm(false);
  };

  const startEdit = (slot) => { setEditingId(slot.id); setEditForm({ ...slot }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const saveEdit = () => {
    if (!editForm.title?.trim() || !editForm.start) {
      toast(t("eventOps.schedule.toastRequired"), { type: "error" });
      return;
    }
    update("schedule", "schedule.edited", { title: editForm.title }, (prev, who) =>
      prev.map((s) => (s.id === editingId ? { ...s, ...editForm, capacity: Number(editForm.capacity) || 0, ...who } : s)));
    toast(t("eventOps.schedule.toastUpdated"), { type: "success" });
    cancelEdit();
  };

  const removeSlot = (slot) => {
    update("schedule", "schedule.removed", { title: slot.title }, (prev) => prev.filter((s) => s.id !== slot.id));
    toast(t("eventOps.schedule.toastRemoved", { title: slot.title }), { type: "info" });
    if (editingId === slot.id) cancelEdit();
  };

  const cycleStatus = (slot) => {
    const cycle = ["Upcoming", "Live", "Ended"];
    const next = cycle[(cycle.indexOf(slot.status) + 1) % cycle.length];
    update("schedule", "schedule.setStatus", { title: slot.title, status: next }, (prev, who) =>
      prev.map((s) => (s.id === slot.id ? { ...s, status: next, ...who } : s)));
  };

  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {["Ended", "Live", "Upcoming"].map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Badge label={`${slots.filter(sl => sl.status === s).length} ${translateEnum("eventState", s)}`} color={statusColor(s)} />
            </span>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-primary-contrast rounded-xl px-3 py-2 hover:opacity-90 transition-opacity flex-shrink-0 bg-primary">
          {showForm ? t("common.cancel") : t("eventOps.schedule.addSlot")}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-raised rounded-xl p-4 border border-blue-100 dark:border-blue-500/20 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("eventOps.schedule.newSlot")}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t("eventOps.schedule.start"), el: <input type="time" dir="ltr" className={inputCls} value={form.start} onChange={F("start")} /> },
              { label: t("eventOps.schedule.end"), el: <input type="time" dir="ltr" className={inputCls} value={form.end} onChange={F("end")} /> },
              { label: t("eventOps.schedule.host"), el: <input className={inputCls} placeholder={t("eventOps.schedule.hostPlaceholder")} value={form.host} onChange={F("host")} /> },
              { label: t("eventOps.schedule.location"), el: <CompactSelect value={form.location} onChange={F("location")} options={SCHEDULE_LOCATIONS} placeholder={t("eventOps.schedule.selectArea")} tOption={(v) => translateEnum("scheduleLocation", v)} /> },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1"><label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</label>{el}</div>
            ))}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.sessionTitle")}</label>
              <input className={inputCls} placeholder={t("eventOps.schedule.sessionTitlePlaceholder")} value={form.title} onChange={F("title")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.capacity")}</label>
              <input type="number" dir="ltr" className={inputCls} placeholder="0" value={form.capacity} onChange={F("capacity")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t("applicants.columns.status")}</label>
              <CompactSelect value={form.status} onChange={F("status")} options={["Upcoming", "Live", "Ended"]} tOption={(v) => translateEnum("eventState", v)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={!form.title.trim() || !form.start} className="text-sm font-semibold text-primary-contrast rounded-xl px-4 py-2 disabled:opacity-50 bg-primary">{t("eventOps.schedule.saveSlot")}</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((slot) => (
          <div key={slot.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center pt-1 flex-shrink-0 w-14">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bidi-ltr">{slot.start}</span>
              <div className="w-px flex-1 bg-gray-200 dark:bg-gray-600 my-1 min-h-[20px]" />
              <span className="text-xs text-gray-400 dark:text-gray-500 bidi-ltr">{slot.end}</span>
            </div>
            <div className={`flex-1 rounded-xl border p-4 flex flex-col gap-2 min-w-0 ${
              slot.status === "Live" ? "border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10"
              : slot.status === "Ended" ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
              : "border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10"}`}>
              {editingId === slot.id ? (
                /* Inline editor — change the time or any detail of an existing slot */
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.start")}</label><input type="time" dir="ltr" className={`text-xs ${inputCls}`} value={editForm.start || ""} onChange={EF("start")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.end")}</label><input type="time" dir="ltr" className={`text-xs ${inputCls}`} value={editForm.end || ""} onChange={EF("end")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.host")}</label><input className={`text-xs ${inputCls}`} value={editForm.host || ""} onChange={EF("host")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.location")}</label><CompactSelect className="text-xs" value={editForm.location || ""} onChange={EF("location")} options={SCHEDULE_LOCATIONS} placeholder={t("eventOps.schedule.selectArea")} tOption={(v) => translateEnum("scheduleLocation", v)} /></div>
                    <div className="flex flex-col gap-1 col-span-2"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.sessionTitle")}</label><input className={`text-xs ${inputCls}`} value={editForm.title || ""} onChange={EF("title")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("eventOps.schedule.capacity")}</label><input type="number" dir="ltr" className={`text-xs ${inputCls}`} value={editForm.capacity ?? ""} onChange={EF("capacity")} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t("applicants.columns.status")}</label><CompactSelect className="text-xs" value={editForm.status || "Upcoming"} onChange={EF("status")} options={["Upcoming", "Live", "Ended"]} tOption={(v) => translateEnum("eventState", v)} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5">{t("common.cancel")}</button>
                    <button onClick={saveEdit} className="text-xs font-semibold text-primary-contrast rounded-lg px-3 py-1.5 bg-primary">{t("common.save")}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{slot.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge label={translateEnum("eventState", slot.status)} color={statusColor(slot.status)} />
                      <button onClick={() => cycleStatus(slot)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-0.5 hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60">
                        {t("eventOps.schedule.nextStatus")}
                      </button>
                      <button onClick={() => startEdit(slot)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-0.5 hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60">
                        {t("common.edit")}
                      </button>
                      <button onClick={() => removeSlot(slot)} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-0.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors bg-white/60 dark:bg-gray-800/60">
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {slot.host && <span>{t("eventOps.schedule.hostLabel")} <span className="font-medium text-gray-700 dark:text-gray-300">{slot.host}</span></span>}
                    {slot.location && <span>{t("eventOps.schedule.locationLabel")} <span className="font-medium text-gray-700 dark:text-gray-300">{translateEnum("scheduleLocation", slot.location)}</span></span>}
                    {slot.capacity > 0 && <span>{t("eventOps.schedule.registeredLabel")} <span className="font-medium text-gray-700 dark:text-gray-300 bidi-ltr">{slot.registered} / {slot.capacity}</span></span>}
                    <LastEdited row={slot} />
                  </div>
                  {slot.capacity > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${slot.status === "Live" ? "bg-primary" : slot.status === "Ended" ? "bg-gray-400 dark:bg-gray-500" : "bg-secondary"}`} style={{
                        width: `${Math.min(100, Math.round((slot.registered / slot.capacity) * 100))}%`,
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
  const { t } = useTranslation();
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
    update("passes", "passes.issued", { code, company }, (prev, who) =>
      [...prev, { id: Date.now(), company, delegate: "Unassigned", type: "Entry", code, issued: new Date().toISOString().slice(0, 10), status: "Active", ...who }]);
    toast(t("eventOps.passes.toastIssued", { company }), { type: "success" });
  };

  const setStatus = (row, status) => {
    update("passes", status === "Revoked" ? "passes.revoked" : "passes.reactivated", { code: row.code, company: row.company }, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, status, ...who } : p)));
    toast(status === "Revoked" ? t("eventOps.passes.toastRevoked", { code: row.code }) : t("eventOps.passes.toastReactivated", { code: row.code }), { type: status === "Revoked" ? "warning" : "success" });
  };

  const startEditParking = (row) => {
    setEditingParking(row.id);
    setParkingForm({ slot: row.slot || "", location: row.location || "", mapUrl: row.mapUrl || "" });
  };

  const saveParking = (row) => {
    update("passes", "passes.setParkingSlot", { slot: parkingForm.slot || "—", company: row.company }, (prev, who) =>
      prev.map((p) => (p.id === row.id ? { ...p, slot: parkingForm.slot, location: parkingForm.location, mapUrl: parkingForm.mapUrl.trim(), ...who } : p)));
    toast(t("eventOps.passes.toastParkingSaved"), { type: "success" });
    setEditingParking(null);
  };

  const typeLabel = (ty) => ty === "All" ? t("eventOps.passes.typeAll") : ty === "Entry" ? t("eventOps.passes.typeEntry") : t("eventOps.passes.typeParking");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label={t("eventOps.passes.totalIssued")} value={passes.length} />
        <StatCard label={t("eventOps.passes.entryPasses")} value={passes.filter(p => p.type === "Entry").length} />
        <StatCard label={t("eventOps.passes.parkingPasses")} value={passes.filter(p => p.type === "Parking").length} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {types.map((ty) => (
            <button key={ty} onClick={() => setFilter(ty)} className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-all duration-150 ${filter === ty ? "text-primary-contrast shadow-sm bg-primary" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              {typeLabel(ty)} {ty !== "All" && `(${passes.filter(p => p.type === ty).length})`}
            </button>
          ))}
        </div>
        <SubTabBar tabs={[t("eventOps.passes.viewTable"), t("eventOps.passes.viewByCompany")]} active={view} onChange={setView} />
      </div>

      {view === 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {[t("eventOps.requirements.company"), t("eventOps.passes.delegate"), t("eventOps.passes.type"), t("eventOps.passes.parkingSlotLocation"), t("eventOps.passes.code"), t("eventOps.passes.issued"), t("applicants.columns.status"), t("eventOps.equipment.colLastChange"), ""].map((h, i) => (
                  <th key={i} className="text-start text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.company}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.delegate}</td>
                  <td className="px-4 py-3"><Badge label={typeLabel(row.type)} color={row.type === "Parking" ? "yellow" : "blue"} /></td>
                  <td className="px-4 py-3">
                    {row.type !== "Parking" ? (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    ) : editingParking === row.id ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <input value={parkingForm.slot} onChange={(e) => setParkingForm((f) => ({ ...f, slot: e.target.value }))} placeholder={t("eventOps.passes.slotPlaceholder")} className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs w-24 bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
                          <input value={parkingForm.location} onChange={(e) => setParkingForm((f) => ({ ...f, location: e.target.value }))} placeholder={t("eventOps.passes.exactLocation")} className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs w-40 bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
                          <button onClick={() => saveParking(row)} className="text-xs font-semibold text-primary-contrast rounded-lg px-2 py-1 bg-primary">{t("common.save")}</button>
                        </div>
                        {/* Google Maps link — paste a share/pin URL; the company
                            side renders a map preview + "Open in Maps". Placeholder
                            for now (no live embed API wired up yet). */}
                        <input value={parkingForm.mapUrl} onChange={(e) => setParkingForm((f) => ({ ...f, mapUrl: e.target.value }))} placeholder={t("eventOps.passes.mapsLinkOptional")} dir="ltr" className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs w-full bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    ) : row.slot ? (
                      <button onClick={() => startEditParking(row)} className="text-start hover:underline">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{row.slot}</span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 block">{row.location}</span>
                        {row.mapUrl && <span className="text-[10px] text-green-600 dark:text-green-400 block">📍 {t("eventOps.passes.mapLinked")}</span>}
                      </button>
                    ) : (
                      <button onClick={() => startEditParking(row)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                        {t("eventOps.passes.assignSlot")}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono bidi-ltr">{row.code}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{row.issued}</td>
                  <td className="px-4 py-3"><Badge label={translateEnum("passStatus", row.status)} color={statusColor(row.status)} /></td>
                  <td className="px-4 py-3"><LastEdited row={row} /></td>
                  <td className="px-4 py-3">
                    {row.status === "Active" && (
                      <button onClick={() => setStatus(row, "Revoked")} className="text-xs font-medium border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors">{t("eventOps.passes.revoke")}</button>
                    )}
                    {row.status === "Revoked" && (
                      <button onClick={() => setStatus(row, "Active")} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 text-gray-500 dark:text-gray-400 transition-colors">{t("eventOps.passes.reactivate")}</button>
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
            placeholder={t("eventOps.delegates.searchCompany")}
            className="w-full sm:w-72 ps-8 pe-3 h-9 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {byCompany.map(([company, rows]) => (
            <div key={company} className="bg-surface-card rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate"><Highlight text={company} query={companySearch} /></p>
                {rows.length > 0
                  ? <Badge label={t("eventOps.passes.passesCount", { count: rows.length })} color="blue" />
                  : <Badge label={t("eventOps.passes.noPassesYet")} color="gray" />}
              </div>
              {rows.length === 0 && (
                <button onClick={() => issueEntryPass(company)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors self-start">
                  {t("eventOps.passes.issueEntryPass")}
                </button>
              )}
              <div className="flex flex-col gap-2">
                {rows.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                    <QRCodeSVG value={`jobfair:pass:${p.code}`} size={44} fgColor="#111827" className="shrink-0 bg-white rounded p-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{p.delegate}</p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bidi-ltr">{p.code}</p>
                      {p.type === "Parking" && p.slot && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{t("eventOps.passes.slotLine", { slot: p.slot, location: p.location })}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge label={typeLabel(p.type)} color={p.type === "Parking" ? "yellow" : "blue"} />
                      <Badge label={translateEnum("passStatus", p.status)} color={statusColor(p.status)} />
                    </div>
                  </div>
                ))}
              </div>
              {rows.length > 0 && <p className="text-[10px] text-gray-400 dark:text-gray-500">{t("eventOps.passes.companyViewNote", { company })}</p>}
            </div>
          ))}
          {byCompany.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6 col-span-2">{t("eventOps.delegates.noCompanyMatch", { search: companySearch })}</p>}
        </div>
        </>
      )}
    </div>
  );
};


// ─── Tab definitions (operational modules only) ───────────────────────────────

// `labelKey` is looked up under eventOps.tabs.* at render time; `label` stays
// as the English fallback for any code path that doesn't have access to `t()`.
const OPERATIONS_TABS = [
  { id: "venue",        labelKey: "venue",        label: "Venue & Booths",        component: VenueMapping },
  { id: "banners",      labelKey: "banners",      label: "Banners & Branding",    component: BannerBranding },
  { id: "requirements", labelKey: "requirements", label: "Special Requirements",  component: SpecialRequirements },
  { id: "equipment",    labelKey: "equipment",    label: "Equipment & Logistics", component: EquipmentLogistics },
  { id: "delegates",    labelKey: "delegates",    label: "Delegate List",         component: DelegateList },
  { id: "attendance",   labelKey: "attendance",   label: "Attendance",            component: AttendanceCheckin },
  { id: "manageStaff",  labelKey: "manageStaff",  label: "Manage Staff",          component: ManageStaff },
  { id: "schedule",     labelKey: "schedule",     label: "Schedule",              component: ScheduleSlots },
  { id: "passes",       labelKey: "passes",       label: "Access Passes",         component: AccessPasses },
];

// ─── Main component: Event Operations ──────────────────────────────────────────
// Day-to-day modules each team member owns a slice of — split out of the
// original single EventSettings.jsx into this page plus EventAdmin.jsx
// (Post-Event Report, Customize, and the Team/ViewAs/Activity/Import panels).

const OPERATIONS_TAB_KEY = "event_ops_active_tab";

const SEEN_REQUESTS_KEY = "event_ops_seen_company_requests";

const EventOperations = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { data, employee, team, setActingAs, onPersistError } = useEventOps();
  const { notify } = useNotifications();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(OPERATIONS_TAB_KEY) || OPERATIONS_TABS[0].id);

  // Cross-account signal: notifications are per-account and client-side, so a
  // company's notify() never reaches CASTO. Instead CASTO detects new company
  // requests off the shared /event-ops data (which the provider polls every
  // 15s): any equipment row with requestedBy, or any requirement whose notes
  // say it was company-submitted, that we haven't recorded before fires a bell
  // notification once. Seen IDs persist so a reload doesn't re-alert.
  useEffect(() => {
    if (!data) return;
    const eqReqs = (data.equipment || []).filter((r) => r.requestedBy).map((r) => ({ key: `eq-${r.id}`, msg: `${r.requestedBy} requested ${r.qtyReq} × ${r.item}`, link: "equipment" }));
    const reqReqs = (data.requirements || []).filter((r) => r.notes === "Submitted by company").map((r) => ({ key: `req-${r.id}`, msg: `${r.company} requested: ${(r.description || "").slice(0, 50)}`, link: "requirements" }));
    const incoming = [...eqReqs, ...reqReqs];
    if (incoming.length === 0) return;

    let seen;
    try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_REQUESTS_KEY) || "[]")); }
    catch { seen = new Set(); }

    const fresh = incoming.filter((r) => !seen.has(r.key));
    if (fresh.length === 0) return;

    // On the very first load (nothing seen yet), record existing requests
    // silently so old ones don't all alert at once — only alert on genuinely
    // new arrivals after that.
    const firstRun = seen.size === 0;
    fresh.forEach((r) => {
      if (!firstRun) notify(r.msg, { type: "info", detail: "New company request — review in Event Operations", dedupeKey: r.key });
      seen.add(r.key);
    });
    try { localStorage.setItem(SEEN_REQUESTS_KEY, JSON.stringify([...seen])); } catch { /* quota */ }
  }, [data, notify]);

  // A save that looked instant (the edit applies optimistically to local
  // state) can still fail to reach the server — a dropped connection, an
  // expired session, a 403. Without this, that failure was invisible: the
  // booth/pass/etc. showed as saved in this tab but was never actually
  // written, so it silently reverted on the next reload or poll from
  // another tab. EventOpsContext retries automatically; this only surfaces
  // it if a save is still failing after that retry.
  useEffect(() => {
    onPersistError((err, sections) => {
      const status = err?.response?.status;
      const reason = status === 401 || status === 403 ? t("eventOps.main.reasonSignIn") : t("eventOps.main.reasonRetrying");
      toast(t("eventOps.main.toastSaveFailed", { sections: sections.join(", "), reason }), { type: "error" });
    });
  }, [onPersistError, toast, t]);

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
    <PageContainer user={user} title={t("eventOps.main.pageTitle")} collapsibleTopBar>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {/* Team view switcher — one CASTO account, one view per employee.
            Two stable zones: the member buttons wrap among themselves on the
            left; the status text + Admin link stay pinned right. Previously the
            variable-length status text ("<role> — changes recorded under
            <name>") sat inline between the buttons and an ml-auto Admin link,
            so switching to a member with a longer role reflowed the whole row
            and the bar appeared to "jump" (most visibly toggling to/from Rana,
            whose short role changed the wrap point). */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{t("eventOps.main.viewingAs")}</span>
            {team.map((m) => (
              <button
                key={m.id}
                onClick={() => setActingAs(m.id)}
                title={m.role}
                className={`flex items-center gap-1.5 rounded-full ps-1 pe-3 py-1 text-xs font-semibold border transition-all ${
                  employee.id === m.id
                    ? "bg-primary text-primary-contrast border-primary shadow-sm"
                    : "bg-surface-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500/40"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${employee.id === m.id ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {m.name[0]}
                </span>
                {m.name}
              </button>
            ))}
          </div>
          <a href="/event-admin" className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-colors shrink-0 mt-1">
            {t("eventOps.main.adminLink")}
          </a>
        </div>
        {/* Status line on its own row so its variable length can never reflow
            the member buttons above. */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1 shrink-0 hidden lg:block">
          {t("eventOps.main.recordedUnder", { role: employee.role, name: employee.name })}
        </p>

        {/* Tab bar — employee's modules first, marked with a dot. Uses the
            shared PillTabs (sliding-pill motion) so it matches every other tab
            bar in the app instead of an instant background swap. */}
        <div className="shrink-0 overflow-x-auto pb-1">
          <PillTabs
            tabs={orderedTabs}
            activeId={activeTab}
            onSelect={setActiveTab}
            renderInner={(tab, active) => {
              const mine = employee.focus?.includes(tab.id);
              return (
                <>
                  <TabIcon id={tab.id} />
                  <span>{t(`eventOps.tabs.${tab.labelKey}`)}</span>
                  {mine && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-primary"}`} title={t("eventOps.main.assignedTo", { name: employee.name })} />}
                </>
              );
            }}
          />
        </div>

        {/* Content — its own scroll area so every tab is fully reachable. Keyed
            on activeTab so switching modules fades the panel in (matching the
            company Status/Settings tab content transition). */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl">
          <div key={activeTab} className="bg-surface-card rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-panelIn">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default EventOperations;
