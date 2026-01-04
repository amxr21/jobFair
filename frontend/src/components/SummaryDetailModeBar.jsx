const SummaryDetailModeBar = ({func, currentMode}) => {
    return (
        <div className="flex justify-end px-1 shrink-0">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                    onClick={() => func('summary')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentMode === 'summary'
                            ? 'bg-[#0E7F41] text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Summary
                </button>
                <button
                    onClick={() => func('details')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentMode === 'details'
                            ? 'bg-[#0E7F41] text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Details
                </button>
            </div>
        </div>
    )
}

export default SummaryDetailModeBar