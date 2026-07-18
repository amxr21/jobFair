import { useContext, useEffect, useState } from "react";
import SurveyOption from "./SurveyOption"

import { SurveyContext } from '../context/SurveyContext'
import { tSurveyQuestion } from "../i18n/surveyContent"


import axios from "axios"
import { API_URL as link } from "../config/api";





const SurveyQuestion = ({Id, QuestionId, QuestionText, QuestionType, QuestionOptions, section, pageType, surveyResponsesData, QuestionResponse}) => {

    if(QuestionResponse){
        // console.log('====================================');
        // console.log(QuestionResponse[0].responses);
        // console.log('====================================');

    }


    const [ selectedBtn, setSelectedBtn ] = useState()

    const { surveyAnswers, updateSurvey } = useContext(SurveyContext)

    const [ yesAnswer, setYesAnswer ] = useState(false)

    // Store the CANONICAL ENGLISH option value (not the translated label shown in
    // the UI), so aggregation/DB matching keeps working across languages.
    const handleOptionSelect = (optionValue) => {
        updateSurvey(QuestionType, QuestionText, optionValue)
    }



    const handleChangeFunc = (e) => {
        let answerResponse = e.target.value

        updateSurvey(QuestionType, QuestionText, answerResponse)
    }


    useEffect(() => {
        // console.log(surveyAnswers[18] );

        if(surveyAnswers[18].responses == 'Yes') setYesAnswer(true)
        else{ setYesAnswer(false) }
    }, [surveyAnswers])

    let counter = 0

    // Translated question text for display; data path keeps QuestionText (English).
    const displayQuestion = tSurveyQuestion(QuestionId, QuestionText)


    if(pageType == 'survey'){
        if((Id == 8 || Id == 9) && section == 0){
            return (
                yesAnswer && <div key={Id} className="survey-question flex flex-col gap-y-3  ">
                    <h2 className={`text-base text-fg ${QuestionType}`} >{`${Id}. ${displayQuestion}`}</h2>

                    <div className="options flex w-full gap-x-3">

                        {

                            // QuestionOptions?
                            QuestionType == "multiple_choice"
                            ?
                            QuestionOptions.map((option, index) => {
                                return (
                                    <SurveyOption
                                        key={index}
                                        optionIndex={index}
                                        label={option}
                                        selected={selectedBtn == index}
                                        handleClick={() => { handleOptionSelect(option); setSelectedBtn(index) }}
                                        type={'multiple_choice'}
                                        page={pageType}
                                    />
                                )
                            })
                            :
                            <SurveyOption handleChange={handleChangeFunc} label={QuestionText} page={pageType}/>
                        }

                    </div>


                </div>
            )

        }
        else{
            return (
                <div key={Id} className="survey-question flex flex-col gap-y-3 col-span-2">
                    <h2 className={`text-base text-fg ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${displayQuestion}`}</h2>

                    <div className="options flex w-full gap-x-3">

                        {

                            // QuestionOptions?
                            QuestionType == "multiple_choice"
                            ?
                            QuestionOptions.map((option, index) => {
                                return (
                                    <SurveyOption
                                        key={index}
                                        optionIndex = {index}
                                        label={option}
                                        selected={selectedBtn == index}
                                        handleClick={() => { handleOptionSelect(option); setSelectedBtn(index) }}
                                        // selected={surveyAnswers.find(a => a.text == QuestionText)?.responses == option}
                                        // handleClick={(e) => handleClickFunc(e) }
                                        type={'multiple_choice'} page={pageType}
                                    />
                                )
                            })
                            :
                            <SurveyOption handleChange={handleChangeFunc} label={QuestionText} page={pageType} />
                        }

                    </div>


                </div>
            )

        }
    }

    else if(pageType == 'surveyResults'){
        if((Id == 8 || Id == 9) && section == 0){
            return (
                <div key={Id} className="survey-question flex flex-col gap-y-3">
                    <h2 className={`text-base text-fg ${QuestionType}`} >{`${Id}. ${displayQuestion}`}</h2>

                    <div className="options flex w-full gap-x-3">

                        {

                            // QuestionOptions?
                            QuestionType == "multiple_choice"
                            ?
                            QuestionOptions.map((option, index) => {
                                return (
                                    <SurveyOption
                                        key={index}
                                        optionIndex={index}
                                        label={option}
                                        selected={selectedBtn == index}
                                        handleClick={() => { handleOptionSelect(option); setSelectedBtn(index) }}
                                        type={'multiple_choice'}
                                        page={pageType}
                                    />
                                )
                            })
                            :
                            <SurveyOption handleChange={handleChangeFunc} label={QuestionText} page={pageType}/>
                        }

                    </div>


                </div>
            )

        }
        else{
            return (
                <div key={Id} className="survey-question flex flex-col gap-y-3 col-span-2">
                    <h2 className={`text-base text-fg ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${displayQuestion}`}</h2>

                    <div className="options flex w-full gap-x-3">

                        {

                            // QuestionOptions?
                            QuestionType == "multiple_choice"
                            ?
                            QuestionOptions.map((option, index) => {
                                // console.log(option, QuestionResponse[0].responses, option == QuestionResponse[0].responses);

                                return (
                                    <SurveyOption
                                        key={index}
                                        optionIndex = {index}
                                        label={option}
                                        selected={option == QuestionResponse?.[0]?.responses}
                                        handleClick={() => { handleOptionSelect(option); setSelectedBtn(index) }}
                                        // selected={surveyAnswers.find(a => a.text == QuestionText)?.responses == option}
                                        // handleClick={(e) => handleClickFunc(e) }
                                        type={'multiple_choice'} page={pageType}
                                    />
                                )
                            })
                            :
                            <SurveyOption handleChange={handleChangeFunc} label={QuestionText} page={pageType} />
                        }

                    </div>


                </div>
            )

        }
    }


    else{
        return (
            <div key={Id} className="survey-question flex flex-col gap-y-3  ">
                <h2 className={`text-base text-fg ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${displayQuestion}`}</h2>

                <div className="options flex w-full gap-x-3">

                    {/* {

                        // QuestionOptions?
                        QuestionType == "multiple_choice"
                        ?
                        QuestionOptions.map((option, index) => {
                            counter = index

                            return (
                                <SurveyOption
                                    key={index}
                                    label={option}
                                    selected={selectedBtn == index}
                                    handleClick={(e) => {handleClickFunc(e); setSelectedBtn(index) }}
                                    type={'multiple_choice'} page={pageType}
                                    index={counter}
                                    questionText={QuestionText}
                                />
                            )
                        })
                        :
                        <SurveyOption handleChange={handleChangeFunc} label={QuestionText} page={pageType} questionText={QuestionText} />
                    } */}

                </div>


            </div>
        )
    }


}

export default SurveyQuestion
