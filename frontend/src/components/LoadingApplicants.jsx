import { CircularProgress } from "@mui/material"


const LoadingApplicants = () => {
    return (
        <div className="flex items-center w-48 justify-between mx-auto mt-4">
            <CircularProgress size={20}/>
            <p className="text-sm">Loading applicants...</p>
        </div>

    )
}


export default LoadingApplicants