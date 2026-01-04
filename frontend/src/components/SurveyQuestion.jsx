import { useContext, useEffect, useState } from "react";
import SurveyOption from "./SurveyOption"

import { SurveyContext } from '../Context/SurveyContext'


import axios from "axios"
const link = "http://localhost:2000"





const SurveyQuestion = ({Id, QuestionText, QuestionType, QuestionOptions, section, pageType, surveyResponsesData, QuestionResponse}) => {
    
    if(QuestionResponse){
        // console.log('====================================');
        // console.log(QuestionResponse[0].responses);
        // console.log('====================================');

    }


    const [ selectedBtn, setSelectedBtn ] = useState()

    const { surveyAnswers, updateSurvey } = useContext(SurveyContext)

    const [ yesAnswer, setYesAnswer ] = useState(false)

    const handleClickFunc = (e) => { 
        

        let questionLabel = e.target.classList.contains('option-btn') 
        ?
        e.target.parentElement.firstElementChild.textContent.replace(/[^A-Za-z0-9 ]/g,'') 
        : 
        e.target.classList.contains('option-btn-dot')
            ? e.target.parentElement.parentElement.firstElementChild.textContent.replace(/[^A-Za-z0-9 ]/g,' ')
            : e.target.textContent.replace(/[^A-Za-z0-9 ]/g,'')
                

        updateSurvey(QuestionType, QuestionText, questionLabel)
        // console.log(questionLabel); 
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
   

    if(pageType == 'survey'){
        if((Id == 8 || Id == 9) && section == 0){
            return (
                yesAnswer && <div key={Id} className="survey-question flex flex-col gap-y-3  ">
                    <h2 className={`text-base ${QuestionType}`} >{`${Id}. ${QuestionText}`}</h2>
        
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
                                        handleClick={(e) => {handleClickFunc(e); setSelectedBtn(index) }}
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
                    <h2 className={`text-base ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${QuestionText}`}</h2>
        
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
                                        handleClick={(e) => {handleClickFunc(e); setSelectedBtn(index) }}
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
                    <h2 className={`text-base ${QuestionType}`} >{`${Id}. ${QuestionText}`}</h2>
        
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
                                        handleClick={(e) => {handleClickFunc(e); setSelectedBtn(index) }}
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
                    <h2 className={`text-base ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${QuestionText}`}</h2>
        
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
                                        handleClick={(e) => {handleClickFunc(e); setSelectedBtn(index) }}
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
                <h2 className={`text-base ${QuestionType}`} >{`${!yesAnswer && Id > 7 ? Id-2 : Id}. ${QuestionText}`}</h2>
    
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