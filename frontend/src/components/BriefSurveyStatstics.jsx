const BriefSurveyStatstics = ({number, text, type}) => {
    return (
        <div className={`bg-white px-8 py-4 flex ${type == 'main' ? 'flex-col items-center text-center' : 'items-center gap-4 w-[32rem]'} grow h-full border rounded-xl`}>
            <h2 className={`${type != 'main' ? 'text-6xl' : 'text-8xl'} font-bold mb-1`}>{number}</h2>
            <h2 className={`${ type == 'main' ? 'text-xl' : 'text-lg'} font-light`}>{text}</h2>
        </div>

    )
}


export default BriefSurveyStatstics;