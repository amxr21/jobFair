import SurveyQuestion from "./SurveyQuestion"
import { useContext, useEffect, useState } from "react"
import { NextSectionIcon, PrevSectionIcon } from "./Icons"
import { useRef } from "react"
import axios, { all } from "axios"
import SubmitSurveyButton from "./SubmitSurveyButton"
import SubmittingCover from "./SubmittingCover"
import { BarChart } from '@mui/x-charts/BarChart';
import { SurveyContext } from "../Context/SurveyContext"
import { NoAnswer, OpenEndedResponse } from "./index"


const SurveySection = ({ section, sectionHeader, subsectionData, page = 'survey', surveyResponsesData, surveyResponsesDataForCompany }) => {
    
    const nextSectionBtn = useRef()
    const prevSectionBtn = useRef()

    const { allResponses } = useContext(SurveyContext)

    // console.log(surveyResponsesData);
    if(surveyResponsesDataForCompany){
        console.log(surveyResponsesDataForCompany[0]);

    }
    


    const scrollSection = (e) => {
        
        let surveyFormSection = nextSectionBtn.current?.parentElement.parentElement ||  prevSectionBtn.current?.parentElement.parentElement
        // console.log(surveyFormSection);

        if(surveyFormSection){
            if(section == 0){
                surveyFormSection.scrollTo({left: surveyFormSection.scrollWidth, behaviour: 'smooth'})
                nextSectionBtn.current.parentElement.scrollTo({top : 0, behaviour: 'smooth'})
            }
            else{
                surveyFormSection.parentElement.scrollTo({left: 0, behaviour: 'smooth'})
                prevSectionBtn.current.parentElement.parentElement.scrollTo({top : 0, behaviour: 'smooth'})
            }

        }
    }

    
    
    // [12, 19,20,21,22]
    let currentQuestionResponses = []
    let openEndedQuestions = {
    'q12': [],
    'q19': [],
    'q20': [],
    'q21': [],
    'q22': [],
    }
    if(allResponses && allResponses.length > 0){
        allResponses?.flatMap(d => d.results).forEach((response) => {
            return response.forEach((question) => {
                // console.log(openEndedQuestions);
                
                switch (question.id) {
                    case "q12":
                        openEndedQuestions["q12"].push(question);
                        
                        currentQuestionResponses = Object.entries(openEndedQuestions)[0][1]
                        // console.log(currentQuestionResponses);
                        break;
                    case "q19":
                        openEndedQuestions["q19"].push(question);
                        currentQuestionResponses = Object.entries(openEndedQuestions)[1][1]
                        break;
                    case "q20":
                        openEndedQuestions["q20"].push(question);
                        currentQuestionResponses = Object.entries(openEndedQuestions)[2][1]
                        break;
                    case "q21":
                        openEndedQuestions["q21"].push(question);
                        currentQuestionResponses = Object.entries(openEndedQuestions)[3][1]
                        break;
                    case "q22":
                        openEndedQuestions["q22"].push(question);
                        currentQuestionResponses = Object.entries(openEndedQuestions)[4][1]
                        break;
                    default:
                        break
                        // Optionally handle unknown question IDs
                        console.warn(`Unhandled question ID: ${question.id}`)
                    }
    
            })
        })
    
        // console.log(currentQuestionResponses);
    }
    

    let counter = 0

    return (
        // <div className="section bg-red-500 min-h-[100%]">
        <div className={`${page == 'results' ? ' ' : 'min-w-[100%] h-[100%] overflow-y-auto'} relative section py-2 pr-4 flex flex-col ${section == 0 ? 'items-end' : 'items-start'} gap-6`}>
            <h3 className="w-full text-2xl font-semibold">{sectionHeader}</h3>
            <div className="w-full questions flex flex-col gap-y-10">
                {
                    subsectionData.map((subsection, index) => (
                        <div key={index } className="flex flex-col gap-y-5">
                            <h2 className="text-xl underline">{subsection.title}</h2>
                            {
                                subsection.questions?.map((question) => {
                                    // console.log(surveyResponsesDataForCompany[0].filter((q) => q.text == question.text)[0].responses);
                                    // console.log(question);
                                    
                                    
                                    counter++
                                    // console.log(question);
                                    
                                    return question.type === 'multiple_choice'
                                        ? (
                                            <div className="grid grid-cols-2">
                                                <SurveyQuestion
                                                    key={question.id}
                                                    section={index}
                                                    Id={counter}
                                                    QuestionText={question.text}
                                                    QuestionType={question.type}
                                                    QuestionOptions={question.options || ''}
                                                    pageType={page}
                                                    QuestionResponse={surveyResponsesDataForCompany ? surveyResponsesDataForCompany[0].filter((q) => {return q.text.toLowerCase() == question.text.toLowerCase()}) : ''}
                                                />
                                                {
                                                    page == 'results' &&
                                                    <BarChart
                                                        xAxis={[{
                                                            scaleType:'band', data: question.options
                                                        }]}
                                                        yAxis={[
                                                            {tickMinStep: 1}
                                                        ]}
                                                        
                                                        series={[{
                                                            data: surveyResponsesData.find((q) => q.text == question.text) ?  Object.values(surveyResponsesData.find((q) => q.text == question.text).options) : [0,0,0] },]}
                                                        height={250}
                                                        width={600}
                                                    />
                                                }
                                                 
                                            </div>
                                        )
                                        : (
                                            <>
                                                <SurveyQuestion
                                                    key={question.id}
                                                    section={index}
                                                    Id={counter}
                                                    QuestionText={question.text}
                                                    QuestionType={question.type}
                                                    pageType={page}
                                                />
                                                {
                                                    // [12, 19,20,21,22]
                                                }
                                                <div className="flex flex-wrap gap-2 -mt-5 mb-6">
                                                    {
                                                        // currentQuestionResponses? currentQuestionResponses.map((ans) => {
                                                        //     return (
                                                        //         <OpenEndedResponse response={ans.responses} />
                                                        //     )
                                                        // })
                                                        // : ''
                                                        
                                                        

                                                        page == 'results'
                                                        ?
                                                        openEndedQuestions[question.id]?.map((ans, i) => 
                                                            (
                                                                    ans.responses?.trim() != "" 
                                                                    ?
                                                                    <OpenEndedResponse key={i} response={ans.responses} />
                                                                    : ""
                                                            )
                                                        )
                                                        :
                                                        surveyResponsesDataForCompany ? 
                                                        surveyResponsesDataForCompany[0].filter((q) => q.text == question.text)?.map((ans, i) => 
                                                            (   
                                                                ans.responses?.trim() != "" 
                                                                ?
                                                                <OpenEndedResponse key={i} response={surveyResponsesDataForCompany ? surveyResponsesDataForCompany[0].filter((q) => q.text == question.text)[0].responses: null} />
                                                                : <NoAnswer />
                                                                
                                                            )
                                                        ):""
                                                    }
                                                </div>
                                            </>
                                        );
                                })
                            }
                        </div>
                    ))

                }
            </div>












            {
                section == 0
                ?
                page == 'survey' && <button ref={nextSectionBtn} onClick={scrollSection} className="button w-10 h-10 p-2.5 bg-white rounded-xl border">
                    <NextSectionIcon />
                </button>
                :
                page == 'survey' &&<>
                    <div className={`flex w-full justify-between`}>
                        <button ref={prevSectionBtn} onClick={scrollSection} className="button w-10 h-10 p-2.5 bg-white rounded-xl border">
                            <PrevSectionIcon />
                        </button>
                        <SubmitSurveyButton />

                    </div>

                </>
            }
        </div>
    )
}


export default SurveySection