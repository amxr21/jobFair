import i18n from "./index";

// Translates a stored enum VALUE (which is always the English/DB canonical form,
// e.g. "Dubai", "Confirmed", "Private") to the active language. Falls back to
// the raw value if there's no translation, so unknown/legacy values still show.
// Use for city/sector/status and any other fixed-option field rendered to users.
export const translateEnum = (group, value) => {
    if (value == null || value === "") return value;
    const key = `enums.${group}.${value}`;
    const translated = i18n.t(key);
    return translated === key ? value : translated;
};

export const tCity = (v) => translateEnum("city", v);
export const tSector = (v) => translateEnum("sector", v);
export const tStatus = (v) => translateEnum("status", v);
export const tIndustryField = (v) => translateEnum("industryField", v);
export const tMajor = (v) => translateEnum("major", v);
