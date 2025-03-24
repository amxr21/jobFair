import UniversityLogo from "../../assets/images/uniLogo-white.svg";
import CastoLogo from "../../assets/images/castoLogo-white.svg";
 



import UniLogoSVG from "./UniLogo";


const Logos = () => {
    return (
        <div className="logos flex gap-x-4">
            <div className="university-logo">
                <img src={UniversityLogo} alt="" className="" />
            </div>
            <div className="casto-office-logo">
                <img src={CastoLogo} alt="" className="" />
            </div>
        </div>
    )
}

export default Logos;