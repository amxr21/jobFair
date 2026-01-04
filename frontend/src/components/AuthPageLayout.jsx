import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import AuthText from "./AuthText";

const AuthPageLayout = ({ variant = "login", children }) => {
  return (
    <div className="fixed inset-0 flex w-screen h-screen overflow-hidden z-50 transition-all duration-300 ease-in-out">
      {/* Background Image with Green Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${CareerFairBg})` }}
      >
        <div className="absolute inset-0 bg-[#0E7F41]/85 transition-opacity duration-300 ease-in-out" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col-reverse md:flex-row justify-between overflow-x-hidden overflow-y-auto md:overflow-y-hidden w-full h-full p-4 md:p-3 lg:p-4 transition-all duration-300 ease-in-out">
        {/* Left side - Text and Logos */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center gap-36 px-6 lg:px-20 py-4 transition-all duration-300 ease-in-out">
          <AuthText variant={variant} />
          <div className="flex gap-8 items-center transition-all duration-300 ease-in-out">
            <img src={UniLogoWhite} alt="University Logo" className="h-full w-auto transition-transform duration-300 ease-in-out hover:scale-105" />
            <img src={CastoLogoWhite} alt="CASTO Logo" className="h-full w-auto transition-transform duration-300 ease-in-out hover:scale-105" />
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-2/5 h-full flex flex-col transition-all duration-300 ease-in-out">
          <div className="flex-1 min-h-0 transition-all duration-300 ease-in-out">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageLayout;
