import { Link } from "react-router-dom"

const NoAccount = ({process}) => {

    return process == 'signup'
    ?
    <div className="my-10 text-sm">
        <span>Don't have an account? </span>
        <span>
            <Link to={"/signup"}>
                Sign Up here
            </Link>
        </span>
    </div>
    :
    <div className="my-10 text-sm">
        <span>You have an account? </span>
        <span>
            <Link to={"/login"}>
                Login here
            </Link>
        </span>
    </div>
}


export default NoAccount