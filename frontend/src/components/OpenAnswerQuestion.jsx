import { useTranslation } from "react-i18next"

const OpenAnswerQuestion = () => {
    const { t } = useTranslation()
    return (
        <textarea placeholder={t("survey.openAnswerPlaceholder")} name="" id="" className="border border-line rounded-xl px-4 py-2 h-28 w-full bg-transparent text-fg outline-none"></textarea>
    )
}

export default OpenAnswerQuestion