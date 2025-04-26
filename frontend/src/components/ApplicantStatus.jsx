const ApplicantStatus = ({status, type}) => {
    return (
        <div className={`font-medium absolute top-0 left-0 w-full p-1.5 ${type == 'shortlisted' ? 'border border-blue-200 rounded-t-xl bg-blue-100 text-blue-700' : 'border border-red-200 rounded-t-xl bg-red-100 text-red-700'} `}>
            {
                type
            }
        </div>
    )
}

export default ApplicantStatus