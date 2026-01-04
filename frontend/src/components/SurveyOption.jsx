import { useContext, useEffect, useRef, useState } from "react"
import OptionResponses from "./OptionResponses"
import { SurveyContext } from "../Context/SurveyContext"
import { AnswersContext } from "../Context/AnswersContext"

const SurveyOption = ({ label, selected, handleClick, handleChange, type, page, index, questionText, optionIndex }) => {
    const { allResponses } = useContext(SurveyContext)
    const { answers } = useContext(AnswersContext) || {}
    const [ options, setOptions ] = useState([0, 0, 0]);
    
     const selectOptionRef = useRef()
    

    if(page == 'survey'){
        return type == 'multiple_choice'
        ? (
            <div onClick={handleClick} className={`survey-option cursor-pointer flex items-center justify-between border rounded-xl px-4 py-3 w-full ${selected ? "border-2 border-gray-300" : ""}`}>
                <p className="text-sm">{label}</p>
                <button ref={selectOptionRef} onClick={handleClick} className="option-btn border w-6 h-6 p-1 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className={`option-btn-dot ${selected ? optionIndex == 0 ? 'bg-green-600' : optionIndex == 1 ? 'bg-yellow-500' : 'bg-red-500' : 'bg-gray-200'} w-full h-full rounded-full`}></div>
                </button>
            </div>
        )

        : (
            <textarea onChange={handleChange} placeholder={label} name="" id="" className="border rounded-xl px-4 py-2 h-28 w-full bg-transparent outline-none border"></textarea>
        )
    }
    else if(page == 'surveyResults'){
        return type == 'multiple_choice'
        ? (
            <div onClick={handleClick} className={`survey-option flex items-center justify-between border rounded-xl px-4 py-3 w-full ${selected ? "border-2 border-gray-300" : ""}`}>
                <p className="text-sm">{label}</p>
                <button ref={selectOptionRef} onClick={handleClick} className="option-btn cursor-default border w-6 h-6 p-1 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className={`option-btn-dot ${selected ? optionIndex == 0 ? 'bg-green-600' : optionIndex == 1 ? 'bg-yellow-500' : 'bg-red-500' : 'bg-gray-200'} w-full h-full rounded-full`}></div>
                </button>
            </div>
        )

        : ""
        // (
        //     <textarea onChange={handleChange} placeholder={label} name="" id="" className="border rounded-xl px-4 py-2 h-28 w-full bg-transparent outline-none border"></textarea>
        // )
    }
    else {
        useEffect(() => {
            const question = answers.find((q) => q.text == questionText)

            if(question && question.options){
                setOptions(Object.values(answers.find((q) => q.text === questionText).options))
            }

        }, [ answers, allResponses, questionText ])
            
        // console.log('====================================');
        // console.log(allResponses.find((q) => q.text === questionText));
        // console.log('====================================');

        return (
            <>

                <OptionResponses
                    answer={label}
                    number={index}
                    percentages={options.map((option) => option /2 * 100)}
                />
            </>
        );
        }




}


export default SurveyOption