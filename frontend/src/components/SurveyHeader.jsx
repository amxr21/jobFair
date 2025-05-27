import { useContext, useEffect, useState } from "react"
import { SurveyContext } from "../Context/SurveyContext"

const SurveyHeader = () => {

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
        <div className="pb-5 border-b flex flex-col gap-3">
            <h1 className="text-3xl font-bold mb-2">Exit Survey of Internship and Career Fair 2025</h1>
            <div className="w-full min-h-2 rounded-xl bg-gray-100 overflow-hidden">
                <div style={{width: `${complete}%`}} className={`transition-all ease-in-out smooth duration-300 bg-[#0E7F41] h-full`}>

                </div>
            </div>
        </div>
    )
}


export default SurveyHeader