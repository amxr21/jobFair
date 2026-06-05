const ApplicantStatus = ({ status, type }) => {
    return (
        <div className={`w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold ${
            type === 'shortlisted'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
        }`}>
            {type}
        </div>
    );
};

export default ApplicantStatus;
