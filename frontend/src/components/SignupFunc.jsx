import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSignUp } from "../hooks/useSignUp";
import { Input, SelectInput, MultiSelectInput, StepTimeline, AuthFormOverlay } from "../components";
import { INDUSTRY_FIELDS } from "./MultiSelectInput";
import { tCity, tSector, tIndustryField, tMajor } from "../i18n/translateEnum";
import axios from "axios";
import { API_URL } from "../config/api";

const SignupFunc = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [numRepresentatives, setNumRepresentatives] = useState("");
  const [repNames, setRepNames] = useState(["", "", ""]);

  // Step 2: Company Type
  const [fields, setFields] = useState([]);
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [noOfPositions, setNoOfPositions] = useState("");

  // Step 3: Hiring Preferences
  const [preferredMajors, setPreferredMajors] = useState([]);
  const [opportunityTypes, setOpportunityTypes] = useState([]);
  const [preferredQualities, setPreferredQualities] = useState("");

  // Email validation
  const [emailError, setEmailError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Similar company name detection
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [showSimilarCompanyDialog, setShowSimilarCompanyDialog] = useState(false);
  const [selectedExistingCompany, setSelectedExistingCompany] = useState(null);
  const [isCheckingCompanyName, setIsCheckingCompanyName] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);

  const { signup, error, isLoading } = useSignUp();

  // Check if email is already in use
  const checkEmailAvailability = async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailError("");
      return;
    }

    setIsCheckingEmail(true);
    setEmailError("");

    try {
      const response = await axios.get(`${API_URL}/companies`);
      const existingEmails = response.data.map(company => company.email?.toLowerCase());

      if (existingEmails.includes(emailToCheck.toLowerCase())) {
        setEmailError(t("auth.signup.emailTaken"));
      }
    } catch (error) {
      // Silently fail - backend will catch duplicates anyway
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check for similar company names
  const checkSimilarCompanyName = async (nameToCheck) => {
    if (!nameToCheck || nameToCheck.trim().length < 3) {
      setSimilarCompanies([]);
      return [];
    }

    setIsCheckingCompanyName(true);

    try {
      const response = await axios.get(`${API_URL}/user/check-company-name`, {
        params: { companyName: nameToCheck }
      });

      const similar = response.data.similarCompanies || [];
      setSimilarCompanies(similar);
      return similar;
    } catch (error) {
      console.error("Error checking similar company names:", error);
      return [];
    } finally {
      setIsCheckingCompanyName(false);
    }
  };

  // Handle reinitialize existing company
  const handleReinitializeCompany = async (existingCompanyId) => {
    setIsReinitializing(true);

    try {
      const count = parseInt(numRepresentatives) || 0;
      const representitives = repNames.slice(0, count).filter(n => n.trim()).join(", ");

      const response = await axios.put(`${API_URL}/user/reinitialize`, {
        existingCompanyId,
        email,
        password,
        fields,
        representitives,
        companyName,
        sector,
        city,
        noOfPositions,
        preferredMajors,
        opportunityTypes,
        preferredQualities
      });

      if (response.data) {
        // Store user data in localStorage (same as normal signup)
        localStorage.setItem('user', JSON.stringify(response.data));
        setIsRedirecting(true);
        setShowSimilarCompanyDialog(false);
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error reinitializing company:", error);
      alert(error.response?.data?.error || t("auth.signup.updateCompanyFailed"));
    } finally {
      setIsReinitializing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Check for similar company names before signup
      const similar = await checkSimilarCompanyName(companyName);

      if (similar.length > 0) {
        // Show dialog to ask user if they want to reinitialize
        setShowSimilarCompanyDialog(true);
        return;
      }

      // No similar companies found, proceed with normal signup
      await proceedWithSignup();
    }
  };

  // Proceed with normal signup
  const proceedWithSignup = async () => {
    const count = parseInt(numRepresentatives) || 0;
    const representitives = repNames.slice(0, count).filter(n => n.trim()).join(", ");

    const success = await signup(email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities);
    if (success) {
      setIsRedirecting(true);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleRepNameChange = (index, value) => {
    const newNames = [...repNames];
    newNames[index] = value;
    setRepNames(newNames);
  };

  const handleOpportunityTypeChange = (type) => {
    setOpportunityTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const opportunityOptions = [
    { value: "Full-time", label: t("auth.signup.opportunityOptions.fullTime") },
    { value: "Part-time", label: t("auth.signup.opportunityOptions.partTime") },
    { value: "Internship", label: t("auth.signup.opportunityOptions.internship") },
    { value: "Co-op", label: t("auth.signup.opportunityOptions.coOp") },
    { value: "Graduate Program", label: t("auth.signup.opportunityOptions.graduateProgram") },
  ];

  const stepInfo = [
    { num: 1, title: "Account", desc: "Company details" },
    { num: 2, title: "Profile", desc: "Industry info" },
    { num: 3, title: "Preferences", desc: "Hiring criteria" }
  ];

  const repCount = parseInt(numRepresentatives) || 0;

  // Validation for each step
  const isStep1Valid = () => {
    if (!companyName.trim() || !email.trim() || !password.trim() || !numRepresentatives) {
      return false;
    }
    // Check if email has error
    if (emailError) {
      return false;
    }
    // Check if all representative names are filled
    const count = parseInt(numRepresentatives) || 0;
    for (let i = 0; i < count; i++) {
      if (!repNames[i]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const isStep2Valid = () => {
    return fields.length > 0 && sector && city && noOfPositions;
  };

  const isStep3Valid = () => {
    return preferredMajors.length > 0 && opportunityTypes.length > 0 && preferredQualities.trim();
  };

  const isCurrentStepValid = () => {
    if (step === 1) return isStep1Valid();
    if (step === 2) return isStep2Valid();
    if (step === 3) return isStep3Valid();
    return false;
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      <StepTimeline currentStep={step} steps={stepInfo} />

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <div className="flex-1 overflow-y-auto px-6 py-5 transition-all duration-300 ease-in-out">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="flex flex-col gap-3 transition-all duration-300 ease-in-out animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 transition-all duration-300 ease-in-out">{t("auth.signup.step1.companyInformation")}</h3>
              <Input
                Id="companyName"
                Name={t("auth.signup.step1.companyName")}
                Type="text"
                Value={companyName}
                handleChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("auth.signup.step1.companyNamePlaceholder")}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    Id="email"
                    Name={t("auth.signup.step1.email")}
                    Type="email"
                    Value={email}
                    handleChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    onBlur={() => checkEmailAvailability(email)}
                    placeholder={t("auth.signup.step1.emailPlaceholder")}
                  />
                  {isCheckingEmail && (
                    <div className="absolute end-2 top-7 text-gray-400">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {emailError && (
                    <p className="text-xs text-red-500 mt-0.5 ms-1 animate-fadeIn">{emailError}</p>
                  )}
                </div>
                <Input
                  Id="password"
                  Name={t("auth.signup.step1.password")}
                  Type="password"
                  Value={password}
                  handleChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.signup.step1.passwordPlaceholder")}
                />
              </div>

              {/* Representatives Section */}
              <div className="mt-2 transition-all duration-300 ease-in-out">
                <label className="text-xs text-gray-600 dark:text-gray-400 ms-1 block mb-0.5 transition-all duration-300 ease-in-out">
                  {t("auth.signup.step1.numberOfRepresentatives")} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 transition-all duration-300 ease-in-out">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumRepresentatives(String(num))}
                      className={`w-10 h-9 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 ${
                        numRepresentatives === String(num)
                          ? 'bg-[#0E7F41] text-white border-[#0E7F41] shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#0E7F41] hover:shadow-sm'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {repCount > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 transition-all duration-300 ease-in-out animate-fadeIn">
                  {Array.from({ length: repCount }).map((_, idx) => (
                    <Input
                      key={idx}
                      Id={`rep${idx + 1}`}
                      Name={t("auth.signup.step1.representativeName", { num: idx + 1 })}
                      Type="text"
                      Value={repNames[idx]}
                      handleChange={(e) => handleRepNameChange(idx, e.target.value)}
                      placeholder={t("auth.signup.step1.representativeNamePlaceholder", { num: idx + 1 })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Company Type */}
          {step === 2 && (
            <div className="flex flex-col gap-3 transition-all duration-300 ease-in-out animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 transition-all duration-300 ease-in-out">{t("auth.signup.step2.companyProfile")}</h3>
              <MultiSelectInput
                Id="fields"
                Name={t("auth.signup.step2.industryFields")}
                options={INDUSTRY_FIELDS}
                value={fields}
                handleChange={setFields}
                placeholder={t("auth.signup.step2.industryFieldsPlaceholder")}
                tOption={tIndustryField}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectInput
                  Id="sector"
                  Name={t("auth.signup.step2.sector")}
                  options={["Local", "Private", "Semi", "Federal"]}
                  value={sector}
                  handleChange={(e) => setSector(e.target.value)}
                  tOption={tSector}
                />
                <SelectInput
                  Id="city"
                  Name={t("auth.signup.step2.city")}
                  options={["Sharjah", "Dubai", "Abu Dhabi", "Ajman", "Al-Ain", "Ras Al-Khaima", "Umm Al-Quwain", "AlFujairah"]}
                  value={city}
                  handleChange={(e) => setCity(e.target.value)}
                  tOption={tCity}
                />
              </div>
              <SelectInput
                Id="noOfPositions"
                Name={t("auth.signup.step2.availablePositions")}
                options={["1-5", "5-10", "10-15", "15-20", ">20"]}
                value={noOfPositions}
                handleChange={(e) => setNoOfPositions(e.target.value)}
              />
            </div>
          )}

          {/* Step 3: Hiring Preferences */}
          {step === 3 && (
            <div className="flex flex-col gap-3 transition-all duration-300 ease-in-out animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 transition-all duration-300 ease-in-out">{t("auth.signup.step3.hiringPreferences")}</h3>
              <MultiSelectInput
                Id="preferredMajors"
                Name={t("auth.signup.step3.preferredMajors")}
                value={preferredMajors}
                handleChange={setPreferredMajors}
                placeholder={t("auth.signup.step3.preferredMajorsPlaceholder")}
                tOption={tMajor}
              />
              <div className="transition-all duration-300 ease-in-out">
                <label className="text-xs text-gray-600 dark:text-gray-400 ms-1 block mb-1.5 transition-all duration-300 ease-in-out">
                  {t("auth.signup.step3.opportunityTypes")} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 transition-all duration-300 ease-in-out">
                  {opportunityOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOpportunityTypeChange(value)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 ${
                        opportunityTypes.includes(value)
                          ? 'bg-[#0E7F41] text-white border-[#0E7F41] shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#0E7F41] hover:shadow-sm'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="transition-all duration-300 ease-in-out">
                <label className="text-xs text-gray-600 dark:text-gray-400 ms-1 block mb-0.5 transition-all duration-300 ease-in-out">
                  {t("auth.signup.step3.idealCandidateQualities")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={preferredQualities}
                  onChange={(e) => setPreferredQualities(e.target.value)}
                  placeholder={t("auth.signup.step3.idealCandidateQualitiesPlaceholder")}
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-surface-card text-fg rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E7F41] focus:border-transparent resize-none transition-all duration-300 ease-in-out hover:border-gray-400"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs rounded-lg px-3 py-2 transition-all duration-300 ease-in-out animate-fadeIn">
              {error}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 transition-all duration-300 ease-in-out">
          <div className="flex gap-3 transition-all duration-300 ease-in-out">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center w-12 h-10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 icon-directional transition-all duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              disabled={isLoading || !isCurrentStepValid()}
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-medium h-10 rounded-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              {isLoading ? (
                t("auth.signup.creating")
              ) : step < 3 ? (
                <>
                  <span>{t("auth.signup.continue")}</span>
                  <svg className="w-5 h-5 icon-directional" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                t("auth.signup.createAccount")
              )}
            </button>
          </div>
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300 transition-all duration-300 ease-in-out">
            <span>{t("auth.signup.alreadyHaveAccount")} </span>
            <a href="/login" className="text-[#0E7F41] hover:underline font-medium transition-all duration-300 ease-in-out">
              {t("auth.signup.logInHere")}
            </a>
          </div>
        </div>
      </form>

      {/* Loading Overlay */}
      {isLoading && !isRedirecting && (
        <AuthFormOverlay type="loading" message={t("auth.signup.creatingAccount")} />
      )}

      {/* Redirect Overlay */}
      {isRedirecting && (
        <AuthFormOverlay type="redirect" message={t("auth.signup.accountCreated")} />
      )}

      {/* Similar Company Dialog */}
      {showSimilarCompanyDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 m-4 max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/15 rounded-full">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t("auth.signup.similarCompanyDialog.title")}</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("auth.signup.similarCompanyDialog.message")}
            </p>

            <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
              {similarCompanies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => setSelectedExistingCompany(selectedExistingCompany === company.id ? null : company.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedExistingCompany === company.id
                      ? 'border-[#0E7F41] bg-green-50 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate" dir="auto">{company.companyName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate bidi-ltr">{company.email}</p>
                    </div>
                    {selectedExistingCompany === company.id && (
                      <svg className="w-5 h-5 text-[#0E7F41] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {selectedExistingCompany && (
                <button
                  type="button"
                  onClick={() => handleReinitializeCompany(selectedExistingCompany)}
                  disabled={isReinitializing}
                  className="w-full py-2.5 bg-[#0E7F41] text-white text-sm font-medium rounded-lg hover:bg-[#0a5f31] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isReinitializing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("auth.signup.similarCompanyDialog.updatingAccount")}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {t("auth.signup.similarCompanyDialog.updateThisAccount")}
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  setShowSimilarCompanyDialog(false);
                  await proceedWithSignup();
                }}
                disabled={isLoading}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? t("auth.signup.creating") : t("auth.signup.similarCompanyDialog.noCreateNewAccount")}
              </button>

              <button
                type="button"
                onClick={() => setShowSimilarCompanyDialog(false)}
                className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {t("auth.signup.similarCompanyDialog.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checking Company Name Overlay */}
      {isCheckingCompanyName && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-40 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg className="animate-spin w-6 h-6 text-[#0E7F41]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-300">{t("auth.signup.checkingCompanyName")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupFunc;
