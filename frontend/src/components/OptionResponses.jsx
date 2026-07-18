import { tSurveyOption } from "../i18n/surveyContent"


const OptionResponses = ({answer, number, percentages}) => {
    // console.log(percentages, "<====== percentages here");



    return (
        <div className={`relative w-full p-4 border border-line rounded-xl h-36 bg-surface-card text-fg overflow-hidden`}>
            <div className="absolute top-0 start-0 flex items-center p-10 w-full h-full z-[999] text-lg">
                {tSurveyOption(answer)}
            </div>



            <div className={`absolute top-0 start-0 h-full z-0 ${number == 2 ? `bg-red-300 bg-opacity-50 w-[${percentages[2]}%]` : number == 1 ? `bg-yellow-300 bg-opacity-50 w-[${percentages[1]}%]` : `bg-green-300 bg-opacity-50 w-[${percentages[0]}%]`}`}>
            </div>
        </div>
    )
}

export default OptionResponses