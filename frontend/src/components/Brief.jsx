const Brief = ({children, onCloseModal}) => {
    return (
        <div className="brief md:w-4/12 flex flex-col items-center">
            {children}

            {/* Close Button */}
            {onCloseModal && (
                <button
                    onClick={onCloseModal}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-sm font-medium"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                </button>
            )}
        </div>
    )
}

export default Brief;