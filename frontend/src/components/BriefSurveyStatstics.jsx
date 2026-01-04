const BriefSurveyStatstics = ({number, text, type}) => {
    return (
        <div className={`bg-white px-6 py-3 flex  min-h-full items-center justify-center ${type == 'main' ? 'flex-1 gap-4' : 'flex-col items-center gap-4 w-56'} border rounded-xl`}>
            <h2 className={`${type != 'main' ? 'text-7xl' : 'text-8xl'} font-bold`}>{number}</h2>
            <h2 className={`${type == 'main' ? 'text-lg' : 'text-lg text-center '} font-light`}>{text}</h2>
        </div>
    )
}


export default BriefSurveyStatstics;