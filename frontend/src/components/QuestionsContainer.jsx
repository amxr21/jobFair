import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { SurveyContext } from "../context/SurveyContext";
import { useAuthContext } from "../hooks/useAuthContext";
import { API_URL as link } from "../config/api";
import CompactSelect from "./CompactSelect";

// ─── Survey definition (must match the live survey exactly) ────────────────────

const SURVEY_PARTS = [
  {
    title: "Part 1: Event Experience",
    sections: [
      {
        title: "Organization & Logistics",
        questions: [
          { id: "q1", text: "How would you rate the overall organization of the event?", type: "multiple_choice", options: ["Good", "Fair", "Poor"] },
          { id: "q2", text: "How would you rate the pre-event communication and coordination?", type: "multiple_choice", options: ["Good", "Fair", "Poor"] },
          { id: "q3", text: "How was your experience with parking and on-campus access?", type: "multiple_choice", options: ["Smooth", "Manageable", "Difficult"] },
          { id: "q4", text: "How would you rate the event location (Main Building, M11) in terms of accessibility and visibility?", type: "multiple_choice", options: ["Good", "Fair", "Poor"] },
          { id: "q5", text: "Was your booth setup ready and satisfactory upon arrival?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q6", text: "How would you rate the support provided by the organizers during the event?", type: "multiple_choice", options: ["Helpful", "Available when needed", "Unavailable"] },
        ],
      },
      {
        title: "Student Interaction & Portal Experience",
        questions: [
          { id: "q7", text: "Were the students well-prepared to engage with you?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q8", text: "Did the online portal support your recruitment efforts effectively?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q9", text: "Were the student profiles/resumes accessible and useful via the portal?", type: "multiple_choice", options: ["Yes", "Neutral", "No"] },
          { id: "q10", text: "Are you in favor of continuing the paperless approach for future fairs?", type: "multiple_choice", options: ["Yes", "Maybe", "No"] },
          { id: "q11", text: "Would you participate in our future career events?", type: "multiple_choice", options: ["Yes", "Maybe", "No"] },
          { id: "q12", text: "Any suggestions or advice to improve the quality of the fair?", type: "open_ended" },
        ],
      },
    ],
  },
  {
    title: "Part 2: Recruitment & Follow-Up",
    sections: [
      {
        title: "Applications & Hiring",
        questions: [
          { id: "q13", text: "Have you reviewed the applications and profiles submitted via our portal?", type: "multiple_choice", options: ["Yes", "In progress", "Not yet"] },
          { id: "q14", text: "Based on your review, how would you rate the overall quality of student applicants?", type: "multiple_choice", options: ["Good", "Fair", "Poor"] },
          { id: "q15", text: "Did you find candidates that match your internship or job requirements?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q16", text: "Were the student resumes/profiles complete and easy to understand in the portal?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q17", text: "Was the portal helpful in managing and filtering applicants post-event?", type: "multiple_choice", options: ["Yes", "Somewhat", "No"] },
          { id: "q18", text: "Are you planning to follow up with any UoS students for internships/jobs?", type: "multiple_choice", options: ["Yes", "No", "Still deciding"] },
          { id: "q19", text: "Did you hire or shortlist any students from the fair?", type: "multiple_choice", options: ["Yes", "No", "Still deciding"] },
          { id: "q20", text: "If yes, how many students did you hire (internship or full-time)?", type: "numeric" },
          { id: "q21", text: "If yes, how many students did you shortlist for next steps/interviews?", type: "numeric" },
          { id: "q22", text: "Any other feedback or suggestions for improvement?", type: "open_ended" },
        ],
      },
    ],
  },
];

const ALL_QUESTIONS = SURVEY_PARTS.flatMap((p) => p.sections.flatMap((s) => s.questions));

// Options are ordered positive → negative in every question, so a fixed
// positive/neutral/negative palette reads correctly everywhere
const OPTION_COLORS = ["#0E7F41", "#EBC600", "#CC0000"];

// ─── Building blocks ───────────────────────────────────────────────────────────

const StatTile = ({ label, value, sub, color = "#0E7F41" }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 min-w-0">
    <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
    <p className="text-2xl font-bold truncate" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
  </div>
);

const ResponseDonut = ({ responded, total }) => {
  const pct = total > 0 ? responded / total : 0;
  const R = 42, C = 2 * Math.PI * R;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0 -rotate-90">
        <circle cx="48" cy="48" r={R} fill="none" stroke="#eef1f6" strokeWidth="10" />
        <circle cx="48" cy="48" r={R} fill="none" stroke="#0E7F41" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800">{Math.round(pct * 100)}%</p>
        <p className="text-xs text-gray-500 font-medium">Response rate</p>
        <p className="text-xs text-gray-400 mt-0.5">{responded} of {total} companies answered</p>
      </div>
    </div>
  );
};

const DistributionBars = ({ options, counts, total }) => (
  <div className="flex flex-col gap-2">
    {options.map((opt, i) => {
      const count = counts[opt] || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return (
        <div key={opt} className="flex items-center gap-2">
          <span className="w-40 text-xs text-gray-600 truncate shrink-0" title={opt}>{opt}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: OPTION_COLORS[i] || "#9ca3af" }} />
          </div>
          <span className="w-14 text-right text-xs text-gray-500 tabular-nums shrink-0">
            <span className="font-semibold text-gray-700">{count}</span> · {pct}%
          </span>
        </div>
      );
    })}
  </div>
);

const QuestionCard = ({ index, question, agg, respondedCount }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 min-w-0">
    <div className="flex items-start gap-2">
      <span className="w-6 h-6 rounded-lg bg-[#0E7F41]/10 text-[#0E7F41] text-[11px] font-bold flex items-center justify-center shrink-0">{index}</span>
      <p className="text-xs font-semibold text-gray-700 leading-snug">{question.text}</p>
    </div>

    {question.type === "multiple_choice" && (
      <DistributionBars options={question.options} counts={agg.counts} total={agg.answered} />
    )}

    {question.type === "numeric" && (
      <div className="flex items-center gap-6">
        <div>
          <p className="text-2xl font-bold text-[#0E7F41]">{agg.numeric.reduce((a, n) => a + n.value, 0)}</p>
          <p className="text-xs text-gray-400">Total reported</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#2959A6]">
            {agg.numeric.length ? (agg.numeric.reduce((a, n) => a + n.value, 0) / agg.numeric.length).toFixed(1) : "0"}
          </p>
          <p className="text-xs text-gray-400">Average per company</p>
        </div>
        <div className="flex flex-wrap gap-1 ml-auto max-w-[45%]">
          {agg.numeric.map((n) => (
            <span key={n.company} title={n.company} className="text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {n.company.split(" ")[0]}: <b>{n.value}</b>
            </span>
          ))}
        </div>
      </div>
    )}

    {question.type === "open_ended" && (
      <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
        {agg.answers.length === 0 && <p className="text-xs text-gray-400">No written answers yet</p>}
        {agg.answers.map((a, i) => (
          <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-600 leading-relaxed">“{a.text}”</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">— {a.company}</p>
          </div>
        ))}
      </div>
    )}

    <p className="text-[10px] text-gray-300 mt-auto">
      {question.type === "open_ended" ? `${agg.answers.length}` : question.type === "numeric" ? `${agg.numeric.length}` : `${agg.answered}`} of {respondedCount} respondents
    </p>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────

const QuestionsContainer = () => {
  const { user } = useAuthContext();
  const { setAllResponses } = useContext(SurveyContext);

  const [companies, setCompanies] = useState([]);
  const [mode, setMode] = useState("summary");
  const [part, setPart] = useState(0);
  const [detailIdx, setDetailIdx] = useState(0);

  const [surveyPublic, setSurveyPublic] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${link}/settings`);
        if (res?.data) setSurveyPublic(res.data.surveyPublic);
      } catch { /* ignore */ }
      try {
        const res = await axios.get(`${link}/companies`);
        if (Array.isArray(res?.data)) {
          setCompanies(res.data);
          setAllResponses(res.data.map((c) => ({ name: c.companyName, results: c.surveyResult })));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const toggleSurveyVisibility = async () => {
    if (!user?.token) return;
    setIsTogglingVisibility(true);
    try {
      const res = await axios.patch(
        `${link}/settings`,
        { key: "surveyPublic", value: !surveyPublic },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (res?.data) setSurveyPublic(!surveyPublic);
    } catch (e) {
      console.error("Error toggling survey visibility:", e);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Invited companies (everyone except the CASTO office itself)
  const invited = useMemo(() => companies.filter((c) => c.companyName !== "CASTO Office"), [companies]);
  const responders = useMemo(() => invited.filter((c) => c.surveyResult?.length > 0), [invited]);
  const pending = useMemo(() => invited.filter((c) => !c.surveyResult?.length), [invited]);

  // One aggregate per question: option counts, numeric values, open answers
  const aggregates = useMemo(() => {
    const map = {};
    ALL_QUESTIONS.forEach((q) => {
      map[q.text] = { counts: {}, answered: 0, numeric: [], answers: [] };
    });
    responders.forEach((comp) => {
      comp.surveyResult.forEach((answerSet) => {
        if (!Array.isArray(answerSet)) return;
        answerSet.forEach((a) => {
          const agg = map[a.text];
          const q = ALL_QUESTIONS.find((qq) => qq.text === a.text);
          if (!agg || !q || a.responses === "" || a.responses == null) return;
          if (q.type === "multiple_choice") {
            if (q.options.includes(a.responses)) {
              agg.counts[a.responses] = (agg.counts[a.responses] || 0) + 1;
              agg.answered++;
            }
          } else if (q.type === "numeric") {
            const n = parseFloat(a.responses);
            if (!isNaN(n)) agg.numeric.push({ company: comp.companyName, value: n });
          } else {
            if (String(a.responses).trim()) agg.answers.push({ company: comp.companyName, text: a.responses });
          }
        });
      });
    });
    return map;
  }, [responders]);

  const totalHired = aggregates[ALL_QUESTIONS.find((q) => q.id === "q20").text]?.numeric.reduce((a, n) => a + n.value, 0) || 0;
  const totalShortlisted = aggregates[ALL_QUESTIONS.find((q) => q.id === "q21").text]?.numeric.reduce((a, n) => a + n.value, 0) || 0;

  // Sentiment-at-a-glance per section — options are always ordered
  // positive -> negative, so "first option chosen" is a fast health proxy.
  // Lets an admin spot a struggling section before reading every card.
  const sectionSentiment = useMemo(() => {
    const out = {};
    SURVEY_PARTS.forEach((part) => {
      part.sections.forEach((section) => {
        const mcQuestions = section.questions.filter((q) => q.type === "multiple_choice");
        let positive = 0, total = 0;
        mcQuestions.forEach((q) => {
          const agg = aggregates[q.text];
          if (!agg) return;
          positive += agg.counts[q.options[0]] || 0;
          total += agg.answered;
        });
        out[section.title] = total > 0 ? Math.round((positive / total) * 100) : null;
      });
    });
    return out;
  }, [aggregates]);

  // Details mode: the selected company's flat answers
  const detailCompany = responders[detailIdx] || null;
  const detailAnswers = useMemo(() => {
    if (!detailCompany) return {};
    const flat = {};
    detailCompany.surveyResult.forEach((set) => {
      if (Array.isArray(set)) set.forEach((a) => { flat[a.text] = a.responses; });
    });
    return flat;
  }, [detailCompany]);

  const numberFor = (() => { const m = {}; let n = 0; ALL_QUESTIONS.forEach((q) => { m[q.id] = ++n; }); return m; })();

  const PartTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
      {SURVEY_PARTS.map((p, i) => (
        <button key={i} onClick={() => setPart(i)}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${part === i ? "bg-[#0E7F41] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          {p.title}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 flex-1 h-full overflow-hidden p-3 md:p-0">
      {/* Mode switch + visibility toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
          {[["summary", "Summary"], ["details", "By Company"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${mode === m ? "bg-[#0E7F41] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {user?.email === "casto@sharjah.ac.ae" && (
          <div className="flex items-center gap-2 md:gap-3 bg-white rounded-xl px-3 md:px-4 py-2 border shadow-sm">
            <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">Survey:</span>
            <button
              onClick={toggleSurveyVisibility}
              disabled={isTogglingVisibility}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0E7F41] focus:ring-offset-2 ${
                surveyPublic ? "bg-[#0E7F41]" : "bg-gray-300"
              } ${isTogglingVisibility ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${surveyPublic ? "left-[1.375rem]" : "left-0.5"}`} />
            </button>
            <span className={`text-xs md:text-sm font-medium ${surveyPublic ? "text-[#0E7F41]" : "text-gray-500"}`}>
              {surveyPublic ? "Public" : "Hidden"}
            </span>
          </div>
        )}
      </div>

      <div className="bg-[#F3F6FF] flex-1 rounded-xl overflow-y-auto min-h-0">
        <div className="flex flex-col gap-4 p-3 md:p-5">

          {mode === "summary" && (
            <>
              {/* Headline stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="col-span-2 lg:col-span-2"><ResponseDonut responded={responders.length} total={invited.length} /></div>
                <StatTile label="Responses" value={responders.length} sub={`${pending.length} still pending`} />
                <StatTile label="Students Hired" value={totalHired} sub="Reported by companies" color="#2959A6" />
                <StatTile label="Shortlisted" value={totalShortlisted} sub="For interviews / next steps" color="#8b5cf6" />
              </div>

              {/* Companies that haven't answered yet */}
              {pending.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Awaiting response</span>
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5">{pending.length}</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                      {pending.map((c) => (
                        <div key={c.companyName} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5 truncate" title={c.companyName}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{c.companyName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <PartTabs />

              {SURVEY_PARTS[part].sections.map((section) => {
                const sentiment = sectionSentiment[section.title];
                return (
                <div key={section.title} className="flex flex-col gap-3">
                  {section.title && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{section.title}</p>
                      {sentiment != null && (
                        <span
                          className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                            sentiment >= 70 ? "bg-green-100 text-green-700" : sentiment >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
                          }`}
                          title="Share of top-option (most positive) answers across this section's multiple-choice questions"
                        >
                          {sentiment}% positive
                        </span>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.questions.map((q) => (
                      <QuestionCard key={q.id} index={numberFor[q.id]} question={q} agg={aggregates[q.text]} respondedCount={responders.length} />
                    ))}
                  </div>
                </div>
                );
              })}
            </>
          )}

          {mode === "details" && (
            <>
              {/* Company navigator */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 flex-wrap sticky top-0 z-10">
                <button onClick={() => setDetailIdx((i) => Math.max(0, i - 1))} disabled={detailIdx === 0}
                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>
                <div className="flex-1 min-w-[160px] max-w-xs">
                  <CompactSelect
                    value={detailIdx}
                    onChange={(e) => setDetailIdx(Number(e.target.value))}
                    options={responders.map((c, i) => ({ value: i, label: c.companyName }))}
                  />
                </div>
                <button onClick={() => setDetailIdx((i) => Math.min(responders.length - 1, i + 1))} disabled={detailIdx >= responders.length - 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </button>
                <span className="text-xs text-gray-400 tabular-nums">{responders.length ? detailIdx + 1 : 0} of {responders.length}</span>
                <div className="ml-auto"><PartTabs /></div>
              </div>

              {!detailCompany && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  No survey responses yet.
                </div>
              )}

              {detailCompany && SURVEY_PARTS[part].sections.map((section) => (
                <div key={section.title} className="flex flex-col gap-3">
                  {section.title && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{section.title}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.questions.map((q) => {
                      const answer = detailAnswers[q.text];
                      return (
                        <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2.5">
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#0E7F41]/10 text-[#0E7F41] text-[11px] font-bold flex items-center justify-center shrink-0">{numberFor[q.id]}</span>
                            <p className="text-xs font-semibold text-gray-700 leading-snug">{q.text}</p>
                          </div>
                          {q.type === "multiple_choice" && (
                            <div className="flex gap-1.5 flex-wrap">
                              {q.options.map((opt, i) => {
                                const chosen = answer === opt;
                                return (
                                  <span key={opt} className={`text-xs rounded-full px-3 py-1 border font-medium transition-colors ${
                                    chosen ? "text-white border-transparent" : "text-gray-400 border-gray-200 bg-white"
                                  }`} style={chosen ? { background: OPTION_COLORS[i] || "#0E7F41" } : {}}>
                                    {opt}
                                  </span>
                                );
                              })}
                              {!answer && <span className="text-xs text-gray-300 italic py-1">Not answered</span>}
                            </div>
                          )}
                          {q.type === "numeric" && (
                            <p className="text-xl font-bold text-[#0E7F41]">{answer ?? <span className="text-gray-300 text-sm italic font-normal">Not answered</span>}</p>
                          )}
                          {q.type === "open_ended" && (
                            answer
                              ? <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-xs text-gray-600 leading-relaxed">“{answer}”</p></div>
                              : <p className="text-xs text-gray-300 italic">Not answered</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsContainer;
