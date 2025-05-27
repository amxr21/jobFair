import { SubmitSurveyIcon } from "./Icons"

import { useRef, useContext } from "react"
import { SurveyContext } from "../Context/SurveyContext"
import axios from "axios"


// const link = "https://jobfair-production.up.railway.app"
// const link = "https://jobfair-7zaa.onrender.com"
const link = "http://localhost:2000"


const SubmitSurveyButton = () => {
    const userId = JSON.parse(localStorage.getItem('user')).user_id
    
    const surveyButtonRef = useRef()
     

    const { surveyAnswers, updateSurvey } = useContext(SurveyContext)

    const handleSubmit = async () => {
        
        const submittingCover = document.getElementById('SubmitLoadingCover')

        const successCover = document.getElementById('Success')

        try {

            console.log(surveyButtonRef.current.parentElement.parentElement.parentElement.lastElementChild);
            
            

            if(userId){

                submittingCover.classList.replace('opacity-0', 'opacity-100')
                submittingCover.classList.replace('h-0', 'h-full')
                
                console.log(userId.replace(/[^A-Za-z0-9]/g,''),);
                
                const patchResponse = await axios.patch(link + '/applicants/survey/' + userId.replace(/[^A-Za-z0-9]/g,''), {
                    surveyResult: surveyAnswers
                })

                console.log(patchResponse.data);
            }
            
        
            
        } catch (error) {
            console.log(error, 'Failed to update user survey results');
            
        }
        finally{
            setTimeout(() => {
                submittingCover.classList.replace('opacity-100', 'opacity-0')
                submittingCover.classList.replace('h-full', 'h-0')
                console.log('It is DONE mf');

                successCover.classList.replace('opacity-0', 'opacity-100')
                successCover.classList.replace('h-0', 'h-full')

            }, 2000)


            setTimeout(() => {
                window.location.reload()
                window.location.href = '/'
            }, 4000)
            
    
                
            
        }


        
    }

    return (
        <button ref={surveyButtonRef} onClick={handleSubmit} className="button flex items-center justify-center gap-2 h-10 p-2.5 bg-[#0E7F41] rounded-xl">
            <p className="text-white font-medium">Submit</p>
            <SubmitSurveyIcon />
        </button>
    )
}


export default SubmitSurveyButton