import SurveySection from "../components/SurveySection";

import { useContext, useEffect, useState } from "react";
import { SurveyContext, SurveyContextProvider } from "../Context/SurveyContext";
import { AnswersContext } from "../Context/AnswersContext";

import { useAuthContext } from "../Hooks/useAuthContext"


import axios from "axios";

import { BriefSurveyStatstics, CurrentCompanyBar, ResponsesPieChart, SummaryDetailModeBar } from "./index";
import { API_URL as link } from "../config/api";


const QuestionsContainer = () => {

    const { user } = useAuthContext()



  const { allResponses, setAllResponses } = useContext(SurveyContext)
  const { answers, updateAnswers } = useContext(AnswersContext)

  const [ list, setList ] = useState([])
  const [ companies, setCompanies ] = useState(null)

  const [ allResponsesData, setAllResponsesData ] = useState([])

  const [ mode, setMode ] = useState("summary");
  const [ surveyPart, setSurveyPart ] = useState(0);

  const [ currentCompanyData, setCurrentCompanyData ] = useState(0)

  // Survey visibility toggle
  const [ surveyPublic, setSurveyPublic ] = useState(false)
  const [ isTogglingVisibility, setIsTogglingVisibility ] = useState(false)

  // Fetch survey visibility setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${link}/settings`)
        if (response?.data) {
          setSurveyPublic(response.data.surveyPublic)
        }
      } catch (error) {
        // Error fetching settings
      }
    }
    fetchSettings()
  }, [])

  // Toggle survey visibility
  const toggleSurveyVisibility = async () => {
    if (!user?.token) return

    setIsTogglingVisibility(true)
    try {
      const response = await axios.patch(
        `${link}/settings`,
        { key: 'surveyPublic', value: !surveyPublic },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      if (response?.data) {
        setSurveyPublic(!surveyPublic)
      }
    } catch (error) {
      console.error('Error toggling survey visibility:', error)
    } finally {
      setIsTogglingVisibility(false)
    }
  }


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
              setAllResponses(response.data.flatMap((comp) => ({'name': comp.companyName, 'results': comp.surveyResult})));
              setCompanies(response.data);
              
            }
         
        } catch (error) {
            // Error fetching survey data
        }
      }
    
      fetchData() 
    }, [])




    // console.log(allResponses);
    // console.log(questionsList);
 
    
    useEffect(() => {      
      allResponsesData?.forEach((result) => {

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

      if(allResponsesData.length > 0){
        setList(questionsList) 
      }
    }, [allResponses, allResponsesData])
 


    useEffect(()=>{
      if(allResponses){
        setAllResponsesData(allResponses.flatMap((a) => a?.results))
      }
    }, [allResponses])

    

    // console.log(allResponses);
    // let a = allResponses.flatMap((d) => {return d.results.length > 0 ? d.name : null}).filter(d=>d)
    let a = allResponses.flatMap((d) => {return d?.results?.length > 0 ? d.name: null}).filter(d=>d) 
    


    return (
      <div className="flex flex-col gap-3 flex-1 h-full overflow-hidden">
        {/* Header with Survey Visibility Toggle */}
        <div className="flex items-center justify-between">
          <SummaryDetailModeBar func={setMode} currentMode={mode} />

          {/* Survey Visibility Toggle - Only for CASTO admin */}
          {user?.email === "casto@sharjah.ac.ae" && (
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border shadow-sm">
              <span className="text-sm text-gray-600">Survey Visibility:</span>
              <button
                onClick={toggleSurveyVisibility}
                disabled={isTogglingVisibility}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0E7F41] focus:ring-offset-2 ${
                  surveyPublic ? 'bg-[#0E7F41]' : 'bg-gray-300'
                } ${isTogglingVisibility ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                    surveyPublic ? 'translate-x-[1.375rem]' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${surveyPublic ? 'text-[#0E7F41]' : 'text-gray-500'}`}>
                {surveyPublic ? 'Public' : 'Hidden'}
              </span>
            </div>
          )}
        </div>

        {
          mode == "summary" &&

          <div id="QuestionsContainer" className="bg-[#F3F6FF] flex-1 rounded-xl overflow-y-auto">
            <div className="sections relative flex flex-col rounded-xl gap-4 grow p-6 ">
              <div className="brief-statstics flex gap-4 h-fit min-h-48">
                <ResponsesPieChart data={companies} res={allResponsesData?.length} unres={companies?.length - 1 - allResponsesData?.length} />
                <BriefSurveyStatstics number={companies?.length-1} text={"Companies Registered and Engaged in the Job Fair"} type={"main"} />
                <div className="flex gap-2 min-h-full">
                  <BriefSurveyStatstics number={allResponsesData?.length < 10 ? '0' + allResponsesData?.length : allResponsesData?.length} text={"Answered survey"} />
                  <BriefSurveyStatstics number={companies?.length && allResponsesData?.length >= 0 ? companies?.length - 1 - allResponsesData?.length  : 'XX'} text={"No response yet"} />
                </div>
              </div>

              {/* Survey Part Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setSurveyPart(0)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${surveyPart === 0 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Part 1: Event Experience
                </button>
                <button
                  onClick={() => setSurveyPart(1)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${surveyPart === 1 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Part 2: Recruitment & Follow-Up
                </button>
              </div>

              <div className="bg-white p-6 border rounded-xl">
                <SurveySection
                  key={surveyPart}
                  section={surveyPart}
                  sectionHeader={surveyData[surveyPart]['title']}
                  subsectionData={surveyData[surveyPart]['subsections']}
                  page={'results'}
                  surveyResponsesData={list}
                />
              </div>
            </div>

          </div>
        }

        {
          mode == "details" &&
          <div className="bg-[#F3F6FF] flex-1 rounded-xl overflow-auto">
            <div className="sections relative flex flex-col rounded-xl gap-4 p-6">
              {/* Company selector and tabs in one card */}
              <div className="sticky top-0 z-10 bg-white rounded-xl border overflow-hidden">
                <CurrentCompanyBar CompanyName={a[currentCompanyData]} length={a.length} func={setCurrentCompanyData}/>

                {/* Survey Part Tabs */}
                <div className="flex gap-2 border-t px-4">
                  <button
                    onClick={() => setSurveyPart(0)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${surveyPart === 0 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Part 1: Event Experience
                  </button>
                  <button
                    onClick={() => setSurveyPart(1)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${surveyPart === 1 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Part 2: Recruitment & Follow-Up
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 border rounded-xl">
                <SurveySection
                  key={`${currentCompanyData}-${surveyPart}`}
                  section={surveyPart}
                  sectionHeader={surveyData[surveyPart]['title']}
                  subsectionData={surveyData[surveyPart]['subsections']}
                  surveyResponsesData={list}
                  surveyResponsesDataForCompany={allResponses?.filter((data) => data.name == a[currentCompanyData])[0]?.results}
                  page="surveyResults"
                />
              </div>
            </div>
          </div>
        }
      </div>
    )
}

export default QuestionsContainer