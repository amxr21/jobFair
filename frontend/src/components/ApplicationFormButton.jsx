const ApplicationFormButton = () => {
    return (
        <a href="https://job-fair-form.vercel.app/" target="_blank" className="text-sm xl:text-base bg-[#0E7F41] flex items-center justify-between p-3 rounded-xl w-full text-white font-medium uppercase">
            Application Form
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} color="white" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
        </a>

    )
}


export default ApplicationFormButton;