import { useTranslation } from "react-i18next"
import SubmitLoading from "../assets/images/submitting.gif"

const SubmittingCover = () => {
    const { t } = useTranslation()
    return (
        <div id="SubmitLoadingCover" className="w-[99%] absolute flex flex-col items-center justify-center p-8 bg-surface flex w-full h-full top-0 start-[100%]  pointer-events-none z-[9999999] h-0 opacity-0">
            <img src={SubmitLoading} alt="" className="size-28" />
            <p className="text-lg font-light w-80 text-center text-fg">{t("survey.processing")}</p>
        </div>
    )
}


export default SubmittingCover