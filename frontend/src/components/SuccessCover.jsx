import { useTranslation } from "react-i18next";
import { ResponseOkIcon } from "./Icons"


const SuccessCover = () => {
    const { t } = useTranslation();
    return (
        <div id="Success" className="absolute flex flex-col items-center justify-center gap-2 p-8 bg-surface w-full top-0 start-[100%]  pointer-events-none z-[9999999] cursor-default h-0 opacity-0">
            <ResponseOkIcon />
            <p className="text-lg font-normal text-center w-[28rem]">{t("intro.responseSubmitted")}</p>

        </div>
    )
}

export default SuccessCover