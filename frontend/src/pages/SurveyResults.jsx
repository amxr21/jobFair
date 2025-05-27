import { QuestionsContainer, TopBar } from "../components"
import { SurveyContextProvider } from "../Context/SurveyContext"
import { useAuthContext } from "../Hooks/useAuthContext"
import { AnswersContextProvider, AnswersContext } from "../Context/AnswersContext"
import { useContext } from "react"



const SurveyResults = () => {

    const { user } = useAuthContext()
 


    return (
        <AnswersContextProvider>
            <SurveyContextProvider>
                <div id="SurveyResults" className="col-span-10 flex flex-col gap-8 overflow-hidden">
                    <TopBar user={user}/>
                    <QuestionsContainer />
                </div>
            </SurveyContextProvider>
        </AnswersContextProvider>
    )
}


export default SurveyResults