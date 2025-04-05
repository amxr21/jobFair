import { useState } from "react";
import { useSignUp } from "../Hooks/useSignUp";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState("");
  const [representitives, setRepresentitives] = useState("");
  const [companyName, setCompanyName] = useState("");

  const { signup, error, isLoading } = useSignUp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(email, password, fields, representitives, companyName);
  };

  return (
    <div className="absolute flex flex-col items-center justify-center opacity-95 w-screen h-screen bg-[#F3F6FF] gap-16 rounded-xl col-span-10">

      <div className="text-8xl font-bold -mt-5">Hello :)</div>

      <div className="w-8/12 flex gap-x-16">

        <div className="col-span-8 bg-white p-10 flex flex-col gap-y-5 rounded-xl w-7/12 overflow-y-auto">
          <h2 className="text-3xl font-bold">Sign Up</h2>
          <form onSubmit={handleSubmit} className="bg-white">
            <div className="w-full py-2 flex flex-col gap-y-3">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full p-3 border rounded-md"
              />

              <div className="flex gap-x-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full p-3 border rounded-md"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-3 border rounded-md"
                />

              </div>
              <input
                type="text"
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="Fields"
                className="w-full p-3 border rounded-md"
              />
              <input
                type="text"
                value={representitives}
                onChange={(e) => setRepresentitives(e.target.value)}
                placeholder="Representatives"
                className="w-full p-3 border rounded-md"
              />
              <button
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
              >
                Sign Up
              </button>
              {error && (
                <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 py-3 my-2">
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="col-span-4 w-5/12">
          <h2 className="font-bold text-3xl mb-6">Welcome to the Job Fair Portal</h2>
          <p className="text-md text-justify">
            Register your company to access full features and connect with potential candidates.
          </p>
          <div className="my-10 text-sm">
            <span>Already have an account? </span>
            <span>
              <a href="/login" className="underline">
                Log in here
              </a>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
