import { createContext, useState } from "react";

const SurveyContext = createContext()

const statisticalSurveyData = [
  { id: "q1", text: "How would you rate the overall organization of the event?", responses: "" },
  { id: "q2", text: "How would you rate the pre-event communication and coordination?", responses: "" },
  { id: "q3", text: "How was your experience with parking and on-campus access?", responses: "" },
  { id: "q4", text: "How would you rate the event location (Main Building, M11) in terms of accessibility and visibility?", responses: "" },
  { id: "q5", text: "Was your booth setup ready and satisfactory upon arrival?", responses: "" },
  { id: "q6", text: "How would you rate the support provided by the organizers during the event?", responses: "" },
  { id: "q7", text: "Were the students well-prepared to engage with you?", responses: "" },
  { id: "q8", text: "Did the online portal support your recruitment efforts effectively?", responses: "" },
  { id: "q9", text: "Were the student profiles/resumes accessible and useful via the portal?", responses: "" },
  { id: "q10", text: "Are you in favor of continuing the paperless approach for future fairs?", responses: "" },
  { id: "q11", text: "Would you participate in our future career events?", responses: "" },
  { id: "q12", text: "Any suggestions or advice to improve the quality of the fair?", responses: "" },
  { id: "q13", text: "Have you reviewed the applications and profiles submitted via our portal?", responses: "" },
  { id: "q14", text: "Based on your review, how would you rate the overall quality of student applicants?", responses: "" },
  { id: "q15", text: "Did you find candidates that match your internship or job requirements?", responses: "" },
  { id: "q16", text: "Were the student resumes/profiles complete and easy to understand in the portal?", responses: "" },
  { id: "q17", text: "Was the portal helpful in managing and filtering applicants post-event?", responses: "" },
  { id: "q18", text: "Are you planning to follow up with any UoS students for internships/jobs?", responses: "" },
  { id: "q19", text: "Did you hire or shortlist any students from the fair?", responses: "" },
  { id: "q20", text: "If yes, how many students did you hire (internship or full-time)?", responses: "" },
  { id: "q21", text: "If yes, how many students did you shortlist for next steps/interviews?", responses: "" },
  { id: "q22", text: "Any other feedback or suggestions for improvement?", responses: "" }
];






const SurveyContextProvider = ({children}) => {
    const [ surveyAnswers, setSurveyAnswers ] = useState(statisticalSurveyData)
    
    const [ allResponses, setAllResponses ] = useState([])


    const updateSurvey = (type, question, label) => {
      
      setSurveyAnswers((prev) => {
        return prev.map((q) => {
          if(q.text == question){
            return {
              ...q,
              responses: label
            }
          }
          return q
        })
      })
      
      console.log(surveyAnswers);

        // console.log(surveyAnswers?.filter( (q) => q.text == question )[0].responses[label.replace(/[^a-zA-Z]/g, '')], label.replace(/[^a-zA-Z]/g, ''))
        // if(type == 'multiple_choice'){
        //     setSurveyAnswers((prev) => 
        //         {
        //             // console.log('====================================');
        //             // console.log(surveyAnswers);
        //             // console.log('====================================');
        //             return prev.map((q) => {
        //                 if(q.text == question){
        //                     return {
        //                         ...q,
        //                         responses: {
        //                             ...q.responses,
        //                             [label]: 1
        
        //                         }
        //                     }
        //                 }
        //                 return q
        //             })
                    
        //         }
        //     )
        // }
        
        // else{
        //     setSurveyAnswers((prev) => {
        //         return prev.map((q) => {
        //             if(q.text == question){
        //                 return {
        //                     ...q,
        //                     responses: label
        //                 }
        //             }
        //             return q
        //         })
        //     })
        // }


    }


    return (
        <SurveyContext.Provider value={{ surveyAnswers, updateSurvey, allResponses, setAllResponses }}>
            {children}
        </SurveyContext.Provider>
    )
}


export { SurveyContext, SurveyContextProvider }