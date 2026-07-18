import { useState } from "react";
import { useTranslation } from "react-i18next";
import CompactSelect from "./CompactSelect";
import SectionCard from "./SectionCard";
import { useToast } from "./Toast";
import { useEventOps } from "../context/EventOpsContext";

// ── Company self-service request form ────────────────────────────────────────
// One redesigned form with a "Request type" selector. Companies can:
//   • Equipment — pick preset items (+ Other free text) with quantities, add
//     several at once. Lands in CASTO's Equipment tab as company-requested,
//     awaiting approval.
//   • Special requirement — free-form need (catering trucks, custom setup…).
//   • Parking note — a note to CASTO about parking needs (CASTO still issues
//     the actual parking pass/slot; this is the company flagging what they need).
// All go through the dedicated insert-only backend endpoint (submitCompanyRequest)
// so a company can only ever append its own rows. CASTO approves/fulfils.

// Each request type is a visual tile (icon + short label + one-line hint)
// instead of a plain dropdown, so choosing what to ask for is a glanceable,
// low-text decision. Labels/hints are translated at render time by `value`.
const REQUEST_TYPES = [
    {
        value: "equipment",
        // desk/booth
        icon: "M4 6h16M4 6v12M20 6v12M4 18h16M8 10h8M8 14h5",
    },
    {
        value: "requirement",
        // sparkle / star
        icon: "M11.48 3.5a.56.56 0 011.04 0l2.12 5.11a.56.56 0 00.48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.38a.56.56 0 01-.84.61l-4.72-2.88a.56.56 0 00-.59 0l-4.72 2.88a.56.56 0 01-.84-.61l1.28-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.48-.35L11.48 3.5z",
    },
    {
        value: "parking",
        // pin
        icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
    },
];

// Common booth items companies ask for. "Other" reveals a free-text field so
// anything unusual is still possible while keeping the frequent ones consistent.
// Values stay English (they are stored/read by CASTO); labels are translated.
const EQUIPMENT_ITEMS = [
    "Folding Table", "Chair", "Power socket / strip", "Extension cable",
    "Monitor / Screen", "Standing banner stand", "Whiteboard / Flip chart",
    "Wi-Fi / Internet", "Other",
];

const blankItem = () => ({ id: Date.now() + Math.random(), item: "", other: "", qty: 1 });

const inputCls =
    "border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary w-full";

export default function CompanyRequestForm({ existingRequests = [] }) {
    const { t } = useTranslation();
    const { submitCompanyRequest } = useEventOps();
    const toast = useToast();

    const [type, setType] = useState("equipment");
    const [items, setItems] = useState([blankItem()]);
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const resolvedItems = items
        .map((r) => ({ item: (r.item === "Other" ? r.other : r.item).trim(), qty: Math.max(1, Number(r.qty) || 1) }))
        .filter((r) => r.item);

    const canSubmit =
        type === "equipment" ? resolvedItems.length > 0 : description.trim().length > 0;

    const reset = () => {
        setItems([blankItem()]);
        setCategory("");
        setDescription("");
    };

    const submit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        try {
            const payload =
                type === "equipment"
                    ? { kind: "equipment", items: resolvedItems }
                    : { kind: type, description: description.trim(), category: category.trim() };
            await submitCompanyRequest(payload);
            reset();
            setDone(true);
            toast(t("requests.toasts.sent"), { type: "success" });
            setTimeout(() => setDone(false), 4000);
        } catch (err) {
            toast(err?.response?.data?.error || t("requests.toasts.failed"), { type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const setItemField = (id, field, value) =>
        setItems((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    const addItemRow = () => setItems((rows) => [...rows, blankItem()]);
    const removeItemRow = (id) =>
        setItems((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));

    const selectedLabel = t(`requests.types.${type}.label`);
    // Item value stays English (stored/read by CASTO); label is translated.
    const itemOptions = EQUIPMENT_ITEMS.map((it) => ({ value: it, label: t(`requests.items.${it}`, { defaultValue: it }) }));

    return (
        <div className="flex flex-col gap-3">
            <SectionCard title={t("requests.formTitle")}>
            <div className="flex flex-col gap-4">
                {/* Request type — visual tiles instead of a dropdown */}
                <div className="grid grid-cols-3 gap-2">
                    {REQUEST_TYPES.map((rt) => {
                        const active = type === rt.value;
                        return (
                            <button
                                key={rt.value}
                                type="button"
                                onClick={() => setType(rt.value)}
                                className={`flex flex-col items-center text-center gap-1.5 rounded-xl border p-3 transition-all ${
                                    active
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? "bg-primary text-primary-contrast" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                                    <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={rt.icon} /></svg>
                                </span>
                                <span className={`text-xs font-bold ${active ? "text-primary" : "text-gray-700 dark:text-gray-300"}`}>{t(`requests.types.${rt.value}.label`)}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-400 leading-tight hidden sm:block">{t(`requests.types.${rt.value}.hint`)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Type-specific fields — keyed so switching type fades the block in */}
                <div key={type} className="flex flex-col gap-3.5 animate-panelIn">
                {/* Equipment: item rows */}
                {type === "equipment" && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 6v12M20 6v12M4 18h16" /></svg>
                            {t("requests.equipment.whatNeed")}
                        </div>
                        {items.map((row) => (
                            <div key={row.id} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <div className="flex-1 min-w-0">
                                    <CompactSelect
                                        value={row.item}
                                        onChange={(e) => setItemField(row.id, "item", e.target.value)}
                                        options={itemOptions}
                                        placeholder={t("requests.equipment.chooseItem")}
                                    />
                                </div>
                                {row.item === "Other" && (
                                    <input
                                        value={row.other}
                                        onChange={(e) => setItemField(row.id, "other", e.target.value)}
                                        placeholder={t("requests.equipment.describeItem")}
                                        className={`${inputCls} sm:w-44`}
                                    />
                                )}
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number"
                                        min="1"
                                        value={row.qty}
                                        onChange={(e) => setItemField(row.id, "qty", e.target.value)}
                                        className={`${inputCls} w-16 text-center`}
                                        aria-label={t("requests.equipment.quantity")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeItemRow(row.id)}
                                        disabled={items.length === 1}
                                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-300 text-lg leading-none px-1"
                                        aria-label={t("requests.equipment.removeItem")}
                                        title={t("requests.equipment.removeItem")}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addItemRow}
                            className="self-start text-[11px] font-semibold text-primary hover:underline mt-0.5"
                        >
                            {t("requests.equipment.addAnother")}
                        </button>
                        <div className="flex flex-col gap-1 mt-1">
                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("requests.equipment.noteLabel")}</label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t("requests.equipment.notePlaceholder")}
                                className={inputCls}
                            />
                        </div>
                    </div>
                )}

                {/* Special requirement */}
                {type === "requirement" && (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("requests.requirement.categoryLabel")}</label>
                            <input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder={t("requests.requirement.categoryPlaceholder")}
                                className={inputCls}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("requests.requirement.describeLabel")}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder={t("requests.requirement.describePlaceholder")}
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </>
                )}

                {/* Parking note */}
                {type === "parking" && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("requests.parking.needsLabel")}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder={t("requests.parking.needsPlaceholder")}
                            className={`${inputCls} resize-none`}
                        />
                        <p className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-400">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {t("requests.parking.hint")}
                        </p>
                    </div>
                )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-400">
                        {type === "equipment"
                            ? t("requests.itemsReady", { count: resolvedItems.length })
                            : selectedLabel}
                    </span>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!canSubmit || submitting}
                        className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-2 bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                        {submitting ? t("requests.submitting") : t("requests.submit")}
                    </button>
                </div>

                {done && (
                    <p className="text-xs text-green-600 dark:text-green-300 -mt-1">{t("requests.doneMessage")}</p>
                )}
            </div>
            </SectionCard>

            {/* Existing requests recap — its own card, matching the Event Day layout */}
            {existingRequests.length > 0 && (
                <SectionCard title={t("requests.currentTitle")}>
                    <div className="flex flex-col gap-1.5">
                        {existingRequests.map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{r.label}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${r.tone}`}>{r.status}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
