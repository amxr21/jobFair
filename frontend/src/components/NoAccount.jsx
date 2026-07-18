import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next";

const NoAccount = ({process, dark = false}) => {
    const { t } = useTranslation();
    const textClass = dark ? "text-white/80" : "text-gray-600 dark:text-gray-300";
    const linkClass = dark ? "text-white font-medium underline hover:text-white/90" : "text-primary font-medium hover:underline";

    return process == 'signup'
    ?
    <div className={`text-sm ${textClass}`}>
        <span>{t("auth.noAccount")} </span>
        <Link to={"/signup"} className={linkClass}>
            {t("auth.signUpHere")}
        </Link>
    </div>
    :
    <div className={`text-sm ${textClass}`}>
        <span>{t("auth.haveAccount")} </span>
        <Link to={"/login"} className={linkClass}>
            {t("auth.logInHere")}
        </Link>
    </div>
}


export default NoAccount
