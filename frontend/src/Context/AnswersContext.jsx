import { createContext, useContext, useState } from "react";

const AnswersContext = createContext()

const AnswersContextProvider = ({children}) => {
    
    const [ answers, setAnswers ] = useState([])



    const updateAnswers = (answersList) => {
        setAnswers(answersList)
    }



    return (
        <AnswersContext.Provider value={{ answers, updateAnswers }}>
            {children}
        </AnswersContext.Provider>
    );
}



export { AnswersContext, AnswersContextProvider };