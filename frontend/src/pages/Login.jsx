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
    <div className="md:h-[60vh] flex flex-col md:flex-row gap-x-10">
      <h2 className="text-3xl font-bold mb-6 bg-white rounded-lg px-8 py-6 shadow-2xl md:h-80">Log in</h2>
      <form onSubmit={handleSubmit} className="bg-white md:w-1/2 md:h-80 h-fit rounded-lg px-8 py-6 shadow-2xl">
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
      <div className="hidden md:block md:w-1/2 md:my-0 px-8">
          <h2 className="font-bold text-3xl mb-6">Welcome to Log in page</h2>
          <p className="text-md text-justify">Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda hic minus laboriosam blanditiis cum, exercitationem repellat sed magnam eos omnis</p>
          <div className="my-10 text-sm">
            <span>Don't have an accont? </span>
            <span><a href="/signup" className="underline">Sign up</a> from here</span>
          </div>
        </div>
    </div>

  );
};
