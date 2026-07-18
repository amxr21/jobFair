import { useState } from "react";
import { useTranslation } from "react-i18next";

const Input = ({
  Id,
  Type,
  Value,
  handleChange,
  onBlur,
  Name,
  placeholder,
  required = true,
  validate,
  errorMessage
}) => {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);

  // Inputs holding email/phone/password/url content are always LTR, even in an
  // Arabic (RTL) UI, so the caret and text render correctly.
  const ltrType = Type === "email" || Type === "password" || Type === "tel" || Type === "url";

  // Default validation based on type
  const getDefaultValidation = () => {
    if (!required) return true;
    if (!Value || !Value.toString().trim()) return false;

    if (Type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(Value);
    }

    if (Type === "password") {
      return Value.length >= 6;
    }

    return true;
  };

  const isValid = validate ? validate(Value) : getDefaultValidation();
  const showError = touched && !isValid && required;

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    if (!Value || !Value.toString().trim()) return t("auth.validation.required", { field: Name });
    if (Type === "email") return t("auth.validation.invalidEmail");
    if (Type === "password") return t("auth.validation.passwordMin");
    return t("auth.validation.invalidField", { field: Name });
  };

  const getBorderClass = () => {
    if (showError) return "border-red-400 focus:ring-red-400";
    if (touched && isValid && Value) return "border-green-400 focus:ring-green-400";
    return "border-line focus:ring-primary hover:border-gray-400 dark:hover:border-gray-500";
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      <label htmlFor={Id} className="text-xs text-gray-600 dark:text-gray-300 ms-1 block mb-0.5 transition-all duration-300 ease-in-out">
        {Name} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={Id}
        type={Type}
        dir={ltrType ? "ltr" : undefined}
        value={Value}
        onChange={handleChange}
        onBlur={() => {
          setTouched(true);
          if (onBlur) onBlur();
        }}
        placeholder={placeholder || Name}
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg bg-surface-card text-fg placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ease-in-out ${getBorderClass()}`}
      />
      {showError && (
        <p className="text-xs text-red-500 mt-0.5 ms-1 transition-all duration-300 ease-in-out animate-fadeIn">
          {getErrorMessage()}
        </p>
      )}
    </div>
  );
};

export default Input;
