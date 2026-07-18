import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import * as XLSX from "xlsx";
import Modal from "./Modal";
import { CircularProgress } from "@mui/material";

const TEMPLATE_COLUMNS = [
    "companyName", "email", "representatives", "fields",
    "sector", "city", "noOfPositions", "preferredMajors", "opportunityTypes", "preferredQualities",
];

const REQUIRED_COLUMNS = ["companyName", "email", "representatives", "fields"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SECTORS = ["Private", "Semi", "Local", "Federal"];

// Same algorithm as backend/controllers/userController.js's levenshteinDistance
// — kept as a small local copy so duplicate-name checks run instantly
// client-side against the already-fetched company list, instead of one
// network round-trip per row for a bulk import of dozens of rows.
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = str1[i - 1] === str2[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// Mirrors checkSimilarCompanyName's exact thresholds (backend/controllers/userController.js)
function isSimilarName(a, b) {
    const na = a.toLowerCase().trim();
    const nb = b.toLowerCase().trim();
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;

    const aWords = na.split(/\s+/).filter((w) => w.length > 2);
    const bWords = nb.split(/\s+/).filter((w) => w.length > 2);
    if (aWords.length > 0 && bWords.length > 0) {
        const matching = aWords.filter((aw) =>
            bWords.some((bw) => bw.includes(aw) || aw.includes(bw) || (aw.length > 3 && bw.length > 3 && levenshteinDistance(aw, bw) <= 2))
        );
        if (matching.length / Math.max(aWords.length, bWords.length) >= 0.5) return true;
    }

    if (na.length > 5 && nb.length > 5) {
        const distance = levenshteinDistance(na, nb);
        const similarity = 1 - distance / Math.max(na.length, nb.length);
        if (similarity >= 0.7) return true;
    }
    return false;
}

function normalizeHeader(h) {
    return String(h || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES = {
    companyname: "companyName", company: "companyName", name: "companyName",
    email: "email",
    representatives: "representatives", representative: "representatives", representitives: "representatives",
    fields: "fields", field: "fields",
    sector: "sector",
    city: "city",
    noofpositions: "noOfPositions", positions: "noOfPositions",
    preferredmajors: "preferredMajors", majors: "preferredMajors",
    opportunitytypes: "opportunityTypes", opportunities: "opportunityTypes",
    preferredqualities: "preferredQualities", qualities: "preferredQualities",
};

// Errors are structured (i18n key + params) rather than pre-built strings so
// the preview table can translate them for whichever language is active,
// same pattern as the EventOps activity log.
function normalizeRow(rawRow, rowIndex) {
    const data = {};
    for (const key of Object.keys(rawRow)) {
        const normalized = HEADER_ALIASES[normalizeHeader(key)];
        if (normalized) data[normalized] = String(rawRow[key] ?? "").trim();
    }

    const errors = [];
    for (const col of REQUIRED_COLUMNS) {
        if (!data[col]) errors.push({ key: "importCompanies.errors.missingColumn", params: { column: col } });
    }
    if (data.email && !EMAIL_RE.test(data.email)) errors.push({ key: "importCompanies.errors.invalidEmail" });
    if (data.sector && !VALID_SECTORS.includes(data.sector)) errors.push({ key: "importCompanies.errors.invalidSector", params: { sectors: VALID_SECTORS.join(", ") } });

    return { rowIndex, data, errors };
}

function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
        {
            companyName: "Acme Corp", email: "contact@acme.com", representatives: "Jane Doe", fields: "Technology",
            sector: "Private", city: "Sharjah", noOfPositions: "1-5", preferredMajors: "", opportunityTypes: "", preferredQualities: "",
        },
    ], { header: TEMPLATE_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "companies-import-template.xlsx");
}

const ImportCompaniesModal = ({ visible, onClose, link, user, onImported }) => {
    const { t } = useTranslation();
    const [stage, setStage] = useState("select"); // select | preview | conflicts | done
    const [parsedRows, setParsedRows] = useState([]);
    const [existingCompanies, setExistingCompanies] = useState([]);
    const [conflictActions, setConflictActions] = useState({}); // rowIndex -> "create" | "update" | "skip"
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [fileError, setFileError] = useState(null);

    useEffect(() => {
        if (!visible) return;
        setStage("select");
        setParsedRows([]);
        setConflictActions({});
        setResults(null);
        setFileError(null);
        // Fetch a fresh companies list every time the modal opens so duplicate
        // detection is always current, independent of any other page's fetch timing.
        axios.get(`${link}/companies`).then((res) => {
            if (Array.isArray(res?.data)) setExistingCompanies(res.data);
        }).catch(() => { /* duplicate detection just won't have data to compare against */ });
    }, [visible, link]);

    const conflicts = useMemo(() => {
        return parsedRows
            .filter((r) => r.errors.length === 0)
            .map((r) => {
                const emailMatch = existingCompanies.find((c) => c.email?.toLowerCase() === r.data.email.toLowerCase());
                const nameMatch = !emailMatch && existingCompanies.find((c) => isSimilarName(c.companyName || "", r.data.companyName));
                const match = emailMatch || nameMatch;
                return match ? { ...r, matchedCompany: match, matchType: emailMatch ? "email" : "name" } : null;
            })
            .filter(Boolean);
    }, [parsedRows, existingCompanies]);

    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    const errorRows = parsedRows.filter((r) => r.errors.length > 0);

    const handleFile = async (file) => {
        setFileError(null);
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (!raw.length) {
                setFileError(t("importCompanies.errors.noRows"));
                return;
            }
            setParsedRows(raw.map((r, i) => normalizeRow(r, i + 1)));
            setStage("preview");
        } catch {
            setFileError(t("importCompanies.errors.readFailed"));
        }
    };

    const goToConflictsOrSubmit = () => {
        if (conflicts.length > 0) {
            setStage("conflicts");
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = validRows.map((r) => {
                const conflict = conflicts.find((c) => c.rowIndex === r.rowIndex);
                const action = conflict ? (conflictActions[r.rowIndex] || "create") : "create";
                return {
                    rowIndex: r.rowIndex,
                    action,
                    data: r.data,
                    existingCompanyId: conflict?.matchedCompany?.id || null,
                };
            });
            const res = await axios.post(`${link}/companies/bulk-import`, { rows: payload }, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setResults(res.data.results);
            setStage("done");
            onImported?.();
        } catch (error) {
            setResults([{ rowIndex: "-", companyName: t("importCompanies.results.requestFailed"), status: "error", error: error.response?.data?.error || error.message }]);
            setStage("done");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} onClose={onClose} maxWidth="max-w-3xl" contentClassName="max-h-[85vh]">
            <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-bold">{t("importCompanies.title")}</h2>
                    <p className="text-xs text-white/80 mt-0.5">
                        {stage === "select" && t("importCompanies.subtitleSelect")}
                        {stage === "preview" && t("importCompanies.subtitlePreview", { count: validRows.length, errorCount: errorRows.length })}
                        {stage === "conflicts" && t("importCompanies.subtitleConflicts", { count: conflicts.length })}
                        {stage === "done" && t("importCompanies.subtitleDone")}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label={t("importCompanies.close")}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 min-h-0">
                {stage === "select" && (
                    <div className="flex flex-col gap-4">
                        <button onClick={downloadTemplate} className="self-start text-xs font-semibold text-[#0E7F41] border border-[#0E7F41] rounded-lg px-3 py-1.5 hover:bg-[#0E7F41]/5 transition-colors">
                            {t("importCompanies.downloadTemplate")}
                        </button>
                        <label className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer hover:border-green-400 transition-colors">
                            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t("importCompanies.clickToChoose")}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{t("importCompanies.acceptedFormats", { columns: REQUIRED_COLUMNS.join(", ") })}</p>
                            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
                        </label>
                        {fileError && <p className="text-xs text-red-600 dark:text-red-400">{fileError}</p>}
                    </div>
                )}

                {stage === "preview" && (
                    <div className="flex flex-col gap-3">
                        <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-2 py-1.5 text-start">{t("importCompanies.table.row")}</th>
                                        <th className="px-2 py-1.5 text-start">{t("importCompanies.table.company")}</th>
                                        <th className="px-2 py-1.5 text-start">{t("importCompanies.table.email")}</th>
                                        <th className="px-2 py-1.5 text-start">{t("importCompanies.table.status")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.map((r) => (
                                        <tr key={r.rowIndex} className="border-t border-gray-100 dark:border-gray-700">
                                            <td className="px-2 py-1.5 text-gray-400 dark:text-gray-500">{r.rowIndex}</td>
                                            <td className="px-2 py-1.5 text-fg" dir="auto">{r.data.companyName || "—"}</td>
                                            <td className="px-2 py-1.5 text-fg bidi-ltr">{r.data.email || "—"}</td>
                                            <td className="px-2 py-1.5">
                                                {r.errors.length === 0
                                                    ? <span className="text-green-600 dark:text-emerald-400 font-medium">{t("importCompanies.table.valid")}</span>
                                                    : <span className="text-red-600 dark:text-red-400">{r.errors.map((e) => t(e.key, e.params)).join("; ")}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t("importCompanies.table.errorRowsNote")}</p>
                    </div>
                )}

                {stage === "conflicts" && (
                    <div className="flex flex-col gap-2.5">
                        {conflicts.map((c) => (
                            <div key={c.rowIndex} className="border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 flex flex-col gap-1.5">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("importCompanies.conflicts.rowLabel", { rowIndex: c.rowIndex })} <span className="text-gray-800 dark:text-gray-100" dir="auto">{c.data.companyName}</span> {t("importCompanies.conflicts.matchesExisting")} <span className="text-gray-800 dark:text-gray-100" dir="auto">{c.matchedCompany.companyName}</span> ({c.matchType === "email" ? t("importCompanies.conflicts.sameEmail") : t("importCompanies.conflicts.similarName")})
                                </p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input type="radio" name={`conflict-${c.rowIndex}`}
                                            checked={(conflictActions[c.rowIndex] || "update") === "update"}
                                            onChange={() => setConflictActions((prev) => ({ ...prev, [c.rowIndex]: "update" }))} />
                                        {t("importCompanies.conflicts.updateExisting")}
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input type="radio" name={`conflict-${c.rowIndex}`}
                                            checked={conflictActions[c.rowIndex] === "skip"}
                                            onChange={() => setConflictActions((prev) => ({ ...prev, [c.rowIndex]: "skip" }))} />
                                        {t("importCompanies.conflicts.keepExisting")}
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {stage === "done" && results && (
                    <div className="flex flex-col gap-1.5">
                        {results.map((r, i) => (
                            <div key={i} className={`text-xs rounded-lg px-3 py-2 ${
                                r.status === "error" ? "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300" : r.status === "skipped" ? "bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400" : "bg-green-50 dark:bg-primary/15 text-green-700 dark:text-emerald-300"
                            }`}>
                                <span className="font-semibold" dir="auto">{r.companyName}</span> — {t(`importCompanies.results.status.${r.status}`, r.status)}
                                {r.status === "error" && `: ${r.error}`}
                                {r.status === "created" && r.tempPassword && ` ${t("importCompanies.results.tempPassword", { password: r.tempPassword })}`}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {stage === "done" ? t("importCompanies.buttons.done") : t("importCompanies.buttons.cancel")}
                </button>
                {stage === "preview" && (
                    <button onClick={goToConflictsOrSubmit} disabled={validRows.length === 0}
                        className="px-5 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t("importCompanies.buttons.continue", { count: validRows.length })}
                    </button>
                )}
                {stage === "conflicts" && (
                    <button onClick={handleSubmit} disabled={isSubmitting}
                        className="px-5 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? <><CircularProgress size={14} sx={{ color: "white" }} />{t("importCompanies.buttons.importing")}</> : t("importCompanies.buttons.import")}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ImportCompaniesModal;
