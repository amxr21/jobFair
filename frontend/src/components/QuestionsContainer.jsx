import SurveySection from "../components/SurveySection";

import { useContext, useEffect, useState } from "react";
import { SurveyContext, SurveyContextProvider } from "../Context/SurveyContext";
import { AnswersContext } from "../Context/AnswersContext";

import axios from "axios";

import { BriefSurveyStatstics, ResponsesPieChart } from "./index";




const link = "http://localhost:2000"


const QuestionsContainer = () => {

  const { allResponses, setAllResponses } = useContext(SurveyContext)
  const { answers, updateAnswers } = useContext(AnswersContext)
  
  const [ list, setList ] = useState([])
  const [ companies, setCompanies ] = useState(null)

      const surveyData = [
      {
        "title": "Part 1: Event Experience",
        "subsections": [
          {
            "title": "Organization & Logistics",
            "questions": [
              {
                "id": "q1",
                "text": "How would you rate the overall organization of the event?",
                "type": "multiple_choice",
                "options": ["Good", "Fair", "Poor"]
              },
              {
                "id": "q2",
                "text": "How would you rate the pre-event communication and coordination?",
                "type": "multiple_choice",
                "options": ["Good", "Fair", "Poor"]
              },
              {
                "id": "q3",
                "text": "How was your experience with parking and on-campus access?",
                "type": "multiple_choice",
                "options": ["Smooth", "Manageable", "Difficult"]
              },
              {
                "id": "q4",
                "text": "How would you rate the event location (Main Building, M11) in terms of accessibility and visibility?",
                "type": "multiple_choice",
                "options": ["Good", "Fair", "Poor"]
              },
              {
                "id": "q5",
                "text": "Was your booth setup ready and satisfactory upon arrival?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q6",
                "text": "How would you rate the support provided by the organizers during the event?",
                "type": "multiple_choice",
                "options": ["Helpful", "Available when needed", "Unavailable"]
              }
            ]
          },
          {
            "title": "Student Interaction & Portal Experience",
            "questions": [
              {
                "id": "q7",
                "text": "Were the students well-prepared to engage with you?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q8",
                "text": "Did the online portal support your recruitment efforts effectively?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q9",
                "text": "Were the student profiles/resumes accessible and useful via the portal?",
                "type": "multiple_choice",
                "options": ["Yes", "Neutral", "No"]
              },
              {
                "id": "q10",
                "text": "Are you in favor of continuing the paperless approach for future fairs?",
                "type": "multiple_choice",
                "options": ["Yes", "Maybe", "No"]
              },
              {
                "id": "q11",
                "text": "Would you participate in our future career events?",
                "type": "multiple_choice",
                "options": ["Yes", "Maybe", "No"]
              },
              {
                "id": "q12",
                "text": "Any suggestions or advice to improve the quality of the fair?",
                "type": "open_ended"
              }
            ]
          }
        ]
      },

      {
        "title": "Part 2: Recruitment & Follow-Up",
        "subsections": [
          {
            'title': '',
            'questions' : [
              {
                "id": "q13",
                "text": "Have you reviewed the applications and profiles submitted via our portal?",
                "type": "multiple_choice",
                "options": ["Yes", "In progress", "Not yet"]
              },
              {
                "id": "q14",
                "text": "Based on your review, how would you rate the overall quality of student applicants?",
                "type": "multiple_choice",
                "options": ["Good", "Fair", "Poor"]
              },
              {
                "id": "q15",
                "text": "Did you find candidates that match your internship or job requirements?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q16",
                "text": "Were the student resumes/profiles complete and easy to understand in the portal?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q17",
                "text": "Was the portal helpful in managing and filtering applicants post-event?",
                "type": "multiple_choice",
                "options": ["Yes", "Somewhat", "No"]
              },
              {
                "id": "q18",
                "text": "Are you planning to follow up with any UoS students for internships/jobs?",
                "type": "multiple_choice",
                "options": ["Yes", "No", "Still deciding"]
              },
              {
                "id": "q19",
                "text": "Did you hire or shortlist any students from the fair?",
                "type": "multiple_choice",
                "options": ["Yes", "No", "Still deciding"]
              },
              {
                "id": "q20",
                "text": "If yes, how many students did you hire (internship or full-time)?",
                "type": "numeric"
              },
              {
                "id": "q21",
                "text": "If yes, how many students did you shortlist for next steps/interviews?",
                "type": "numeric"
              },
              {
                "id": "q22",
                "text": "Any other feedback or suggestions for improvement?",
                "type": "open_ended"
              }

            ]
          }
        ]
      }
    ]

    let questionsList = surveyData.flatMap(section =>
      section.subsections.flatMap(sub =>
        sub.questions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.type === "multiple_choice"
            ? Object.fromEntries(q.options.map(option => [option, 0]))
            : {}
        }))
      )
    );


    useEffect(() => {
      const fetchData = async () => {
        try {
            const response = await axios.get(`${link}/companies`) 

            if(response && response.data){
              setAllResponses(response.data.flatMap((comp) => comp.surveyResult));
              setCompanies(response.data);
              
            }
         
        } catch (error) {
            console.log('Error in fetching data');
        }
      }
    
      fetchData() 
    }, [])




    //  console.log(allresponses);
    // console.log(questionsList);
 
    
    useEffect(() => {      

      allResponses?.forEach((result) => {

        if(Array.isArray(result)){
          result.forEach((q) => {
            // console.log(q);
            
            questionsList.forEach((question) => {
              if(question.text == q.text){
                if(question.options.hasOwnProperty(q.responses)){
                  question.options[q.responses]++
                  // console.log(question.options, '==', q.responses, question.options.hasOwnProperty(q.responses));
                }
  
              }
              
            })
  
            
            
          })

        }
        
      })

      if(allResponses.length > 0){
        setList(questionsList) 
      }
    }, [allResponses])



    return (
        <div id="QuestionsContainer" className="bg-[#F3F6FF] grow overflow-hidden rounded-xl">
          {/* <h2 className="text-2xl px-8 pt-8 pb-4">Questions</h2> */}


          <div className="sections relative flex flex-col rounded-xl gap-4 grow overflow-y-auto p-6 h-[95%]">

            <div className="brief-statstics flex gap-4">
              <ResponsesPieChart data={companies} />
              <BriefSurveyStatstics number={companies?.length} text={"Companies Registered and Engaged in the Job Fair"} type={"main"} />  
              <div className=" flex flex-col justify-between gap-4 ">
                <BriefSurveyStatstics number={allResponses?.length < 10 ? '0' + allResponses?.length : allResponses?.length} text={"Companies interacted & answered the published survey"} />
                <BriefSurveyStatstics number={companies?.length && allResponses?.length >= 0 ? companies?.length - allResponses?.length  : 'XX'} text={"Companies did not respond yet to the survey"} />
              </div>
              

            </div>

            <div className="bg-white p-8 border rounded-xl">
              {
                surveyData?.map((data, index) => 
                  { 
                    return <SurveySection key={index} section={index} sectionHeader={data['title']} subsectionData={data['subsections']} page={'results'} surveyResponsesData={list} />
                  }

                )
              } 
            </div>

              
          </div>


            
        </div>
    )
}

export default QuestionsContainer