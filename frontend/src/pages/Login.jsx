import { useState } from "react";
import { useLogin } from "../Hooks/useLogin"

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);

  };

  return (
    <div className="absolute flex flex-col items-center justify-center opacity-95 w-screen h-screen bg-[#F3F6FF] gap-16 rounded-xl col-span-10">
      
      <div className="text-8xl font-bold -mt-16">Hello again ;)</div>
      
      <div className="w-8/12 flex gap-x-16">
      
        <div className="col-span-8 bg-white p-10 flex flex-col gap-y-5 rounded-xl w-7/12 h-[20rem]">
          <h2 className="text-3xl font-bold">Log in</h2>
          <form onSubmit={handleSubmit} className="bg-white">
          {/* Input fields for email and password */}
          <div className="w-full py-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 border rounded-md mb-1"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 mt-2 border rounded-md mb-4"
            />
            <button disabled={isLoading} type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4">
              Log In
            </button>
            {error && <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 py-3 my-2">{error}</div>}
          </div>
        </form>
        </div>

        <div className="col-span-4 w-5/12">
          <h2 className="font-bold text-3xl mb-6">Welcome to the Job Fair Portal</h2>
          <p className="text-md text-justify">
            Please sign in to access all features and participate in the event.
          </p>
          <div className="my-10 text-sm">
            <span>Don't have an account? </span>
            <span>
              <a href="/signup" className="underline">
                Sign up here
              </a>
            </span>
          </div>
        </div>


      </div>





    </div>

  );
};
