const LegendLabel = ({legendText, colors}) => {
    return (
        <div className='px-2 py-1 min-w-28 w-fit'>
            <div className="legend flex items-center gap-2 font-semibold">
                <div className={`min-w-6 min-h-6 bg-[${colors}] rounded-md`}></div>
                <p className='legent-key'>{legendText}</p>
            </div>
        </div>
    )
}


export default LegendLabel