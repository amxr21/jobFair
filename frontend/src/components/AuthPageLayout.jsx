import UniLogoWhite from "../assets/images/uniLogo-white.svg";
import CastoLogoWhite from "../assets/images/castoLogo-white.svg";
import CareerFairBg from "../assets/images/career-fair-bg.jpg";
import AuthText from "./AuthText";

const AuthPageLayout = ({ variant = "login", children }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 50 }}>

      {/* Background image + green overlay — fills entire viewport */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${CareerFairBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,127,65,0.85)' }} />
      </div>

      {/* Two-column layout — zero padding, flush to all edges */}
      <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>

        {/* Left panel — green image side */}
        <div style={{ flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px' }}
          className="md:flex">
          <div />
          <AuthText variant={variant} />
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <img src={UniLogoWhite} alt="University of Sharjah" style={{ height: 56, width: 'auto' }} />
            <img src={CastoLogoWhite} alt="CASTO" style={{ height: 56, width: 'auto' }} />
          </div>
        </div>

        {/* Right panel — white form, flush to right/top/bottom edges, no rounding */}
        <div style={{ width: '42%', minWidth: 340, height: '100%', background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}
          className="w-full md:w-[42%]">
          {children}
        </div>

      </div>
    </div>
  );
};

export default AuthPageLayout;
