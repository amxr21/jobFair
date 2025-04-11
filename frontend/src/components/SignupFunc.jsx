import { useState } from "react";
import { useSignUp } from "../Hooks/useSignUp";
import { NoAccount, OfficeLogo, UniLogo } from "../components";

const SignupFunc = () => {
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
    <div className="w-[48rem] flex flex-col items-center gap-y-16 bg-white rounded-3xl px-16 py-12 box-border overflow-y-hidden">
      <div className="flex gap-x-10 items-center">
        <UniLogo height={16} />
        <OfficeLogo height={14} />
      </div>

      <div className="flex flex-col items-center gap-y-8 w-full">
        <h2 className="text-5xl font-light">Sign Up</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 items-center">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
            className="w-10/12 p-3 text-lg border rounded-2xl mb-1 font-regular"
          />
          <div className="flex gap-x-3 w-10/12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 text-lg border rounded-2xl mb-1 font-regular"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 text-lg border rounded-2xl mb-1 font-regular"
            />
          </div>
          <input
            type="text"
            value={fields}
            onChange={(e) => setFields(e.target.value)}
            placeholder="Fields"
            className="w-10/12 p-3 text-lg border rounded-2xl mb-1 font-regular"
          />
          <input
            type="text"
            value={representitives}
            onChange={(e) => setRepresentitives(e.target.value)}
            placeholder="Representatives"
            className="w-10/12 p-3 text-lg border rounded-2xl mb-1 font-regular"
          />
          <button
            disabled={isLoading}
            className="bg-[#0E7F41] w-10/12 text-white text-xl p-3 mt-5 rounded-xl"
          >
            Sign Up
          </button>
          {error && (
            <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 py-3 my-2">
              {error}
            </div>
          )}
        </form>
        
        <NoAccount process={'login'} />

      </div>
    </div>
  );
};

export default SignupFunc;
