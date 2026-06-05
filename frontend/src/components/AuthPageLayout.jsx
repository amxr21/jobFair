import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import AuthText from "./AuthText";

const AuthPageLayout = ({ variant = "login", children }) => {
  return (
    <div className="fixed inset-0 flex w-screen h-screen overflow-hidden z-50">
      {/* Background Image with Green Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${CareerFairBg})` }}
      >
        <div className="absolute inset-0 bg-[#0E7F41]/85" />
      </div>

      {/* Two-column layout — NO outer padding so nothing peeks behind the card */}
      <div className="relative flex w-full h-full overflow-hidden">

        {/* Left panel — text and logos over the green background */}
        <div className="hidden md:flex flex-1 flex-col justify-between px-12 lg:px-20 py-10">
          <div />
          <AuthText variant={variant} />
          <div className="flex gap-8 items-center pb-2">
            <img src={UniLogoWhite} alt="University of Sharjah" className="h-14 w-auto" />
            <img src={CastoLogoWhite} alt="CASTO" className="h-14 w-auto" />
          </div>
        </div>

        {/* Right panel — white card, flush to right/top/bottom, no outer gap */}
        <div className="w-full md:w-[42%] h-full bg-white flex flex-col overflow-y-auto shadow-2xl flex-shrink-0">
          {children}
        </div>

      </div>
    </div>
  );
};

export default AuthPageLayout;
