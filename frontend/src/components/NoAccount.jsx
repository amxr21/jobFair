import { Link } from "react-router-dom"

const NoAccount = ({process, dark = false}) => {
    const textClass = dark ? "text-white/80" : "text-gray-600";
    const linkClass = dark ? "text-white font-medium underline hover:text-white/90" : "text-[#0E7F41] font-medium hover:underline";

    return process == 'signup'
    ?
    <div className={`text-sm ${textClass}`}>
        <span>Don't have an account? </span>
        <Link to={"/signup"} className={linkClass}>
            Sign Up here
        </Link>
    </div>
    :
    <div className={`text-sm ${textClass}`}>
        <span>Already have an account? </span>
        <Link to={"/login"} className={linkClass}>
            Login here
        </Link>
    </div>
}


export default NoAccount