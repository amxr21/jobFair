import { useState } from "react";
import { useLogin } from "../Hooks/useLogin"
import NoAccount from "./NoAccount";
import { OfficeLogo, UniLogo, LoadingIn } from "../components";


const LoginFunc = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [ isVisible, setIsVisible ] = useState(false)


  const { login, error, isLoading } = useLogin("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);

  };

    const handleShowingPass = (e) => {
        e.preventDefault();
        setIsVisible(p => !p)
    }





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
                    <div className="w-10/12 flex items-center relative border rounded-xl mb-2">
                        <input
                            type={isVisible ? 'password' : 'text'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-3 text-base rounded-xl font-regular"
                        />
                        <button onClick={handleShowingPass}>
                            {
                                isVisible ?
                                <svg className="opacity-30 absolute right-4 top-[25%] size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                :
                                <svg className="opacity-30 absolute right-4 top-[25%] size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>


                            }

                        </button>


                    </div>
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