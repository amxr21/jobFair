const NpApplicants = () => {
    return (
        <div className="flex flex-col gap-2 items-center justify-center  mt-4 border w-full p-3 rounded-xl text-gray-500 justify-center">
                <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />
                </svg>


                </div>
                <p className="text-sm">No Applicants</p>
        </div>
    )
}



export default NpApplicants