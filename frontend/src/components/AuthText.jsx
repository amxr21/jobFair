import { useTranslation } from "react-i18next";

const AuthText = ({ variant = "login" }) => {
  const { t } = useTranslation();

  const description =
    variant === "signup"
      ? t("auth.hero.descriptionSignup")
      : t("auth.hero.descriptionLogin");

  return (
    <div className="flex flex-col justify-center text-center md:text-start text-white shrink-0 transition-all duration-300 ease-in-out">
      <h2 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight md:leading-snug mb-2 md:mb-4 transition-all duration-300 ease-in-out">
        {t("auth.hero.title")}
      </h2>
      <p className="text-sm md:text-base lg:text-lg font-light opacity-90 transition-all duration-300 ease-in-out">
        {description}
      </p>
    </div>
  );
};

export default AuthText;
