import UniLogo from "../../assets/images/uni-logo.png";
import OfficeLogo from "../../assets/images/casto-logo.jpg";

const NavBar = () => {
    return (
        <nav className="flex items-center justify-between h-20 overflow-hidden">
            <div className="unilogo h-16">
                <img className="h-full" src={OfficeLogo} alt="" />
            </div>
            <div className="unilogo h-20">
                <img className="h-full" src={UniLogo} alt="" />
            </div>
        </nav>
    )
}

export default NavBar;