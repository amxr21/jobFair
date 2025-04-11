import { SignupText,SignupFunc } from "../components/index";

export const Signup = () => {
  return (
    <div className="absolute flex w-screen h-screen bg-[#F3F6FF]">
      <div className="flex gap-x-32 justify-between w-full h-full px-14 py-10 bg-[#0E7F41] overflow-y-hidden">
        <SignupText />
        <SignupFunc />
      </div>
    </div>
  );
};
