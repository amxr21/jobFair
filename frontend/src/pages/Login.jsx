import { LoginText, OfficeLogo, UniLogo } from "../components";
import LoginFunc from "../components/LoginFunc";

export const Login = () => {

  return (
    <div className="absolute flex w-[100vw] h-[110vh] md:h-[100vh] overflow-hidden bg-[#F3F6FF]">
      <div className="flex flex-col-reverse md:flex-row overflow-x-hidden overflow-y-auto md:overflow-hidden gap-x-16 md:gap-x-32 justify-between w-full h-full px-8 md:px-14 py-6 md:py-10 bg-[#0E7F41]">
          <LoginText />
          <LoginFunc />

      </div>


    </div>

  );
};
