import { QuestionsContainer, TopBar } from "../components"
import { SurveyContextProvider } from "../context/SurveyContext"
import { useAuthContext } from "../hooks/useAuthContext"
import { AnswersContextProvider, AnswersContext } from "../context/AnswersContext"
import { useContext } from "react"



const SurveyResults = () => {

    const { user } = useAuthContext()
 


    return (
        <AnswersContextProvider>
            <SurveyContextProvider>
                <div id="SurveyResults" className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0 h-full">
                    <TopBar user={user} />
                    <QuestionsContainer />
                </div>
            </SurveyContextProvider>
        </AnswersContextProvider>
    )
}


export default SurveyResults