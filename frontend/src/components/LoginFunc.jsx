import { useState } from "react";
import { useLogin } from "../Hooks/useLogin"
import NoAccount from "./NoAccount";
import { OfficeLogo, UniLogo, LoadingIn } from "../components";


const LoginFunc = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);

  };


    return (
        <div className="login-window relative w-full md:w-[48rem] flex flex-col items-center gap-y-10 md:gap-y-20 bg-white rounded-3xl px-8 md:px-16 py-4 md:py-12 md:box-border max-h-full flex md:overflow-y-hidden">

            <div className="flex flex-col md:flex-row gap-5 md:gap-10 items-center">
                <UniLogo height={16} />
                <OfficeLogo height={14}/>
            </div>
            <div className="flex flex-col items-center gap-y-4 md:gap-y-9 w-full">
                <h2 className="text-3xl md:text-5xl font-light">Log in</h2>
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    {/* Input fields for email and password */}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-10/12 p-3 text-base border rounded-xl mb-2 font-regular"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-10/12 p-3 text-base border rounded-xl mb-2 font-regular"
                    />
                    <button disabled={isLoading} type="submit" className="bg-[#0E7F41] w-10/12 text-white text-xl p-3 mt-5 rounded-xl">
                        Log In
                    </button>
                    {error && <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 py-3 my-2">{error}</div>}
                </form>

                <NoAccount process={'signup'} />
            </div>


            {
                isLoading && <LoadingIn />
            }
            



        </div>
        
    )
}





export default LoginFunc