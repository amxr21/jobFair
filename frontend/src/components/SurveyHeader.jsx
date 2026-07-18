import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { SurveyContext } from "../context/SurveyContext"

const SurveyHeader = () => {

    const { t } = useTranslation()
    const { surveyAnswers } = useContext(SurveyContext)
    
    
    const [ complete, setComplete ] = useState(0)

    useEffect(() => {
        
        const yesToQ18 = surveyAnswers[18].responses == 'Yes';
        
        const numberOfQuestions = yesToQ18 ? 22 : 20

        const answeredQuestions = surveyAnswers.filter((q, index) => {
            if((index == 19 || index == 20) && !yesToQ18) return false
            return q.responses.length > 0
        }).length
        
        const percentage = (answeredQuestions / numberOfQuestions) * 100 
        setComplete(percentage)

        
    }, [surveyAnswers])

     
    


    return (
        <div className="pb-5 border-b border-line flex flex-col gap-3">
            <h1 className="text-3xl font-bold mb-2 text-fg">{t("survey.pageTitle")}</h1>
            <div className="w-full min-h-2 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div style={{width: `${complete}%`}} className={`transition-all ease-in-out smooth duration-300 bg-primary h-full`}>

                </div>
            </div>
        </div>
    )
}


export default SurveyHeader