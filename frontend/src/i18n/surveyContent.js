import i18n from "./index";

// ── Predefined-survey content translation ─────────────────────────────────────
// The survey questions/options are HARD-CODED constants (they don't come from a
// user), so their DISPLAY should be translated. BUT the English strings double as
// data keys: option labels are stored verbatim as a company's answer and the
// aggregation logic in QuestionsContainer matches those stored answers against the
// canonical English `options`, while responses are keyed by the English question
// `text`. So we translate for DISPLAY ONLY and always keep the canonical English
// value flowing through the data path. Each helper falls back to the English
// original when a key is missing, so nothing ever renders blank.

// Question display text, looked up by its stable id (q1..q22).
export const tSurveyQuestion = (id, fallback = "") => {
    if (!id) return fallback;
    const key = `surveyQuestions.questions.${id}`;
    const translated = i18n.t(key);
    return translated === key ? fallback : translated;
};

// Fixed multiple-choice option label, looked up by its canonical English value.
export const tSurveyOption = (value) => {
    if (value == null || value === "") return value;
    const key = `surveyQuestions.options.${value}`;
    const translated = i18n.t(key);
    return translated === key ? value : translated;
};

// Part title (e.g. "Part 1: Event Experience"), looked up by canonical English.
export const tSurveyPart = (title) => {
    if (!title) return title;
    const key = `surveyQuestions.parts.${title}`;
    const translated = i18n.t(key);
    return translated === key ? title : translated;
};

// Section title (e.g. "Organization & Logistics"), looked up by canonical English.
export const tSurveySection = (title) => {
    if (!title) return title;
    const key = `surveyQuestions.sections.${title}`;
    const translated = i18n.t(key);
    return translated === key ? title : translated;
};
