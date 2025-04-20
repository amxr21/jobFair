const Success = ({result}) => {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-l-4 border-green-500 bg-green-50 text-green-800 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm font-medium">
                <span className="font-semibold">Success:</span> {result}
            </div>
        </div>
    )
}

export default Success