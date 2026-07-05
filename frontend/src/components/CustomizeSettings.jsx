import { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { FONT_OPTIONS, SIZE_OPTIONS, getSavedCustomization, applyCustomization, saveCustomization } from "../utils/customization";

// Per-user font/text-size preference — shared between EventSettings.jsx
// (CASTO) and CompanyStatus.jsx (companies), since the underlying mechanism
// (utils/customization.js) is already account-agnostic.
const CustomizeSettings = () => {
  const { user } = useAuthContext();
  const [fontId, setFontId] = useState(() => getSavedCustomization(user).fontId);
  const [sizeId, setSizeId] = useState(() => getSavedCustomization(user).sizeId);

  const choose = (nextFontId, nextSizeId) => {
    setFontId(nextFontId);
    setSizeId(nextSizeId);
    applyCustomization(nextFontId, nextSizeId);
    saveCustomization(user, nextFontId, nextSizeId);
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Font</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => choose(f.id, sizeId)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                fontId === f.id ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 mb-1">{f.label}</p>
              <p className="text-base text-gray-800" style={{ fontFamily: f.stack }}>Aa Bb Cc</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Text size</p>
        <div className="grid grid-cols-3 gap-2.5">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => choose(fontId, s.id)}
              className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-colors ${
                sizeId === s.id ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-bold text-gray-800" style={{ fontSize: s.px }}>Aa</span>
              <span className="text-xs font-semibold text-gray-500">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        Applies across the whole dashboard on this browser, for your account only.
      </p>
    </div>
  );
};

export default CustomizeSettings;
