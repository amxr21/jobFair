import { Link } from "react-router-dom"

const NoAccount = () => {
    return (
        <div className="my-10 text-sm">
            <span>Don't have an account? </span>
            <span>
                <Link to={"/signup"}>
                    Sign up here
                </Link>
            </span>
        </div>
    )
}


export default NoAccount