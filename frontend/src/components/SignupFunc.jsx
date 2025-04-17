import { useState } from "react";
import { useSignUp } from "../Hooks/useSignUp";
import { NoAccount, OfficeLogo, UniLogo, Input, SelectInput } from "../components";

const SignupFunc = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState("");
  const [representitives, setRepresentitives] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [noOfPositions, setNoOfPositions] = useState("");

  const { signup, error, isLoading } = useSignUp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(email, password, fields, representitives, companyName, sector, city, noOfPositions);
  };

  return (
    <div className="w-[48rem] flex flex-col items-center gap-y-10 bg-white overflow-y-auto rounded-3xl px-16 py-12 box-border">
      <div className="flex gap-x-10 items-center">
        <UniLogo height={16} />
        <OfficeLogo height={14} />
      </div>

      <div className="flex flex-col items-center gap-y-4 w-full h-full">
        <h2 className="text-5xl font-light">Sign Up</h2>

        {/* Scrollable Form Fields */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-2 items-center overflow-y-auto"
          style={{ maxHeight: "50vh" }}
        >
          <Input
            key="companyName"
            Id="companyName"
            Name="Company Name"
            Type="text"
            Value={companyName}
            handleChange={(e) => setCompanyName(e.target.value)}
          />

          <div className="flex gap-x-3 w-full">
            <Input
              key="email"
              Id="email"
              Name="Email"
              Type="email"
              Value={email}
              handleChange={(e) => setEmail(e.target.value)}
            />
            <Input
              key="password"
              Id="password"
              Name="Password"
              Type="password"
              Value={password}
              handleChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Input
            key="fields"
            Id="fields"
            Name="Fields"
            Type="text"
            Value={fields}
            handleChange={(e) => setFields(e.target.value)}
          />

          <Input
            key="representitives"
            Id="representitives"
            Name="Representatives"
            Type="text"
            Value={representitives}
            handleChange={(e) => setRepresentitives(e.target.value)}
          />

          <div className="flex gap-x-3 w-full">
            <SelectInput
              Id="sector"
              Name="Sector"
              options={["Local", "Private", "Semi", "Federal"]}
              value={sector}
              handleChange={(e) => setSector(e.target.value)}
            />
            <SelectInput
              Id="city"
              Name="City"
              options={["Sharjah", "Dubai", "Abu Dhabi", "Ajman", "Al-Ain", "Ras Al-Khaima", "Umm Al-Quwain", "AlFujairah"]}
              value={city}
              handleChange={(e) => setCity(e.target.value)}
            />
            <SelectInput
              Id="noOfPositions"
              Name="Number of Positions"
              options={["1-5", "5-10", "10-15", "15-20", ">20"]}
              value={noOfPositions}
              handleChange={(e) => setNoOfPositions(e.target.value)}
            />
          </div>
        </form>

        {/* Button Outside Scroll */}
        
        <button
          disabled={isLoading}
          onClick={handleSubmit}
          className="bg-[#0E7F41] w-full text-white text-xl p-3 mt-2 rounded-xl"
        >
          Sign Up
        </button>

        <div className="flex w-full gap-x-5 justify-center items-center min-h-14">
          {error && (
            <div className="error bg-red-200 border border-red-500 text-red-800 rounded-lg px-2 py-3 my-2">
              {error}test
            </div>
          )}

          <NoAccount process="login" />

        </div>

      </div>
    </div>
  );
};

export default SignupFunc;
