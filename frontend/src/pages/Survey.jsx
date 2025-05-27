import { SubmittingCover, SuccessCover } from "../components/index";
import SurveyHeader from "../components/SurveyHeader";
import SurveySection from "../components/SurveySection";
import { SurveyContextProvider } from "../Context/SurveyContext";


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
                "options": ["Yes", "Not yet", "In progress"]
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
  
  





const Survey = () => {
    return (
        <div id="Survey" className="gap-y-8 py-8 flex flex-col col-span-10 gap-y-2  w-full mx-auto max-h-[92vh] ease-in-out duration-300">
            <SurveyContextProvider>
              <SurveyHeader />
              <div className="sections relative bg-[#F3F6FF] flex rounded-xl p-8 gap-16 grow overflow-x-hidden">
                  {
                      surveyData?.map((data, index) => 
                        { 
                          return <SurveySection key={index} section={index} sectionHeader={data['title']} subsectionData={data['subsections']} />
                        }

                      )
                  } 


                  <SubmittingCover />

                  <SuccessCover />

                  

                  
              </div>

            </SurveyContextProvider>
        </div>
    )
}

export default Survey;