import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../hooks/useAuthContext";
import { FONT_OPTIONS, SIZE_OPTIONS, getSavedCustomization, applyCustomization, saveCustomization } from "../utils/customization";

// Per-user font/text-size preference — shared between EventSettings.jsx
// (CASTO) and CompanyStatus.jsx (companies), since the underlying mechanism
// (utils/customization.js) is already account-agnostic.
const CustomizeSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [fontId, setFontId] = useState(() => getSavedCustomization(user).fontId);
  const [sizeId, setSizeId] = useState(() => getSavedCustomization(user).sizeId);

  const choose = (nextFontId, nextSizeId) => {
    setFontId(nextFontId);
    setSizeId(nextSizeId);
    applyCustomization(nextFontId, nextSizeId);
    saveCustomization(user, nextFontId, nextSizeId);
  };

  // Font family names (Inter, System) stay as-is; only translatable labels are
  // looked up. Size labels are translated by id.
  const fontLabel = (f) => t(`settings.appearance.fonts.${f.id}`, { defaultValue: f.label });
  const sizeLabel = (s) => t(`settings.appearance.sizes.${s.id}`, { defaultValue: s.label });

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-3">{t("settings.appearance.font")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => choose(f.id, sizeId)}
              className={`rounded-xl border p-3 text-start transition-colors ${
                fontId === f.id ? "border-green-400 bg-green-50 dark:border-primary dark:bg-primary/15" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{fontLabel(f)}</p>
              <p className="text-base text-gray-800 dark:text-gray-100" style={{ fontFamily: f.stack }}>Aa Bb Cc</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-3">{t("settings.appearance.textSize")}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => choose(fontId, s.id)}
              className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-colors ${
                sizeId === s.id ? "border-green-400 bg-green-50 dark:border-primary dark:bg-primary/15" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="font-bold text-gray-800 dark:text-gray-100" style={{ fontSize: s.px }}>Aa</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{sizeLabel(s)}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-400">
        {t("settings.appearance.scopeNote")}
      </p>
    </div>
  );
};

export default CustomizeSettings;
